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
    if (!GameState.gameStarted || !GameState.guessMode) return;

    // Prevent default behavior for game-related keys
    if (/^[a-zA-Z]$/.test(event.key) || 
        event.key === 'Backspace' || 
        event.key === 'Enter' || 
        event.key === 'Escape') {
        event.preventDefault();
    }

    // Handle letter keys
    if (/^[a-zA-Z]$/.test(event.key)) {
        log(`Keyboard key pressed: ${event.key.toUpperCase()}`);
        
        // Play sound effect
        Audio.playSound('tick');

        // Update word progress
        WordHandler.processLetter(event.key.toUpperCase());
    }
    
    // Handle backspace
    else if (event.key === 'Backspace') {
        log("Backspace pressed");
        if (GameState.currentInput.length > 0) {
            GameState.currentInput = GameState.currentInput.slice(0, -1);
            WordHandler.updateWordSpaces();
        }
    }
    
    // Handle enter
    else if (event.key === 'Enter') {
        log("Enter pressed");
        WordHandler.processFullWord();
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
    GameState.guessMode = true;
    
    // Start the guess timer
    if (typeof startGuessTimer === 'function') {
        startGuessTimer();
    }
    
    // Play sound effect
    Audio.playSound('guess');
}

// Exit guess mode for desktop devices
function exitGuessMode() {
    if (!isDesktopDevice) return;

    log("Exiting guess mode (desktop)");
    
    // Update game state
    GameState.guessMode = false;
    
    // Stop the guess timer
    if (typeof stopGuessTimer === 'function') {
        stopGuessTimer();
    }
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