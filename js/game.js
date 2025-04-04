// game.js - Main entry point for the Anticipation Game
// This file coordinates all the game modules and handles initialization

// Import all modules
import GameState from './modules/state.js';
import * as Renderer from './modules/renderer.js';
import * as InputHandler from './modules/input.js';
import * as Animation from './modules/animation.js';
import * as UI from './modules/ui.js';
import * as WordHandler from './modules/wordHandler.js';
import * as Audio from './modules/audio.js';
import * as GameLogic from './modules/gameLogic.js';
import * as Menu from './menu.js';
import * as VolumeControls from './modules/volume-controls.js';

// Make functions globally available for older code
window.startGame = GameLogic.startGame;
window.startDrawing = GameLogic.startDrawing;
window.updatePuzzleCompletion = Menu.updatePuzzleCompletion;
window.showGameScreen = Menu.showGameScreen;
window.showMainMenu = Menu.showMainMenu;
window.renderFrame = Renderer.renderFrame;
window.resizeCanvas = Renderer.resizeCanvas;
window.clearCanvas = Renderer.clearCanvas;

// Simple logging function for debugging
function log(message) {
    console.log(`[AnticipationGame] ${message}`);
}

// Initialize the game
function initGame() {
    log("Initializing game...");

    // Initialize game state first
    GameState.init();

    // Initialize modules in the correct order
    Renderer.init();
    Audio.init();
    UI.init();
    InputHandler.init();
    Animation.init();
    WordHandler.init();
    GameLogic.init();
    VolumeControls.init(); // Initialize volume controls

    // NEW: Initialize mobile layout
    initMobileLayout();

    // Set up window-level event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('load', handleFullLoad);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Preload all audio assets
    Audio.preloadAudio();

    log("Game initialized");
}

// NEW: Initialize mobile-specific layout optimizations
function initMobileLayout() {
    // Check if we're on a mobile device
    const isMobile = UI.detectMobileDevice();

    if (isMobile) {
        log("Mobile device detected - initializing mobile layout");

        // Add mobile classes
        document.body.classList.add('mobile-device');

        // Create a container for our buttons on mobile
        const gameControlsDiv = document.querySelector('.game-controls');
        if (gameControlsDiv) {
            // Create a mobile-specific controls container
            const mobileControlsDiv = document.createElement('div');
            mobileControlsDiv.className = 'game-controls-mobile';

            // Move buttons into this container
            const beginButton = document.getElementById('beginButton');
            const hintButton = document.getElementById('hintButton');

            if (beginButton && hintButton) {
                // Clone the buttons to avoid DOM manipulation issues
                const beginClone = beginButton.cloneNode(true);
                const hintClone = hintButton.cloneNode(true);

                // Add event listeners to clones
                beginClone.addEventListener('click', () => {
                    if (!GameState.gameStarted) {
                        GameLogic.startDrawing();
                    } else {
                        UI.enterGuessMode();
                    }
                });

                hintClone.addEventListener('click', () => {
                    // Find and call the useHint function
                    const useHintFn = document.getElementById('hintButton').onclick;
                    if (useHintFn) {
                        useHintFn();
                    }
                });

                // Add to mobile container
                mobileControlsDiv.appendChild(beginClone);
                mobileControlsDiv.appendChild(hintClone);

                // Replace standard controls with mobile controls
                gameControlsDiv.parentElement.insertBefore(mobileControlsDiv, gameControlsDiv);

                // Only hide the original controls when in game, not in the menu
                if (GameState.gameStarted) {
                    gameControlsDiv.style.display = 'none';
                }
            }
        }

        // Handle orientation changes
        window.addEventListener('orientationchange', handleOrientationChange);

        // Add viewport meta tag if not present (for proper mobile scaling)
        if (!document.querySelector('meta[name="viewport"]')) {
            const metaTag = document.createElement('meta');
            metaTag.name = 'viewport';
            metaTag.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(metaTag);
        }

        // Prevent double-tap zooming on mobile
        document.addEventListener('touchend', preventDoubleTapZoom);
    }
}

// Handle window resize with debounce
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        Renderer.resizeCanvas();
        UI.repositionElements();
    }, 100);
}

// Handle orientation changes on mobile
function handleOrientationChange() {
    log("Orientation changed - adjusting layout");

    // Force a resize after orientation change
    clearTimeout(resizeTimeout);

    // Add a bit more delay for orientation changes
    resizeTimeout = setTimeout(() => {
        Renderer.resizeCanvas();
        UI.repositionElements();
    }, 300);
}

// Prevent double-tap zoom on mobile
function preventDoubleTapZoom(e) {
    // Only prevent in game, not in menu
    if (GameState.gameStarted) {
        const now = Date.now();
        const timeDiff = now - (this.lastTouchEnd || 0);

        if (timeDiff < 300) {
            e.preventDefault();
        }

        this.lastTouchEnd = now;
    }
}

// Handle full page load
function handleFullLoad() {
    log("Window fully loaded");

    // Force another init check after everything loads
    setTimeout(() => {
        Renderer.checkCanvasInitialization();
        if (!UI.detectMobileDevice()) {
            InputHandler.createVirtualKeyboard();
        }
    }, 300);
}

// Handle visibility change (tab switching)
function handleVisibilityChange() {
    if (!document.hidden && GameState.gameStarted) {
        log("Page became visible, redrawing canvas");

        Animation.cancelAnimations();
        Renderer.resizeCanvas();

        if (GameState.gameStarted && !GameState.guessMode && GameState.pendingAnimationStart) {
            Animation.startDrawingAnimation();
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);

// Export public functions for external access
export {
    log,
    initMobileLayout
};
