// input.js - Handles keyboard and touch input with mobile improvements

import GameState from './state.js';
import * as WordHandler from './wordHandler.js';
import * as UI from './ui.js';
import * as Audio from './audio.js';
import * as GameLogic from './gameLogic.js';
import { log } from '../game.js';

// Module variables
let beginButton, backButton, canvas;
let virtualKeyboard;
let isDeviceMobile; // Renamed variable to avoid conflict

// Initialize the input handling
function init() {
    // Get DOM elements
    beginButton = document.getElementById('beginButton');
    backButton = document.getElementById('backButton');
    canvas = document.getElementById('gameCanvas');

    // Detect if we're on a mobile device
    isDeviceMobile = UI.detectMobileDevice();

    // Add mobile class to game container if on mobile
    if (isDeviceMobile) {
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('drawing-mode');
        }
    }

    // Set up input event listeners
    setupEventListeners();

    // Initialize touch handling for mobile
    initTouchHandling();

    // Create virtual keyboard if needed
    if (isDeviceMobile) {
        // We'll rely on the mobile keyboard created in UI module
        log("Using mobile keyboard UI");
    } else {
        // Create standard virtual keyboard for non-mobile
        createVirtualKeyboard();
    }

    log("Input module initialized " + (isDeviceMobile ? "(Mobile)" : "(Desktop)"));

    return true;
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

    // Key press events for direct typing (desktop only)
    if (!isDeviceMobile) {
        document.addEventListener('keydown', handleKeyPress);
    }

    // Add touch event to canvas (with passive: false to prevent scrolling)
    if (canvas) {
        canvas.addEventListener('touchstart', handleCanvasTouch, { passive: false });
    }
}

// Initialize touch handling for mobile
function initTouchHandling() {
    if (isDeviceMobile && canvas) {
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

            // If mobile, add drawing mode class
            if (isDeviceMobile) {
                const gameContainer = document.querySelector('.game-container');
                if (gameContainer) {
                    gameContainer.classList.add('drawing-mode');
                    gameContainer.classList.remove('guess-mode');
                }
            }
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

    // Remove mobile-specific classes
    if (isDeviceMobile) {
        document.body.classList.remove('mobile-play');
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.remove('guess-mode');
            gameContainer.classList.remove('drawing-mode');
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

// Create virtual keyboard for non-mobile devices
function createVirtualKeyboard() {
    // Only create if it doesn't already exist
    if (!document.getElementById('virtual-keyboard')) {
        virtualKeyboard = document.createElement('div');
        virtualKeyboard.id = 'virtual-keyboard';
        virtualKeyboard.style.display = 'none';
        virtualKeyboard.style.position = 'fixed';
        virtualKeyboard.style.bottom = '0';
        virtualKeyboard.style.left = '0';
        virtualKeyboard.style.width = '100%';
        virtualKeyboard.style.backgroundColor = '#f5f5f5';
        virtualKeyboard.style.padding = '10px';
        virtualKeyboard.style.boxShadow = '0 -2px 5px rgba(0,0,0,0.1)';
        virtualKeyboard.style.zIndex = '1000';
        virtualKeyboard.style.borderTopLeftRadius = '15px';
        virtualKeyboard.style.borderTopRightRadius = '15px';
        virtualKeyboard.style.transition = 'transform 0.3s ease';
        virtualKeyboard.style.transform = 'translateY(100%)';

        // Add keyboard rows
        const rows = [
            'QWERTYUIOP',
            'ASDFGHJKL',
            'ZXCVBNM'
        ];

        rows.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.justifyContent = 'center';
            rowDiv.style.margin = '5px 0';
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
                key.style.margin = '2px';
                key.style.padding = '12px 0';
                key.style.width = '9%';
                key.style.minWidth = '30px';
                key.style.fontSize = '16px';
                key.style.border = 'none';
                key.style.borderRadius = '8px';
                key.style.backgroundColor = 'white';
                key.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                key.style.transition = 'all 0.2s ease';
                key.style.fontWeight = 'bold';
                key.style.color = '#333';

                // Add "active" effect on press
                key.addEventListener('touchstart', function() {
                    key.style.backgroundColor = '#e0e0e0';
                    key.style.transform = 'translateY(2px)';
                    key.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                });

                key.addEventListener('touchend', function() {
                    key.style.backgroundColor = 'white';
                    key.style.transform = 'translateY(0)';
                    key.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                });

                // Add letter-by-letter validation
                key.addEventListener('click', () => {
                    if (GameState.guessMode) {
                        const letter = key.textContent;
                        WordHandler.processLetter(letter);
                    }
                });

                rowDiv.appendChild(key);
            }

            virtualKeyboard.appendChild(rowDiv);
        });

        // Add additional buttons row (delete, space, enter)
        const actionRow = document.createElement('div');
        actionRow.style.display = 'flex';
        actionRow.style.justifyContent = 'center';
        actionRow.style.margin = '5px 0';
        actionRow.style.gap = '8px';

        // Delete button
        const deleteButton = createKeyboardButton('←', '#f44336', 'white', 60);
        deleteButton.addEventListener('click', () => {
            if (GameState.guessMode && GameState.currentInput.length > 0) {
                GameState.currentInput = GameState.currentInput.slice(0, -1);
                WordHandler.updateWordSpaces();
            }
        });

        // Space button
        const spaceButton = createKeyboardButton('Space', '#9e9e9e', 'white', 150, true);
        spaceButton.addEventListener('click', () => {
            if (GameState.guessMode) {
                WordHandler.processLetter(' ');
            }
        });

        // Enter button
        const enterButton = createKeyboardButton('Enter', '#4CAF50', 'white', 60);
        enterButton.addEventListener('click', () => {
            if (GameState.guessMode) {
                WordHandler.processFullWord();
            }
        });

        actionRow.appendChild(deleteButton);
        actionRow.appendChild(spaceButton);
        actionRow.appendChild(enterButton);
        virtualKeyboard.appendChild(actionRow);

        // Add dismiss handle for better UX
        const dismissHandle = document.createElement('div');
        dismissHandle.style.width = '40px';
        dismissHandle.style.height = '5px';
        dismissHandle.style.backgroundColor = '#ccc';
        dismissHandle.style.borderRadius = '3px';
        dismissHandle.style.margin = '0 auto 10px auto';
        virtualKeyboard.insertBefore(dismissHandle, virtualKeyboard.firstChild);

        // Add to document
        document.body.appendChild(virtualKeyboard);

        // Show keyboard when in guess mode with animation
        document.addEventListener('guessmode-changed', (e) => {
            if (e.detail.active) {
                virtualKeyboard.style.display = 'block';
                // Trigger reflow
                void virtualKeyboard.offsetWidth;
                virtualKeyboard.style.transform = 'translateY(0)';
            } else {
                virtualKeyboard.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    virtualKeyboard.style.display = 'none';
                }, 300);
            }
        });
    }
}

// Create a keyboard button with consistent styling
function createKeyboardButton(text, bgColor, textColor, minWidth, flexGrow = false) {
    const button = document.createElement('button');
    button.textContent = text;
    button.style.padding = '12px 15px';
    button.style.fontSize = '16px';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.backgroundColor = bgColor;
    button.style.color = textColor;
    button.style.fontWeight = 'bold';
    button.style.minWidth = `${minWidth}px`;
    button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    button.style.transition = 'all 0.2s ease';

    if (flexGrow) {
        button.style.flexGrow = '1';
        button.style.maxWidth = '150px';
    }

    // Add active effects
    button.addEventListener('touchstart', function() {
        this.style.transform = 'translateY(2px)';
        this.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
    });

    button.addEventListener('touchend', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    });

    return button;
}

// Check if current device is mobile - Use UI module's detection
function checkIsMobileDevice() {
    return UI.detectMobileDevice();
}

// Export public functions
export {
    init,
    createVirtualKeyboard,
    handleKeyPress,
    handleBeginButtonClick,
    handleBackButtonClick,
    checkIsMobileDevice // Renamed export to avoid conflict
};
