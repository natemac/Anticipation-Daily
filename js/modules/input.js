// input.js - Handles keyboard and touch input

import GameState from './state.js';
import * as WordHandler from './wordHandler.js';
import * as UI from './ui.js';
import * as Audio from './audio.js';
import * as GameLogic from './gameLogic.js';
import { log } from '../game.js';

// Module variables
let beginButton, backButton, canvas;
let virtualKeyboard, keyboardContainer;
let canvasContainer, wordSpacesDiv;
let canvasOriginalDimensions = { width: 0, height: 0 };

// Initialize the input handling
function init() {
    // Get DOM elements
    beginButton = document.getElementById('beginButton');
    backButton = document.getElementById('backButton');
    canvas = document.getElementById('gameCanvas');
    canvasContainer = document.querySelector('.canvas-container');

    // Store original canvas dimensions for later restoration
    if (canvasContainer) {
        canvasOriginalDimensions.width = canvasContainer.offsetWidth;
        canvasOriginalDimensions.height = canvasContainer.offsetHeight;
    }

    // Set up input event listeners
    setupEventListeners();

    // Initialize touch handling for mobile
    initTouchHandling();

    // Create invisible input field and prepare for keyboard
    enhanceGuessInput();

    // Prevent scrolling on the entire document
    preventDocumentScrolling();

    log("Input module initialized");

    return true;
}

// Prevent scrolling on the entire document
function preventDocumentScrolling() {
    // Prevent default touch behavior to enhance app-like feel
    document.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });

    // Prevent scrolling with CSS
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';

    // Prevent double-tap to zoom
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (window.lastTap && (now - window.lastTap) < DOUBLE_TAP_DELAY) {
            e.preventDefault();
        }

        window.lastTap = now;
    }, { passive: false });
}

// Set up all input event listeners
function setupEventListeners() {
    // Begin/Guess button
    if (beginButton) {
        beginButton.addEventListener('click', handleBeginButtonClick);
    }

    // Back button
    if (backButton) {
        backButton.addEventListener('click', handleBackButtonClick);
    }

    // Key press events for direct typing
    document.addEventListener('keydown', handleKeyPress);

    // Add touch event to canvas (with passive: false to prevent scrolling)
    if (canvas) {
        canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    }
}

// Initialize touch handling for mobile
function initTouchHandling() {
    if (isMobileDevice() && canvas) {
        canvas.addEventListener('touchstart', function(e) {
            if (GameState.gameStarted && !GameState.guessMode) {
                // Enter guess mode on tap if game is in progress
                UI.enterGuessMode();
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// Handle begin button click
function handleBeginButtonClick() {
    if (!GameState.gameStarted) {
        if (typeof GameLogic.startDrawing === 'function') {
            // Forward to gameLogic.startDrawing()
            GameLogic.startDrawing();
        }
    } else {
        UI.enterGuessMode();
    }
}

// Handle back button click
function handleBackButtonClick() {
    // Always stop music when going back to the menu, regardless of game state
    if (typeof Audio.stopAllMusic === 'function') {
        Audio.stopAllMusic();
    }

    // Always hide keyboard when going back to menu
    hideKeyboard();

    // If the game has started, use the proper endGame function
    if (GameState.gameStarted) {
        if (typeof GameLogic.endGame === 'function') {
            GameLogic.endGame(false);
        }
    } else {
        // Even if the game hasn't started, we still need to return to the menu
        if (typeof showMainMenu === 'function') {
            showMainMenu();
        }
    }
}

// Handle keyboard input
function handleKeyPress(e) {
    // Only process keypresses when in guess mode
    if (!GameState.guessMode) return;

    // Handle different key types
    if (e.key === 'Backspace') {
        // Remove the last character
        if (GameState.currentInput.length > 0) {
            GameState.currentInput = GameState.currentInput.slice(0, -1);
            WordHandler.updateWordSpaces();
        }
    } else if (e.key === 'Enter') {
        // Submit full word
        if (GameState.guessMode && GameState.currentInput.length > 0) {
            WordHandler.processFullWord();
        }
    } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
        // Process letter input
        WordHandler.processLetter(e.key);
    }
}

// Handle canvas touch
function handleCanvasTouch(e) {
    e.preventDefault();
    log("Canvas touch detected");

    // Ensure canvas is properly rendered
    if (GameState.gameStarted) {
        if (typeof renderFrame === 'function') {
            renderFrame();
        }
    }
}

// Enhanced guessInput field for mobile
function enhanceGuessInput() {
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

    // Set up event listeners for input
    guessInput.addEventListener('input', function(e) {
        if (!GameState.guessMode) return;

        // Get the last character typed
        const lastChar = this.value.slice(-1);

        // Clear input for next character
        this.value = '';

        // Process the character if it's a letter
        if (/[a-zA-Z]/.test(lastChar)) {
            WordHandler.processLetter(lastChar);
        }
    });

    // Handle special keys
    guessInput.addEventListener('keydown', function(e) {
        if (!GameState.guessMode) return;

        if (e.key === 'Backspace') {
            // Remove the last character
            if (GameState.currentInput.length > 0) {
                GameState.currentInput = GameState.currentInput.slice(0, -1);
                WordHandler.updateWordSpaces();
            }
            e.preventDefault();
        } else if (e.key === 'Enter') {
            // Submit full word
            if (GameState.guessMode && GameState.currentInput.length > 0) {
                WordHandler.processFullWord();
            }
            e.preventDefault();
        }
    });

    return guessInput;
}

// Show the keyboard with animation
function showKeyboard() {
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
    }, 100);
}

// Hide the keyboard with animation
function hideKeyboard() {
    // Make sure we have the guessInput
    const guessInput = document.getElementById('guessInput');
    if (!guessInput) return;

    // Blur and hide the input field to dismiss the keyboard
    guessInput.blur();
    guessInput.style.display = 'none';

    // Reset layout
    updateKeyboardLayout(false);
}

// Adjust layout for keyboard visibility
function updateKeyboardLayout(showKeyboard) {
    // Get required elements
    if (!canvasContainer) {
        canvasContainer = document.querySelector('.canvas-container');
    }

    if (!wordSpacesDiv) {
        wordSpacesDiv = document.getElementById('wordSpacesDiv');
    }

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

        // Add styles if they don't exist
        addKeyboardStyles();

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

// Add keyboard styles
function addKeyboardStyles() {
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

// Force hide the keyboard
function forceHideKeyboard() {
    // Hide and blur the input field
    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.blur();
        guessInput.style.display = 'none';
    }

    // Reset layout
    updateKeyboardLayout(false);
}

// Check if we're on a mobile device
function isMobileDevice() {
    return (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0) ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
}

// Export public functions
export {
    init,
    enhanceGuessInput,
    handleKeyPress,
    handleBeginButtonClick,
    handleBackButtonClick,
    isMobileDevice,
    showKeyboard,
    hideKeyboard,
    forceHideKeyboard,
    updateKeyboardLayout,
    addKeyboardStyles
};
