// gameInterface.js - Game-specific UI elements and functionality

import GameState from '../state.js';
import * as WordHandler from '../wordHandler.js';
import * as Audio from '../audio.js';
import { log } from '../../game.js';

let hintButton;
let hintButtonTimeout;
let buttonTimer;
let guessTimer = null;

// Create hint button
function createHintButton() {
    // Check if already exists
    if (document.getElementById('hintButton')) {
        hintButton = document.getElementById('hintButton');
        return hintButton;
    }

    hintButton = document.createElement('button');
    hintButton.id = 'hintButton';
    hintButton.className = 'hint-button';
    hintButton.textContent = 'Hint';
    hintButton.style.display = 'block';
    hintButton.style.backgroundColor = '#4CAF50';
    hintButton.style.color = 'white';
    hintButton.style.padding = '10px 20px';
    hintButton.style.border = 'none';
    hintButton.style.borderRadius = '5px';
    hintButton.style.cursor = 'pointer';
    hintButton.style.margin = '10px';
    hintButton.disabled = true;

    // Add event listener
    hintButton.addEventListener('click', useHint);

    // Add to game controls
    const gameControlsDiv = document.querySelector('.game-controls');
    if (gameControlsDiv) {
        gameControlsDiv.appendChild(hintButton);
    }

    return hintButton;
}

// Update timer display
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (!timerDisplay) return;

    const minutes = Math.floor(GameState.elapsedTime / 60);
    const seconds = GameState.elapsedTime % 60;
    timerDisplay.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Start guess timer
function startGuessTimer() {
    if (guessTimer) {
        clearInterval(guessTimer);
    }

    GameState.elapsedTime = 0;
    updateTimerDisplay();

    guessTimer = setInterval(() => {
        GameState.elapsedTime++;
        updateTimerDisplay();
    }, 1000);
}

// Stop guess timer
function stopGuessTimer() {
    if (guessTimer) {
        clearInterval(guessTimer);
        guessTimer = null;
    }
}

// Show wrong message
function showWrongMessage() {
    const wrongMessage = document.getElementById('wrongMessage');
    if (wrongMessage) {
        wrongMessage.style.display = 'block';
        setTimeout(() => {
            wrongMessage.style.display = 'none';
        }, 2000);
    }
}

// Enable hint button
function enableHintButton() {
    if (!hintButton) return;

    hintButton.disabled = false;
    hintButton.style.opacity = "1";
    hintButton.style.cursor = "pointer";
    hintButton.textContent = 'Hint';
}

// Use hint
function useHint() {
    if (GameState.hintsRemaining <= 0) return;

    GameState.hintsRemaining--;
    Audio.playSound('hint');
    log(`Hint used. ${GameState.hintsRemaining} hints remaining.`);

    // Update hint button state
    const hintButton = document.getElementById('hintButton');
    if (hintButton) {
        hintButton.disabled = GameState.hintsRemaining <= 0;
    }

    // Find the first empty or incorrect letter space
    const letterSpaces = document.querySelectorAll('.letter-space');
    let hintIndex = -1;

    for (let i = 0; i < letterSpaces.length; i++) {
        const space = letterSpaces[i];
        if (!space.textContent || space.textContent !== GameState.currentWord[i]) {
            hintIndex = i;
            break;
        }
    }

    if (hintIndex === -1) return;

    // Fill in the letter
    const space = letterSpaces[hintIndex];
    space.textContent = GameState.currentWord[hintIndex];
    space.classList.add('correct');

    // Update word handler
    WordHandler.updateWordProgress();

    // Start hint cooldown
    startHintCooldown();
}

// Update hint button counter
function updateHintButtonCounter() {
    if (!hintButton) return;

    const timeLeft = Math.ceil(GameState.hintCooldown / 1000);
    hintButton.textContent = `Hint (${timeLeft}s)`;
}

// Start hint cooldown
function startHintCooldown() {
    if (hintButtonTimeout) {
        clearTimeout(hintButtonTimeout);
    }

    hintButton.disabled = true;
    hintButton.style.opacity = "0.5";
    hintButton.style.cursor = "not-allowed";

    const startTime = Date.now();
    const cooldownInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, GameState.hintCooldown - elapsed);

        if (remaining <= 0) {
            clearInterval(cooldownInterval);
            enableHintButton();
            return;
        }

        updateHintButtonCounter();
    }, 1000);
}

// Toggle hint button visibility
function toggleHintButton(show) {
    if (!hintButton) return;
    hintButton.style.display = show ? 'block' : 'none';
}

export {
    createHintButton,
    updateTimerDisplay,
    startGuessTimer,
    stopGuessTimer,
    showWrongMessage,
    enableHintButton,
    useHint,
    updateHintButtonCounter,
    startHintCooldown,
    toggleHintButton
}; 