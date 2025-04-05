import { useCallback, useEffect, useRef, useState } from "react";
// import * as libv86 from "../../v86/build/libv86";
import saebios from "../../v86/bios/seabios.bin?url";
import vgabios from "../../v86/bios/vgabios.bin?url";
import v86wasm from "../../v86/build/v86.wasm?url";
import v86fs from "../../v86/images/alpine-fs.json?url";
import { init, decompress } from '@bokuweb/zstd-wasm';
import { useZstd } from "./useZstd";

// Global reference to emulator for direct access
let emulator = null;

export const V86 = () => {
    const [screenContainer, setScreenContainer] = useState<HTMLDivElement | null>(null);
    const [terminalValue, setTerminalValue] = useState<string>("");
    const [commandValue, setCommandValue] = useState<string>("");
    const captureOutput = useRef<boolean>(false);
    const dataBuffer = useRef<string>("");
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const [isReady, setIsReady] = useState<boolean>(false);
    const {loadCompressedState} = useZstd()

    const V86 = useCallback(async () => {
        return (await import("../../v86/build/libv86")).default;
    }, []);

    // Function to append text to terminal and auto-scroll
    const appendToTerminal = useCallback((text: string) => {
        setTerminalValue(prev => prev + text);
        // Auto-scroll the terminal to the bottom
        setTimeout(() => {
            if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
        }, 0);
    }, []);

    const initVM = async () => {
        const v86 = await V86()
            console.log(v86)
            emulator = new v86({
                wasm_path: v86wasm,
                memory_size: 128 * 1024 * 1024,
                vga_memory_size: 4 * 1024 * 1024,
                // screen_container: screenContainer,
                bios: { url: saebios },
                vga_bios: { url: vgabios },
                filesystem: {
                    baseurl: "../../src/v86/images/alpine-rootfs-flat/",
                    basefs: v86fs,
                },
                autostart: true,
                serial0: true,
                // Critical for Alpine Linux to work properly with v86
                bzimage_initrd_from_filesystem: true,
                cmdline: "console=ttyS0 rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable",
            });
            
            // This approach mimics the Lua example directly
            let data = "";
            
            emulator.add_listener("serial0-output-byte", function(byte) {
                const char = String.fromCharCode(byte);
                
                // Skip carriage returns
                if (char !== "\r") {
                    data += char;
                    dataBuffer.current += char;
                }
                
                // Always output to terminal if we're capturing
                if (captureOutput.current) {
                    appendToTerminal(char);
                }
                
                // Check for shell prompt (assuming Linux "$ " or "# " prompt)
                if (data.trimEnd().endsWith("$") || data.trimEnd().endsWith("#") || data.trimEnd().endsWith("~%")) {
                    console.log("Shell prompt detected");
                    
                    // We've reached the end of the command output
                    if (!isReady) {
                        setIsReady(true);
                        appendToTerminal("\nSystem is ready for commands\n");
                    }
                    
                    // Stop capturing unless we just started
                    if (captureOutput.current && dataBuffer.current.length > 3) {
                        captureOutput.current = false;
                    }
                }
                
                // Keep the buffer manageable
                if (data.length > 10000) {
                    data = data.substring(data.length - 1000);
                }
                if (dataBuffer.current.length > 10000) {
                    dataBuffer.current = dataBuffer.current.substring(dataBuffer.current.length - 1000);
                }
            });
    }

    useEffect(() => {
        if (!screenContainer) return;

        appendToTerminal("Booting system... please wait\n");

        V86().then((v86) => {
            console.log(v86)
            emulator = new v86({
                wasm_path: v86wasm,
                memory_size: 128 * 1024 * 1024,
                vga_memory_size: 4 * 1024 * 1024,
                // screen_container: screenContainer,
                bios: { url: saebios },
                vga_bios: { url: vgabios },
                filesystem: {
                    baseurl: "../../src/v86/images/alpine-rootfs-flat/",
                    basefs: v86fs,
                },
                autostart: true,
                serial0: true,
                // Critical for Alpine Linux to work properly with v86
                bzimage_initrd_from_filesystem: true,
                cmdline: "console=ttyS0 rw root=host9p rootfstype=9p rootflags=trans=virtio,cache=loose modules=virtio_pci tsc=reliable",
            });
            
            // This approach mimics the Lua example directly
            let data = "";
            
            emulator.add_listener("serial0-output-byte", function(byte) {
                const char = String.fromCharCode(byte);
                
                // Skip carriage returns
                if (char !== "\r") {
                    data += char;
                    dataBuffer.current += char;
                }
                
                // Always output to terminal if we're capturing
                if (captureOutput.current) {
                    appendToTerminal(char);
                }
                
                // Check for shell prompt (assuming Linux "$ " or "# " prompt)
                if (data.trimEnd().endsWith("$") || data.trimEnd().endsWith("#") || data.trimEnd().endsWith("~%")) {
                    console.log("Shell prompt detected");
                    
                    // We've reached the end of the command output
                    if (!isReady) {
                        setIsReady(true);
                        appendToTerminal("\nSystem is ready for commands\n");
                    }
                    
                    // Stop capturing unless we just started
                    if (captureOutput.current && dataBuffer.current.length > 3) {
                        captureOutput.current = false;
                    }
                }
                
                // Keep the buffer manageable
                if (data.length > 10000) {
                    data = data.substring(data.length - 1000);
                }
                if (dataBuffer.current.length > 10000) {
                    dataBuffer.current = dataBuffer.current.substring(dataBuffer.current.length - 1000);
                }
            });

        }).catch(error => {
            console.error("Error initializing V86:", error);
            appendToTerminal("Error: Failed to initialize V86 emulator\n");
        });
    }, [screenContainer, appendToTerminal, isReady]);

    const sendInput = useCallback(() => {
        if (!emulator || !commandValue) return;
        
        // Display the command in the terminal with a prompt
        appendToTerminal(`> ${commandValue}\n`);
        
        // Clear any pending output
        dataBuffer.current = "";
        
        // Start capturing output
        captureOutput.current = true;
        
        try {
            // Send the command followed by newline
            emulator.serial0_send(commandValue + '\n');
            console.log("Command sent:", commandValue);
        } catch (error) {
            console.error("Error sending command:", error);
            appendToTerminal("Error: Failed to send command\n");
            captureOutput.current = false;
        }
        
        setCommandValue("");
    }, [commandValue, appendToTerminal]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            sendInput();
        }
    }, [sendInput]);

    // Run a test command similar to the Lua example
    const runTest = useCallback(() => {
        if (!emulator) return;
        
        // Clear the result area first
        appendToTerminal("\n--- TEST COMMAND ---\n");
        
        // Reset capture buffer
        dataBuffer.current = "";
        
        // Start capturing output
        captureOutput.current = true;
        
        // Send a simple command that will produce output
        emulator.serial0_send("ls -la /\n");
        
        console.log("Test command sent");
    }, [appendToTerminal]);

    // Run a python command similar to your setTimeout example
    const runPython = useCallback(() => {
        if (!emulator) return;
        
        appendToTerminal("\n--- PYTHON TEST ---\n");
        dataBuffer.current = "";
        captureOutput.current = true;
        
        emulator.serial0_send("python --help\n");
        console.log("Python help command sent");
    }, [appendToTerminal]);

    const saveState = () => {
        emulator.save_state().then(state => {
            var a = document.createElement("a");
            a.download = "v86state.bin";
            a.href = window.URL.createObjectURL(new Blob([state]));
            a.dataset.downloadurl = "application/octet-stream:" + a.download + ":" + a.href;
            a.click();
        });
    };

    return (
        <div>
            <div id="screen_container" ref={setScreenContainer}>
                <div
                    style={{
                        whiteSpace: "pre",
                        font: "14px monospace",
                        lineHeight: "14px",
                    }}
                />
                <canvas style={{ display: "none" }} />
                
                {/* Status indicator */}
                <div style={{ 
                    padding: '8px', 
                    backgroundColor: isReady ? '#2e7d32' : '#f57c00',
                    color: 'white',
                    marginBottom: '8px',
                    borderRadius: '4px'
                }}>
                    Status: {isReady ? 'Ready for commands' : 'System is booting...'}
                </div>
                
                {/* Terminal output display */}
                <div 
                    ref={terminalRef}
                    style={{
                        width: '100%',
                        height: '400px',
                        backgroundColor: 'black',
                        color: '#00ff00',
                        fontFamily: 'monospace',
                        padding: '10px',
                        overflowY: 'scroll',
                        borderRadius: '5px',
                        marginBottom: '10px',
                        whiteSpace: 'pre-wrap', // Preserve whitespace and wrap text
                    }}
                >
                    {terminalValue}
                </div>
                
                {/* Command input */}
                <div style={{ display: 'flex', marginBottom: '10px' }}>
                    <input
                        type="text"
                        style={{
                            flex: 1,
                            padding: '8px',
                            fontFamily: 'monospace',
                        }}
                        placeholder="Enter command..."
                        value={commandValue}
                        onChange={(e) => setCommandValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={!isReady}
                    />
                    <button 
                        onClick={sendInput}
                        style={{
                            padding: '8px 16px',
                            marginLeft: '8px',
                            backgroundColor: isReady ? '#1976d2' : '#cccccc',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isReady ? 'pointer' : 'not-allowed'
                        }}
                        disabled={!isReady}
                    >
                        Send
                    </button>
                </div>
                
                {/* Test buttons */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                    <button 
                        onClick={runTest}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#4caf50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Run LS Test
                    </button>
                    
                    <button 
                        onClick={runPython}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#9c27b0',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Run Python Test
                    </button>
                    
                    <button
                        onClick={() => {
                            setTerminalValue("");
                            dataBuffer.current = "";
                        }}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f44336',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Clear Terminal
                    </button>
                    <button onClick={saveState}>
                        Save State
                    </button>
                </div>
                
                {/* Helpful notes */}
                <div style={{ 
                    marginTop: '16px', 
                    padding: '8px', 
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '14px'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>Important Notes:</div>
                    <ul style={{ margin: '0', paddingLeft: '20px' }}>
                        <li><code>bzimage_initrd_from_filesystem: true</code> is required for Alpine Linux to boot properly</li>
                        <li>Serial console output is captured when commands are sent</li>
                        <li>If no output appears, the shell prompt might be different from what we're detecting</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};