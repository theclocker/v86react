type MainThreadMessage =
  | { type: 'init'; config: any }
  | { type: 'sendCommand'; command: string }
  | { type: 'loadState'; stateUrl: string }
  | { type: 'saveState' }
  | { type: 'runTest'; testType: 'ls' | 'python' }
  | { type: 'cleanCache' };

// Import base types for explicit typing
import V86Starter from "v86";
import { V86StarterOptions } from "v86";

// Define the expected constructor type
type V86ConstructorType = {
  new (options: V86StarterOptions): V86Starter;
};

let emulator: V86Starter | null = null; // Use the imported type
let dataBuffer = '';
let isWorkerBusy = false;

// Add explicit return type and handle potential errors
async function loadV86(): Promise<V86ConstructorType> {
  try {
    const v86module = await import('../../lib/libv86');
    if (!v86module.default || typeof v86module.default !== 'function') {
        throw new Error("Default export is not a constructable function.");
    }
    // Assert the type to match our expectation
    return v86module.default as V86ConstructorType;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to load v86:', error);
    postMessage({ type: 'error', message: `Failed to load v86 emulator: ${message}` });
    throw error; // Re-throw after logging/posting
  }
}

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

    setupEventListeners();

    postMessage({ type: 'status', status: 'initialized' });
    isWorkerBusy = false;
    
    return true;
  } catch (error) {
    // Handle unknown error type
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to initialize emulator:', error);
    postMessage({ type: 'error', message: `Failed to initialize emulator: ${message}` });
    isWorkerBusy = false;
    return false;
  }
}

function setupEventListeners() {
  if (!emulator) return;
  
  let data = "";

  emulator.add_listener("emulator-ready", function() {
    postMessage({ type: 'emulatorReady' });
  });

  emulator.add_listener("serial0-output-byte", function(byte: number) {
    const char = String.fromCharCode(byte);

    if (char !== "\r") {
      data += char;
      dataBuffer += char;
      postMessage({ type: 'serialOutput', char });
    }

    if (data.trimEnd().endsWith("$") || data.trimEnd().endsWith("#") || data.trimEnd().endsWith("~%")) {
      postMessage({ type: 'shellPromptDetected' });
      dataBuffer = "";
    }

    if (data.length > 10000) {
      data = data.substring(data.length - 1000);
    }
  });
}

async function loadState(stateUrl: string) {
  try {
    isWorkerBusy = true;
    postMessage({ type: 'status', status: 'loadingState' });

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
    const stateData = new Uint8Array(compressedData);

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
    // Handle unknown error type
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to load state:', error);
    postMessage({ type: 'error', message: `Failed to load state: ${message}` });
    isWorkerBusy = false;
    return false;
  }
}

async function saveState() {
  // Add null check
  if (!emulator) {
    postMessage({ type: 'error', message: 'Emulator not initialized before saving state' });
    return false;
  }
  // Assign to a new const after the null check
  const currentEmulator = emulator;

  try {
    
    isWorkerBusy = true;
    postMessage({ type: 'status', status: 'savingState' });
    
    // Use the new constant
    const state = await currentEmulator.save_state();

    postMessage({
      type: 'stateSaved',
      state: new Blob([state]),
      details: `State size: ${(state.byteLength / 1024 / 1024).toFixed(2)} MB`
    });

    isWorkerBusy = false;
    return true;
  } catch (error) {
    // Handle unknown error type
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to save state:', error);
    postMessage({ type: 'error', message: `Failed to save state: ${message}` });
    isWorkerBusy = false;
    return false;
  }
}

function sendCommand(command: string) {
  if (!emulator) {
    postMessage({ type: 'error', message: 'Emulator not initialized' });
    return false;
  }

  try {
    dataBuffer = "";
    emulator.serial0_send(command + '\n');
    return true;
  } catch (error) {
    // Handle unknown error type
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to send command:', error);
    postMessage({ type: 'error', message: `Failed to send command: ${message}` });
    return false;
  }
}

function runTest(testType: 'ls' | 'python') {
  if (!emulator) {
    postMessage({ type: 'error', message: 'Emulator not initialized' });
    return false;
  }

  try {
    dataBuffer = "";

    if (testType === 'ls') {
      emulator.serial0_send("ls -la /\n");
    } else if (testType === 'python') {
      emulator.serial0_send("python --help\n");
    }
    
    return true;
  } catch (error) {
    // Handle unknown error type
    const message = error instanceof Error ? error.message : String(error);
    console.error('Failed to run test:', error);
    postMessage({ type: 'error', message: `Failed to run test: ${message}` });
    return false;
  }
}

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

postMessage({ type: 'workerReady' });
