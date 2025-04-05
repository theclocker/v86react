// v86.worker.ts - Web Worker for v86 emulation

// Types for messages from the main thread
type MainThreadMessage = 
  | { type: 'init'; config: any }
  | { type: 'sendCommand'; command: string }
  | { type: 'loadState'; stateUrl: string }
  | { type: 'saveState' }
  | { type: 'runTest'; testType: 'ls' | 'python' }
  | { type: 'cleanCache' };

// Global reference to emulator
let emulator: any = null;
let dataBuffer = '';
let isWorkerBusy = false;

// Import v86 dynamically
async function loadV86() {
  try {
    const v86module = await import('../../lib/libv86');
    return v86module.default;
  } catch (error) {
    console.error('Failed to load v86:', error);
    postMessage({ type: 'error', message: 'Failed to load v86 emulator' });
    throw error;
  }
}

// Initialize v86 emulator
async function initEmulator(config: any) {
  try {
    isWorkerBusy = true;
    postMessage({ type: 'status', status: 'initializing' });
    
    const V86Constructor = await loadV86();

    if (!config.wasm_path) {
      postMessage({ type: 'error', message: 'Missing wasm_path in config' });
      return false;
    }
    if (!config.bios_path) {
      postMessage({ type: 'error', message: 'Missing bios_path in config' });
      return false;
    }
    if (!config.vgabios_path) {
      postMessage({ type: 'error', message: 'Missing vgabios_path in config' });
      return false;
    }
    if (!config.filesystem_basefs) {
      postMessage({ type: 'error', message: 'Missing filesystem_basefs in config' });
      return false;
    }

    console.log(config)
    
    // Create v86 emulator with provided config
    emulator = new V86Constructor({
      wasm_path: config.wasm_path,
      memory_size: config.memory_size || 128 * 1024 * 1024,
      vga_memory_size: config.vga_memory_size || 4 * 1024 * 1024,
      bios: { url: config.bios_path },
      vga_bios: { url: config.vgabios_path },
      filesystem: {
        baseurl: config.filesystem_baseurl,
        basefs: config.filesystem_basefs,
      },
      autostart: true,
      serial0: true,
      bzimage_initrd_from_filesystem: true,
      cmdline: config.cmdline || "console=ttyS0 rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable",
    });
    
    // Set up event listeners
    setupEventListeners();
    
    postMessage({ type: 'status', status: 'initialized' });
    isWorkerBusy = false;
    
    return true;
  } catch (error) {
    console.error('Failed to initialize emulator:', error);
    postMessage({ type: 'error', message: 'Failed to initialize emulator: ' + error.message });
    isWorkerBusy = false;
    return false;
  }
}

// Set up event listeners for the emulator
function setupEventListeners() {
  if (!emulator) return;
  
  let data = "";
  
  // Listen for ready event
  emulator.add_listener("emulator-ready", function() {
    postMessage({ type: 'emulatorReady' });
  });
  
  // Listen for serial output
  emulator.add_listener("serial0-output-byte", function(byte: number) {
    const char = String.fromCharCode(byte);
    
    // Skip carriage returns
    if (char !== "\r") {
      data += char;
      dataBuffer += char;
      
      // Send character to main thread
      postMessage({ type: 'serialOutput', char });
    }
    
    // Check for shell prompt
    if (data.trimEnd().endsWith("$") || data.trimEnd().endsWith("#") || data.trimEnd().endsWith("~%")) {
      postMessage({ type: 'shellPromptDetected' });
      
      // Clear buffer after a prompt
      dataBuffer = "";
    }
    
    // Keep the buffer manageable
    if (data.length > 10000) {
      data = data.substring(data.length - 1000);
    }
  });
}

// Load a compressed state
async function loadState(stateUrl: string) {
  try {
    isWorkerBusy = true;
    postMessage({ type: 'status', status: 'loadingState' });
    
    // Fetch the compressed state
    const response = await fetch(stateUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch state file: ${response.status}`);
    }
    
    const compressedData = await response.arrayBuffer();
    postMessage({ 
      type: 'status', 
      status: 'decompressingState',
      details: `Compressed size: ${(compressedData.byteLength / 1024 / 1024).toFixed(2)} MB`
    });
    
    // TODO: Implement decompression here if using zstd
    // For now, assuming the state is not compressed
    const stateData = new Uint8Array(compressedData);
    
    // Restore the state
    if (!emulator) {
      throw new Error('Emulator not initialized');
    }
    
    await new Promise<void>((resolve, reject) => {
      emulator.restore_state(stateData, (error: Error | null) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
    
    postMessage({ type: 'status', status: 'stateLoaded' });
    isWorkerBusy = false;
    return true;
  } catch (error) {
    console.error('Failed to load state:', error);
    postMessage({ type: 'error', message: 'Failed to load state: ' + error.message });
    isWorkerBusy = false;
    return false;
  }
}

// Save the current state
async function saveState() {
  try {
    if (!emulator) {
      throw new Error('Emulator not initialized');
    }
    
    isWorkerBusy = true;
    postMessage({ type: 'status', status: 'savingState' });
    
    const state = await emulator.save_state();
    
    // Send state back to main thread
    postMessage({
      type: 'stateSaved', 
      state: new Blob([state]),
      details: `State size: ${(state.byteLength / 1024 / 1024).toFixed(2)} MB`
    }); // Pass the buffer as a transferable object
    
    isWorkerBusy = false;
    return true;
  } catch (error) {
    console.error('Failed to save state:', error);
    postMessage({ type: 'error', message: 'Failed to save state: ' + error.message });
    isWorkerBusy = false;
    return false;
  }
}

// Send a command to the emulator
function sendCommand(command: string) {
  if (!emulator) {
    postMessage({ type: 'error', message: 'Emulator not initialized' });
    return false;
  }
  
  try {
    // Clear data buffer
    dataBuffer = "";
    
    // Send the command
    emulator.serial0_send(command + '\n');
    
    return true;
  } catch (error) {
    console.error('Failed to send command:', error);
    postMessage({ type: 'error', message: 'Failed to send command: ' + error.message });
    return false;
  }
}

// Run a test command
function runTest(testType: 'ls' | 'python') {
  if (!emulator) {
    postMessage({ type: 'error', message: 'Emulator not initialized' });
    return false;
  }
  
  try {
    // Clear data buffer
    dataBuffer = "";
    
    // Send the appropriate test command
    if (testType === 'ls') {
      emulator.serial0_send("ls -la /\n");
    } else if (testType === 'python') {
      emulator.serial0_send("python --help\n");
    }
    
    return true;
  } catch (error) {
    console.error('Failed to run test:', error);
    postMessage({ type: 'error', message: 'Failed to run test: ' + error.message });
    return false;
  }
}

// Message handler
self.onmessage = async function(e: MessageEvent) {
  const message = e.data as MainThreadMessage;
  
  switch (message.type) {
    case 'init':
      await initEmulator(message.config);
      break;
      
    case 'sendCommand':
      sendCommand(message.command);
      break;
      
    case 'loadState':
      await loadState(message.stateUrl);
      break;
      
    case 'saveState':
      await saveState();
      break;
      
    case 'runTest':
      runTest(message.testType);
      break;
      
    case 'cleanCache':
      dataBuffer = '';
      break;
      
    default:
      console.error('Unknown message type:', message);
      postMessage({ type: 'error', message: 'Unknown message type' });
  }
};

// Notify that the worker has loaded
postMessage({ type: 'workerReady' });