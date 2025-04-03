// menu.js - Main menu and game initialization functionality
// Updated to work with the modular architecture

// Import modules
import GameState from './modules/state.js';
import * as GameLogic from './modules/gameLogic.js';
import * as UI from './modules/ui.js';
import * as Audio from './modules/audio.js';

// Menu state object
const menuState = {
    completedCategories: 0,
    puzzles: {
        yellow: { completed: false, guesses: 0, time: 0 },
        green: { completed: false, guesses: 0, time: 0 },
        blue: { completed: false, guesses: 0, time: 0 },
        red: { completed: false, guesses: 0, time: 0 }
    }
};

// DOM elements
let mainScreen, gameScreen, colorSquares, difficultyToggle, audioToggle, shareButton;

// Simple logging function for debugging
function log(message) {
    console.log(`[AnticipationMenu] ${message}`);
}

// Initialize the menu
function initMenu() {
    log("Initializing menu...");

    // Get DOM elements
    mainScreen = document.querySelector('.main-screen');
    gameScreen = document.querySelector('.game-screen');
    colorSquares = document.querySelectorAll('.color-square');
    difficultyToggle = document.getElementById('difficultyToggle');
    audioToggle = document.getElementById('audioToggle');
    shareButton = document.getElementById('shareButton');

    // Set up event listeners
    setupMenuEventListeners();

    // Initialize toggles
    initToggles();

    log("Menu initialized");
}

// Set up event listeners for menu elements
function setupMenuEventListeners() {
    // Difficulty toggle
    difficultyToggle.addEventListener('change', () => {
        const difficulty = difficultyToggle.checked ? 'hard' : 'easy';
        updateDifficultyUI(difficultyToggle.checked);

        // Store preference
        localStorage.setItem('difficultyMode', difficulty);

        // Update game state
        if (GameState) {
            GameState.setDifficulty(difficulty);
        }
    });

    // Audio toggle
    audioToggle.addEventListener('change', function() {
        const enabled = this.checked;
        updateAudioToggleUI(enabled);
        if (Audio && typeof Audio.updateAudioState === 'function') {
            Audio.updateAudioState(enabled);
        }
        if (GameState) {
            GameState.toggleAudio(enabled);
        }
    });

    // Color squares click events
    colorSquares.forEach(square => {
        square.addEventListener('click', () => {
            const color = square.dataset.color;
            const category = square.dataset.category;

            // Don't allow replaying completed puzzles
            if (menuState.puzzles[color].completed) return;

            // Start game using GameLogic module
            if (typeof GameLogic.startGame === 'function') {
                GameLogic.startGame(color, category);
            } else {
                console.error("Game module not loaded");
            }
        });
    });

    // Share button
    shareButton.addEventListener('click', () => {
        shareResults();
    });

    // Direct click handlers for labels (better mobile experience)
    document.getElementById('easyLabel').addEventListener('click', function() {
        difficultyToggle.checked = false;
        difficultyToggle.dispatchEvent(new Event('change'));
    });

    document.getElementById('hardLabel').addEventListener('click', function() {
        difficultyToggle.checked = true;
        difficultyToggle.dispatchEvent(new Event('change'));
    });

    document.getElementById('offLabel').addEventListener('click', function() {
        audioToggle.checked = false;
        audioToggle.dispatchEvent(new Event('change'));
    });

    document.getElementById('onLabel').addEventListener('click', function() {
        audioToggle.checked = true;
        audioToggle.dispatchEvent(new Event('change'));
    });
}

// Initialize toggle states
function initToggles() {
    // Set initial difficulty state based on stored preference
    const storedDifficulty = localStorage.getItem('difficultyMode');
    difficultyToggle.checked = storedDifficulty === 'hard';
    updateDifficultyUI(difficultyToggle.checked);

    // Set initial audio state
    const storedAudio = localStorage.getItem('audioEnabled');
    audioToggle.checked = storedAudio !== 'false';
    updateAudioToggleUI(audioToggle.checked);
}

// Update difficulty UI
function updateDifficultyUI(isHard) {
    const easyLabel = document.getElementById('easyLabel');
    const hardLabel = document.getElementById('hardLabel');
    const slider = difficultyToggle.nextElementSibling;

    if (isHard) {
        // Hard mode selected
        easyLabel.style.opacity = '0.5';
        easyLabel.style.fontWeight = 'normal';
        hardLabel.style.opacity = '1';
        hardLabel.style.fontWeight = 'bold';
        // Force the slider to update its position
        slider.classList.add('slider-active');
    } else {
        // Easy mode selected
        hardLabel.style.opacity = '0.5';
        hardLabel.style.fontWeight = 'normal';
        easyLabel.style.opacity = '1';
        easyLabel.style.fontWeight = 'bold';
        // Reset slider position
        slider.classList.remove('slider-active');
    }
}

// Update audio toggle UI
function updateAudioToggleUI(isOn) {
    const offLabel = document.getElementById('offLabel');
    const onLabel = document.getElementById('onLabel');
    const slider = audioToggle.nextElementSibling;

    if (isOn) {
        offLabel.style.opacity = '0.5';
        offLabel.style.fontWeight = 'normal';
        onLabel.style.opacity = '1';
        onLabel.style.fontWeight = 'bold';
        slider.classList.add('slider-active');
    } else {
        onLabel.style.opacity = '0.5';
        onLabel.style.fontWeight = 'normal';
        offLabel.style.opacity = '1';
        offLabel.style.fontWeight = 'bold';
        slider.classList.remove('slider-active');
    }
}

// Update the menu state when a game is completed
function updatePuzzleCompletion(color, time, guesses = 0) {
    // Fix: Update the guesses count from the parameter
    menuState.puzzles[color].completed = true;
    menuState.puzzles[color].time = time;
    menuState.puzzles[color].guesses = guesses;
    menuState.completedCategories++;

    // Update result overlay with enhanced styling
    const resultOverlay = document.getElementById(`${color}-result`);

    // Add CSS for the stamp effect if not already added
    addCompletionStyles();

    // Update the result overlay with better styling
    resultOverlay.innerHTML = `
        <div class="completion-stamp">
            <div class="stamp-text">COMPLETED</div>
        </div>
        <div class="completion-stats">
            <p class="stat-line">Time: ${time.toFixed(2)}s</p>
            <p class="stat-line">Guesses: ${guesses}</p>
        </div>
    `;

    resultOverlay.classList.add('visible');

    // Show share button if all categories completed
    if (menuState.completedCategories === 4) {
        shareButton.style.display = 'block';
    }
}

// Add styles for the completion stamp and stats
function addCompletionStyles() {
    if (!document.getElementById('completion-styles')) {
        const styleElem = document.createElement('style');
        styleElem.id = 'completion-styles';
        styleElem.innerHTML = `
            .completion-stamp {
                font-family: 'Impact', sans-serif;
                font-size: 38px;
                color: #ff0000;
                transform: rotate(-15deg);
                border: 5px solid #ff0000;
                padding: 8px 12px;
                border-radius: 10px;
                opacity: 0.9;
                text-shadow: 2px 2px 0 rgba(0,0,0,0.3);
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                animation: stampBounce 0.5s ease-out;
                background-color: rgba(255,255,255,0.9);
                margin-bottom: 15px;
            }

            .stamp-text {
                letter-spacing: 2px;
            }

            .completion-stats {
                font-weight: bold;
                font-size: 18px;
                color: white;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
                background-color: rgba(0,0,0,0.5);
                padding: 8px 15px;
                border-radius: 10px;
            }

            .stat-line {
                margin: 5px 0;
            }

            @keyframes stampBounce {
                0% { transform: scale(2) rotate(-15deg); opacity: 0; }
                70% { transform: scale(1.2) rotate(-15deg); opacity: 1; }
                100% { transform: scale(1) rotate(-15deg); opacity: 0.9; }
            }
        `;
        document.head.appendChild(styleElem);
    }
}

// Share results functionality
function shareResults() {
    let shareText = "Daily Anticipation Results:\n";

    for (const color of ['yellow', 'green', 'blue', 'red']) {
        const puzzle = menuState.puzzles[color];
        const category = document.querySelector(`.color-square[data-color="${color}"]`).dataset.category;

        if (puzzle.completed) {
            shareText += `${category}: ✓ (${puzzle.time.toFixed(2)}s, ${puzzle.guesses} guesses)\n`;
        } else {
            shareText += `${category}: ✗\n`;
        }
    }

    // Try to use the Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'Daily Anticipation Results',
            text: shareText
        }).catch(err => {
            console.error('Error sharing:', err);
            fallbackShare(shareText);
        });
    } else {
        fallbackShare(shareText);
    }
}

// Fallback for sharing when Share API isn't available
function fallbackShare(text) {
    // Copy to clipboard
    const textarea = document.createElement('textarea');
    textarea.value = text;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);

    alert('Results copied to clipboard!');
}

// Switch between main menu and game screens
function showMainMenu() {
    mainScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    document.body.style.backgroundColor = '#f5f5f5';
}

function showGameScreen() {
    mainScreen.style.display = 'none';
    gameScreen.style.display = 'flex';

    // Force a redraw after the game screen becomes visible
    setTimeout(() => {
        if (typeof canvas !== 'undefined' && canvas) {
            log("Forcing canvas redraw after screen transition");
            // Trigger proper rendering through the Renderer module
            if (typeof renderFrame === 'function') {
                renderFrame();
            }
        }
    }, 100);
}

// Initialize the menu when the DOM is loaded
document.addEventListener('DOMContentLoaded', initMenu);

// Export public functions for other modules to use
export {
    showMainMenu,
    showGameScreen,
    updatePuzzleCompletion
};
