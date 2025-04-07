"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useV86 = void 0;
const react_1 = require("react");
// Import worker
// @ts-ignore
const v86_worker_worker_1 = __importDefault(require("./v86.worker?worker"));
const useV86 = (options = {}) => {
    const workerRef = (0, react_1.useRef)(null);
    const [isReady, setIsReady] = (0, react_1.useState)(false);
    const [status, setStatus] = (0, react_1.useState)('initializing');
    // Initialize the worker
    (0, react_1.useEffect)(() => {
        var _a, _b, _c, _d, _e, _f;
        // Create a new worker
        const worker = new v86_worker_worker_1.default();
        workerRef.current = worker;
        // Set up message handler
        worker.onmessage = (e) => {
            var _a, _b, _c, _d, _e;
            const message = e.data;
            switch (message.type) {
                case 'workerReady':
                    console.log('V86 worker is ready');
                    break;
                case 'status':
                    setStatus(message.status);
                    (_a = options.onStatusChange) === null || _a === void 0 ? void 0 : _a.call(options, message.status, message.details);
                    break;
                case 'error':
                    console.error('V86 error:', message.message);
                    (_b = options.onError) === null || _b === void 0 ? void 0 : _b.call(options, message.message);
                    break;
                case 'emulatorReady':
                    setIsReady(true);
                    (_c = options.onEmulatorReady) === null || _c === void 0 ? void 0 : _c.call(options);
                    break;
                case 'serialOutput':
                    (_d = options.onSerialOutput) === null || _d === void 0 ? void 0 : _d.call(options, message.char);
                    break;
                case 'shellPromptDetected':
                    (_e = options.onShellPromptDetected) === null || _e === void 0 ? void 0 : _e.call(options);
                    break;
                case 'stateSaved':
                    saveStateToFile(message.state);
                    break;
                default:
                    console.warn('Unknown message from worker:', message);
            }
        };
        const absolutePaths = {
            wasm_path: (_a = options.config) === null || _a === void 0 ? void 0 : _a.wasm_path,
            bios_path: (_b = options.config) === null || _b === void 0 ? void 0 : _b.bios_path,
            vgabios_path: (_c = options.config) === null || _c === void 0 ? void 0 : _c.vgabios_path,
            filesystem_basefs: (_d = options.config) === null || _d === void 0 ? void 0 : _d.filesystem_basefs,
            filesystem_baseurl: (_e = options.config) === null || _e === void 0 ? void 0 : _e.filesystem_baseurl
        };
        // Initialize the emulator
        worker.postMessage({
            type: 'init',
            config: Object.assign(Object.assign({ screen_container: (_f = options.screenContainer) !== null && _f !== void 0 ? _f : undefined, memory_size: 128 * 1024 * 1024, vga_memory_size: 4 * 1024 * 1024 }, absolutePaths), { cmdline: "console=ttyS0 rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable" })
        });
        // Cleanup function
        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, []);
    // Load state if provided
    (0, react_1.useEffect)(() => {
        if (options.stateUrl && workerRef.current) {
            workerRef.current.postMessage({ type: 'loadState', stateUrl: options.stateUrl });
        }
    }, [options.stateUrl]);
    // Save the state to a file
    const saveStateToFile = (0, react_1.useCallback)((state) => {
        const blob = new Blob([state], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'v86state.bin';
        a.click();
        URL.revokeObjectURL(url);
    }, []);
    // Send a command to the emulator
    const sendCommand = (0, react_1.useCallback)((command) => {
        if (!workerRef.current || !isReady)
            return;
        workerRef.current.postMessage({ type: 'sendCommand', command });
    }, [isReady]);
    // Run a test command
    const runTest = (0, react_1.useCallback)((testType) => {
        if (!workerRef.current || !isReady)
            return;
        workerRef.current.postMessage({ type: 'runTest', testType });
    }, [isReady]);
    // Save the current state
    const saveState = (0, react_1.useCallback)(() => {
        if (!workerRef.current || !isReady)
            return;
        workerRef.current.postMessage({ type: 'saveState' });
    }, [isReady]);
    // Clean the cache
    const cleanCache = (0, react_1.useCallback)(() => {
        if (!workerRef.current)
            return;
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
exports.useV86 = useV86;
