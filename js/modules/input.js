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

    // Create virtual keyboard
    createVirtualKeyboard();

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

// Create virtual keyboard for mobile devices
function createVirtualKeyboard() {
    // Only create if we're on a mobile device and it doesn't already exist
    if (!document.getElementById('virtual-keyboard-container') && isMobileDevice()) {
        // Create container for the keyboard (separate from the keyboard itself)
        keyboardContainer = document.createElement('div');
        keyboardContainer.id = 'virtual-keyboard-container';
        keyboardContainer.style.position = 'fixed';
        keyboardContainer.style.bottom = '0';
        keyboardContainer.style.left = '0';
        keyboardContainer.style.width = '100%';
        keyboardContainer.style.zIndex = '1000';
        keyboardContainer.style.display = 'none';
        keyboardContainer.style.transition = 'transform 0.3s ease-out';
        keyboardContainer.style.transform = 'translateY(100%)';
        keyboardContainer.style.boxShadow = '0 -5px 15px rgba(0,0,0,0.2)';
        keyboardContainer.style.backgroundColor = '#f5f5f5';

        // Create the keyboard itself
        virtualKeyboard = document.createElement('div');
        virtualKeyboard.id = 'virtual-keyboard';
        virtualKeyboard.style.backgroundColor = '#f5f5f5';
        virtualKeyboard.style.padding = '10px 5px';
        virtualKeyboard.style.borderTopLeftRadius = '15px';
        virtualKeyboard.style.borderTopRightRadius = '15px';

        // Add drag handle for better UX
        const handle = document.createElement('div');
        handle.style.width = '40px';
        handle.style.height = '5px';
        handle.style.backgroundColor = '#ccc';
        handle.style.borderRadius = '3px';
        handle.style.margin = '0 auto 10px auto';
        virtualKeyboard.appendChild(handle);

        // Add keyboard rows with enhanced styling
        const rows = [
            'QWERTYUIOP',
            'ASDFGHJKL',
            'ZXCVBNM'
        ];

        // Create key container
        const keyContainer = document.createElement('div');
        keyContainer.style.maxWidth = '600px';
        keyContainer.style.margin = '0 auto';
        keyContainer.style.padding = '0 5px';

        rows.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.justifyContent = 'center';
            rowDiv.style.margin = '6px 0';
            rowDiv.style.gap = '4px';

            // Add padding for the bottom row (for alignment)
            if (rowIndex === 2) {
                rowDiv.style.paddingLeft = '20px';
                rowDiv.style.paddingRight = '20px';
            }

            // Add keys for this row
            for (let i = 0; i < row.length; i++) {
                const key = document.createElement('button');
                key.textContent = row[i];
                key.style.flex = '1';
                key.style.aspectRatio = '1/1';
                key.style.padding = '0';
                key.style.fontSize = '20px';
                key.style.border = 'none';
                key.style.borderRadius = '8px';
                key.style.backgroundColor = 'white';
                key.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                key.style.transition = 'all 0.15s ease';
                key.style.fontWeight = 'bold';
                key.style.color = '#333';
                key.style.textAlign = 'center';
                key.style.cursor = 'pointer';

                // Add "active" effect on press
                key.addEventListener('touchstart', function() {
                    key.style.backgroundColor = '#e0e0e0';
                    key.style.transform = 'translateY(2px)';
                    key.style.boxShadow = '0 1px 1px rgba(0,0,0,0.1)';
                    // Add subtle glow effect based on category color
                    addCategoryGlow(key);
                });

                key.addEventListener('touchend', function() {
                    key.style.backgroundColor = 'white';
                    key.style.transform = 'translateY(0)';
                    key.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
                    key.style.filter = 'none';
                });

                // Letter-by-letter validation
                key.addEventListener('click', () => {
                    if (GameState.guessMode) {
                        const letter = key.textContent;
                        WordHandler.processLetter(letter);
                    }
                });

                rowDiv.appendChild(key);
            }

            keyContainer.appendChild(rowDiv);
        });

        // Add backspace and enter keys in a final row
        const controlRow = document.createElement('div');
        controlRow.style.display = 'flex';
        controlRow.style.justifyContent = 'center';
        controlRow.style.margin = '6px 0';
        controlRow.style.gap = '4px';

        // Backspace key
        const backspaceKey = document.createElement('button');
        backspaceKey.innerHTML = '&#9003;'; // Backspace symbol
        backspaceKey.style.flex = '1';
        backspaceKey.style.padding = '10px 15px';
        backspaceKey.style.fontSize = '20px';
        backspaceKey.style.border = 'none';
        backspaceKey.style.borderRadius = '8px';
        backspaceKey.style.backgroundColor = '#e0e0e0';
        backspaceKey.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        backspaceKey.style.transition = 'all 0.15s ease';
        backspaceKey.style.fontWeight = 'bold';
        backspaceKey.style.color = '#333';
        backspaceKey.style.textAlign = 'center';

        backspaceKey.addEventListener('click', () => {
            // Implement backspace functionality
            if (GameState.guessMode && GameState.currentInput.length > 0) {
                GameState.currentInput = GameState.currentInput.slice(0, -1);
                WordHandler.updateWordSpaces();
            }
        });

        // Enter key
        const enterKey = document.createElement('button');
        enterKey.textContent = 'Enter';
        enterKey.style.flex = '1';
        enterKey.style.padding = '10px 15px';
        enterKey.style.fontSize = '16px';
        enterKey.style.border = 'none';
        enterKey.style.borderRadius = '8px';
        enterKey.style.backgroundColor = '#4CAF50';
        enterKey.style.boxShadow = '0 1px 3px rgba(0,0,0,0.2)';
        enterKey.style.transition = 'all 0.15s ease';
        enterKey.style.fontWeight = 'bold';
        enterKey.style.color = 'white';
        enterKey.style.textAlign = 'center';

        enterKey.addEventListener('click', () => {
            // Submit the word
            if (GameState.guessMode && GameState.currentInput.length > 0) {
                WordHandler.processFullWord();
            }
        });

        controlRow.appendChild(backspaceKey);
        controlRow.appendChild(enterKey);
        keyContainer.appendChild(controlRow);

        virtualKeyboard.appendChild(keyContainer);
        keyboardContainer.appendChild(virtualKeyboard);
        document.body.appendChild(keyboardContainer);

        // Show keyboard when in guess mode with animation
        document.addEventListener('guessmode-changed', (e) => {
            if (e.detail.active) {
                showKeyboard();
            } else {
                hideKeyboard();
            }
        });

        // Add a click handler to the handle for manually dismissing the keyboard
        handle.addEventListener('click', () => {
            if (GameState.guessMode) {
                UI.exitGuessMode();
            }
        });

        // Add keyboard mode styles
        addKeyboardModeStyles();
    }
}

// Add glow effect based on current category color
function addCategoryGlow(keyElement) {
    if (!GameState.currentColor) return;

    // Get color based on category
    let shadowColor;
    switch(GameState.currentColor) {
        case 'yellow':
            shadowColor = 'rgba(255, 215, 0, 0.6)';
            break;
        case 'green':
            shadowColor = 'rgba(76, 175, 80, 0.6)';
            break;
        case 'blue':
            shadowColor = 'rgba(33, 150, 243, 0.6)';
            break;
        case 'red':
            shadowColor = 'rgba(244, 67, 54, 0.6)';
            break;
        default:
            shadowColor = 'rgba(33, 150, 243, 0.6)';
    }

    keyElement.style.boxShadow = `0 0 10px ${shadowColor}`;
}

// Show the keyboard with animation
function showKeyboard() {
    if (!keyboardContainer) return;

    // First make it visible but keep it off-screen
    keyboardContainer.style.display = 'block';

    // Force a reflow to ensure the transition works
    void keyboardContainer.offsetWidth;

    // Slide it up
    keyboardContainer.style.transform = 'translateY(0)';

    // Adjust the canvas and word spaces
    adjustLayoutForKeyboard(true);
}

// Hide the keyboard with animation
function hideKeyboard() {
    if (!keyboardContainer) return;

    // Slide it down
    keyboardContainer.style.transform = 'translateY(100%)';

    // After animation completes, hide it
    setTimeout(() => {
        keyboardContainer.style.display = 'none';
    }, 300);

    // Reset canvas and word spaces
    adjustLayoutForKeyboard(false);
}

// Adjust layout to make room for keyboard - improved for better visibility
function adjustLayoutForKeyboard(showingKeyboard) {
    // Get required elements
    if (!canvasContainer) {
        canvasContainer = document.querySelector('.canvas-container');
    }

    if (!wordSpacesDiv) {
        wordSpacesDiv = document.getElementById('wordSpacesDiv');
    }

    const gameControls = document.querySelector('.game-controls');
    const gameButtonContainer = document.getElementById('gameButtonContainer');
    const gameScreen = document.querySelector('.game-screen');

    if (!canvasContainer || !gameScreen) return;

    if (showingKeyboard) {
        // Add keyboard-visible class to game screen for CSS adjustments
        if (gameScreen) {
            gameScreen.classList.add('keyboard-visible');
        }

        // Significantly reduce canvas size when keyboard is shown
        canvasContainer.style.transition = 'all 0.3s ease';
        canvasContainer.style.width = '60%'; // Make canvas smaller
        canvasContainer.style.margin = '0 auto 5px auto';
        canvasContainer.style.transform = 'scale(0.8)'; // Scale down for better view

        // Add animation effect to canvas
        canvasContainer.style.animation = 'canvas-shrink 0.3s forwards';

        // Adjust wordSpacesDiv for better visibility
        if (wordSpacesDiv) {
            wordSpacesDiv.style.margin = '5px auto'; // Tighter spacing
            wordSpacesDiv.style.transition = 'all 0.3s ease';
            wordSpacesDiv.style.transform = 'translateY(-10px)'; // Move up slightly

            // Add highlight glow to draw attention to word spaces
            wordSpacesDiv.style.boxShadow = '0 0 10px rgba(76, 175, 80, 0.6)';
        }

        // Adjust button container if available
        if (gameButtonContainer) {
            gameButtonContainer.style.margin = '5px auto 180px auto'; // Add bottom margin for keyboard
            gameButtonContainer.style.transition = 'all 0.3s ease';
            gameButtonContainer.style.transform = 'scale(0.9)'; // Slightly smaller buttons
        } else if (gameControls) {
            // Fallback to old controls system
            gameControls.style.marginBottom = '180px'; // Enough space for keyboard
        }

        // Create and add a "Done" button above keyboard to exit guess mode
        addDoneButton();

    } else {
        // Remove keyboard-visible class
        if (gameScreen) {
            gameScreen.classList.remove('keyboard-visible');
        }

        // Restore canvas size
        canvasContainer.style.width = '100%';
        canvasContainer.style.margin = '0 0 15px 0';
        canvasContainer.style.transform = 'scale(1)';
        canvasContainer.style.animation = 'canvas-expand 0.3s forwards';

        // Restore wordSpacesDiv
        if (wordSpacesDiv) {
            wordSpacesDiv.style.margin = '15px 0';
            wordSpacesDiv.style.transform = 'translateY(0)';
            wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        }

        // Restore button container
        if (gameButtonContainer) {
            gameButtonContainer.style.margin = '15px 0';
            gameButtonContainer.style.transform = 'scale(1)';
        } else if (gameControls) {
            // Fallback to old controls system
            gameControls.style.marginBottom = '0';
        }

        // Remove the "Done" button
        removeDoneButton();
    }
}

// Add "Done" button above keyboard for easier exiting guess mode
function addDoneButton() {
    // Check if button already exists
    if (document.getElementById('keyboardDoneBtn')) {
        return;
    }

    const doneButton = document.createElement('button');
    doneButton.id = 'keyboardDoneBtn';
    doneButton.textContent = 'Done';
    doneButton.style.position = 'fixed';
    doneButton.style.bottom = '255px'; // Position above keyboard
    doneButton.style.right = '15px';
    doneButton.style.backgroundColor = '#4CAF50';
    doneButton.style.color = 'white';
    doneButton.style.border = 'none';
    doneButton.style.borderRadius = '5px';
    doneButton.style.padding = '8px 15px';
    doneButton.style.fontWeight = 'bold';
    doneButton.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
    doneButton.style.zIndex = '1010';
    doneButton.style.cursor = 'pointer';

    // Add event listener to exit guess mode
    doneButton.addEventListener('click', function() {
        if (typeof UI !== 'undefined' && typeof UI.exitGuessMode === 'function') {
            UI.exitGuessMode();
        }
    });

    document.body.appendChild(doneButton);
}

// Remove "Done" button when keyboard is hidden
function removeDoneButton() {
    const doneButton = document.getElementById('keyboardDoneBtn');
    if (doneButton && doneButton.parentNode) {
        doneButton.parentNode.removeChild(doneButton);
    }
}

// Function to add specific styling for keyboard mode
function addKeyboardModeStyles() {
    if (document.getElementById('keyboard-mode-styles')) return;

    const styleElement = document.createElement('style');
    styleElement.id = 'keyboard-mode-styles';
    styleElement.textContent = `
        @keyframes canvas-shrink {
            0% { transform: scale(1); }
            100% { transform: scale(0.8); }
        }

        @keyframes canvas-expand {
            0% { transform: scale(0.8); }
            100% { transform: scale(1); }
        }

        .keyboard-visible .canvas-container {
            width: 60% !important;
            margin: 0 auto 5px auto !important;
            transform: scale(0.8);
        }

        .keyboard-visible #wordSpacesDiv {
            margin: 5px auto !important;
            transform: translateY(-10px);
            box-shadow: 0 0 10px rgba(76, 175, 80, 0.6) !important;
        }

        .keyboard-visible #gameButtonContainer,
        .keyboard-visible .game-controls {
            margin-bottom: 180px !important;
            transform: scale(0.9);
        }

        /* Fix for iOS devices to ensure content doesn't get hidden */
        @supports (-webkit-touch-callout: none) {
            .keyboard-visible .canvas-container {
                width: 55% !important;
                margin-top: 5px !important;
                transform: scale(0.75);
            }

            .keyboard-visible #wordSpacesDiv {
                transform: translateY(-15px);
                margin: 3px auto !important;
            }

            .keyboard-visible #gameButtonContainer,
            .keyboard-visible .game-controls {
                margin-bottom: 200px !important;
            }
        }

        /* Tablet adjustments */
        @media (min-width: 768px) {
            .keyboard-visible .canvas-container {
                width: 70% !important;
                transform: scale(0.9);
            }

            .keyboard-visible #gameButtonContainer,
            .keyboard-visible .game-controls {
                margin-bottom: 230px !important;
            }
        }

        /* Portrait phone adjustments */
        @media (max-height: 700px) {
            .keyboard-visible .canvas-container {
                width: 50% !important;
                transform: scale(0.7);
            }

            .keyboard-visible #wordSpacesDiv {
                transform: translateY(-20px);
            }
        }
    `;

    document.head.appendChild(styleElement);
}

// Force hide the keyboard - use this when returning to menu or completing a game
function forceHideKeyboard() {
    if (!keyboardContainer) return;

    // Immediately hide without animation
    keyboardContainer.style.display = 'none';
    keyboardContainer.style.transform = 'translateY(100%)';

    // Reset layout
    adjustLayoutForKeyboard(false);

    // Also remove the Done button if it exists
    removeDoneButton();
}

// Check if we're on a mobile device
function isMobileDevice() {
    return (typeof window.orientation !== 'undefined') ||
           (navigator.userAgent.indexOf('IEMobile') !== -1) ||
           (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

// Export public functions - make sure init is included
export {
    init,
    createVirtualKeyboard,
    handleKeyPress,
    handleBeginButtonClick,
    handleBackButtonClick,
    isMobileDevice,
    showKeyboard,
    hideKeyboard,
    forceHideKeyboard,
    adjustLayoutForKeyboard,
    addKeyboardModeStyles
};
