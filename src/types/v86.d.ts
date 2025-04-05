// Fixed v86 type declarations

// Main v86 module declaration
declare module "v86" {
  export default class V86Starter {
    /**
     * Create a new V86 emulator instance
     * @param options Configuration options for the emulator
     */
    constructor(options: V86StarterOptions);

    /**
     * Initialize the emulator without starting execution
     */
    emulator_init(): Promise<void>;

    /**
     * Start or resume execution
     */
    run(): void;

    /**
     * Stop execution
     */
    stop(): void;

    /**
     * Restart the emulator with the current configuration
     */
    restart(): void;

    /**
     * Add an event listener
     * @param event Event name
     * @param listener Callback function
     */
    add_listener(event: V86EventType, listener: (...args: any[]) => void): void;

    /**
     * Remove an event listener
     * @param event Event name
     * @param listener Callback function
     */
    remove_listener(event: V86EventType, listener: (...args: any[]) => void): void;

    /**
     * Save the current state of the emulator
     * @param callback Function called with the state data
     */
    save_state(callback: (err: Error | null, state: Uint8Array) => void): void;

    /**
     * Save the current state of the emulator (Promise version)
     * @returns Promise resolving to state data
     */
    save_state(): Promise<Uint8Array>;

    /**
     * Restore a previously saved state
     * @param state State data as returned by save_state
     * @param callback Function called when the state has been restored
     */
    restore_state(state: Uint8Array, callback?: (err: Error | null) => void): void;

    /**
     * Send a character to the emulated serial port
     * @param charCode Character code to send
     */
    serial0_send(charCode: number): void;

    /**
     * Send a string to the emulated serial port
     * @param str String to send
     */
    serial0_send(str: string): void;

    /**
     * Send a key event to the emulator
     * @param code Key code
     * @param pressed Whether the key is pressed (true) or released (false)
     */
    keyboard_send_scancodes(code: number, pressed: boolean): void;

    /**
     * Send mouse event to the emulator
     * @param dx Mouse movement in x direction
     * @param dy Mouse movement in y direction
     * @param button State of mouse buttons
     */
    mouse_move(dx: number, dy: number, button: number): void;

    /**
     * Set the mouse position
     * @param x Absolute x coordinate
     * @param y Absolute y coordinate
     */
    mouse_set_position(x: number, y: number): void;

    /**
     * Lock or unlock the mouse
     * @param enabled Whether to lock the mouse
     */
    lock_mouse(enabled: boolean): void;

    /**
     * Go into fullscreen mode
     */
    go_fullscreen(): void;

    /**
     * Create a screenshot
     * @returns An Uint8Array of RGBA values
     */
    screen_make_screenshot(): Uint8Array;

    /**
     * Returns an object containing machine state data
     */
    get_statistics(): V86Statistics;

    /**
     * The underlying CPU object
     */
    cpu: {
      /**
       * CPU devices including serial ports
       */
      devices: {
        [key: string]: any;
        serial0?: {
          /**
           * Send a character to the serial port
           * @param charCode Character code
           */
          send_char(charCode: number): void;
        };
      };
    };

    /**
     * The underlying network adapter handler
     */
    tcp_handler?: {
      /**
       * Register port forwarding
       * @param host_port Host port
       * @param guest_port Guest port
       */
      register_forwarding(host_port: number, guest_port: number): void;
    };
  }

  export interface V86StarterOptions {
    /**
     * Path to the v86.wasm file
     */
    wasm_path: string;
    
    /**
     * Amount of memory to allocate to the emulator in bytes
     */
    memory_size: number;
    
    /**
     * Amount of VGA memory in bytes
     */
    vga_memory_size: number;
    
    /**
     * DOM element to render the screen output
     */
    screen_container?: HTMLElement;
    
    /**
     * URL to fetch the BIOS
     */
    bios?: {
      url: string;
    };
    
    /**
     * URL to fetch the VGA BIOS
     */
    vga_bios?: {
      url: string;
    };
    
    /**
     * URL to fetch a cdrom image
     */
    cdrom?: {
      url: string;
    };
    
    /**
     * URL to fetch a floppy disk image
     */
    fda?: {
      url: string;
    };
    
    /**
     * URL to fetch a hard disk image
     */
    hda?: {
      url: string;
    };
    
    /**
     * URL to fetch a second hard disk image
     */
    hdb?: {
      url: string;
    };
    
    /**
     * URL to fetch a kernel image
     */
    bzimage?: {
      url: string;
    };
    
    /**
     * URL to fetch an initrd image
     */
    initrd?: {
      url: string;
    };
    
    /**
     * Filesystem configuration
     */
    filesystem?: {
      /**
       * Base URL for filesystem data
       */
      baseurl: string;
      
      /**
       * URL to the base filesystem JSON
       */
      basefs: string;
    };
    
    /**
     * Whether to start the emulator automatically
     */
    autostart?: boolean;
    
    /**
     * Disable the keyboard
     */
    disable_keyboard?: boolean;
    
    /**
     * Disable the mouse
     */
    disable_mouse?: boolean;
    
    /**
     * Enable serial port 0 (COM1)
     */
    serial0?: boolean;
    
    /**
     * Serial port configuration
     */
    serial?: {
      /**
       * Function called when a byte is received from the emulated serial port
       */
      receiveByte?: (byte: number) => void;
    };
    
    /**
     * Use the bzimage and initrd from the filesystem
     */
    bzimage_initrd_from_filesystem?: boolean;
    
    /**
     * Kernel command line parameters
     */
    cmdline?: string;
    
    /**
     * Network relay URL for networking support
     */
    network_relay_url?: string;
    
    /**
     * Network adapter configuration
     */
    network_adapter?: {
      /**
       * Adapter name
       */
      name: string;
      
      /**
       * MAC address
       */
      mac_address: string;
    };
    
    /**
     * Initial state to load
     */
    initial_state?: {
      /**
       * URL to fetch the state data
       */
      url: string;
    };
  }

  export type V86EventType = 
    | 'emulator-ready'            // Emulator is ready for input
    | 'emulator-started'          // Emulator execution has started
    | 'emulator-stopped'          // Emulator execution has stopped
    | 'emulator-loaded'           // Emulator resources have loaded
    | 'download-progress'         // Progress on downloading resources
    | 'screen-set-mode'           // Screen mode has changed
    | 'screen-set-size'           // Screen size has changed
    | 'mouse-enable'              // Mouse has been enabled
    | 'mouse-disable'             // Mouse has been disabled
    | 'serial0-output-char'       // Character output from serial port 0
    | 'serial0-output-byte'       // Byte output from serial port 0
    | 'net0-init'                 // Network adapter 0 initialized
    | 'exit'                      // Emulator has exited
    | 'power-down-hard'           // Hard power-down event
    | 'power-up-hard'             // Hard power-up event
    | 'error';                    // An error has occurred

  export interface V86Statistics {
    /** Number of instructions per second */
    ips: number;
    
    /** Protected mode enabled status */
    protected_mode: boolean;
    
    /** Virtual 8086 mode status */
    virtual_mode: boolean;
    
    /** Current main memory usage */
    memory_size: number;
    
    /** Current VGA memory usage */
    vga_memory_size: number;
  }
}

// Type declarations for v86 build in your project
declare module "../../v86/build/libv86" {
  // Define a constructor class type
  export const default: {
    new (options: import("v86").V86StarterOptions): import("v86").default;
  };
  
  // Re-export types
  export type V86StarterOptions = import("v86").V86StarterOptions;
  export type V86EventType = import("v86").V86EventType;
  export type V86Statistics = import("v86").V86Statistics;
}

// Asset URL imports
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