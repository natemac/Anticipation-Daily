// ui-keyboard.js - Handles keyboard input and virtual keyboard functionality

import GameState from './state.js';
import * as WordHandler from './wordHandler.js';

// Initialize mobile keyboard support
export function initMobileKeyboard() {
    // Create/enhance the input field
    enhanceGuessInput();

    // Add keyboard styles
    addKeyboardStyles();
}

// Enhance the guessInput field for mobile
export function enhanceGuessInput() {
    // Get or create the guessInput
    let guessInput = document.getElementById('guessInput');

    if (!guessInput) {
        // Create a new input field
        guessInput = document.createElement('input');
        guessInput.id = 'guessInput';
        guessInput.type = 'text';
        guessInput.autocomplete = 'off';
        guessInput.autocorrect = 'off';
        guessInput.autocapitalize = 'none';
        guessInput.spellcheck = false;

        // Add to game controls
        const gameControls = document.querySelector('.game-controls');
        if (gameControls) {
            gameControls.appendChild(guessInput);
        }
    }

    // Set up the input with proper styling
    guessInput.style.padding = '0';
    guessInput.style.margin = '0';
    guessInput.style.border = 'none';
    guessInput.style.outline = 'none';
    guessInput.style.opacity = '0';
    guessInput.style.position = 'absolute';
    guessInput.style.left = '-1000px'; // Position off-screen
    guessInput.style.height = '1px';
    guessInput.style.width = '1px';

    // Remove previous event listeners to avoid duplication
    // This is a simple approach: clone and replace the input element
    const parent = guessInput.parentNode;
    if (parent) {
        const newInput = guessInput.cloneNode(true);
        parent.replaceChild(newInput, guessInput);
        guessInput = newInput;
    }

    // No need to add input event listeners here - we'll rely on the ones in input.js
    // This module will only focus on keyboard visibility and layout adjustments

    console.log("Enhanced guess input without duplicate event listeners");
    return guessInput;
}

// Add keyboard styles
export function addKeyboardStyles() {
    if (document.getElementById('keyboard-style-element')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'keyboard-style-element';
    styleElement.textContent = `
        /* Base keyboard adjustments */
        .keyboard-visible .canvas-container {
            width: 80% !important;
            margin: 5px auto !important;
            transform: scale(0.9) !important;
        }

        .keyboard-visible #wordSpacesDiv {
            margin: 5px auto !important;
            box-shadow: 0 0 8px rgba(76, 175, 80, 0.6) !important;
        }

        .keyboard-visible #gameButtonContainer,
        .keyboard-visible .game-controls {
            margin-bottom: 0px !important;
        }

        /* iOS specific styles */
        @supports (-webkit-touch-callout: none) {
            .keyboard-visible .canvas-container {
                width: 80% !important;
                transform: scale(0.85) !important;
                margin-top: 0 !important;
            }

            .keyboard-visible #wordSpacesDiv {
                transform: scale(1.05);
                margin: 8px auto !important;
            }
        }

        /* Handle smaller screens */
        @media (max-height: 700px) {
            .keyboard-visible .canvas-container {
                width: 70% !important;
                transform: scale(0.8) !important;
            }

            .keyboard-visible #wordSpacesDiv {
                transform: scale(0.95);
                margin: 8px auto !important;
            }
        }
    `;

    document.head.appendChild(styleElement);
}

// Show the keyboard with animation
export function showKeyboard() {
    // Make sure we have the guessInput
    const guessInput = document.getElementById('guessInput');
    if (!guessInput) return;

    // Adjust the layout
    updateKeyboardLayout(true);

    // Make sure guessInput is visible and properly positioned
    guessInput.style.display = 'block';

    // Focus the input field to trigger the native keyboard
    setTimeout(() => {
        guessInput.focus();
        console.log("Keyboard show requested");
    }, 100);
}

// Hide the keyboard with animation
export function hideKeyboard() {
    // Make sure we have the guessInput
    const guessInput = document.getElementById('guessInput');
    if (!guessInput) return;

    // Blur and hide the input field to dismiss the keyboard
    guessInput.blur();
    guessInput.style.display = 'none';

    // Reset layout
    updateKeyboardLayout(false);
}

// Force hide the keyboard
export function forceHideKeyboard() {
    // Hide and blur the input field
    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.blur();
        guessInput.style.display = 'none';
    }

    // Reset layout
    updateKeyboardLayout(false);
}

// Adjust layout for keyboard visibility
export function updateKeyboardLayout(showKeyboard) {
    // Get required elements
    const canvasContainer = document.querySelector('.canvas-container');
    const wordSpacesDiv = document.getElementById('wordSpacesDiv');
    const gameControls = document.querySelector('.game-controls');
    const gameButtonContainer = document.getElementById('gameButtonContainer');
    const backButton = document.getElementById('backButton');
    const gameScreen = document.querySelector('.game-screen');

    if (!canvasContainer || !gameScreen) return;

    if (showKeyboard) {
        // Add keyboard-visible class
        gameScreen.classList.add('keyboard-visible');

        // Resize canvas
        canvasContainer.style.transition = 'all 0.3s ease';
        canvasContainer.style.width = '80%';
        canvasContainer.style.margin = '5px auto';
        canvasContainer.style.transform = 'scale(0.9)';

        // Adjust word spaces
        if (wordSpacesDiv) {
            wordSpacesDiv.style.margin = '5px auto';
            wordSpacesDiv.style.transition = 'all 0.3s ease';
            wordSpacesDiv.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.6)';
        }

        // Hide back button when keyboard is visible to save space
        if (backButton) {
            backButton.style.display = 'none';
        }

    } else {
        // Remove keyboard-visible class
        gameScreen.classList.remove('keyboard-visible');

        // Restore canvas size
        canvasContainer.style.width = '100%';
        canvasContainer.style.margin = '0 0 15px 0';
        canvasContainer.style.transform = 'scale(1)';

        // Restore word spaces
        if (wordSpacesDiv) {
            wordSpacesDiv.style.margin = '15px 0';
            wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }

        // Show back button again
        if (backButton) {
            backButton.style.display = 'block';
        }
    }
}
