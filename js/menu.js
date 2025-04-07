// menu.js - Main menu and game initialization functionality
// Updated to work with the modular architecture and handle keyboard visibility

import GameState from './modules/state.js';
import * as GameLogic from './modules/gameLogic.js';
import * as UI from './modules/ui.js';
import * as Audio from './modules/audio.js';
import * as Input from './modules/input.js';

// Menu state object
const menuState = {
    completedCategories: 0,
    lastCompletedColor: null, // Track the last completed color to prevent animation bugs
    puzzles: {
        yellow: { completed: false, guesses: 0, time: 0, hardMode: false, earlyCompletion: false },
        green: { completed: false, guesses: 0, time: 0, hardMode: false, earlyCompletion: false },
        blue: { completed: false, guesses: 0, time: 0, hardMode: false, earlyCompletion: false },
        red: { completed: false, guesses: 0, time: 0, hardMode: false, earlyCompletion: false }
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

    // Load category data from JSON files
    loadCategoryData();

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

// Load category data from JSON files
async function loadCategoryData() {
    log("Loading category data from JSON files");

    // Colors to load - these correspond to the JSON file names
    const colors = ['yellow', 'green', 'blue', 'red'];
    const colorSquares = document.querySelectorAll('.color-square');

    // Load each color's JSON file
    for (let i = 0; i < colors.length; i++) {
        const color = colors[i];
        const colorSquare = colorSquares[i];

        try {
            // Try to load the JSON file
            const response = await fetch(`items/${color}.json`);

            if (response.ok) {
                const data = await response.json();

                // Update the category name if available in the JSON
                if (data && data.categoryName) {
                    const heading = colorSquare.querySelector('h3');
                    if (heading) {
                        heading.textContent = data.categoryName;
                    }

                    // Also update the data-category attribute for reference
                    colorSquare.setAttribute('data-category', data.categoryName);
                }
            } else {
                log(`Could not load ${color}.json, keeping default category name`);
            }
        } catch (error) {
            log(`Error loading ${color}.json: ${error.message}`);
        }
    }

    log("Category data loading complete");
}

// Update game title based on current state
function updateGameTitle(category = null) {
    const gameTitleElement = document.querySelector('.game-title');
    const gameHeaderElement = document.getElementById('gameHeader');
    const categoryDisplayElement = document.getElementById('categoryDisplay');

    if (!gameTitleElement || !gameHeaderElement || !categoryDisplayElement) return;

    if (category && GameState.gameStarted) {
        // If in game and category is provided, switch to game header layout
        gameTitleElement.style.display = 'none';
        gameHeaderElement.style.display = 'flex';
        categoryDisplayElement.textContent = `Category: ${category}`;

        // Log for debugging
        console.log("Switching to game header with category:", category);
    } else {
        // Otherwise show the default title and hide game header
        gameTitleElement.style.display = 'block';
        gameHeaderElement.style.display = 'none';
        gameTitleElement.textContent = 'Daily Anticipation';
    }
}

// Update the menu state when a game is completed
function updatePuzzleCompletion(color, time, guesses = 0, isHardMode = false, isEarlyCompletion = false) {
    // Store the last completed color to prevent animation bugs
    menuState.lastCompletedColor = color;

    // Update puzzle state
    menuState.puzzles[color].completed = true;
    menuState.puzzles[color].time = time;
    menuState.puzzles[color].guesses = guesses;
    menuState.puzzles[color].hardMode = isHardMode;
    menuState.puzzles[color].earlyCompletion = isEarlyCompletion;
    menuState.completedCategories++;

    // Update result overlay with enhanced styling
    const resultOverlay = document.getElementById(`${color}-result`);
    if (!resultOverlay) {
        console.error(`Could not find result overlay for ${color}`);
        return;
    }

    // Add CSS for the stamp effect if not already added
    addCompletionStyles();

    // Determine which stamp class to use based on completion properties
    let stampClass = 'completion-stamp-default';

    if (isHardMode && isEarlyCompletion) {
        stampClass = 'completion-stamp-early-hard';
    } else if (isHardMode) {
        stampClass = 'completion-stamp-hard';
    } else if (isEarlyCompletion) {
        stampClass = 'completion-stamp-early';
    }

    // Check if it's a first-guess completion
    const isFirstGuess = guesses === 1;

    // Update the result overlay with better styling
    resultOverlay.innerHTML = `
        <div class="completion-stamp ${stampClass}">
            <div class="stamp-text">
                COMPLETED
                ${isHardMode ? '<span class="hard-badge">HARD</span>' : ''}
            </div>
        </div>
        <div class="completion-stats">
            <p class="stat-line">Time: ${time.toFixed(2)}s</p>
            ${isFirstGuess ?
              '<p class="stat-line stat-achievement">Got it in one ☝️</p>' :
              `<p class="stat-line">Guesses: ${guesses}</p>`}
            ${isEarlyCompletion ? '<p class="stat-line stat-achievement">Early completion! ⚡</p>' : ''}
            ${isHardMode ? '<p class="stat-line stat-achievement">Hard mode! 🏆</p>' : ''}
        </div>
    `;

    // Make sure the overlay is positioned properly
    resultOverlay.style.position = 'absolute';
    resultOverlay.style.top = '0';
    resultOverlay.style.left = '0';
    resultOverlay.style.right = '0';
    resultOverlay.style.bottom = '0';
    resultOverlay.style.display = 'flex';
    resultOverlay.style.flexDirection = 'column';
    resultOverlay.style.justifyContent = 'center';
    resultOverlay.style.alignItems = 'center';
    resultOverlay.style.zIndex = '10';
    resultOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    resultOverlay.style.borderRadius = '8px';
    resultOverlay.style.opacity = '1';
    resultOverlay.style.pointerEvents = 'auto';

    // Make sure the class is also added for CSS transitions
    resultOverlay.classList.add('visible');

    // Fix any potential styling issues with the completion stats
    const statsElement = resultOverlay.querySelector('.completion-stats');
    if (statsElement) {
        statsElement.style.background = 'rgba(0, 0, 0, 0.6)';
        statsElement.style.color = 'white';
        statsElement.style.padding = '10px 15px';
        statsElement.style.borderRadius = '8px';
        statsElement.style.marginTop = '10px';
        statsElement.style.textAlign = 'center';
        statsElement.style.width = 'auto';
        statsElement.style.display = 'block';
    }

    // Show share button if all categories completed
    if (menuState.completedCategories === 4) {
        shareButton.style.display = 'block';
    }
}

// Add styles for the completion stamp and stats with difficulty and timing variations
function addCompletionStyles() {
    if (!document.getElementById('completion-styles')) {
        const styleElem = document.createElement('style');
        styleElem.id = 'completion-styles';
        styleElem.innerHTML = `
            /* Base stamp style */
            .completion-stamp {
                font-family: 'Impact', sans-serif;
                font-size: 38px;
                transform: rotate(-15deg);
                padding: 8px 12px;
                border-radius: 10px;
                opacity: 0.9;
                text-shadow: 2px 2px 0 rgba(0,0,0,0.3);
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                animation: stampBounce 0.5s ease-out;
                background-color: rgba(255,255,255,0.9);
                margin-bottom: 15px;
                position: relative;
                z-index: 15;
            }

            /* Default stamp (red) */
            .completion-stamp-default {
                color: #ff0000;
                border: 5px solid #ff0000;
            }

            /* Hard mode stamp (gold with special effects) */
            .completion-stamp-hard {
                color: #ffd700;
                border: 5px solid #ffd700;
                text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
                box-shadow: 0 0 15px rgba(255, 215, 0, 0.7);
                background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,223,0,0.25) 100%);
            }

            /* Early completion stamp (green with glow) */
            .completion-stamp-early {
                color: #00c853;
                border: 5px solid #00c853;
                animation: stampGlow 2s infinite alternate;
            }

            /* Early + Hard combination (extra special) */
            .completion-stamp-early-hard {
                color: #00c853;
                border: 5px solid #ffd700;
                animation: stampGlowGold 2s infinite alternate;
                background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(0,200,83,0.25) 100%);
            }

            /* Hard mode badge */
            .hard-badge {
                position: absolute;
                top: -10px;
                right: -10px;
                background-color: #ffd700;
                color: #333;
                font-size: 12px;
                font-weight: bold;
                padding: 3px 6px;
                border-radius: 10px;
                transform: rotate(15deg);
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                text-shadow: none;
            }

            .stamp-text {
                letter-spacing: 2px;
                position: relative;
            }

            .completion-stats {
                font-weight: bold;
                font-size: 18px;
                color: white;
                text-shadow: 1px 1px 3px rgba(0,0,0,0.7);
                background-color: rgba(0,0,0,0.5);
                padding: 8px 15px;
                border-radius: 10px;
                z-index: 15;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }

            .stat-line {
                margin: 5px 0;
                display: block !important;
                visibility: visible !important;
                opacity: 1 !important;
            }

            .stat-achievement {
                color: #ffd700;
                font-weight: bold;
                display: block !important;
            }

            .result-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: rgba(0, 0, 0, 0.7);
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                z-index: 10;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s;
            }

            .result-overlay.visible {
                opacity: 1;
                pointer-events: auto;
                display: flex !important;
            }

            @keyframes stampBounce {
                0% { transform: scale(2) rotate(-15deg); opacity: 0; }
                70% { transform: scale(1.2) rotate(-15deg); opacity: 1; }
                100% { transform: scale(1) rotate(-15deg); opacity: 0.9; }
            }

            @keyframes stampGlow {
                0% { box-shadow: 0 0 10px rgba(0, 200, 83, 0.5); }
                100% { box-shadow: 0 0 20px rgba(0, 200, 83, 0.9); }
            }

            @keyframes stampGlowGold {
                0% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.5), 0 0 15px rgba(0, 200, 83, 0.3); }
                100% { box-shadow: 0 0 20px rgba(255, 215, 0, 0.9), 0 0 25px rgba(0, 200, 83, 0.6); }
            }

            /* Fix for menu showing completed categories */
            .color-square .result-overlay p {
                display: block !important;
                opacity: 1 !important;
                visibility: visible !important;
                color: white;
                font-size: 16px;
                text-align: center;
                margin: 5px 0;
            }

            /* Force results to be visible */
            #yellow-result, #green-result, #blue-result, #red-result {
                display: flex !important;
                flex-direction: column !important;
                justify-content: center !important;
                align-items: center !important;
            }

            /* Ensure padding for stats */
            .color-square .completion-stats {
                margin-top: 10px;
                padding: 10px 15px;
                width: auto;
                min-width: 150px;
                text-align: center;
                background: rgba(0,0,0,0.6);
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
            // Add achievement badges
            let achievementBadges = [];

            if (puzzle.guesses === 1) {
                achievementBadges.push('☝️');
            }
            if (puzzle.earlyCompletion) {
                achievementBadges.push('⚡');
            }
            if (puzzle.hardMode) {
                achievementBadges.push('🏆');
            }

            const badges = achievementBadges.length > 0 ? ` ${achievementBadges.join(' ')}` : '';
            shareText += `${category}: ✓${badges} (${puzzle.time.toFixed(2)}s, ${puzzle.guesses} guess${puzzle.guesses !== 1 ? 'es' : ''})\n`;
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
    // Always force hide keyboard when returning to menu
    if (typeof Input.forceHideKeyboard === 'function') {
        Input.forceHideKeyboard();
    }

    // Make sure we reset the game screen state
    const gameScreen = document.querySelector('.game-screen');
    if (gameScreen) {
        gameScreen.classList.remove('keyboard-visible');
    }

    // Restore canvas size
    const canvasContainer = document.querySelector('.canvas-container');
    if (canvasContainer) {
        canvasContainer.style.width = '100%';
        canvasContainer.style.margin = '0 0 20px 0';
        canvasContainer.style.transform = 'scale(1)';
    }

    // Ensure all completed overlays are visible
    Object.keys(menuState.puzzles).forEach(color => {
        if (menuState.puzzles[color].completed) {
            const resultOverlay = document.getElementById(`${color}-result`);
            if (resultOverlay) {
                resultOverlay.classList.add('visible');
                resultOverlay.style.display = 'flex';
                resultOverlay.style.opacity = '1';

                // Make sure the completion stats are visible
                const statsElement = resultOverlay.querySelector('.completion-stats');
                if (statsElement) {
                    statsElement.style.display = 'block';
                    statsElement.style.visibility = 'visible';
                    statsElement.style.opacity = '1';
                }
            }
        }
    });

    // Show main screen
    mainScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    document.body.style.backgroundColor = '#f5f5f5';

    // Show title and hide game header when returning to menu
    const gameTitleElement = document.querySelector('.game-title');
    const gameHeaderElement = document.getElementById('gameHeader');

    if (gameTitleElement && gameHeaderElement) {
        gameTitleElement.style.display = 'block';
        gameHeaderElement.style.display = 'none';
        gameTitleElement.textContent = 'Daily Anticipation';
    }
}

function showGameScreen() {
    mainScreen.style.display = 'none';
    gameScreen.style.display = 'flex';

    // Get references to title and header elements
    const gameTitleElement = document.querySelector('.game-title');
    const gameHeaderElement = document.getElementById('gameHeader');
    const categoryDisplayElement = document.getElementById('categoryDisplay');

    // Hide the title and show the game header with category
    if (gameTitleElement && gameHeaderElement && categoryDisplayElement && GameState.currentCategory) {
        gameTitleElement.style.display = 'none';
        gameHeaderElement.style.display = 'flex';
        categoryDisplayElement.textContent = `Category: ${GameState.currentCategory}`;

        // Log for debugging
        console.log("Switching to game header with category:", GameState.currentCategory);
    }

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

// Force update all completed puzzles (use to fix display issues)
function refreshCompletedPuzzles() {
    Object.keys(menuState.puzzles).forEach(color => {
        if (menuState.puzzles[color].completed) {
            const puzzle = menuState.puzzles[color];
            updatePuzzleCompletion(
                color,
                puzzle.time,
                puzzle.guesses,
                puzzle.hardMode,
                puzzle.earlyCompletion
            );
        }
    });
}

// Initialize the menu when the DOM is loaded
document.addEventListener('DOMContentLoaded', initMenu);

// Export public functions for other modules to use
export {
    showMainMenu,
    showGameScreen,
    updatePuzzleCompletion,
    updateGameTitle,
    shareResults,
    refreshCompletedPuzzles
};
