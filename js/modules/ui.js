// ui.js - Handles UI elements and their interactions

import GameState from './state.js';
import * as Animation from './animation.js';
import * as Audio from './audio.js';
import * as WordHandler from './wordHandler.js';
import * as GameLogic from './gameLogic.js';
import { log } from '../game.js';

// Module variables
let timerDisplay, beginButton, wrongMessage, backButton, buttonTimer;
let wordSpacesDiv, hintButton;
let hintButtonTimeout;

// Initialize UI module
function init() {
    // Get DOM elements
    timerDisplay = document.getElementById('timerDisplay');
    beginButton = document.getElementById('beginButton');
    wrongMessage = document.getElementById('wrongMessage');
    backButton = document.getElementById('backButton');
    buttonTimer = document.getElementById('buttonTimer');

    // Set up back button event listener
    if (backButton) {
        backButton.addEventListener('click', handleBackButton);
    }

    // Create UI elements
    createWordSpacesDiv();
    createHintButton();

    // Add audio toggle to settings
    addAudioToggle();

    log("UI module initialized");

    return {
        timerDisplay,
        beginButton,
        wrongMessage,
        backButton,
        buttonTimer,
        wordSpacesDiv,
        hintButton
    };
}

// Handle back button clicks
function handleBackButton() {
    log("Back button clicked");
    if (GameState.gameStarted) {
        GameLogic.endGame(false);
    }
}

// Create the word spaces div
function createWordSpacesDiv() {
    // Check if already exists
    if (document.getElementById('wordSpacesDiv')) {
        wordSpacesDiv = document.getElementById('wordSpacesDiv');
        return wordSpacesDiv;
    }

    // Create the div for word spaces
    wordSpacesDiv = document.createElement('div');
    wordSpacesDiv.id = 'wordSpacesDiv';
    wordSpacesDiv.style.width = '100%';
    wordSpacesDiv.style.height = '60px';
    wordSpacesDiv.style.margin = '10px 0';
    wordSpacesDiv.style.textAlign = 'center';
    wordSpacesDiv.style.position = 'relative';
    wordSpacesDiv.style.backgroundColor = 'white';
    wordSpacesDiv.style.borderRadius = '8px';
    wordSpacesDiv.style.padding = '10px';
    wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    wordSpacesDiv.style.transition = 'box-shadow 0.3s ease, transform 0.2s ease';

    // Find the game controls div to insert before it
    const gameControlsDiv = document.querySelector('.game-controls');

    if (gameControlsDiv && gameControlsDiv.parentElement) {
        // Insert it before the game controls
        gameControlsDiv.parentElement.insertBefore(wordSpacesDiv, gameControlsDiv);
    } else {
        // Fallback: insert after canvas container
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer && canvasContainer.parentElement) {
            canvasContainer.parentElement.insertBefore(wordSpacesDiv, canvasContainer.nextSibling);
        }
    }

    return wordSpacesDiv;
}

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
    hintButton.textContent = 'Hint?';
    hintButton.style.display = 'none';
    hintButton.style.backgroundColor = '#FFC107';
    hintButton.style.color = '#333';
    hintButton.style.border = 'none';
    hintButton.style.borderRadius = '8px';
    hintButton.style.padding = '8px 15px';
    hintButton.style.margin = '10px 0';
    hintButton.style.fontWeight = 'bold';
    hintButton.style.cursor = 'pointer';
    hintButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    hintButton.style.transition = 'background-color 0.3s, transform 0.2s';

    // Initially disable the hint button (will enable after cooldown period)
    hintButton.disabled = true;
    hintButton.style.opacity = "0.5";
    hintButton.style.cursor = "not-allowed";

    // Add event listener
    hintButton.addEventListener('click', useHint);

    // Add to game controls
    const gameControlsDiv = document.querySelector('.game-controls');
    if (gameControlsDiv) {
        gameControlsDiv.appendChild(hintButton);
    }

    return hintButton;
}

// Add audio toggle to settings
function addAudioToggle() {
    // Find appropriate place to add toggle
    const difficultyContainer = document.querySelector('.difficulty-container');
    if (!difficultyContainer) return;

    // Check if already exists
    if (document.querySelector('.audio-container')) return;

    // Create audio toggle container
    const audioContainer = document.createElement('div');
    audioContainer.className = 'audio-container';
    audioContainer.style.display = 'flex';
    audioContainer.style.flexDirection = 'column';
    audioContainer.style.alignItems = 'center';
    audioContainer.style.margin = '10px 0';

    // Create title
    const audioTitle = document.createElement('div');
    audioTitle.className = 'audio-title';
    audioTitle.textContent = 'Sound Effects';
    audioTitle.style.marginBottom = '8px';
    audioTitle.style.fontSize = '18px';
    audioTitle.style.fontWeight = 'bold';

    // Create toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.gap = '10px';

    // Create labels and toggle
    const offLabel = document.createElement('span');
    offLabel.id = 'offLabel';
    offLabel.className = 'difficulty-label';
    offLabel.textContent = 'Off';

    const onLabel = document.createElement('span');
    onLabel.id = 'onLabel';
    onLabel.className = 'difficulty-label';
    onLabel.textContent = 'On';

    // Create toggle switch
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'toggle-switch';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'audioToggle';

    // Set initial state from localStorage
    toggleInput.checked = GameState.audioEnabled;

    const slider = document.createElement('span');
    slider.className = 'slider';

    // Assemble toggle
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(slider);

    // Assemble toggle container
    toggleContainer.appendChild(offLabel);
    toggleContainer.appendChild(toggleSwitch);
    toggleContainer.appendChild(onLabel);

    // Assemble audio container
    audioContainer.appendChild(audioTitle);
    audioContainer.appendChild(toggleContainer);

    // Add to page after difficulty container
    difficultyContainer.parentNode.insertBefore(audioContainer, difficultyContainer.nextSibling);

    // Add click handlers for labels
    offLabel.addEventListener('click', function() {
        toggleInput.checked = false;
        toggleInput.dispatchEvent(new Event('change'));
    });

    onLabel.addEventListener('click', function() {
        toggleInput.checked = true;
        toggleInput.dispatchEvent(new Event('change'));
    });

    // Initial update of label styling
    updateAudioToggleUI(toggleInput.checked);

    // Add change handler to update UI
    toggleInput.addEventListener('change', function() {
        const enabled = this.checked;
        updateAudioToggleUI(enabled);
        Audio.updateAudioState(enabled);
        GameState.toggleAudio(enabled);
    });
}

// Update audio toggle UI
function updateAudioToggleUI(isOn) {
    const offLabel = document.getElementById('offLabel');
    const onLabel = document.getElementById('onLabel');

    if (!offLabel || !onLabel) return;

    if (isOn) {
        offLabel.style.opacity = '0.5';
        offLabel.style.fontWeight = 'normal';
        onLabel.style.opacity = '1';
        onLabel.style.fontWeight = 'bold';
    } else {
        onLabel.style.opacity = '0.5';
        onLabel.style.fontWeight = 'normal';
        offLabel.style.opacity = '1';
        offLabel.style.fontWeight = 'bold';
    }
}

// Update timer display (always keep black color)
function updateTimerDisplay() {
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
        enableHintButton();
    }

    // Update cooldown timer if it's running (only when not in guess mode)
    if (GameState.hintButtonCooldown && !GameState.guessMode && GameState.gameStarted) {
        updateHintCooldown();
    }
}

// Start the guess timer with single color
function startGuessTimer() {
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
            exitGuessMode();
            showWrongMessage("TIME'S UP!");

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
function stopGuessTimer() {
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

// Show wrong message with animation
function showWrongMessage(message) {
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

// Hide all messages
function hideMessages() {
    if (wrongMessage) {
        wrongMessage.classList.remove('visible');
    }

    const canvas = document.querySelector('.canvas-container canvas');
    if (canvas) {
        canvas.classList.remove('incorrect');
    }
}

// Enable hint button
function enableHintButton() {
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
function useHint() {
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
function updateHintButtonCounter() {
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
function startHintCooldown() {
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
function updateHintCooldown() {
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
            } else {
                // Unlimited hints
                hintButton.textContent = "Hint?";

                // Always re-enable in easy mode
                if (GameState.difficulty === 'easy' && GameState.gameStarted) {
                    enableHintButton();
                }
            }
        } else {
            // Update cooldown text
            const seconds = Math.ceil(GameState.hintCooldownRemaining);
            hintButton.textContent = `Wait ${seconds}s`;
        }
    }
}

// Enter guess mode
function enterGuessMode() {
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

    // Show virtual keyboard on mobile
    updateVirtualKeyboard(true);
}

// Exit guess mode
function exitGuessMode() {
    log("Exiting guess mode");

    // Resume animation and timer
    GameState.guessMode = false;

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

    // Hide virtual keyboard on mobile
    updateVirtualKeyboard(false);
}

// Update mobile virtual keyboard visibility
function updateVirtualKeyboard(show) {
    const event = new CustomEvent('guessmode-changed', {
        detail: {
            active: show
        }
    });
    document.dispatchEvent(event);
}

// Reposition UI elements after resize
function repositionElements() {
    // Nothing to reposition yet
}

// Show/hide hint button
function toggleHintButton(show) {
    if (!hintButton) return;

    // Only show hint button in easy mode
    if (GameState.difficulty !== 'easy') {
        hintButton.style.display = 'none';
        return;
    }

    // Update display based on show parameter
    hintButton.style.display = show ? 'block' : 'none';

    // Reset hint button state
    if (show) {
        // Update text based on limited vs unlimited hints
        if (GameState.CONFIG.HINTS_AVAILABLE > 0) {
            hintButton.textContent = `Hint? (${GameState.CONFIG.HINTS_AVAILABLE})`;
        } else {
            hintButton.textContent = 'Hint?';
        }

        hintButton.disabled = true;
        hintButton.style.opacity = "0.5";
        hintButton.style.cursor = "not-allowed";

        // Start with inactive state but not in cooldown
        GameState.hintButtonActive = false;
        GameState.hintButtonCooldown = false;
        GameState.hintCooldownRemaining = 0;

        // Enable after initial delay if in easy mode
        if (GameState.difficulty === 'easy' &&
            GameState.elapsedTime >= GameState.CONFIG.HINT_COOLDOWN_TIME) {
            enableHintButton();
        }
    }
}

// Show error message to user
function showError(message) {
    // Use the wrong message element for errors too
    const wrongMessage = document.getElementById('wrongMessage');
    if (wrongMessage) {
        wrongMessage.textContent = message;
        wrongMessage.classList.add('visible');
        wrongMessage.style.backgroundColor = 'rgba(244, 67, 54, 0.9)';
        wrongMessage.style.padding = '10px';
        wrongMessage.style.borderRadius = '4px';

        // Keep error visible longer
        setTimeout(() => {
            wrongMessage.classList.remove('visible');
        }, 5000);
    } else {
        // Fallback to alert if element not found
        alert(message);
    }
}

// Export public functions
export {
    init,
    updateTimerDisplay,
    startGuessTimer,
    stopGuessTimer,
    showWrongMessage,
    hideMessages,
    enterGuessMode,
    exitGuessMode,
    updateVirtualKeyboard,
    repositionElements,
    toggleHintButton,
    enableHintButton,
    startHintCooldown,
    showError,
    updateHintButtonCounter
};
