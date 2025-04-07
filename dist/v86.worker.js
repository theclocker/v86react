"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
let emulator = null; // Use the imported type
let dataBuffer = '';
let isWorkerBusy = false;
// Add explicit return type and handle potential errors
function loadV86() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const v86module = yield Promise.resolve().then(() => __importStar(require('./lib/libv86')));
            if (!v86module.default || typeof v86module.default !== 'function') {
                throw new Error("Default export is not a constructable function.");
            }
            // Assert the type to match our expectation
            return v86module.default;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.error('Failed to load v86:', error);
            postMessage({ type: 'error', message: `Failed to load v86 emulator: ${message}` });
            throw error; // Re-throw after logging/posting
        }
    });
}
function initEmulator(config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            isWorkerBusy = true;
            postMessage({ type: 'status', status: 'initializing' });
            const V86Constructor = yield loadV86();
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
            console.log(config);
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
        }
        catch (error) {
            // Handle unknown error type
            const message = error instanceof Error ? error.message : String(error);
            console.error('Failed to initialize emulator:', error);
            postMessage({ type: 'error', message: `Failed to initialize emulator: ${message}` });
            isWorkerBusy = false;
            return false;
        }
    });
}
function setupEventListeners() {
    if (!emulator)
        return;
    let data = "";
    emulator.add_listener("emulator-ready", function () {
        postMessage({ type: 'emulatorReady' });
    });
    emulator.add_listener("serial0-output-byte", function (byte) {
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
function loadState(stateUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            isWorkerBusy = true;
            postMessage({ type: 'status', status: 'loadingState' });
            const response = yield fetch(stateUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch state file: ${response.status}`);
            }
            const compressedData = yield response.arrayBuffer();
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
            yield new Promise((resolve, reject) => {
                emulator.restore_state(stateData, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
            postMessage({ type: 'status', status: 'stateLoaded' });
            isWorkerBusy = false;
            return true;
        }
        catch (error) {
            // Handle unknown error type
            const message = error instanceof Error ? error.message : String(error);
            console.error('Failed to load state:', error);
            postMessage({ type: 'error', message: `Failed to load state: ${message}` });
            isWorkerBusy = false;
            return false;
        }
    });
}
function saveState() {
    return __awaiter(this, void 0, void 0, function* () {
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
            const state = yield currentEmulator.save_state();
            postMessage({
                type: 'stateSaved',
                state: new Blob([state]),
                details: `State size: ${(state.byteLength / 1024 / 1024).toFixed(2)} MB`
            });
            isWorkerBusy = false;
            return true;
        }
        catch (error) {
            // Handle unknown error type
            const message = error instanceof Error ? error.message : String(error);
            console.error('Failed to save state:', error);
            postMessage({ type: 'error', message: `Failed to save state: ${message}` });
            isWorkerBusy = false;
            return false;
        }
    });
}
function sendCommand(command) {
    if (!emulator) {
        postMessage({ type: 'error', message: 'Emulator not initialized' });
        return false;
    }
    try {
        dataBuffer = "";
        emulator.serial0_send(command + '\n');
        return true;
    }
    catch (error) {
        // Handle unknown error type
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to send command:', error);
        postMessage({ type: 'error', message: `Failed to send command: ${message}` });
        return false;
    }
}
function runTest(testType) {
    if (!emulator) {
        postMessage({ type: 'error', message: 'Emulator not initialized' });
        return false;
    }
    try {
        dataBuffer = "";
        if (testType === 'ls') {
            emulator.serial0_send("ls -la /\n");
        }
        else if (testType === 'python') {
            emulator.serial0_send("python --help\n");
        }
        return true;
    }
    catch (error) {
        // Handle unknown error type
        const message = error instanceof Error ? error.message : String(error);
        console.error('Failed to run test:', error);
        postMessage({ type: 'error', message: `Failed to run test: ${message}` });
        return false;
    }
}
self.onmessage = function (e) {
    return __awaiter(this, void 0, void 0, function* () {
        const message = e.data;
        switch (message.type) {
            case 'init':
                yield initEmulator(message.config);
                break;
            case 'sendCommand':
                sendCommand(message.command);
                break;
            case 'loadState':
                yield loadState(message.stateUrl);
                break;
            case 'saveState':
                yield saveState();
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
    });
};
postMessage({ type: 'workerReady' });
