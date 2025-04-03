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
    hintButton.textContent = 'Hint (1)';
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
}

// Start the guess timer with single color
function startGuessTimer() {
    if (!buttonTimer || !beginButton) return;

    // Reset the guess timer
    GameState.guessTimeRemaining = GameLogic.CONFIG.GUESS_TIME_LIMIT;
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
        const timeLimit = GameLogic.CONFIG.GUESS_TIME_LIMIT;
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

            // Exit guess mode with timeout message
            exitGuessMode();
            showWrongMessage("TIME'S UP!");

            // Play incorrect sound
            Audio.playIncorrect();
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
    }, 800);
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

// Use hint feature
function useHint() {
    if (!GameState.gameStarted || GameState.hintsUsed >= GameState.hintsAvailable) return;

    // Get current word
    const currentWord = GameState.drawingData.name;

    // If we're in guess mode, provide the next letter
    if (GameState.guessMode) {
        const letterIndex = GameState.currentInput.length;

        // If we have room for more letters
        if (letterIndex < currentWord.length) {
            // If this position is a space, skip to next letter
            if (currentWord[letterIndex] === ' ') {
                GameState.currentInput += ' ';
                WordHandler.updateWordSpaces();
                return;
            }

            // Add the next correct letter
            const nextLetter = currentWord[letterIndex].toUpperCase();
            GameState.currentInput += nextLetter;
            WordHandler.updateWordSpaces();

            // Highlight this letter as a hint
            const letterElement = WordHandler.getLetterElement(letterIndex);
            if (letterElement) {
                Animation.highlightHintLetter(letterElement);
            }

            // Check if we've completed the word with this hint
            if (GameState.currentInput.length === currentWord.length) {
                log("Word completed with hint!");
                WordHandler.handleWordCompletion();
            }
        }
    } else {
        // If not in guess mode, enter guess mode and reveal first letter
        enterGuessMode();

        // Add the first letter as a hint
        if (currentWord[0] === ' ') {
            GameState.currentInput = ' ';
        } else {
            const firstLetter = currentWord[0].toUpperCase();
            GameState.currentInput = firstLetter;
        }

        WordHandler.updateWordSpaces();

        // Highlight this letter as a hint
        const letterElement = WordHandler.getLetterElement(0);
        if (letterElement) {
            Animation.highlightHintLetter(letterElement);
        }
    }

    // Update hint count and button state
    GameState.hintsUsed++;
    updateHintButton();

    // Play sound
    Audio.playSound('tick');
}

// Update hint button based on available hints
function updateHintButton() {
    if (!hintButton) return;

    hintButton.textContent = `Hint (${Math.max(0, GameState.hintsAvailable - GameState.hintsUsed)})`;

    // Disable if no hints remain
    if (GameState.hintsUsed >= GameState.hintsAvailable) {
        hintButton.disabled = true;
        hintButton.style.opacity = "0.5";
        hintButton.style.cursor = "not-allowed";
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

    // Pause animation and timer
    GameState.guessMode = true;

    // Cancel any ongoing animation but keep drawing progress
    if (GameState.animationId) {
        cancelAnimationFrame(GameState.animationId);
        GameState.animationId = null;
    }

    // Clear current input
    GameState.currentInput = '';
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
        if (GameLogic.CONFIG.ANIMATION_LINE_BY_LINE) {
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

    hintButton.style.display = show ? 'block' : 'none';
    updateHintButton();
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
    updateHintButton,
    showError
};
