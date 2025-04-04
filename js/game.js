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
import * as MobileUI from './modules/mobileUI.js'; // Import our new mobile UI module

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
        if (typeof MobileUI !== 'undefined' && MobileUI.init) {
            initializeModule("Mobile UI", MobileUI.init);
        }

        // Set up window-level event listeners
        window.addEventListener('resize', handleResize);
        window.addEventListener('load', handleFullLoad);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('orientationchange', handleOrientationChange);

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

// Handle orientation changes on mobile
function handleOrientationChange() {
    log("Orientation changed - adjusting layout");

    // Forward to mobile UI handler
    MobileUI.handleOrientationChange();

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
        if (!MobileUI.detectMobileDevice()) {
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

// Override the UI enter/exit guess mode functions with mobile-aware versions
const originalEnterGuessMode = UI.enterGuessMode;
UI.enterGuessMode = function() {
    // Call original function
    originalEnterGuessMode();

    // Add mobile-specific handling
    if (MobileUI.detectMobileDevice()) {
        MobileUI.enterMobileGuessMode();
    }
};

const originalExitGuessMode = UI.exitGuessMode;
UI.exitGuessMode = function() {
    // Call original function
    originalExitGuessMode();

    // Add mobile-specific handling
    if (MobileUI.detectMobileDevice()) {
        MobileUI.exitMobileGuessMode();
    }
};

// Handle window resize with debounce
let resizeTimeout;
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        Renderer.resizeCanvas();
        UI.repositionElements();
    }, 100);
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);

// Export public functions for external access
export {
    log,
    initGame,
    handleResize
};
