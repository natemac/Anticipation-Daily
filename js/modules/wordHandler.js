// wordHandler.js - Handles word display, validation, and user input

import GameState from './state.js';
import * as Animation from './animation.js';
import * as Audio from './audio.js';
import * as UI from './ui.js';
import { log } from '../game.js';

// Module variables
let wordSpacesDiv;

// Initialize module
function init() {
    // Get the word spaces div
    wordSpacesDiv = document.getElementById('wordSpacesDiv');

    log("Word handler module initialized");

    return true;
}

// Update the word spaces display
function updateWordSpaces() {
    // Only update word spaces in easy mode
    if (GameState.difficulty !== 'easy' || !GameState.drawingData) return;

    if (!wordSpacesDiv) {
        wordSpacesDiv = document.getElementById('wordSpacesDiv');
        if (!wordSpacesDiv) return;
    }

    const answer = GameState.drawingData.name;

    // Clear existing content
    wordSpacesDiv.innerHTML = '';

    // Create a container for the letters
    const letterContainer = document.createElement('div');
    letterContainer.style.display = 'flex';
    letterContainer.style.justifyContent = 'center';
    letterContainer.style.alignItems = 'center';
    letterContainer.style.height = '100%';
    letterContainer.style.gap = '5px'; // Consistent spacing

    // Determine which letters to show - depends on game mode
    const lettersToShow = GameState.guessMode ?
                          GameState.currentInput :
                          GameState.correctLetters.join('');

    // Add word spaces with improved styling
    for (let i = 0; i < answer.length; i++) {
        const letterDiv = document.createElement('div');
        letterDiv.style.position = 'relative';
        letterDiv.style.width = '30px';
        letterDiv.style.height = '40px';
        letterDiv.style.margin = '0 2px';
        letterDiv.style.display = 'inline-flex'; // Use flex for better centering
        letterDiv.style.justifyContent = 'center';
        letterDiv.style.alignItems = 'center';
        letterDiv.style.fontFamily = 'Arial, sans-serif';
        letterDiv.style.transition = 'all 0.2s ease';

        if (answer[i] !== ' ') {
            // Add background for letters
            letterDiv.style.backgroundColor = '#f5f5f5';
            letterDiv.style.borderRadius = '4px';
            letterDiv.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';

            // Add underline
            const underline = document.createElement('div');
            underline.style.position = 'absolute';
            underline.style.bottom = '5px';
            underline.style.left = '2px';
            underline.style.width = 'calc(100% - 4px)';
            underline.style.height = '2px';
            underline.style.backgroundColor = '#333';
            underline.style.borderRadius = '1px';
            letterDiv.appendChild(underline);

            // Show letter if it's been entered correctly
            if (i < lettersToShow.length) {
                const letterSpan = document.createElement('span');
                letterSpan.style.fontSize = '24px';
                letterSpan.style.fontWeight = 'bold';
                letterSpan.style.color = '#333';
                letterSpan.textContent = lettersToShow[i];
                letterDiv.appendChild(letterSpan);

                // Add 3D effect for entered letters
                letterDiv.style.backgroundColor = '#e8f5e9';
                letterDiv.style.transform = 'translateY(-2px)';
                letterDiv.style.boxShadow = '0 3px 5px rgba(0,0,0,0.1)';
            }
        } else {
            // For spaces, add a visible gap with subtle styling
            letterDiv.style.width = '15px'; // Smaller width for spaces
            letterDiv.style.backgroundColor = 'transparent';
        }

        letterContainer.appendChild(letterDiv);
    }

    wordSpacesDiv.appendChild(letterContainer);

    // Add a cursor effect to indicate where the next letter will go
    if (GameState.guessMode && GameState.currentInput.length < answer.length) {
        const cursorIndex = GameState.currentInput.length;
        const letterDivs = letterContainer.children;

        if (cursorIndex < letterDivs.length) {
            const currentLetterDiv = letterDivs[cursorIndex];

            // Skip spaces
            if (answer[cursorIndex] === ' ') {
                GameState.currentInput += ' ';
                updateWordSpaces();
                return;
            }

            // Highlight the current letter div
            currentLetterDiv.style.backgroundColor = '#e3f2fd';
            currentLetterDiv.style.boxShadow = '0 0 8px rgba(33, 150, 243, 0.5)';

            // Add cursor element
            const cursor = document.createElement('div');
            cursor.style.position = 'absolute';
            cursor.style.bottom = '5px';
            cursor.style.left = '2px';
            cursor.style.width = 'calc(100% - 4px)';
            cursor.style.height = '2px';
            cursor.style.backgroundColor = '#2196F3';
            cursor.style.animation = 'blink 1s infinite';
            cursor.style.borderRadius = '1px';
            currentLetterDiv.appendChild(cursor);

            // Add blink animation if it doesn't exist
            if (!document.getElementById('cursor-blink-style')) {
                const style = document.createElement('style');
                style.id = 'cursor-blink-style';
                style.textContent = `
                    @keyframes blink {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
}

// Store correct letters when an incorrect guess is made
function storeCorrectLetters() {
    if (!GameState.guessMode) return;

    const answer = GameState.drawingData.name;

    // Check each letter entered so far
    GameState.correctLetters = [];

    for (let i = 0; i < GameState.currentInput.length; i++) {
        // For spaces, always mark as correct
        if (answer[i] === ' ') {
            GameState.correctLetters.push(' ');
            continue;
        }

        // For letters, check if correct
        if (GameState.currentInput[i].toUpperCase() === answer[i].toUpperCase()) {
            GameState.correctLetters.push(GameState.currentInput[i]);
        } else {
            // Stop at the first incorrect letter
            break;
        }
    }

    log("Stored correct letters: " + GameState.correctLetters.join(''));
}

// Get the correct letters array
function getCorrectLetters() {
    return GameState.correctLetters;
}

// Add a correct letter to the stored array (for hint button when not in guess mode)
function addCorrectLetter(letter) {
    if (!GameState.correctLetters) {
        GameState.correctLetters = [];
    }

    GameState.correctLetters.push(letter);
    log("Added correct letter: " + letter + ", total: " + GameState.correctLetters.join(''));
}

// Restore correct letters from previous attempts
function restoreCorrectLetters() {
    if (!GameState.correctLetters || GameState.correctLetters.length === 0) {
        GameState.currentInput = '';
        return;
    }

    // Restore the previously correct letters
    GameState.currentInput = GameState.correctLetters.join('');
    log("Restored correct letters: " + GameState.currentInput);
}

// Process letter input with validation
function processLetter(letter) {
    if (!GameState.guessMode) return;

    const currentWord = GameState.drawingData.name;
    const letterIndex = GameState.currentInput.length;

    // Only process if we still have space for more letters
    if (letterIndex < currentWord.length) {
        const newLetter = letter.toUpperCase();

        // Skip if the current position is a space
        if (currentWord[letterIndex] === ' ') {
            GameState.currentInput += ' ';
            updateWordSpaces();

            // Play tick sound
            Audio.playTick();

            // Continue with next letter
            processLetter(letter);
            return;
        }

        const correctLetter = currentWord[letterIndex].toUpperCase();

        // Check if this letter is correct at this position
        if (newLetter === correctLetter) {
            // Add the correct letter
            GameState.currentInput += newLetter;
            updateWordSpaces();

            // Play correct sound
            Audio.playTick();

            // Add satisfying visual feedback for correct letter
            Animation.pulseElement(getLetterElement(letterIndex), 'green');

            // If we've completed the word successfully
            if (GameState.currentInput.length === currentWord.length) {
                log("Word completed correctly!");
                handleWordCompletion();
            }
        } else {
            // Wrong letter - show feedback and exit guess mode
            log("Incorrect letter");

            // Increment guess count for tracking
            GameState.guessAttempts++;
            log("Guess attempts: " + GameState.guessAttempts);

            // Store correct letters before showing error
            storeCorrectLetters();

            // Play incorrect sound
            Audio.playIncorrect();

            // Show wrong message and animation
            UI.showWrongMessage(`WRONG! It's not "${GameState.currentInput + newLetter}..."`);

            // Reset input and exit guess mode
            setTimeout(() => {
                GameState.currentInput = '';
                UI.exitGuessMode();

                // Restore correct letters after exiting guess mode
                setTimeout(() => {
                    restoreCorrectLetters();
                    updateWordSpaces();
                }, 50);
            }, 800);
        }
    }
}

// Process full word validation
function processFullWord() {
    if (!GameState.guessMode) return;

    const currentWord = GameState.drawingData.name;
    const currentGuess = GameState.currentInput;

    // If the input is complete and matches exactly
    if (currentGuess.length === currentWord.length &&
        currentGuess.toUpperCase() === currentWord.toUpperCase()) {
        // Handle successful completion
        handleWordCompletion();
    } else {
        // Increment guess count
        GameState.guessAttempts++;
        log("Guess attempts: " + GameState.guessAttempts);

        // Store correct letters before showing error
        storeCorrectLetters();

        // Incorrect or incomplete word
        // Play incorrect sound
        Audio.playIncorrect();

        // Show incorrect feedback
        UI.showWrongMessage(`WRONG! Try again`);

        // Reset input but stay in guess mode
        setTimeout(() => {
            GameState.currentInput = '';
            restoreCorrectLetters();
            updateWordSpaces();
        }, 800);
    }
}

// Handle successful word completion
function handleWordCompletion() {
    // Stop the guess timer
    UI.stopGuessTimer();

    // Success feedback
    if (wordSpacesDiv) {
        wordSpacesDiv.style.boxShadow = '0 0 12px rgba(76, 175, 80, 0.8)';
        wordSpacesDiv.style.transform = 'scale(1.05)';
    }

    // Play completion sound
    Audio.playCompletion();

    // Start confetti animation
    Animation.startConfettiAnimation();

    // Delay game end to show celebration
    setTimeout(() => {
        endGame(true);
    }, 1500);
}

// Get a specific letter element from the word spaces
function getLetterElement(index) {
    if (!wordSpacesDiv) return null;

    const letterContainer = wordSpacesDiv.querySelector('div');
    if (!letterContainer) return null;

    const letterDivs = letterContainer.children;
    if (!letterDivs || index >= letterDivs.length) return null;

    const letterDiv = letterDivs[index];
    return letterDiv.querySelector('span');
}

// End the game and update status
function endGame(success) {
    // Update menu state if successful
    if (success) {
        const time = GameState.elapsedTime + (GameState.elapsedTimeHundredths / 100);

        // Determine if completed on hard mode
        const isHardMode = GameState.difficulty === 'hard';

        // Determine if completed early (before drawing was fully revealed)
        const totalSequenceLength = GameState.drawingData.sequence.length;
        const isEarlyCompletion = GameState.drawingProgress < totalSequenceLength;

        // FIXED: Increment the guess counter when entering guess mode for the first time
        // This counts the current successful attempt as 1 (or higher if there were previous attempts)
        GameState.guessAttempts++;

        log("Final guess count: " + GameState.guessAttempts);

        // Pass parameters to updatePuzzleCompletion
        if (typeof updatePuzzleCompletion === 'function') {
            updatePuzzleCompletion(
                GameState.currentColor,
                time,
                GameState.guessAttempts,
                isHardMode,
                isEarlyCompletion
            );
        }
    }

    // Reset game state
    GameState.gameStarted = false;
    GameState.timerActive = false;
    GameState.correctLetters = []; // Clear stored correct letters

    // Stop timers and animations
    UI.stopGuessTimer();
    if (GameState.elapsedTimer) clearInterval(GameState.elapsedTimer);
    if (GameState.animationId) cancelAnimationFrame(GameState.animationId);

    // Hide UI elements
    UI.toggleHintButton(false);

    // Return to menu after delay
    setTimeout(() => {
        if (typeof showMainMenu === 'function') {
            showMainMenu();
        }
    }, success ? 2000 : 500);
}

// Export public functions
export {
    init,
    updateWordSpaces,
    processLetter,
    processFullWord,
    handleWordCompletion,
    getLetterElement,
    endGame,
    storeCorrectLetters,
    restoreCorrectLetters,
    getCorrectLetters,
    addCorrectLetter
};
