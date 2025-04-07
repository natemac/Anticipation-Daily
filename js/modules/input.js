// input.js - Handles keyboard and touch input

import GameState from './state.js';
import * as WordHandler from './wordHandler.js';
import * as UI from './ui/index.js';
import * as Audio from './audio.js';
import * as GameLogic from './gameLogic.js';
import { log } from '../game.js';

// Module variables
let beginButton, backButton, canvas;

// Initialize the input handling
function init() {
    // Get DOM elements
    beginButton = document.getElementById('beginButton');
    backButton = document.getElementById('backButton');
    canvas = document.getElementById('gameCanvas');

    // Set up input event listeners
    setupEventListeners();

    // Initialize touch handling for mobile
    initTouchHandling();

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

// Check if device is mobile
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export {
    init,
    handleBeginButtonClick,
    handleBackButtonClick,
    handleKeyPress,
    handleCanvasTouch,
    isMobileDevice
};
