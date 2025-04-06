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

    log("Input module initialized");

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
        
        // Create the keyboard itself
        virtualKeyboard = document.createElement('div');
        virtualKeyboard.id = 'virtual-keyboard';
        virtualKeyboard.style.backgroundColor = '#f5f5f5';
        virtualKeyboard.style.padding = '15px 10px';
        virtualKeyboard.style.boxShadow = '0 -5px 15px rgba(0,0,0,0.2)';
        virtualKeyboard.style.borderTopLeftRadius = '15px';
        virtualKeyboard.style.borderTopRightRadius = '15px';
        
        // Add drag handle for better UX
        const handle = document.createElement('div');
        handle.style.width = '40px';
        handle.style.height = '5px';
        handle.style.backgroundColor = '#ccc';
        handle.style.borderRadius = '3px';
        handle.style.margin = '0 auto 15px auto';
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
            rowDiv.style.margin = '8px 0';
            rowDiv.style.gap = '6px';

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
                key.style.fontSize = '22px';
                key.style.border = 'none';
                key.style.borderRadius = '8px';
                key.style.backgroundColor = 'white';
                key.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
                key.style.transition = 'all 0.2s ease';
                key.style.fontWeight = 'bold';
                key.style.color = '#333';
                key.style.textAlign = 'center';
                key.style.cursor = 'pointer';

                // Add "active" effect on press
                key.addEventListener('touchstart', function() {
                    key.style.backgroundColor = '#e0e0e0';
                    key.style.transform = 'translateY(2px)';
                    key.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                    // Add subtle glow effect based on category color
                    addCategoryGlow(key);
                });

                key.addEventListener('touchend', function() {
                    key.style.backgroundColor = 'white';
                    key.style.transform = 'translateY(0)';
                    key.style.boxShadow = '0 2px 4px rgba(0,0,0,0.15)';
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
    
    // Hide physical controls that are replaced by the keyboard
    hidePhysicalControls();
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
    
    // Show physical controls again
    showPhysicalControls();
}

// Adjust layout to make room for keyboard
function adjustLayoutForKeyboard(showingKeyboard) {
    // Get required elements
    if (!canvasContainer) {
        canvasContainer = document.querySelector('.canvas-container');
    }
    
    if (!wordSpacesDiv) {
        wordSpacesDiv = document.getElementById('wordSpacesDiv');
    }
    
    const gameControls = document.querySelector('.game-controls');
    
    if (!canvasContainer || !wordSpacesDiv || !gameControls) return;
    
    if (showingKeyboard) {
        // Add keyboard-visible class to game screen for CSS adjustments
        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen) {
            gameScreen.classList.add('keyboard-visible');
        }
        
        // Shrink canvas while maintaining aspect ratio
        canvasContainer.style.transition = 'all 0.3s ease';
        canvasContainer.style.width = '80%';
        canvasContainer.style.margin = '0 auto';
        
        // Move elements up to make room for keyboard
        gameControls.style.marginBottom = '240px'; // Enough space for keyboard
        
        // Apply bounce-up animation to word spaces
        wordSpacesDiv.style.animation = 'word-bounce-up 0.4s ease-out forwards';
        
        // Make sure the animation style exists
        addKeyboardAnimationStyles();
        
    } else {
        // Remove keyboard-visible class
        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen) {
            gameScreen.classList.remove('keyboard-visible');
        }
        
        // Restore canvas size
        canvasContainer.style.width = '100%';
        canvasContainer.style.margin = '0 0 20px 0';
        
        // Reset margins
        gameControls.style.marginBottom = '0';
        
        // Apply bounce-down animation to word spaces
        wordSpacesDiv.style.animation = 'word-bounce-down 0.3s ease-in forwards';
    }
}

// Hide physical controls when virtual keyboard is showing
function hidePhysicalControls() {
    // Hide guess button (begin button)
    if (beginButton) {
        beginButton.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        beginButton.style.opacity = '0';
        beginButton.style.transform = 'translateY(20px)';
        beginButton.style.pointerEvents = 'none';
    }
    
    // Hide hint button
    const hintButton = document.querySelector('.hint-button');
    if (hintButton) {
        hintButton.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        hintButton.style.opacity = '0';
        hintButton.style.transform = 'translateY(20px)';
        hintButton.style.pointerEvents = 'none';
    }
}

// Show physical controls when virtual keyboard is hidden
function showPhysicalControls() {
    // Show guess button (begin button)
    if (beginButton) {
        beginButton.style.opacity = '1';
        beginButton.style.transform = 'translateY(0)';
        beginButton.style.pointerEvents = 'auto';
    }
    
    // Show hint button
    const hintButton = document.querySelector('.hint-button');
    if (hintButton) {
        hintButton.style.opacity = '1';
        hintButton.style.transform = 'translateY(0)';
        hintButton.style.pointerEvents = 'auto';
    }
}

// Add animation styles for keyboard-related effects
function addKeyboardAnimationStyles() {
    if (document.getElementById('keyboard-animation-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'keyboard-animation-styles';
    styleElement.textContent = `
        @keyframes word-bounce-up {
            0% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
            70% { transform: translateY(-10px); }
            100% { transform: translateY(-12px); }
        }
        
        @keyframes word-bounce-down {
            0% { transform: translateY(-12px); }
            100% { transform: translateY(0); }
        }
        
        .keyboard-visible .canvas-container {
            transform: scale(0.9);
            margin-bottom: 5px !important;
        }
        
        #wordSpacesDiv {
            z-index: 5;
            position: relative;
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Check if we're on a mobile device
function isMobileDevice() {
    return (typeof window.orientation !== 'undefined') ||
           (navigator.userAgent.indexOf('IEMobile') !== -1) ||
           (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

// Export public functions
export {
    init,
    createVirtualKeyboard,
    handleKeyPress,
    handleBeginButtonClick,
    handleBackButtonClick,
    isMobileDevice,
    showKeyboard,
    hideKeyboard
};
