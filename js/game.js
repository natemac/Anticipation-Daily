// Game state and variables
const state = {
    difficulty: 'easy',
    currentColor: null,
    currentCategory: null,
    completedCategories: 0,
    puzzles: {
        yellow: { completed: false, guesses: 0, time: 0 },
        green: { completed: false, guesses: 0, time: 0 },
        blue: { completed: false, guesses: 0, time: 0 },
        red: { completed: false, guesses: 0, time: 0 }
    },
    drawingData: null,
    drawingProgress: 0,
    countdownTimer: null,
    guessTimer: null,
    countdownTime: 10, // in seconds
    guessTime: 20, // in seconds
    guessCount: 0,
    gameStarted: false,
    timerActive: false,
    elapsedTime: 0
};

// DOM elements
let mainScreen, gameScreen, colorSquares, difficultyToggle, backButton, canvas,
    ctx, timerBar, guessInput, guessButton, wrongMessage, shareButton;

// Initialize the game
function initGame() {
    // Get DOM elements
    mainScreen = document.querySelector('.main-screen');
    gameScreen = document.querySelector('.game-screen');
    colorSquares = document.querySelectorAll('.color-square');
    difficultyToggle = document.getElementById('difficultyToggle');
    backButton = document.getElementById('backButton');
    canvas = document.getElementById('gameCanvas');
    timerBar = document.getElementById('timerBar');
    guessInput = document.getElementById('guessInput');
    guessButton = document.getElementById('guessButton');
    wrongMessage = document.getElementById('wrongMessage');
    shareButton = document.getElementById('shareButton');

    // Set up canvas
    ctx = canvas.getContext('2d');
    resizeCanvas(canvas);

    // Set event listeners
    setupEventListeners();

    // Initialize difficulty toggle
    initDifficultyToggle();

    // Initialize game state
    clearCanvas();
}

// Resize canvas to match container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
}

// Set up event listeners
function setupEventListeners() {
    // Window resize event
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    // Difficulty toggle
    difficultyToggle.addEventListener('change', () => {
        // Update the difficulty state when toggled
        state.difficulty = difficultyToggle.checked ? 'hard' : 'easy';
        updateDifficultyUI(difficultyToggle.checked);
        console.log(`Difficulty set to: ${state.difficulty}`);
    });

    // Color squares click events
    colorSquares.forEach(square => {
        square.addEventListener('click', () => {
            const color = square.dataset.color;
            const category = square.dataset.category;

            // Don't allow replaying completed puzzles
            if (state.puzzles[color].completed) return;

            startGame(color, category);
        });
    });

    // Back button
    backButton.addEventListener('click', () => {
        endGame(false);
    });

    // Guess button
    guessButton.addEventListener('click', () => {
        // Only handle guesses, not starting the drawing
        if (state.gameStarted) {
            checkGuess();
        }
    });

    // Enter key for guess input
    guessInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter' && state.gameStarted) {
            checkGuess();
        }
    });

    // Share button
    shareButton.addEventListener('click', () => {
        shareResults();
    });
}

// Difficulty toggle functionality
function initDifficultyToggle() {
    const difficultyToggle = document.getElementById('difficultyToggle');
    const easyLabel = document.querySelector('.difficulty-label:first-of-type');
    const hardLabel = document.querySelector('.difficulty-label:last-of-type');

    // Set initial state based on stored preference (if any)
    const storedDifficulty = localStorage.getItem('difficultyMode');
    if (storedDifficulty === 'hard') {
        difficultyToggle.checked = true;
        state.difficulty = 'hard';
        updateDifficultyUI(true);
    } else {
        difficultyToggle.checked = false;
        state.difficulty = 'easy';
        updateDifficultyUI(false);
    }

    // Ensure the toggle is properly initialized with the event listener
    // Remove any existing listeners first to prevent duplicates
    difficultyToggle.removeEventListener('change', difficultyChangeHandler);

    // Add the event listener
    difficultyToggle.addEventListener('change', difficultyChangeHandler);

    // Define the handler function to properly update state and UI
    function difficultyChangeHandler() {
        // Update the game state
        state.difficulty = difficultyToggle.checked ? 'hard' : 'easy';

        // Save preference to localStorage
        localStorage.setItem('difficultyMode', state.difficulty);

        // Update visual feedback
        updateDifficultyUI(difficultyToggle.checked);

        console.log(`Difficulty set to: ${state.difficulty}`);
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

// Ensure updateDifficultyUI is properly implemented
function updateDifficultyUI(isHard) {
    const easyLabel = document.querySelector('.difficulty-label:first-of-type');
    const hardLabel = document.querySelector('.difficulty-label:last-of-type');

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

// Game Functions
async function startGame(color, category) {
    // Only try to load the JSON file when a category is clicked
    try {
        // Try to load the exported JSON file from the items folder
        const itemData = await loadJsonData('items/item1.json');

        if (itemData) {
            console.log('Successfully loaded custom drawing data');
            // Use the loaded data regardless of which category was clicked (for testing)
            startGameWithData(color, category, itemData);
        } else {
            console.log('Using default drawing data for', category);
            // Fallback to existing data if file can't be loaded
            startGameWithData(color, category, gameData[color]);
        }
    } catch (error) {
        console.log('Error in game startup, using default data');
        startGameWithData(color, category, gameData[color]);
    }
}

// Function to start game with provided data
function startGameWithData(color, category, data) {
    state.currentColor = color;
    state.currentCategory = category;
    state.drawingData = data;
    state.drawingProgress = 0;
    state.guessCount = 0;
    state.gameStarted = false;
    state.timerActive = false;
    state.elapsedTime = 0;

    // Switch to game screen
    mainScreen.style.display = 'none';
    gameScreen.style.display = 'flex';

    // Set background color
    document.body.style.backgroundColor = `var(--${color}-color)`;

    // Reset input and messages
    guessInput.value = '';
    wrongMessage.classList.remove('visible');

    // Clear canvas and draw initial state
    clearCanvas();

    if (state.difficulty === 'easy') {
        drawDots();
        drawWordSpaces();
    }

    // Add Begin overlay
    const canvasContainer = document.querySelector('.canvas-container');

    // Remove any existing begin overlay first
    const existingOverlay = document.querySelector('.begin-overlay');
    if (existingOverlay) {
        canvasContainer.removeChild(existingOverlay);
    }

    const beginOverlay = document.createElement('div');
    beginOverlay.className = 'begin-overlay';

    const beginButton = document.createElement('button');
    beginButton.className = 'begin-button';
    beginButton.textContent = 'Begin';
    beginButton.addEventListener('click', function() {
        canvasContainer.removeChild(beginOverlay);
        startDrawing();
    });

    beginOverlay.appendChild(beginButton);
    canvasContainer.appendChild(beginOverlay);
}

function startDrawing() {
    state.gameStarted = true;
    guessButton.textContent = 'Guess';

    // Debug: Log the drawing data to make sure it's correctly formatted
    console.log("Drawing data:", state.drawingData);

    if (!state.drawingData || !state.drawingData.dots || !state.drawingData.sequence) {
        console.error("Invalid drawing data format!");
        alert("Error: Invalid drawing data format!");
        return;
    }

    // Check that dots and sequence references are valid
    for (let i = 0; i < state.drawingData.sequence.length; i++) {
        const line = state.drawingData.sequence[i];
        if (line.from >= state.drawingData.dots.length || line.to >= state.drawingData.dots.length) {
            console.error(`Invalid line reference: ${line.from} -> ${line.to}`);
            alert("Error: Invalid line references in drawing data!");
            return;
        }
    }

    // Start countdown timer
    state.countdownTime = 10;
    updateTimerBar(state.countdownTime, 10);

    // Draw initial state immediately
    clearCanvas();
    if (state.difficulty === 'easy') {
        drawDots();
        drawWordSpaces();
    }

    // Draw the first line immediately
    if (state.drawingData.sequence.length > 0) {
        state.drawingProgress = 1;
        drawLines();
    }

    state.countdownTimer = setInterval(() => {
        state.countdownTime--;
        updateTimerBar(state.countdownTime, 10);

        // Update drawing progress
        state.drawingProgress = Math.floor((10 - state.countdownTime) / 10 * state.drawingData.sequence.length);
        clearCanvas();

        if (state.difficulty === 'easy') {
            drawDots();
            drawWordSpaces();
        }

        drawLines();

        if (state.countdownTime <= 0) {
            clearInterval(state.countdownTimer);
            startGuessTimer();
        }
    }, 1000);
}

function startGuessTimer() {
    state.guessTime = 20;
    state.timerActive = true;
    updateTimerBar(state.guessTime, 20);

    state.guessTimer = setInterval(() => {
        state.guessTime--;
        state.elapsedTime++;
        updateTimerBar(state.guessTime, 20);

        if (state.guessTime <= 0) {
            clearInterval(state.guessTimer);
            endGame(false);
        }
    }, 1000);
}

function checkGuess() {
    const guess = guessInput.value.trim().toUpperCase();
    state.guessCount++;

    if (guess === state.drawingData.name) {
        // Correct guess
        endGame(true);
    } else {
        // Wrong guess
        wrongMessage.classList.add('visible');
        setTimeout(() => {
            wrongMessage.classList.remove('visible');
        }, 1500);
    }

    guessInput.value = '';
}

function endGame(success) {
    // Clear timers
    clearInterval(state.countdownTimer);
    clearInterval(state.guessTimer);

    // Update puzzle state
    if (success) {
        state.puzzles[state.currentColor].completed = true;
        state.puzzles[state.currentColor].guesses = state.guessCount;
        state.puzzles[state.currentColor].time = state.elapsedTime;
        state.completedCategories++;

        // Update result overlay
        const resultOverlay = document.getElementById(`${state.currentColor}-result`);
        resultOverlay.querySelector('.guess-count').textContent = `Guesses: ${state.guessCount}`;
        resultOverlay.querySelector('.time-count').textContent = `Time: ${state.elapsedTime}s`;
        resultOverlay.classList.add('visible');
    }

    // Show share button if all categories completed
    if (state.completedCategories === 4) {
        shareButton.style.display = 'block';
    }

    // Reset UI
    mainScreen.style.display = 'flex';
    gameScreen.style.display = 'none';
    document.body.style.backgroundColor = '#f5f5f5';
}

function shareResults() {
    let shareText = "Daily Anticipation Results:\n";

    for (const color of ['yellow', 'green', 'blue', 'red']) {
        const puzzle = state.puzzles[color];
        const category = document.querySelector(`.color-square[data-color="${color}"]`).dataset.category;

        if (puzzle.completed) {
            shareText += `${category}: ✓ (${puzzle.guesses} guesses, ${puzzle.time}s)\n`;
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

// Drawing Functions
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function drawDots() {
    // Only draw dots in easy mode
    if (state.difficulty === 'hard') return;

    const data = state.drawingData;
    const dotRadius = 5;

    ctx.fillStyle = '#333';
    data.dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawLines() {
    const data = state.drawingData;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;

    for (let i = 0; i < state.drawingProgress; i++) {
        if (i < data.sequence.length) {
            const line = data.sequence[i];
            const from = data.dots[line.from];
            const to = data.dots[line.to];

            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        }
    }
}

function drawWordSpaces() {
    // Only draw word spaces in easy mode
    if (state.difficulty === 'hard') return;

    const answer = state.drawingData.name;
    const canvasWidth = canvas.width;
    const charWidth = canvasWidth / (answer.length + 2);
    const startX = (canvasWidth - (charWidth * answer.length)) / 2;
    const y = canvas.height - 30;

    ctx.fillStyle = '#333';
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    for (let i = 0; i < answer.length; i++) {
        const x = startX + (i * charWidth);

        if (answer[i] !== ' ') {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + charWidth - 5, y);
            ctx.stroke();
        }
    }
}

function updateTimerBar(current, total) {
    const percentage = (current / total) * 100;
    timerBar.style.width = `${percentage}%`;

    // Change color based on time remaining
    if (percentage > 60) {
        timerBar.style.backgroundColor = '#4CAF50'; // Green
    } else if (percentage > 30) {
        timerBar.style.backgroundColor = '#FFC107'; // Yellow
    } else {
        timerBar.style.backgroundColor = '#F44336'; // Red
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
