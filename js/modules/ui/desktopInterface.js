// desktopInterface.js - Desktop-specific UI elements and interactions

import GameState from '../state.js';
import * as WordHandler from '../wordHandler.js';
import * as Audio from '../audio.js';
import { log } from '../../game.js';

let isDesktopDevice = false;

// Initialize desktop interface
function init() {
    // Detect desktop device (non-touch)
    isDesktopDevice = !('ontouchstart' in window) && (navigator.maxTouchPoints === 0);
    
    if (isDesktopDevice) {
        setupKeyboardListeners();
    }
}

// Set up keyboard event listeners
function setupKeyboardListeners() {
    document.addEventListener('keydown', handleKeyDown);
}

// Handle key down events
function handleKeyDown(event) {
    if (!GameState.gameStarted || !GameState.inGuessMode) return;

    // Handle letter keys
    if (/^[a-zA-Z]$/.test(event.key)) {
        log(`Keyboard key pressed: ${event.key.toUpperCase()}`);
        
        // Play sound effect
        Audio.playSound('tick');

        // Update word progress
        WordHandler.handleLetterInput(event.key.toUpperCase());
    }
    
    // Handle backspace
    else if (event.key === 'Backspace') {
        log("Backspace pressed");
        WordHandler.handleBackspace();
    }
    
    // Handle enter
    else if (event.key === 'Enter') {
        log("Enter pressed");
        WordHandler.handleEnter();
    }
    
    // Handle escape
    else if (event.key === 'Escape') {
        log("Escape pressed");
        exitGuessMode();
    }
}

// Enter guess mode for desktop devices
function enterGuessMode() {
    if (!isDesktopDevice) return;

    log("Entering guess mode (desktop)");
    
    // Update game state
    GameState.inGuessMode = true;
    
    // Play sound effect
    Audio.playSound('guess');
}

// Exit guess mode for desktop devices
function exitGuessMode() {
    if (!isDesktopDevice) return;

    log("Exiting guess mode (desktop)");
    
    // Update game state
    GameState.inGuessMode = false;
}

// Check if device is desktop
function isDesktopEnabled() {
    return isDesktopDevice;
}

export {
    init,
    enterGuessMode,
    exitGuessMode,
    isDesktopEnabled
}; 