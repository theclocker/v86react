// v86 type declarations

// Main v86 module declaration (remains the same)
declare module "v86" {
  export default class V86Starter {
    constructor(options: V86StarterOptions);
    emulator_init(): Promise<void>;
    run(): void;
    stop(): void;
    restart(): void;
    add_listener(event: V86EventType, listener: (...args: any[]) => void): void;
    remove_listener(event: V86EventType, listener: (...args: any[]) => void): void;
    save_state(callback: (err: Error | null, state: Uint8Array) => void): void;
    save_state(): Promise<Uint8Array>;
    restore_state(state: Uint8Array, callback?: (err: Error | null) => void): void;
    serial0_send(charCode: number): void;
    serial0_send(str: string): void;
    keyboard_send_scancodes(code: number, pressed: boolean): void;
    mouse_move(dx: number, dy: number, button: number): void;
    mouse_set_position(x: number, y: number): void;
    lock_mouse(enabled: boolean): void;
    go_fullscreen(): void;
    screen_make_screenshot(): Uint8Array;
    get_statistics(): V86Statistics;
    cpu: {
      devices: {
        [key: string]: any;
        serial0?: {
          send_char(charCode: number): void;
        };
      };
    };
    tcp_handler?: {
      register_forwarding(host_port: number, guest_port: number): void;
    };
  }

  export interface V86StarterOptions {
    wasm_path: string;
    memory_size: number;
    vga_memory_size: number;
    screen_container?: HTMLElement;
    bios?: { url: string; };
    vga_bios?: { url: string; };
    cdrom?: { url: string; };
    fda?: { url: string; };
    hda?: { url: string; };
    hdb?: { url: string; };
    bzimage?: { url: string; };
    initrd?: { url: string; };
    filesystem?: { baseurl: string; basefs: string; };
    autostart?: boolean;
    disable_keyboard?: boolean;
    disable_mouse?: boolean;
    serial0?: boolean;
    serial?: { receiveByte?: (byte: number) => void; };
    bzimage_initrd_from_filesystem?: boolean;
    cmdline?: string;
    network_relay_url?: string;
    network_adapter?: { name: string; mac_address: string; };
    initial_state?: { url: string; };
  }

  export type V86EventType =
    | 'emulator-ready' | 'emulator-started' | 'emulator-stopped' | 'emulator-loaded'
    | 'download-progress' | 'screen-set-mode' | 'screen-set-size' | 'mouse-enable'
    | 'mouse-disable' | 'serial0-output-char' | 'serial0-output-byte' | 'net0-init'
    | 'exit' | 'power-down-hard' | 'power-up-hard' | 'error';

  export interface V86Statistics {
    ips: number;
    protected_mode: boolean;
    virtual_mode: boolean;
    memory_size: number;
    vga_memory_size: number;
  }
}

// Corrected type declarations for the specific import path used in v86.worker.ts
declare module "../../lib/libv86" {
  // Import the base types from the main module declaration
  import V86StarterBase from "v86";
  import { V86StarterOptions as V86OptionsBase, V86EventType as V86EventTypeBase, V86Statistics as V86StatisticsBase } from "v86";

  // Declare the default export as a class constructor matching the base type
  const V86Starter: {
    new (options: V86OptionsBase): V86StarterBase;
  };
  export default V86Starter;

  // Re-export types (optional, but can be helpful)
  export type V86StarterOptions = V86OptionsBase;
  export type V86EventType = V86EventTypeBase;
  export type V86Statistics = V86StatisticsBase;
}

// Asset URL imports (remain the same)
declare module "*.bin?url" {
  const url: string;
  export default url;
}

declare module "*.wasm?url" {
  const url: string;
  export default url;
}

declare module "*.json?url" {
  const url: string;
  export default url;
}
