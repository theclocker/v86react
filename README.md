# v86react

[![NPM Version](https://img.shields.io/npm/v/v86react?style=flat-square)](https://www.npmjs.com/package/v86react)
[![License: ISC](https://img.shields.io/npm/l/v86react?style=flat-square)](https://opensource.org/licenses/ISC)

A React wrapper component for the [v86](https://github.com/copy/v86) emulator, making it easier to embed x86 virtualization within your React applications.

## Motivation

Integrating the v86 emulator directly into React applications often requires significant boilerplate for setup, state management, and communication, especially when using web workers for performance. `v86react` aims to simplify this integration by providing a declarative and reusable component.

## Features

*   **Simple Integration:** Embed the v86 emulator using a straightforward `<V86 />` React component.
*   **Abstraction:** Hides the complexities of initializing and managing the v86 instance.
*   **Web Worker Support:** Runs the emulator in a web worker by default to prevent blocking the main UI thread, abstracting the necessary communication logic.
*   **Configurable:** Allows passing configuration options (like BIOS, disk images, WASM paths) to the emulator via props.
*   **State Management:** Includes basic functionality for saving and potentially loading the emulator state (currently saves state as a downloadable file).
*   **Built with TypeScript:** Provides static typing for a better developer experience.

## Installation

Using Yarn (as specified in `package.json`):

```bash
yarn add v86react
```

Or using npm:

```bash
npm install v86react
```

**Note:** This package requires `react` version 19 or higher as a peer dependency.

## Usage

Import the `V86` component and use it in your React application. You need to provide the necessary configuration, including paths to the v86 assets.

```jsx
import React from 'react';
import { V86 } from 'v86react';

function App() {
  const v86Config = {
    wasm_path: "/path/to/v86.wasm", // Required: Path to v86 WASM file
    bios_path: "/path/to/seabios.bin", // Required: Path to SeaBIOS file
    vgabios_path: "/path/to/vgabios.bin", // Required: Path to VGA BIOS file
    filesystem_basefs: "/path/to/fs.json", // Required: Path to filesystem definition JSON
    filesystem_baseurl: "/path/to/images/", // Required: Base URL for filesystem images
    // You might also need to configure other v86 options like cdrom, initial_state, etc.
    // See the v86 documentation for all available options.
  };

  // Optional: URL to a previously saved state file
  const stateUrl = "/path/to/v86state.bin"; 

  return (
    <div>
      <h1>My v86 Emulator</h1>
      <V86 config={v86Config} stateUrl={stateUrl} />
      {/* The component renders the emulator screen and basic controls */}
    </div>
  );
}

export default App;
```

### Component Props

*   **`config`** (`V86Config`, required): An object containing configuration options passed directly to the underlying v86 emulator instance running in the worker. See the [Configuration](#configuration) section below and the [official v86 documentation](https://github.com/copy/v86/blob/master/docs/options.md) for details.
*   **`stateUrl`** (`string`, optional): A URL pointing to a previously saved emulator state file (`.bin`). If provided, the emulator will attempt to load this state upon initialization.

### Configuration (`V86Config`)

The `config` prop requires an object specifying paths to essential v86 assets. These paths should be accessible via HTTP(S) from your application (e.g., placed in your `public` folder or served from a CDN).

```typescript
type V86Config = {
    wasm_path: string;      // URL to v86.wasm
    bios_path: string;      // URL to seabios.bin
    vgabios_path: string;   // URL to vgabios.bin
    filesystem_basefs: string; // URL to the filesystem definition JSON (e.g., default.json)
    filesystem_baseurl: string; // Base URL where filesystem images (e.g., linux.iso) are located
    // ... other valid v86 options (memory_size, vga_memory_size, cdrom_image_url, etc.)
};
```

Refer to the [v86 options documentation](https://github.com/copy/v86/blob/master/docs/options.md) for a complete list of available configuration parameters.

### Using the `useV86` Hook Directly

For more granular control, you can use the `useV86` hook directly. This is useful if you want to build a custom UI around the emulator or handle events in a specific way.

```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useV86, V86Config } from 'v86react'; // Assuming useV86 is exported

function CustomV86Interface() {
  const [terminalOutput, setTerminalOutput] = useState('');
  const [command, setCommand] = useState('');

  const v86Config: V86Config = {
    wasm_path: "/path/to/v86.wasm",
    bios_path: "/path/to/seabios.bin",
    vgabios_path: "/path/to/vgabios.bin",
    filesystem_basefs: "/path/to/fs.json",
    filesystem_baseurl: "/path/to/images/",
    // Other config...
  };

  const handleSerialOutput = useCallback((char: string) => {
    setTerminalOutput(prev => prev + char);
  }, []);

  const handleStatusChange = useCallback((status: string, details?: string) => {
    console.log(`Emulator Status: ${status}`, details || '');
    // Update UI based on status
  }, []);
  
  const handleEmulatorReady = useCallback(() => {
    console.log("Emulator is ready!");
    // Enable command input, etc.
  }, []);

  const { 
    isReady, 
    status, 
    sendCommand, 
    saveState, 
    cleanCache 
  } = useV86({
    config: v86Config,
    // stateUrl: "/optional/path/to/state.bin",
    onSerialOutput: handleSerialOutput,
    onStatusChange: handleStatusChange,
    onEmulatorReady: handleEmulatorReady,
    onError: (msg) => console.error("V86 Error:", msg),
    onShellPromptDetected: () => console.log("Shell prompt detected."),
  });

  const handleSendCommand = () => {
    if (isReady && command) {
      sendCommand(command + '\n'); // Add newline for shell commands
      setTerminalOutput(prev => prev + `\n> ${command}\n`);
      setCommand('');
      cleanCache(); // Example: Clean cache after sending command
    }
  };

  return (
    <div>
      <h2>Custom v86 Interface</h2>
      <p>Status: {status} {isReady ? '(Ready)' : '(Initializing...)'}</p>
      
      <pre style={{ height: '300px', overflowY: 'scroll', border: '1px solid #ccc', background: '#f0f0f0', padding: '5px' }}>
        {terminalOutput}
      </pre>
      
      <input 
        type="text" 
        value={command} 
        onChange={(e) => setCommand(e.target.value)} 
        disabled={!isReady}
        onKeyPress={(e) => e.key === 'Enter' && handleSendCommand()}
      />
      <button onClick={handleSendCommand} disabled={!isReady}>Send Command</button>
      <button onClick={saveState} disabled={!isReady}>Save State</button>
    </div>
  );
}

export default CustomV86Interface;
```

This hook provides access to the emulator's state (`isReady`, `status`) and functions (`sendCommand`, `saveState`, `cleanCache`, `runTest`) while allowing you to define callbacks for various emulator events.

## Development

To set up the development environment for `v86react` itself:

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/v86react.git 
    cd v86react
    ```
    *(Replace `your-username` with the actual repository location if applicable)*
2.  **Install dependencies:**
    ```bash
    yarn install
    ```
3.  **(Optional) Build local v86 assets:** If you need to rebuild the included v86 library:
    ```bash
    yarn full-build 
    ```
    *(This might require Docker and other build tools)*
4.  **Run Storybook:** View and interact with the component in isolation:
    ```bash
    yarn storybook
    ```
5.  **Build the library:** Compile TypeScript to JavaScript in the `dist` folder:
    ```bash
    yarn build
    ```

## License

This project is licensed under the **ISC License**. See the LICENSE file for details.

## Author

*   Yonatan Vega

## Contributing

Contributions are welcome! Please feel free to open an issue or submit a pull request. *(Consider adding more specific contribution guidelines if needed)*
