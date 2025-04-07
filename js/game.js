// game.js - Main entry point for the Anticipation Game
// This file coordinates all the game modules and handles initialization

// Import all modules
import GameState from './modules/state.js';
import * as Renderer from './modules/renderer.js';
import * as InputHandler from './modules/input.js';
import * as Animation from './modules/animation.js';
import * as UI from './modules/ui/index.js';
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
export function log(message) {
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

    // Set up window-level event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('load', handleFullLoad);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Preload all audio assets
    Audio.preloadAudio();

    log("Game initialized");
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

// Handle full page load
function handleFullLoad() {
    log("Window fully loaded");

    // Force another init check after everything loads
    setTimeout(() => {
        Renderer.checkCanvasInitialization();
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
