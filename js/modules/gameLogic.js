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

    // Preload all audio files
    if (typeof Audio.preloadAudio === 'function') {
        Audio.preloadAudio();
    }

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

        // Add the color to the data, determined by filename
        itemData.category = color;

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

    // Use categoryName from the JSON if available, otherwise use the provided category
    GameState.currentCategory = data.categoryName || category;

    // Store drawing data
    GameState.drawingData = data;

    // Reset hint button
    UI.toggleHintButton(false);

    // Hide confetti canvas
    const confettiCanvas = document.getElementById('confettiCanvas');
    if (confettiCanvas) {
        confettiCanvas.style.display = 'none';
    }

    // Stop any previous music
    Audio.stopAllMusic();

    // Update the game title to show the current category
    log("Setting category display: " + GameState.currentCategory);

    // Call updateGameTitle explicitly
    if (typeof updateGameTitle === 'function') {
        updateGameTitle(GameState.currentCategory);
    }

    // Switch to game screen
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

    // Clear any messages that might be showing
    if (GameState.CONFIG.HIDE_INITIAL_MESSAGES) {
        UI.hideMessages();
    }

    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = '00:00';
        timerDisplay.style.color = '#000'; // Keep timer color black
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
        buttonTimer.style.backgroundColor = '#cccccc'; // Grey timer color
    }

    // Clear the word spaces div if it exists, but don't hide it
    const wordSpacesDiv = document.getElementById('wordSpacesDiv');
    if (wordSpacesDiv) {
        wordSpacesDiv.innerHTML = '';
        // Keep it visible but empty
        wordSpacesDiv.style.display = 'block';
        wordSpacesDiv.style.visibility = 'visible';
    }

    // Reset correctLetters to ensure no leftover from previous game
    GameState.correctLetters = [];
    GameState.currentInput = '';

    // Ensure canvas is properly sized and clean
    setTimeout(() => {
        Renderer.resizeCanvas();
    }, 100);
}

// Start the drawing animation - updated to start category-specific background music
function startDrawing() {
    log("Starting drawing animation");

    // Update game state
    GameState.gameStarted = true;
    GameState.timerActive = true;
    GameState.pendingAnimationStart = true;

    const beginButton = document.getElementById('beginButton')?.querySelector('span');
    if (beginButton) {
        beginButton.textContent = 'Guess';
    }

    // Show hint button
    UI.toggleHintButton(true);

    // Clear any existing timers
    if (GameState.elapsedTimer) clearInterval(GameState.elapsedTimer);
    if (GameState.guessTimer) clearInterval(GameState.guessTimer);
    if (GameState.animationId) cancelAnimationFrame(GameState.animationId);

    // Ensure canvas is properly sized
    Renderer.resizeCanvas();

    // Start the timer counting up
    startElapsedTimer();

    // Start category-specific music
    Audio.startDrawingMusic(GameState.currentColor);

    // Draw initial state
    if (GameState.difficulty === 'easy') {
        Renderer.drawDots();
    }

    // Always update word spaces in both easy and hard modes
    WordHandler.updateWordSpaces();

    // Start animation with a short delay to ensure rendering is ready
    setTimeout(() => {
        if (GameState.CONFIG.ANIMATION_LINE_BY_LINE) {
            Animation.startPointToPointAnimation();
        } else {
            Animation.startDrawingAnimation();
        }
    }, 50);
}

// Start the elapsed timer
function startElapsedTimer() {
    // Clear any existing timer
    if (GameState.elapsedTimer) clearInterval(GameState.elapsedTimer);

    // Update timer every 10ms for hundredths of seconds precision
    GameState.elapsedTimer = setInterval(() => {
        if (!GameState.guessMode && GameState.timerActive) {
            GameState.elapsedTimeHundredths += 1;

            if (GameState.elapsedTimeHundredths >= 100) {
                GameState.elapsedTime += 1;
                GameState.elapsedTimeHundredths = 0;
            }

            // Format and display timer
            UI.updateTimerDisplay();
        }
    }, 10);

    return GameState.elapsedTimer;
}

// End the game and go back to menu - updated to handle music
function endGame(success) {
    // Use the WordHandler endGame function but ensure it exists
    if (typeof WordHandler.endGame === 'function') {
        WordHandler.endGame(success);
    } else {
        log("Warning: WordHandler.endGame not found");
        // Fallback implementation
        GameState.gameStarted = false;
        GameState.timerActive = false;

        // Stop all music
        Audio.stopAllMusic();

        // Update menu state if successful
        if (success && typeof updatePuzzleCompletion === 'function') {
            const time = GameState.elapsedTime + (GameState.elapsedTimeHundredths / 100);
            // Pass the guess attempts to the menu function
            updatePuzzleCompletion(GameState.currentColor, time, GameState.guessAttempts);
        }

        // Return to menu
        if (typeof showMainMenu === 'function') {
            showMainMenu();
        }
    }
}

// Export public functions
export {
    init,
    startGame,
    startGameWithData,
    startDrawing,
    startElapsedTimer,
    endGame
};
