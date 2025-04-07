export type V86Config = {
    wasm_path: string;
    bios_path: string;
    vgabios_path: string;
    filesystem_basefs: string;
    filesystem_baseurl: string;
};
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
export declare const useV86: (options?: UseV86Options) => {
    isReady: boolean;
    status: string;
    sendCommand: (command: string) => void;
    runTest: (testType: "ls" | "python") => void;
    saveState: () => void;
    cleanCache: () => void;
};
