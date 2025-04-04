// mobileUI.js - Enhanced mobile experience for the Anticipation Game
// This module handles mobile-specific UI and interactions

import GameState from './state.js';
import * as Animation from './animation.js';
import * as Audio from './audio.js';
import * as WordHandler from './wordHandler.js';
import * as UI from './ui.js';
import { log } from '../game.js';

// Module variables
let mobileKeyboard;
let isMobileDevice;
let isTabletDevice;
let touchStartY = 0;
let touchIdentifier = null;

// Initialize Mobile UI
function init() {
    // Detect device type
    isMobileDevice = detectMobileDevice();
    isTabletDevice = detectTabletDevice();
    
    // Set up mobile-specific meta tags and body classes
    setupMobileViewport();
    
    // Create mobile keyboard (only if on mobile)
    if (isMobileDevice) {
        createMobileKeyboard();
        preventScrolling();
        enhanceUIForTouch();
    }
    
    log(`Mobile UI initialized: ${isMobileDevice ? 'Mobile Device' : 'Desktop Device'}`);
    
    return {
        isMobileDevice,
        isTabletDevice,
        mobileKeyboard
    };
}

// Set up the proper mobile viewport and meta tags
function setupMobileViewport() {
    // Only add if we're on a mobile device
    if (!isMobileDevice) return;

    // Find or create proper viewport meta tag
    let viewportMeta = document.querySelector('meta[name="viewport"]');
    if (!viewportMeta) {
        viewportMeta = document.createElement('meta');
        viewportMeta.name = 'viewport';
        document.head.appendChild(viewportMeta);
    }
    
    // Set optimal viewport settings for mobile game
    viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    
    // Add mobile classes to body and game container
    document.body.classList.add('mobile-device');
    const gameContainer = document.querySelector('.game-container');
    if (gameContainer) {
        gameContainer.classList.add('mobile-container');
    }
    
    // Add theme-color meta for browser UI
    let themeColor = document.querySelector('meta[name="theme-color"]');
    if (!themeColor) {
        themeColor = document.createElement('meta');
        themeColor.name = 'theme-color';
        document.head.appendChild(themeColor);
    }
    themeColor.content = '#2196F3'; // Match game blue
    
    // Add mobile-specific styles if not already added
    addMobileStyles();
}

// Detect if we're on a mobile device (phone)
function detectMobileDevice() {
    // More accurate mobile detection
    const isMobileUserAgent = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const hasTouchPoints = navigator.maxTouchPoints > 0;
    const isSmallScreen = window.innerWidth < 768;
    
    // Consider it a mobile phone if it has a mobile user agent AND either touch capability or small screen
    return isMobileUserAgent && (hasTouchPoints || isSmallScreen);
}

// Detect if we're on a tablet
function detectTabletDevice() {
    // Detect tablets - typically larger touchscreens
    const isTabletUserAgent = /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
    const hasTouchPoints = navigator.maxTouchPoints > 0;
    const isMediumScreen = window.innerWidth >= 768 && window.innerWidth < 1200;
    
    // Consider it a tablet if it matches tablet user agent OR has touch and medium screen
    return isTabletUserAgent || (hasTouchPoints && isMediumScreen);
}

// Create the mobile keyboard
function createMobileKeyboard() {
    // Check if keyboard already exists
    if (document.getElementById('mobileKeyboard')) {
        mobileKeyboard = document.getElementById('mobileKeyboard');
        return mobileKeyboard;
    }

    // Create the keyboard container
    mobileKeyboard = document.createElement('div');
    mobileKeyboard.id = 'mobileKeyboard';
    mobileKeyboard.className = 'mobile-keyboard';
    
    // Add a handle for closing the keyboard
    const keyboardHandle = document.createElement('div');
    keyboardHandle.className = 'keyboard-handle';
    mobileKeyboard.appendChild(keyboardHandle);

    // Define the keyboard layout
    const rows = [
        'QWERTYUIOP',
        'ASDFGHJKL',
        'ZXCVBNM'
    ];

    // Create keyboard rows
    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'keyboard-row';

        // Create keys for this row
        for (let letter of row) {
            const key = document.createElement('div');
            key.className = 'key';
            key.textContent = letter;
            
            // Add ripple effect container
            const ripple = document.createElement('span');
            ripple.className = 'key-ripple';
            key.appendChild(ripple);

            // Add touch/click handlers with ripple effect
            key.addEventListener('touchstart', (e) => {
                createRippleEffect(e, key);
                if (GameState.guessMode) {
                    WordHandler.processLetter(letter);
                    Audio.playTick();
                }
            });
            
            key.addEventListener('click', () => {
                if (GameState.guessMode) {
                    WordHandler.processLetter(letter);
                    Audio.playTick();
                }
            });

            rowDiv.appendChild(key);
        }

        mobileKeyboard.appendChild(rowDiv);
    });
    
    // Add action row (backspace, space, enter)
    const actionRow = document.createElement('div');
    actionRow.className = 'keyboard-row';
    
    // Backspace key
    const backspaceKey = document.createElement('div');
    backspaceKey.className = 'key action-key';
    backspaceKey.innerHTML = '⌫';
    backspaceKey.addEventListener('click', () => {
        if (GameState.guessMode && GameState.currentInput.length > 0) {
            GameState.currentInput = GameState.currentInput.slice(0, -1);
            WordHandler.updateWordSpaces();
            Audio.playTick();
        }
    });
    
    // Space key
    const spaceKey = document.createElement('div');
    spaceKey.className = 'key space-key';
    spaceKey.innerHTML = 'SPACE';
    spaceKey.addEventListener('click', () => {
        if (GameState.guessMode) {
            WordHandler.processLetter(' ');
            Audio.playTick();
        }
    });
    
    // Enter key
    const enterKey = document.createElement('div');
    enterKey.className = 'key action-key';
    enterKey.innerHTML = '↵';
    enterKey.addEventListener('click', () => {
        if (GameState.guessMode && GameState.currentInput.length > 0) {
            WordHandler.processFullWord();
        }
    });
    
    actionRow.appendChild(backspaceKey);
    actionRow.appendChild(spaceKey);
    actionRow.appendChild(enterKey);
    mobileKeyboard.appendChild(actionRow);

    // Add keyboard handle tap gesture to dismiss
    keyboardHandle.addEventListener('click', () => {
        if (GameState.guessMode) {
            // Exit guess mode
            UI.exitGuessMode();
        }
    });

    // Add to document body
    document.body.appendChild(mobileKeyboard);
    
    return mobileKeyboard;
}

// Show mobile keyboard with animation
function showMobileKeyboard() {
    if (!mobileKeyboard) return;
    
    // Make sure the keyboard is visible before animating
    mobileKeyboard.style.display = 'block';
    
    // Use a small delay to ensure display change takes effect before animation
    setTimeout(() => {
        mobileKeyboard.classList.add('active');
        
        // Add full-screen play mode to resize layout
        document.body.classList.add('mobile-play');
        
        // Add guess-mode to game container for layout changes
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.add('guess-mode');
            gameContainer.classList.remove('drawing-mode');
        }
        
        // Add animation to canvas container to become smaller
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.classList.add('compact-mode');
        }
    }, 10);
}

// Hide mobile keyboard with animation
function hideMobileKeyboard() {
    if (!mobileKeyboard) return;
    
    mobileKeyboard.classList.remove('active');
    
    // Remove mode classes after animation completes
    setTimeout(() => {
        mobileKeyboard.style.display = 'none';
        
        // Remove full-screen play mode
        document.body.classList.remove('mobile-play');
        
        // Update game container classes
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            gameContainer.classList.remove('guess-mode');
            gameContainer.classList.add('drawing-mode');
        }
        
        // Remove compact mode from canvas
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.classList.remove('compact-mode');
        }
    }, 300); // Match the transition duration
}

// Prevent scrolling on touch devices
function preventScrolling() {
    // Add a minimum of touch-action: none to the body
    document.body.style.touchAction = 'none';
    
    // Handle touchmove event to prevent scrolling
    document.addEventListener('touchmove', (e) => {
        // Only prevent default if in game mode
        if (GameState.gameStarted) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Handle touchstart to track initial position for custom scrolling if needed
    document.addEventListener('touchstart', (e) => {
        if (GameState.gameStarted && e.touches.length === 1) {
            touchStartY = e.touches[0].clientY;
            touchIdentifier = e.touches[0].identifier;
        }
    }, { passive: true });
    
    // Add touchend handler to reset touch tracking
    document.addEventListener('touchend', (e) => {
        if (e.changedTouches[0].identifier === touchIdentifier) {
            touchIdentifier = null;
        }
    }, { passive: true });
}

// Add ripple effect for touch feedback
function createRippleEffect(event, element) {
    const ripple = element.querySelector('.key-ripple');
    if (!ripple) return;
    
    // Remove any existing animation
    ripple.classList.remove('animate');
    
    // Set size based on button size
    const size = Math.max(element.clientWidth, element.clientHeight);
    ripple.style.width = ripple.style.height = `${size}px`;
    
    // Position ripple where touch occurred
    let rect = element.getBoundingClientRect();
    let x, y;
    
    if (event.type === 'touchstart') {
        x = event.touches[0].clientX - rect.left - size / 2;
        y = event.touches[0].clientY - rect.top - size / 2;
    } else {
        x = event.clientX - rect.left - size / 2;
        y = event.clientY - rect.top - size / 2;
    }
    
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    // Trigger animation
    ripple.classList.add('animate');
}

// Enhance UI elements for touch
function enhanceUIForTouch() {
    // Increase touch targets
    const buttons = document.querySelectorAll('button');
    buttons.forEach(button => {
        button.classList.add('touch-enhanced');
    });
    
    // Add touch feedback to canvas for entering guess mode
    const canvas = document.getElementById('gameCanvas');
    if (canvas) {
        canvas.addEventListener('touchstart', () => {
            if (GameState.gameStarted && !GameState.guessMode) {
                // Add tap effect
                const effect = document.createElement('div');
                effect.className = 'tap-effect';
                const rect = canvas.getBoundingClientRect();
                effect.style.left = '50%';
                effect.style.top = '50%';
                canvas.parentElement.appendChild(effect);
                
                // Remove after animation completes
                setTimeout(() => {
                    if (effect.parentElement) {
                        effect.parentElement.removeChild(effect);
                    }
                }, 700);
            }
        });
    }
    
    // Optimize hint button
    const hintButton = document.getElementById('hintButton');
    if (hintButton) {
        hintButton.classList.add('mobile-optimized');
    }
    
    // Make sure word spaces div is properly sized for mobile
    const wordSpacesDiv = document.getElementById('wordSpacesDiv');
    if (wordSpacesDiv) {
        wordSpacesDiv.classList.add('mobile-optimized');
    }
}

// Add mobile-specific styles if they don't exist
function addMobileStyles() {
    if (!document.getElementById('mobile-optimization-styles')) {
        const styleElem = document.createElement('style');
        styleElem.id = 'mobile-optimization-styles';
        styleElem.textContent = `
            /* Mobile optimization styles */
            body.mobile-device {
                position: fixed;
                width: 100%;
                height: 100%;
                overflow: hidden;
                touch-action: none;
                -webkit-overflow-scrolling: none;
                overscroll-behavior: none;
            }
            
            body.mobile-play .game-container {
                height: 100vh;
                display: flex;
                flex-direction: column;
            }
            
            .game-container.mobile-container {
                max-width: 100%;
                margin: 0;
                padding: 0;
            }
            
            .game-container.guess-mode .canvas-container {
                height: 40vh;
                min-height: 200px;
                transition: height 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
            }
            
            .canvas-container.compact-mode {
                transform: scale(0.95);
                transition: transform 0.3s ease;
            }
            
            .mobile-keyboard {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                background-color: #eef0f2;
                padding: 10px 5px 15px 5px;
                box-shadow: 0 -2px 10px rgba(0,0,0,0.2);
                z-index: 1000;
                transform: translateY(100%);
                transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
                display: none;
                border-top-left-radius: 15px;
                border-top-right-radius: 15px;
            }
            
            .mobile-keyboard.active {
                transform: translateY(0);
            }
            
            .keyboard-handle {
                width: 40px;
                height: 5px;
                background-color: #ccc;
                border-radius: 3px;
                margin: 0 auto 15px auto;
                cursor: pointer;
            }
            
            .keyboard-row {
                display: flex;
                justify-content: center;
                margin-bottom: 8px;
                gap: 4px;
            }
            
            .key {
                flex: 1;
                max-width: 40px;
                height: 45px;
                display: flex;
                justify-content: center;
                align-items: center;
                background-color: white;
                border-radius: 5px;
                font-weight: bold;
                box-shadow: 0 2px 3px rgba(0,0,0,0.1);
                position: relative;
                overflow: hidden;
                cursor: pointer;
                user-select: none;
                -webkit-tap-highlight-color: transparent;
            }
            
            .key:active {
                background-color: #f0f0f0;
                transform: translateY(2px);
                box-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }
            
            .key-ripple {
                position: absolute;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 50%;
                transform: scale(0);
                pointer-events: none;
            }
            
            .key-ripple.animate {
                animation: ripple 0.6s linear;
            }
            
            .action-key {
                max-width: 60px;
                font-size: 24px;
            }
            
            .space-key {
                max-width: 150px;
                flex-grow: 3;
                font-size: 14px;
            }
            
            .tap-effect {
                position: absolute;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.5);
                transform: translate(-50%, -50%) scale(0);
                animation: tap-explode 0.7s forwards;
                pointer-events: none;
            }
            
            @keyframes tap-explode {
                0% {
                    transform: translate(-50%, -50%) scale(0);
                    opacity: 1;
                }
                100% {
                    transform: translate(-50%, -50%) scale(4);
                    opacity: 0;
                }
            }
            
            @keyframes ripple {
                to {
                    transform: scale(4);
                    opacity: 0;
                }
            }
            
            .touch-enhanced {
                min-height: 44px;
                min-width: 44px;
                padding: 12px 15px;
            }
            
            #wordSpacesDiv.mobile-optimized {
                margin: 15px 5px;
                padding: 15px 5px;
                border-radius: 10px;
            }
            
            .mobile-optimized.hint-button {
                min-height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 16px;
            }
            
            /* Game mode layout changes */
            body.mobile-device.mobile-play .game-title {
                display: none;
            }
            
            /* Dynamic category display */
            .category-display {
                position: absolute;
                top: 10px;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                padding: 8px;
                color: #333;
                z-index: 10;
                transition: transform 0.3s ease, opacity 0.3s ease;
            }
            
            .category-display.hidden {
                transform: translateY(-20px);
                opacity: 0;
            }
        `;
        document.head.appendChild(styleElem);
    }
}

// Enter mobile guess mode
function enterMobileGuessMode() {
    // Only apply mobile-specific changes if on mobile
    if (!isMobileDevice) return;
    
    // Show keyboard
    showMobileKeyboard();
    
    // Add guess mode classes to body and game container
    document.body.classList.add('mobile-guess');
    
    // Add pulsing animation to word spaces
    const wordSpacesDiv = document.getElementById('wordSpacesDiv');
    if (wordSpacesDiv) {
        wordSpacesDiv.classList.add('pulse-animation');
        setTimeout(() => {
            wordSpacesDiv.classList.remove('pulse-animation');
        }, 1000);
    }
    
    // Create and show dynamic category display
    showCategoryDisplay();
}

// Exit mobile guess mode
function exitMobileGuessMode() {
    // Only apply mobile-specific changes if on mobile
    if (!isMobileDevice) return;
    
    // Hide keyboard
    hideMobileKeyboard();
    
    // Remove guess mode classes
    document.body.classList.remove('mobile-guess');
    
    // Hide category display with animation
    hideCategoryDisplay();
}

// Show category display with animation
function showCategoryDisplay() {
    // Create or get the category display
    let categoryDisplay = document.querySelector('.category-display');
    
    if (!categoryDisplay) {
        categoryDisplay = document.createElement('div');
        categoryDisplay.className = 'category-display';
        document.body.appendChild(categoryDisplay);
    }
    
    // Set content
    categoryDisplay.textContent = GameState.currentCategory || 'Category';
    
    // Show with animation
    categoryDisplay.classList.remove('hidden');
}

// Hide category display with animation
function hideCategoryDisplay() {
    const categoryDisplay = document.querySelector('.category-display');
    if (categoryDisplay) {
        categoryDisplay.classList.add('hidden');
    }
}

// Handle orientation changes on mobile
function handleOrientationChange() {
    // Only process on mobile
    if (!isMobileDevice) return;
    
    log("Orientation changed - adjusting mobile layout");
    
    // Add a small delay to ensure DOM updates after rotation
    setTimeout(() => {
        // Resize the UI components
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            // Force re-layout
            canvasContainer.style.height = GameState.guessMode ? '40vh' : 'auto';
        }
        
        // Adjust keyboard position for new dimensions
        if (mobileKeyboard && GameState.guessMode) {
            mobileKeyboard.style.display = 'none';
            setTimeout(() => {
                mobileKeyboard.style.display = 'block';
                mobileKeyboard.classList.add('active');
            }, 100);
        }
    }, 300);
}

// Export functions
export {
    init,
    detectMobileDevice,
    detectTabletDevice,
    createMobileKeyboard,
    showMobileKeyboard,
    hideMobileKeyboard,
    enterMobileGuessMode,
    exitMobileGuessMode,
    handleOrientationChange
};
