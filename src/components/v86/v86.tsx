import { useCallback, useEffect, useRef, useState } from "react";
import { useV86, V86Config } from "../../hooks/useV86";

type Props = {
    stateUrl?: string,
    config?: V86Config
}

export const V86 = ({ stateUrl, config }: Props) => {
    const [screenContainer, setScreenContainer] = useState<HTMLDivElement | null>(null);
    const [terminalValue, setTerminalValue] = useState<string>("");
    const [commandValue, setCommandValue] = useState<string>("");
    const captureOutput = useRef<boolean>(false);
    const terminalRef = useRef<HTMLDivElement | null>(null);
    const [isReady, setIsReady] = useState<boolean>(false);

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

    // Use the v86 hook
    const { 
        isReady: emulatorReady, 
        status: emulatorStatus, 
        sendCommand, 
        runTest, 
        saveState, 
        cleanCache 
    } = useV86({
        config,
        stateUrl,
        onStatusChange: (status, details) => {
            appendToTerminal(`[Status] ${status}${details ? ': ' + details : ''}\n`);
        },
        onError: (message) => {
            appendToTerminal(`[Error] ${message}\n`);
        },
        onSerialOutput: (char) => {
            if (captureOutput.current) {
                appendToTerminal(char);
            }
        },
        onShellPromptDetected: () => {
            if (!isReady) {
                setIsReady(true);
                appendToTerminal("\nSystem is ready for commands\n");
            }
            
            // Stop capturing unless we just started
            if (captureOutput.current) {
                captureOutput.current = false;
            }
        },
        onEmulatorReady: () => {
            appendToTerminal("[Info] Emulator is ready\n");
        }
    });

    useEffect(() => {
        appendToTerminal("Initializing system...\n");
    }, []);

    const handleSendCommand = useCallback(() => {
        if (!emulatorReady || !commandValue) return;
        
        // Display the command in the terminal with a prompt
        appendToTerminal(`> ${commandValue}\n`);
        
        // Clean the cache
        cleanCache();
        
        // Start capturing output
        captureOutput.current = true;
        
        // Send the command
        sendCommand(commandValue);
        
        setCommandValue("");
    }, [commandValue, emulatorReady, sendCommand, cleanCache, appendToTerminal]);

    const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSendCommand();
        }
    }, [handleSendCommand]);

    const handleRunLsTest = useCallback(() => {
        appendToTerminal("\n--- TEST COMMAND ---\n");
        cleanCache();
        captureOutput.current = true;
        runTest('ls');
    }, [runTest, cleanCache, appendToTerminal]);

    const handleRunPythonTest = useCallback(() => {
        appendToTerminal("\n--- PYTHON TEST ---\n");
        cleanCache();
        captureOutput.current = true;
        runTest('python');
    }, [runTest, cleanCache, appendToTerminal]);

    const handleClearTerminal = useCallback(() => {
        setTerminalValue("");
        cleanCache();
    }, [cleanCache]);

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
                    Status: {isReady ? 'Ready for commands' : emulatorStatus}
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
                        onClick={handleSendCommand}
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
                        onClick={handleRunLsTest}
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
                        onClick={handleRunPythonTest}
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
                        onClick={handleClearTerminal}
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
                    <button 
                        onClick={saveState}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#ff9800',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
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
                        <li>V86 is running in a Web Worker for better performance</li>
                        <li>Serial console output is captured when commands are sent</li>
                        <li>The worker handles state loading/saving operations</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};