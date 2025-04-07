"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.V86 = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const useV86_1 = require("../../hooks/useV86");
const V86 = ({ stateUrl, config }) => {
    const [screenContainer, setScreenContainer] = (0, react_1.useState)(null);
    const [terminalValue, setTerminalValue] = (0, react_1.useState)("");
    const [commandValue, setCommandValue] = (0, react_1.useState)("");
    const captureOutput = (0, react_1.useRef)(false);
    const terminalRef = (0, react_1.useRef)(null);
    const [isReady, setIsReady] = (0, react_1.useState)(false);
    // Function to append text to terminal and auto-scroll
    const appendToTerminal = (0, react_1.useCallback)((text) => {
        setTerminalValue(prev => prev + text);
        // Auto-scroll the terminal to the bottom
        setTimeout(() => {
            if (terminalRef.current) {
                terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
            }
        }, 0);
    }, []);
    // Use the v86 hook
    const { isReady: emulatorReady, status: emulatorStatus, sendCommand, runTest, saveState, cleanCache } = (0, useV86_1.useV86)({
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
    (0, react_1.useEffect)(() => {
        appendToTerminal("Initializing system...\n");
    }, []);
    const handleSendCommand = (0, react_1.useCallback)(() => {
        if (!emulatorReady || !commandValue)
            return;
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
    const handleKeyPress = (0, react_1.useCallback)((e) => {
        if (e.key === 'Enter') {
            handleSendCommand();
        }
    }, [handleSendCommand]);
    const handleRunLsTest = (0, react_1.useCallback)(() => {
        appendToTerminal("\n--- TEST COMMAND ---\n");
        cleanCache();
        captureOutput.current = true;
        runTest('ls');
    }, [runTest, cleanCache, appendToTerminal]);
    const handleRunPythonTest = (0, react_1.useCallback)(() => {
        appendToTerminal("\n--- PYTHON TEST ---\n");
        cleanCache();
        captureOutput.current = true;
        runTest('python');
    }, [runTest, cleanCache, appendToTerminal]);
    const handleClearTerminal = (0, react_1.useCallback)(() => {
        setTerminalValue("");
        cleanCache();
    }, [cleanCache]);
    return ((0, jsx_runtime_1.jsx)("div", { children: (0, jsx_runtime_1.jsxs)("div", { id: "screen_container", ref: setScreenContainer, children: [(0, jsx_runtime_1.jsx)("div", { style: {
                        whiteSpace: "pre",
                        font: "14px monospace",
                        lineHeight: "14px",
                    } }), (0, jsx_runtime_1.jsx)("canvas", { style: { display: "none" } }), (0, jsx_runtime_1.jsxs)("div", { style: {
                        padding: '8px',
                        backgroundColor: isReady ? '#2e7d32' : '#f57c00',
                        color: 'white',
                        marginBottom: '8px',
                        borderRadius: '4px'
                    }, children: ["Status: ", isReady ? 'Ready for commands' : emulatorStatus] }), (0, jsx_runtime_1.jsx)("div", { ref: terminalRef, style: {
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
                    }, children: terminalValue }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', marginBottom: '10px' }, children: [(0, jsx_runtime_1.jsx)("input", { type: "text", style: {
                                flex: 1,
                                padding: '8px',
                                fontFamily: 'monospace',
                            }, placeholder: "Enter command...", value: commandValue, onChange: (e) => setCommandValue(e.target.value), onKeyPress: handleKeyPress, disabled: !isReady }), (0, jsx_runtime_1.jsx)("button", { onClick: handleSendCommand, style: {
                                padding: '8px 16px',
                                marginLeft: '8px',
                                backgroundColor: isReady ? '#1976d2' : '#cccccc',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: isReady ? 'pointer' : 'not-allowed'
                            }, disabled: !isReady, children: "Send" })] }), (0, jsx_runtime_1.jsxs)("div", { style: { display: 'flex', gap: '8px', marginBottom: '10px' }, children: [(0, jsx_runtime_1.jsx)("button", { onClick: handleRunLsTest, style: {
                                padding: '8px 16px',
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }, children: "Run LS Test" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleRunPythonTest, style: {
                                padding: '8px 16px',
                                backgroundColor: '#9c27b0',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }, children: "Run Python Test" }), (0, jsx_runtime_1.jsx)("button", { onClick: handleClearTerminal, style: {
                                padding: '8px 16px',
                                backgroundColor: '#f44336',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }, children: "Clear Terminal" }), (0, jsx_runtime_1.jsx)("button", { onClick: saveState, style: {
                                padding: '8px 16px',
                                backgroundColor: '#ff9800',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }, children: "Save State" })] }), (0, jsx_runtime_1.jsxs)("div", { style: {
                        marginTop: '16px',
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        fontSize: '14px'
                    }, children: [(0, jsx_runtime_1.jsx)("div", { style: { fontWeight: 'bold', marginBottom: '4px' }, children: "Important Notes:" }), (0, jsx_runtime_1.jsxs)("ul", { style: { margin: '0', paddingLeft: '20px' }, children: [(0, jsx_runtime_1.jsx)("li", { children: "V86 is running in a Web Worker for better performance" }), (0, jsx_runtime_1.jsx)("li", { children: "Serial console output is captured when commands are sent" }), (0, jsx_runtime_1.jsx)("li", { children: "The worker handles state loading/saving operations" })] })] })] }) }));
};
exports.V86 = V86;
