// Main menu and game initialization functionality
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
let mainScreen, gameScreen, colorSquares, difficultyToggle, shareButton;

// Simple logging function for debugging
function log(message) {
    console.log(message);
}

// Initialize the menu
function initMenu() {
    log("Initializing menu...");

    // Get DOM elements
    mainScreen = document.querySelector('.main-screen');
    gameScreen = document.querySelector('.game-screen');
    colorSquares = document.querySelectorAll('.color-square');
    difficultyToggle = document.getElementById('difficultyToggle');
    shareButton = document.getElementById('shareButton');

    // Set up event listeners
    setupMenuEventListeners();

    // Initialize difficulty toggle
    initDifficultyToggle();

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

        // Update game state if game.js is loaded
        if (typeof gameState !== 'undefined') {
            gameState.difficulty = difficulty;
        }
    });

    // Color squares click events
    colorSquares.forEach(square => {
        square.addEventListener('click', () => {
            const color = square.dataset.color;
            const category = square.dataset.category;

            // Don't allow replaying completed puzzles
            if (menuState.puzzles[color].completed) return;

            // Start game if game.js is loaded
            if (typeof startGame === 'function') {
                startGame(color, category);
            } else {
                console.error("Game module not loaded");
            }
        });
    });

    // Share button
    shareButton.addEventListener('click', () => {
        shareResults();
    });
}

// Difficulty toggle functionality
function initDifficultyToggle() {
    const easyLabel = document.getElementById('easyLabel');
    const hardLabel = document.getElementById('hardLabel');

    // Set initial state based on stored preference (if any)
    const storedDifficulty = localStorage.getItem('difficultyMode');
    if (storedDifficulty === 'hard') {
        difficultyToggle.checked = true;
        updateDifficultyUI(true);
    } else {
        difficultyToggle.checked = false;
        updateDifficultyUI(false);
    }

    // Also add direct click handlers to labels for better mobile experience
    easyLabel.addEventListener('click', function() {
        difficultyToggle.checked = false;
        difficultyToggle.dispatchEvent(new Event('change'));
    });

    hardLabel.addEventListener('click', function() {
        difficultyToggle.checked = true;
        difficultyToggle.dispatchEvent(new Event('change'));
    });
}

// Update difficulty UI
function updateDifficultyUI(isHard) {
    const easyLabel = document.getElementById('easyLabel');
    const hardLabel = document.getElementById('hardLabel');

    if (isHard) {
        // Hard mode selected
        easyLabel.style.opacity = '0.5';
        easyLabel.style.fontWeight = 'normal';
        hardLabel.style.opacity = '1';
        hardLabel.style.fontWeight = 'bold';
    } else {
        // Easy mode selected
        hardLabel.style.opacity = '0.5';
        hardLabel.style.fontWeight = 'normal';
        easyLabel.style.opacity = '1';
        easyLabel.style.fontWeight = 'bold';
    }
}

// Update the menu state when a game is completed
function updatePuzzleCompletion(color, time) {
    menuState.puzzles[color].completed = true;
    menuState.puzzles[color].time = time;
    menuState.completedCategories++;

    // Update result overlay
    const resultOverlay = document.getElementById(`${color}-result`);
    resultOverlay.querySelector('.time-count').textContent = `Time: ${time.toFixed(2)}s`;
    resultOverlay.classList.add('visible');

    // Show share button if all categories completed
    if (menuState.completedCategories === 4) {
        shareButton.style.display = 'block';
    }
}

// Share results functionality
function shareResults() {
    let shareText = "Daily Anticipation Results:\n";

    for (const color of ['yellow', 'green', 'blue', 'red']) {
        const puzzle = menuState.puzzles[color];
        const category = document.querySelector(`.color-square[data-color="${color}"]`).dataset.category;

        if (puzzle.completed) {
            shareText += `${category}: ✓ (${puzzle.time.toFixed(2)}s)\n`;
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
}

// Initialize the menu when the DOM is loaded
document.addEventListener('DOMContentLoaded', initMenu);
