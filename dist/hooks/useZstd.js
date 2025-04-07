"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useZstd = void 0;
const zstd_wasm_1 = require("@bokuweb/zstd-wasm");
const zstd_wasm_url_1 = __importDefault(require("../../wasm/zstd.wasm?url"));
const useZstd = () => {
    // Function to load and decompress the VM state
    const loadCompressedState = (stateUrl) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            const response = yield fetch(stateUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch state file: ${response.status}`);
            }
            const compressedBuffer = yield response.arrayBuffer();
            // Initialize zstd decompressor
            yield (0, zstd_wasm_1.init)(zstd_wasm_url_1.default);
            // Decompress the state
            const decompressedBuffer = (0, zstd_wasm_1.decompress)(new Uint8Array(compressedBuffer));
            return decompressedBuffer;
        }
        catch (error) {
            console.error("Error loading compressed state:", error);
            throw error;
        }
    });
    return {
        loadCompressedState
    };
};
exports.useZstd = useZstd;
