import { init, decompress } from "@bokuweb/zstd-wasm";
import wasmUrl from "../../wasm/zstd.wasm?url";


export const useZstd = () => {
    // Function to load and decompress the VM state
    const loadCompressedState = async (stateUrl: string) => {
        try {
            const response = await fetch(stateUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch state file: ${response.status}`);
            }

            const compressedBuffer = await response.arrayBuffer();
            // Initialize zstd decompressor
            await init(wasmUrl);

            // Decompress the state
            const decompressedBuffer = decompress(new Uint8Array(compressedBuffer));
            return decompressedBuffer;
        } catch (error) {
            console.error("Error loading compressed state:", error);
            throw error;
        }
    };

    return {
        loadCompressedState
    }
}