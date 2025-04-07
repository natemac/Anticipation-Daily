// touchInterface.js - Touch-specific UI elements and interactions

import GameState from '../state.js';
import * as WordHandler from '../wordHandler.js';
import * as Audio from '../audio.js';
import { log } from '../../game.js';
import * as VirtualKeyboard from './virtualKeyboard.js';

let touchStartX, touchStartY;
let isTouchDevice = false;

// Initialize touch interface
function init() {
    // Detect touch device
    isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (isTouchDevice) {
        setupTouchListeners();
    }
}

// Set up touch event listeners
function setupTouchListeners() {
    document.addEventListener('touchstart', handleTouchStart, false);
    document.addEventListener('touchmove', handleTouchMove, false);
    document.addEventListener('touchend', handleTouchEnd, false);
}

// Handle touch start
function handleTouchStart(event) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
}

// Handle touch move
function handleTouchMove(event) {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = event.touches[0].clientX;
    const touchEndY = event.touches[0].clientY;

    // Calculate swipe distance
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // If it's a significant horizontal swipe
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        event.preventDefault();
        
        if (deltaX > 0) {
            // Right swipe - show virtual keyboard
            if (!VirtualKeyboard.isKeyboardShown()) {
                VirtualKeyboard.updateVirtualKeyboard(true);
            }
        } else {
            // Left swipe - hide virtual keyboard
            if (VirtualKeyboard.isKeyboardShown()) {
                VirtualKeyboard.updateVirtualKeyboard(false);
            }
        }
    }
}

// Handle touch end
function handleTouchEnd() {
    touchStartX = null;
    touchStartY = null;
}

// Enter guess mode for touch devices
function enterGuessMode() {
    if (!isTouchDevice) return;

    log("Entering guess mode (touch)");
    
    // Show virtual keyboard
    VirtualKeyboard.updateVirtualKeyboard(true);
    
    // Update game state
    GameState.inGuessMode = true;
    
    // Play sound effect
    Audio.playSound('guess');
}

// Exit guess mode for touch devices
function exitGuessMode() {
    if (!isTouchDevice) return;

    log("Exiting guess mode (touch)");
    
    // Hide virtual keyboard
    VirtualKeyboard.updateVirtualKeyboard(false);
    
    // Update game state
    GameState.inGuessMode = false;
}

// Check if device is touch-enabled
function isTouchEnabled() {
    return isTouchDevice;
}

export {
    init,
    enterGuessMode,
    exitGuessMode,
    isTouchEnabled
}; 