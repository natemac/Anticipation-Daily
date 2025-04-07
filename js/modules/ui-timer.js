// ui-timer.js - Handles timer displays and countdown functionality

import GameState from './state.js';
import * as Audio from './audio.js';
import * as WordHandler from './wordHandler.js';
import * as UiHints from './ui-hints.js';
import { timerDisplay, beginButton, buttonTimer } from './ui-core.js';

// Update timer display (always keep black color)
export function updateTimerDisplay() {
    if (!timerDisplay) return;

    const seconds = String(GameState.elapsedTime).padStart(2, '0');
    const hundredths = String(GameState.elapsedTimeHundredths).padStart(2, '0');
    timerDisplay.textContent = `${seconds}:${hundredths}`;

    // Always keep timer color black
    timerDisplay.style.color = '#000';

    // Enable hint button after initial delay if in easy mode
    if (GameState.difficulty === 'easy' && GameState.elapsedTime >= GameState.CONFIG.HINT_COOLDOWN_TIME &&
        !GameState.hintButtonActive && !GameState.hintButtonCooldown &&
        !GameState.guessMode && GameState.gameStarted) {
        UiHints.enableHintButton();
    }

    // Update cooldown timer if it's running (only when not in guess mode)
    if (GameState.hintButtonCooldown && !GameState.guessMode && GameState.gameStarted) {
        UiHints.updateHintCooldown();
    }
}

// Start the guess timer with single color
export function startGuessTimer() {
    if (!buttonTimer || !beginButton) return;

    // Reset the guess timer
    GameState.guessTimeRemaining = GameState.CONFIG.GUESS_TIME_LIMIT;
    GameState.guessTimerActive = true;

    // Reset and show the timer overlay
    buttonTimer.style.width = '0%';
    buttonTimer.classList.add('active');

    // Always use grey for timer overlay
    buttonTimer.style.backgroundColor = '#cccccc';

    // Disable the button during guessing
    beginButton.disabled = true;
    beginButton.style.opacity = '0.7';
    beginButton.style.cursor = 'not-allowed';

    // Clear any existing timer
    if (GameState.guessTimer) clearInterval(GameState.guessTimer);

    // Start the timer
    GameState.guessTimer = setInterval(() => {
        const timeLimit = GameState.CONFIG.GUESS_TIME_LIMIT;
        GameState.guessTimeRemaining -= 0.1; // Decrease by 0.1s for smooth transition

        // Update the button timer width (grows from left to right)
        const percentage = ((timeLimit - GameState.guessTimeRemaining) / timeLimit) * 100;
        buttonTimer.style.width = `${percentage}%`;

        // If time runs out
        if (GameState.guessTimeRemaining <= 0) {
            clearInterval(GameState.guessTimer);
            GameState.guessTimerActive = false;

            // Hide the timer overlay and reset it
            buttonTimer.classList.remove('active');
            buttonTimer.style.width = '0%';

            // Re-enable the button
            beginButton.disabled = false;
            beginButton.style.opacity = '1';
            beginButton.style.cursor = 'pointer';

            // Store any correct letters before exiting guess mode
            if (typeof WordHandler.storeCorrectLetters === 'function') {
                WordHandler.storeCorrectLetters();
            }

            // Exit guess mode with timeout message
            import('./ui-modes.js').then(UiModes => {
                UiModes.exitGuessMode();
                UiModes.showWrongMessage("TIME'S UP!");
            });

            // Play incorrect sound
            Audio.playIncorrect();

            // Restore correct letters after a short delay
            setTimeout(() => {
                if (typeof WordHandler.restoreCorrectLetters === 'function') {
                    WordHandler.restoreCorrectLetters();
                    WordHandler.updateWordSpaces();
                }
            }, 300);
        }
    }, 100); // Update every 100ms for smooth animation
}

// Stop the guess timer
export function stopGuessTimer() {
    if (GameState.guessTimer) {
        clearInterval(GameState.guessTimer);
        GameState.guessTimerActive = false;
    }

    if (buttonTimer) {
        buttonTimer.classList.remove('active');
        buttonTimer.style.width = '0%';
    }

    // Re-enable the button
    if (beginButton) {
        beginButton.disabled = false;
        beginButton.style.opacity = '1';
        beginButton.style.cursor = 'pointer';
    }
}
