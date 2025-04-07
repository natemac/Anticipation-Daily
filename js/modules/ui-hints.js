// ui-hints.js - Handles the hint system functionality

import GameState from './state.js';
import * as Animation from './animation.js';
import * as Audio from './audio.js';
import * as WordHandler from './wordHandler.js';
import { log } from '../game.js';

// Import from ui-controls module to access hintButton
import { hintButton } from './ui-controls.js';
import { showWrongMessage } from './ui-modes.js';

// Enable hint button
export function enableHintButton() {
    if (!hintButton || GameState.difficulty !== 'easy') return;

    // Only enable if we have hints available or unlimited hints
    if (!GameState.hasHintsAvailable()) {
        return;
    }

    hintButton.disabled = false;
    hintButton.style.opacity = "1";
    hintButton.style.cursor = "pointer";
    GameState.hintButtonActive = true;
    GameState.hintButtonCooldown = false;

    // Add pulse animation to draw attention
    hintButton.style.animation = 'pulse 0.5s';
    setTimeout(() => {
        hintButton.style.animation = '';
    }, 500);
}

// Use hint feature
export function useHint() {
    if (!GameState.gameStarted || !GameState.hintButtonActive || GameState.difficulty !== 'easy') return;

    // Check if hints are available
    if (!GameState.hasHintsAvailable()) {
        // No more hints available
        showWrongMessage("No hints left!");
        return;
    }

    // Get current word
    const currentWord = GameState.drawingData.name;

    // Start cooldown period
    startHintCooldown();

    // Get the next missing letter index
    let nextMissingIndex = -1;
    if (GameState.guessMode) {
        // If in guess mode, use current input length as the next index
        nextMissingIndex = GameState.currentInput.length;
    } else {
        // If not in guess mode, find the next empty spot
        const storedLetters = WordHandler.getCorrectLetters() || [];
        nextMissingIndex = storedLetters.length;
    }

    // Make sure we're within the word bounds
    if (nextMissingIndex >= 0 && nextMissingIndex < currentWord.length) {
        // If this position is a space, skip to next letter
        if (currentWord[nextMissingIndex] === ' ') {
            // Add the space to current input or correct letters
            if (GameState.guessMode) {
                GameState.currentInput += ' ';
                WordHandler.updateWordSpaces();
            } else {
                // If not in guess mode, add to correct letters
                WordHandler.addCorrectLetter(' ');
                WordHandler.updateWordSpaces();
            }

            // Try again to find next non-space letter
            useHint();
            return;
        }

        // Add the next correct letter
        const nextLetter = currentWord[nextMissingIndex].toUpperCase();

        if (GameState.guessMode) {
            // Add to current input if in guess mode
            GameState.currentInput += nextLetter;
            WordHandler.updateWordSpaces();

            // Highlight this letter as a hint
            const letterElement = WordHandler.getLetterElement(nextMissingIndex);
            if (letterElement) {
                Animation.highlightHintLetter(letterElement);
            }

            // Check if we've completed the word with this hint
            if (GameState.currentInput.length === currentWord.length) {
                log("Word completed with hint!");
                WordHandler.handleWordCompletion();
            }
        } else {
            // Add to correct letters if not in guess mode
            WordHandler.addCorrectLetter(nextLetter);
            WordHandler.updateWordSpaces();

            // Highlight this letter
            const letterElement = WordHandler.getLetterElement(nextMissingIndex);
            if (letterElement) {
                Animation.highlightHintLetter(letterElement);
            }
        }
    }

    // Update hint count (only matters for limited hints)
    GameState.hintsUsed++;

    // Update hint button text if using limited hints
    if (GameState.CONFIG.HINTS_AVAILABLE > 0) {
        updateHintButtonCounter();
    }

    // Play sound
    Audio.playSound('tick');
}

// Update hint button counter text
export function updateHintButtonCounter() {
    if (!hintButton) return;

    // Only show counter if hints are limited
    if (GameState.CONFIG.HINTS_AVAILABLE > 0) {
        const hintsLeft = Math.max(0, GameState.CONFIG.HINTS_AVAILABLE - GameState.hintsUsed);
        // Don't change text if in cooldown
        if (!GameState.hintButtonCooldown) {
            hintButton.textContent = hintsLeft > 0 ? `Hint? (${hintsLeft})` : 'No hints left';
        }

        // Disable if no hints left
        if (hintsLeft <= 0) {
            hintButton.disabled = true;
            hintButton.style.opacity = "0.5";
            hintButton.style.cursor = "not-allowed";
        }
    } else {
        // Don't show counter for unlimited hints
        if (!GameState.hintButtonCooldown) {
            hintButton.textContent = 'Hint?';
        }
    }
}

// Start hint button cooldown
export function startHintCooldown() {
    // Disable the hint button
    if (!hintButton) return;

    hintButton.disabled = true;
    hintButton.style.opacity = "0.5";
    hintButton.style.cursor = "not-allowed";

    // Add cooldown timer text
    hintButton.textContent = `Wait ${GameState.CONFIG.HINT_COOLDOWN_TIME}s`;

    // Set cooldown state
    GameState.hintButtonActive = false;
    GameState.hintButtonCooldown = true;
    GameState.hintCooldownRemaining = GameState.CONFIG.HINT_COOLDOWN_TIME;

    // Note: We don't start a timer here - the cooldown is updated in updateTimerDisplay
    // which only runs when the main timer is active (not during guessing)
}

// Update hint cooldown - called from updateTimerDisplay
export function updateHintCooldown() {
    if (!GameState.hintButtonCooldown || !hintButton) return;

    // Only decrement timer when game is active and not in guess mode
    if (GameState.gameStarted && !GameState.guessMode) {
        // Decrease remaining time (adjust based on how often updateTimerDisplay is called)
        GameState.hintCooldownRemaining -= 0.01; // 10ms if updateTimerDisplay is called every 10ms

        if (GameState.hintCooldownRemaining <= 0) {
            // Cooldown finished
            GameState.hintButtonCooldown = false;

            // Update button text based on hint availability
            if (GameState.CONFIG.HINTS_AVAILABLE > 0) {
                // Limited hints - show counter
                const hintsLeft = Math.max(0, GameState.CONFIG.HINTS_AVAILABLE - GameState.hintsUsed);
                hintButton.textContent = hintsLeft > 0 ? `Hint? (${hintsLeft})` : 'No hints left';

                // Only re-enable if we have hints left
                if (hintsLeft > 0 && GameState.difficulty === 'easy' && GameState.gameStarted) {
                    enableHintButton();
                }
