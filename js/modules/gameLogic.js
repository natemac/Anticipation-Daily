// gameLogic.js - Handles main game flow and mechanics

import GameState from './state.js';
import * as Renderer from './renderer.js';
import * as Animation from './animation.js';
import * as Audio from './audio.js';
import * as UI from './ui.js';
import * as WordHandler from './wordHandler.js';
import { log } from '../game.js';

// Module variables
let elapsedTimerInterval;

// Initialize the game logic
function init() {
    log("Game logic module initialized");
    return true;
}

// Start a new game with the selected category
async function startGame(color, category) {
    log(`Starting game: ${category} (${color})`);

    try {
        // Try to load the JSON file
        const response = await fetch(`items/${color}.json`);

        if (!response.ok) {
            throw new Error(`Could not load ${color}.json (${response.status}: ${response.statusText})`);
        }

        const itemData = await response.json();
        log('Successfully loaded drawing data');
        startGameWithData(color, category, itemData);
    } catch (error) {
        log('ERROR: Failed to load game data: ' + error.message);
        // Show error to user
        UI.showError(`Failed to load game data: ${error.message}`);
    }
}

// Start game with provided data
function startGameWithData(color, category, data) {
    log("Starting game with data");

    // Cancel any existing animation
    if (GameState.animationId) {
        cancelAnimationFrame(GameState.animationId);
        GameState.animationId = null;
    }

    // Reset game state for new game
    GameState.resetForNewGame();

    // Update game state with new data
    GameState.currentColor = color;
    GameState.currentCategory = category;
    GameState.drawingData = data;

    // Reset hint button
    UI.toggleHintButton(false);

    // Hide confetti canvas
    const confettiCanvas = document.getElementById('confettiCanvas');
    if (confettiCanvas) {
        confettiCanvas.style.display = 'none';
    }

    // Switch to game screen using the menu function
    if (typeof showGameScreen === 'function') {
        showGameScreen();
    }

    // Set background color based on category
    document.body.style.backgroundColor = `var(--${color}-color)`;

    // Reset UI elements
    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.style.display = 'none';
    }

    UI.showWrongMessage('');

    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = '00:00';
    }

    const beginButton = document.getElementById('beginButton')?.querySelector('span');
    if (beginButton) {
        beginButton.textContent = 'Begin';
    }

    const gameCanvas = document.getElementById('gameCanvas');
    if (gameCanvas) {
        gameCanvas.classList.remove('incorrect');
    }

    const buttonTimer = document.getElementById('buttonTimer');
    if (buttonTimer) {
        buttonTimer.classList.remove('active');
        buttonTimer.style.width = '0%';
    }

    // Ensure canvas is properly sized and clean
    setTimeout(() => {
        Renderer.resizeCanvas();
    }, 100);
}

// Rest of the file stays the same...
// Export functions
export {
    init,
    startGame,
    startGameWithData,
    startDrawing,
    startElapsedTimer
};
