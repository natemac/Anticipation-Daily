// ui-core.js - Core UI initialization and shared functionality

import GameState from './state.js';
import { log } from '../game.js';
import * as UiControls from './ui-controls.js';
import * as UiTimers from './ui-timer.js';
import * as UiHints from './ui-hints.js';
import * as UiModes from './ui-modes.js';
import * as UiKeyboard from './ui-keyboard.js';

// Module variables - shared across UI modules
export let timerDisplay, beginButton, wrongMessage, backButton, buttonTimer;
export let wordSpacesDiv, hintButton, buttonContainer;

// Initialize UI module
export function init() {
    // Get DOM elements
    timerDisplay = document.getElementById('timerDisplay');
    beginButton = document.getElementById('beginButton');
    wrongMessage = document.getElementById('wrongMessage');
    backButton = document.getElementById('backButton');
    buttonTimer = document.getElementById('buttonTimer');

    // Set up back button event listener
    if (backButton) {
        backButton.addEventListener('click', UiControls.handleBackButton);
    }

    // Create UI elements
    createWordSpacesDiv();
    createButtonContainer();
    UiControls.createHintButton();
    UiControls.addAudioToggle();
    UiKeyboard.initMobileKeyboard();

    log("UI module initialized");

    return {
        timerDisplay,
        beginButton,
        wrongMessage,
        backButton,
        buttonTimer,
        wordSpacesDiv,
        hintButton,
        buttonContainer
    };
}

// Create the word spaces div
export function createWordSpacesDiv() {
    // Check if already exists
    if (document.getElementById('wordSpacesDiv')) {
        wordSpacesDiv = document.getElementById('wordSpacesDiv');
        return wordSpacesDiv;
    }

    // Create the div for word spaces
    wordSpacesDiv = document.createElement('div');
    wordSpacesDiv.id = 'wordSpacesDiv';
    wordSpacesDiv.style.width = '100%';
    wordSpacesDiv.style.minHeight = '60px';
    wordSpacesDiv.style.margin = '15px 0'; // Even padding
    wordSpacesDiv.style.textAlign = 'center';
    wordSpacesDiv.style.position = 'relative';
    wordSpacesDiv.style.backgroundColor = 'white';
    wordSpacesDiv.style.borderRadius = '8px';
    wordSpacesDiv.style.padding = '10px';
    wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    wordSpacesDiv.style.transition = 'box-shadow 0.3s ease, transform 0.2s ease';

    // Find the game controls div to insert before it
    const gameControlsDiv = document.querySelector('.game-controls');

    if (gameControlsDiv && gameControlsDiv.parentElement) {
        // Insert it before the game controls
        gameControlsDiv.parentElement.insertBefore(wordSpacesDiv, gameControlsDiv);
    } else {
        // Fallback: insert after canvas container
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer && canvasContainer.parentElement) {
            canvasContainer.parentElement.insertBefore(wordSpacesDiv, canvasContainer.nextSibling);
        }
    }

    return wordSpacesDiv;
}

// Create button container for side-by-side layout
export function createButtonContainer() {
    // Check if already exists
    if (document.getElementById('gameButtonContainer')) {
        buttonContainer = document.getElementById('gameButtonContainer');
        return buttonContainer;
    }

    // Create container for buttons
    buttonContainer = document.createElement('div');
    buttonContainer.id = 'gameButtonContainer';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.width = '100%';
    buttonContainer.style.justifyContent = 'space-between';
    buttonContainer.style.gap = '10px';
    buttonContainer.style.margin = '15px 0'; // Even padding
    buttonContainer.style.flexDirection = 'row'; // Ensure left-to-right layout

    // Find the game controls div
    const gameControlsDiv = document.querySelector('.game-controls');

    if (gameControlsDiv) {
        // Move the beginButton into our container once the DOM is fully loaded
        setTimeout(() => {
            const beginButton = document.getElementById('beginButton');
            if (beginButton && beginButton.parentNode === gameControlsDiv) {
                beginButton.style.margin = '0';
                beginButton.style.flex = '2'; // Takes up 2/3 of the space
                beginButton.style.order = '1'; // Explicitly set to first position (left)
                buttonContainer.appendChild(beginButton);
                gameControlsDiv.appendChild(buttonContainer);
            }
        }, 0);
    }

    return buttonContainer;
}

// Hide all messages
export function hideMessages() {
    if (wrongMessage) {
        wrongMessage.classList.remove('visible');
    }

    const canvas = document.querySelector('.canvas-container canvas');
    if (canvas) {
        canvas.classList.remove('incorrect');
    }
}

// Show error message to user
export function showError(message) {
    // Use the wrong message element for errors too
    const wrongMessage = document.getElementById('wrongMessage');
    if (wrongMessage) {
        wrongMessage.textContent = message;
        wrongMessage.classList.add('visible');
        wrongMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
        wrongMessage.style.padding = '10px';
        wrongMessage.style.borderRadius = '4px';

        // Keep error visible longer
        setTimeout(() => {
            wrongMessage.classList.remove('visible');
        }, 5000);
    } else {
        // Fallback to alert if element not found
        alert(message);
    }
}

// Reposition UI elements after resize
export function repositionElements() {
    // Reapply keyboard layout adjustments if in guess mode
    if (GameState.guessMode) {
        UiKeyboard.updateKeyboardLayout(true);
    }
}

// Function to detect if device is mobile
export function isMobileDevice() {
    return (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0) ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
}

// Main UI module - aggregates and re-exports functionality from all UI sub-modules
export * from './ui-controls.js';
export * from './ui-timer.js';
export * from './ui-hints.js';
export * from './ui-modes.js';
export * from './ui-keyboard.js';
