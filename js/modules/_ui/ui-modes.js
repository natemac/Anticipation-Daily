// ui-modes.js - Handles game mode transitions and related UI updates

import GameState from './state.js';
import * as Animation from './animation.js';
import * as Audio from './audio.js';
import * as WordHandler from './wordHandler.js';
import * as Input from './input.js';
import { log } from '../game.js';
import { beginButton, wordSpacesDiv, wrongMessage } from './ui-core.js';
import { startGuessTimer, stopGuessTimer } from './ui-timer.js';

// Enter guess mode - updated to handle keyboard display
export function enterGuessMode() {
    log("Entering guess mode");

    // If already in guess mode, reset the timer instead of toggling
    if (GameState.guessMode) {
        startGuessTimer();
        return;
    }

    // Store correct letters before entering guess mode
    if (typeof WordHandler.storeCorrectLetters === 'function') {
        WordHandler.storeCorrectLetters();
    }

    // Pause animation and timer
    GameState.guessMode = true;

    // Start guessing music
    Audio.updateMusicForGameMode(true);

    // IMPORTANT - Initialize guessAttempts to track guess attempts properly
    // We don't increment here, as the final successful attempt will be counted in endGame
    if (GameState.guessAttempts === 0) {
        GameState.guessAttempts = 0; // Start counting at 0, will increment on first guess
    }

    // Cancel any ongoing animation but keep drawing progress
    if (GameState.animationId) {
        cancelAnimationFrame(GameState.animationId);
        GameState.animationId = null;
    }

    // Restore any previously correct letters
    if (typeof WordHandler.restoreCorrectLetters === 'function') {
        WordHandler.restoreCorrectLetters();
    }

    if (wordSpacesDiv) {
        wordSpacesDiv.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.6)';
    }

    // Update the word spaces to show empty slots
    WordHandler.updateWordSpaces();

    // Make word spaces clickable
    makeWordSpacesInteractive();

    // Add pulse animation to the word spaces div to draw attention
    if (wordSpacesDiv) {
        wordSpacesDiv.style.animation = 'pulse-attention 1s';
        setTimeout(() => {
            wordSpacesDiv.style.animation = '';
        }, 1000);
    }

    // Add the animation if it doesn't exist
    if (!document.getElementById('pulse-attention-style')) {
        const style = document.createElement('style');
        style.id = 'pulse-attention-style';
        style.textContent = `
            @keyframes pulse-attention {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    // Start the guess timer
    startGuessTimer();

    // Always keep button text as "Guess"
    if (beginButton && beginButton.querySelector('span')) {
        beginButton.querySelector('span').textContent = 'Guess';
    }

    // Adjust layout for keyboard
    Input.updateKeyboardLayout(true);

    // Show virtual keyboard on mobile and adjust layout
    if (typeof Input.showKeyboard === 'function') {
        Input.showKeyboard();

        // Force focus on input field with a slight delay to ensure keyboard appears
        setTimeout(() => {
            const guessInput = document.getElementById('guessInput');
            if (guessInput) {
                guessInput.style.display = 'block';
                guessInput.focus();
                console.log("Forcing focus on guess input");
            }
        }, 300);
    }

    // Also make sure clicking on word spaces activates keyboard
    setTimeout(() => {
        if (wordSpacesDiv) {
            // Trigger a click on the word spaces div to focus the input
            wordSpacesDiv.click();
        }
    }, 500);
}

// Exit guess mode - updated to handle keyboard handling
export function exitGuessMode() {
    log("Exiting guess mode");

    // Resume animation and timer
    GameState.guessMode = false;

    // Switch back to drawing music
    Audio.updateMusicForGameMode(false);

    // Stop the guess timer
    stopGuessTimer();

    // Reset word spaces appearance
    if (wordSpacesDiv) {
        wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }

    // Always keep button text as "Guess"
    if (beginButton && beginButton.querySelector('span')) {
        beginButton.querySelector('span').textContent = 'Guess';
    }

    // Restart animation if needed, continuing from where it left off
    if (GameState.pendingAnimationStart) {
        if (GameState.CONFIG.ANIMATION_LINE_BY_LINE) {
            Animation.startPointToPointAnimation();
        } else {
            Animation.startDrawingAnimation();
        }
    }

    // Hide virtual keyboard on mobile and restore layout
    if (typeof Input.hideKeyboard === 'function') {
        Input.hideKeyboard();
    }

    // Also reset layout directly
    Input.updateKeyboardLayout(false);
}

// Show wrong message with animation
export function showWrongMessage(message) {
    if (!wrongMessage) return;

    wrongMessage.textContent = message || "WRONG!";
    wrongMessage.classList.add('visible');

    if (document.querySelector('.canvas-container canvas')) {
        document.querySelector('.canvas-container canvas').classList.add('incorrect');
    }

    if (wordSpacesDiv) {
        wordSpacesDiv.style.boxShadow = '0 0 12px rgba(244, 67, 54, 0.8)';
        wordSpacesDiv.style.transform = 'scale(0.95)';
    }

    setTimeout(() => {
        wrongMessage.classList.remove('visible');

        if (document.querySelector('.canvas-container canvas')) {
            document.querySelector('.canvas-container canvas').classList.remove('incorrect');
        }

        if (wordSpacesDiv) {
            wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
            wordSpacesDiv.style.transform = 'scale(1)';
        }
    }, GameState.CONFIG.WRONG_MESSAGE_DURATION);
}

// Make the word spaces area interactive (clickable)
export function makeWordSpacesInteractive() {
    if (!wordSpacesDiv) return;

    // Add cursor style
    wordSpacesDiv.style.cursor = 'text';

    // Remove existing click listener if any
    wordSpacesDiv.removeEventListener('click', handleWordSpacesClick);

    // Add click event to focus input
    wordSpacesDiv.addEventListener('click', handleWordSpacesClick);
}

// Handle click on word spaces
export function handleWordSpacesClick() {
    if (!GameState.guessMode) return;

    // Focus the guess input to bring up keyboard
    const guessInput = document.getElementById('guessInput');
    if (guessInput) {
        guessInput.focus();
    }
}
