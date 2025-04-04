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
// Import mobile UI module conditionally to avoid errors if it doesn't exist
let MobileUI;
try {
    MobileUI = await import('./modules/mobileUI.js');
} catch (e) {
    console.log("Mobile UI module not available:", e);
    MobileUI = { init: () => {}, detectMobileDevice: () => false };
}

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

// Initialize the game with better error handling
function initGame() {
    try {
        log("Initializing game...");

        // Initialize game state first
        GameState.init();

        // Initialize modules in the correct order with error handling
        initializeModule("Renderer", Renderer.init);
        initializeModule("Audio", Audio.init);
        initializeModule("UI", UI.init);
        initializeModule("Input Handler", InputHandler.init);
        initializeModule("Animation", Animation.init);
        initializeModule("Word Handler", WordHandler.init);
        initializeModule("Game Logic", GameLogic.init);
        initializeModule("Volume Controls", VolumeControls.init);

        // Initialize Mobile UI last to ensure it can access all other modules
        if (MobileUI && typeof MobileUI.init === 'function') {
            initializeModule("Mobile UI", MobileUI.init);
        }

        // Set up window-level event listeners
        window.addEventListener('resize', handleResize);
        window.addEventListener('load', handleFullLoad);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('orientationchange', handleOrientationChange);

        // Add mobile mode specific listeners
        setupMobileExtensions();

        // Preload all audio assets
        if (Audio && typeof Audio.preloadAudio === 'function') {
            Audio.preloadAudio();
        }

        log("Game initialized successfully");
    } catch (error) {
        console.error("Error during game initialization:", error);
        showErrorMessage("Failed to initialize the game. Try refreshing the page.");
    }
}

// Helper function to initialize a module with error handling
function initializeModule(moduleName, initFunction) {
    try {
        if (typeof initFunction === 'function') {
            const result = initFunction();
            log(`${moduleName} module initialized`);
            return result;
        } else {
            throw new Error(`${moduleName} init is not a function`);
        }
    } catch (error) {
        console.error(`Error initializing ${moduleName} module:`, error);
        // Continue with initialization, but log the error
        return null;
    }
}

// Display a user-friendly error message
function showErrorMessage(message) {
    // Create an error message element if it doesn't exist
    let errorMessage = document.getElementById('errorMessage');
    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.id = 'errorMessage';
        errorMessage.style.position = 'fixed';
        errorMessage.style.top = '50%';
        errorMessage.style.left = '50%';
        errorMessage.style.transform = 'translate(-50%, -50%)';
        errorMessage.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
        errorMessage.style.color = 'white';
        errorMessage.style.padding = '20px';
        errorMessage.style.borderRadius = '10px';
        errorMessage.style.maxWidth = '80%';
        errorMessage.style.textAlign = 'center';
        errorMessage.style.zIndex = '9999';
        document.body.appendChild(errorMessage);
    }

    errorMessage.textContent = message;
}

// Set up mobile extensions without modifying the original UI functions
function setupMobileExtensions() {
    // Create event listeners for UI mode changes
    // This approach doesn't modify the original functions
    document.addEventListener('guessmode-entered', function() {
        // Add mobile-specific handling after the original function runs
        if (MobileUI && typeof MobileUI.enterMobileGuessMode === 'function'
            && MobileUI.detectMobileDevice()) {
            MobileUI.enterMobileGuessMode();
        }
    });

    document.addEventListener('guessmode-exited', function() {
        // Add mobile-specific handling after the original function runs
        if (MobileUI && typeof MobileUI.exitMobileGuessMode === 'function'
            && MobileUI.detectMobileDevice()) {
            MobileUI.exitMobileGuessMode();
        }
    });

    // Create a proxy for UI.enterGuessMode to dispatch the event
    const originalEnterGuessMode = UI.enterGuessMode;
    // We'll use a global function that preserves the original but adds our event
    window.enterGuessModeWithMobile = function() {
        // Call the original function with the correct this context
        originalEnterGuessMode.apply(UI);
        // Dispatch an event that our listener above will catch
        document.dispatchEvent(new CustomEvent('guessmode-entered'));
    };

    // Create a proxy for UI.exitGuessMode to dispatch the event
    const originalExitGuessMode = UI.exitGuessMode;
    // We'll use a global function that preserves the original but adds our event
    window.exitGuessModeWithMobile = function() {
        // Call the original function with the correct this context
        originalExitGuessMode.apply(UI);
        // Dispatch an event that our listener above will catch
        document.dispatchEvent(new CustomEvent('guessmode-exited'));
    };

    // Now update the event listeners that call these functions
    updateEventListeners();
}

// Update event listeners to use our wrapper functions
function updateEventListeners() {
    // Find the begin button and update its event listener if it exists
    const beginButton = document.getElementById('beginButton');
    if (beginButton) {
        // Remove existing event listeners (if possible)
        const newBeginButton = beginButton.cloneNode(true);
        beginButton.parentNode.replaceChild(newBeginButton, beginButton);

        // Add new event listener
        newBeginButton.addEventListener('click', function() {
            if (!GameState.gameStarted) {
                if (typeof GameLogic.startDrawing === 'function') {
                    GameLogic.startDrawing();
                }
            } else {
                // Use our wrapper instead of direct UI.enterGuessMode call
                window.enterGuessModeWithMobile();
            }
        });
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

    // Forward to mobile UI handler if available
    if (MobileUI && typeof MobileUI.handleOrientationChange === 'function') {
        MobileUI.handleOrientationChange();
    }

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

        // Only create virtual keyboard if we're NOT on a mobile device
        // For mobile devices, we use the MobileUI keyboard instead
        if (MobileUI && !MobileUI.detectMobileDevice()) {
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
    initGame,
    handleResize,
    handleOrientationChange
};
