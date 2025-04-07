import { useRef, useState, useEffect, useCallback } from 'react';

// Import worker
// @ts-ignore
import V86Worker from './v86.worker?worker';

// Define the types of messages we can receive from the worker
type WorkerMessage =
  | { type: 'workerReady' }
  | { type: 'status'; status: string; details?: string }
  | { type: 'error'; message: string }
  | { type: 'emulatorReady' }
  | { type: 'serialOutput'; char: string }
  | { type: 'shellPromptDetected' }
  | { type: 'stateSaved'; state: Uint8Array; details: string };


export type V86Config = {
    wasm_path: string,
    bios_path: string,
    vgabios_path: string,
    filesystem_basefs: string,
    filesystem_baseurl: string
}


export interface UseV86Options {
  stateUrl?: string;
  screenContainer?: HTMLDivElement | null;
  onStatusChange?: (status: string, details?: string) => void;
  onError?: (message: string) => void;
  onSerialOutput?: (char: string) => void;
  onShellPromptDetected?: () => void;
  onEmulatorReady?: () => void;
  config?: V86Config;
}

export const useV86 = (options: UseV86Options = {}) => {
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [status, setStatus] = useState<string>('initializing');

  // Initialize the worker
  useEffect(() => {
    // Create a new worker
    const worker = new V86Worker();
    workerRef.current = worker;

    // Set up message handler
    worker.onmessage = (e: MessageEvent<WorkerMessage>) => {
      const message = e.data;

      switch (message.type) {
        case 'workerReady':
          console.log('V86 worker is ready');
          break;

        case 'status':
          setStatus(message.status);
          options.onStatusChange?.(message.status, message.details);
          break;

        case 'error':
          console.error('V86 error:', message.message);
          options.onError?.(message.message);
          break;

        case 'emulatorReady':
          setIsReady(true);
          options.onEmulatorReady?.();
          break;

        case 'serialOutput':
          options.onSerialOutput?.(message.char);
          break;

        case 'shellPromptDetected':
          options.onShellPromptDetected?.();
          break;

        case 'stateSaved':
          saveStateToFile(message.state);
          break;

        default:
          console.warn('Unknown message from worker:', message);
      }
    };

    const absolutePaths = {
        wasm_path: options.config?.wasm_path,
        bios_path: options.config?.bios_path,
        vgabios_path: options.config?.vgabios_path,
        filesystem_basefs: options.config?.filesystem_basefs,
        filesystem_baseurl: options.config?.filesystem_baseurl
    };

    // Initialize the emulator
    worker.postMessage({
      type: 'init',
      config: {
        screen_container: options.screenContainer ?? undefined,
        memory_size: 128 * 1024 * 1024,
        vga_memory_size: 4 * 1024 * 1024,
        ...absolutePaths,
        cmdline: "console=ttyS0 rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable"
      }
    });

    // Cleanup function
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  // Load state if provided
  useEffect(() => {
    if (options.stateUrl && workerRef.current) {
      workerRef.current.postMessage({ type: 'loadState', stateUrl: options.stateUrl });
    }
  }, [options.stateUrl]);

  // Save the state to a file
  const saveStateToFile = useCallback((state: Uint8Array) => {
    const blob = new Blob([state], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'v86state.bin';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // Send a command to the emulator
  const sendCommand = useCallback((command: string) => {
    if (!workerRef.current || !isReady) return;
    workerRef.current.postMessage({ type: 'sendCommand', command });
  }, [isReady]);

  // Run a test command
  const runTest = useCallback((testType: 'ls' | 'python') => {
    if (!workerRef.current || !isReady) return;
    workerRef.current.postMessage({ type: 'runTest', testType });
  }, [isReady]);

  // Save the current state
  const saveState = useCallback(() => {
    if (!workerRef.current || !isReady) return;
    workerRef.current.postMessage({ type: 'saveState' });
  }, [isReady]);

  // Clean the cache
  const cleanCache = useCallback(() => {
    if (!workerRef.current) return;
    workerRef.current.postMessage({ type: 'cleanCache' });
  }, []);

  return {
    isReady,
    status,
    sendCommand,
    runTest,
    saveState,
    cleanCache
  };
};