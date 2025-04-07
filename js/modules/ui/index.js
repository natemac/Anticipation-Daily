// index.js - Main UI module that coordinates all other UI modules

import * as Core from './core.js';
import * as AudioControls from './audioControls.js';
import * as GameInterface from './gameInterface.js';
import * as VirtualKeyboard from './virtualKeyboard.js';
import * as TouchInterface from './touchInterface.js';
import * as DesktopInterface from './desktopInterface.js';

// Initialize all UI modules
function init() {
    // Initialize core UI
    const uiElements = Core.init();
    
    // Initialize audio controls
    AudioControls.addAudioToggle();
    
    // Initialize device-specific interfaces
    TouchInterface.init();
    DesktopInterface.init();
    
    // Create virtual keyboard (will be shown/hidden as needed)
    VirtualKeyboard.createVirtualKeyboard();
    
    return uiElements;
}

// Enter guess mode
function enterGuessMode() {
    if (TouchInterface.isTouchEnabled()) {
        TouchInterface.enterGuessMode();
    } else if (DesktopInterface.isDesktopEnabled()) {
        DesktopInterface.enterGuessMode();
    }
}

// Exit guess mode
function exitGuessMode() {
    if (TouchInterface.isTouchEnabled()) {
        TouchInterface.exitGuessMode();
    } else if (DesktopInterface.isDesktopEnabled()) {
        DesktopInterface.exitGuessMode();
    }
}

// Show error message
function showError(message) {
    Core.showError(message);
}

// Hide all messages
function hideMessages() {
    Core.hideMessages();
}

// Update timer display
function updateTimerDisplay() {
    GameInterface.updateTimerDisplay();
}

// Start guess timer
function startGuessTimer() {
    GameInterface.startGuessTimer();
}

// Stop guess timer
function stopGuessTimer() {
    GameInterface.stopGuessTimer();
}

// Show wrong message
function showWrongMessage(message) {
    GameInterface.showWrongMessage(message);
}

// Enable hint button
function enableHintButton() {
    GameInterface.enableHintButton();
}

// Use hint
function useHint() {
    GameInterface.useHint();
}

// Toggle hint button visibility
function toggleHintButton(show) {
    GameInterface.toggleHintButton(show);
}

// Reposition UI elements
function repositionElements() {
    Core.repositionElements();
}

export {
    init,
    enterGuessMode,
    exitGuessMode,
    showError,
    hideMessages,
    updateTimerDisplay,
    startGuessTimer,
    stopGuessTimer,
    showWrongMessage,
    enableHintButton,
    useHint,
    toggleHintButton,
    repositionElements
}; 