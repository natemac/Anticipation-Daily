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
    animationTimer: null,
    elapsedTimer: null,
    gameStarted: false,
    timerActive: false,
    elapsedTime: 0,
    elapsedTimeHundredths: 0,
    guessMode: false,
    currentInput: '',
    correctLetters: []
};

// DOM elements
let mainScreen, gameScreen, colorSquares, difficultyToggle, backButton, canvas,
    ctx, timerDisplay, guessInput, beginButton, wrongMessage, shareButton;

// Initialize the game
function initGame() {
    // Get DOM elements
    mainScreen = document.querySelector('.main-screen');
    gameScreen = document.querySelector('.game-screen');
    colorSquares = document.querySelectorAll('.color-square');
    difficultyToggle = document.getElementById('difficultyToggle');
    backButton = document.getElementById('backButton');
    canvas = document.getElementById('gameCanvas');
    timerDisplay = document.getElementById('timerDisplay');
    guessInput = document.getElementById('guessInput');
    beginButton = document.getElementById('beginButton');
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
        redrawCanvas();
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

    // Begin/Guess button
    beginButton.addEventListener('click', () => {
        if (!state.gameStarted) {
            startDrawing();
        } else {
            enterGuessMode();
        }
    });

    // Guess input
    guessInput.addEventListener('input', (e) => {
        if (state.guessMode) {
            handleLetterInput(e.target.value);
        }
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
        state.difficulty = 'hard';
        updateDifficultyUI(true);
    } else {
        difficultyToggle.checked = false;
        state.difficulty = 'easy';
        updateDifficultyUI(false);
    }

    // Add the event listener
    difficultyToggle.addEventListener('change', function() {
        // Update the game state
        state.difficulty = difficultyToggle.checked ? 'hard' : 'easy';

        // Save preference to localStorage
        localStorage.setItem('difficultyMode', state.difficulty);

        // Update visual feedback
        updateDifficultyUI(difficultyToggle.checked);

        console.log(`Difficulty set to: ${state.difficulty}`);
    });

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

// Game Functions
async function startGame(color, category) {
    try {
        // Try to load the exported JSON file from the items folder
        const itemData = await loadJsonData(`items/${color}.json`);

        if (itemData) {
            console.log('Successfully loaded custom drawing data');
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
    state.gameStarted = false;
    state.timerActive = false;
    state.elapsedTime = 0;
    state.elapsedTimeHundredths = 0;
    state.guessMode = false;
    state.currentInput = '';
    state.correctLetters = Array(data.name.length).fill(null);

    // Switch to game screen
    mainScreen.style.display = 'none';
    gameScreen.style.display = 'flex';

    // Set background color
    document.body.style.backgroundColor = `var(--${color}-color)`;

    // Reset UI elements
    guessInput.value = '';
    guessInput.style.display = 'none';
    wrongMessage.classList.remove('visible');
    timerDisplay.textContent = '00:00';
    beginButton.textContent = 'Begin';
    canvas.classList.remove('incorrect');

    // Reset canvas and draw initial state
    clearCanvas();
}

function startDrawing() {
    // Change to game started state
    state.gameStarted = true;
    state.timerActive = true;
    beginButton.textContent = 'Guess';

    // Clear any existing timers
    if (state.animationTimer) clearInterval(state.animationTimer);
    if (state.elapsedTimer) clearInterval(state.elapsedTimer);

    // Debug: Log the drawing data
    console.log("Drawing data:", state.drawingData);

    if (!state.drawingData || !state.drawingData.dots || !state.drawingData.sequence) {
        console.error("Invalid drawing data format!");
        alert("Error: Invalid drawing data format!");
        return;
    }

    // Validate sequence references
    for (let i = 0; i < state.drawingData.sequence.length; i++) {
        const line = state.drawingData.sequence[i];
        if (line.from >= state.drawingData.dots.length || line.to >= state.drawingData.dots.length) {
            console.error(`Invalid line reference: ${line.from} -> ${line.to}`);
            alert("Error: Invalid line references in drawing data!");
            return;
        }
    }

    // Start the timer counting up
    startElapsedTimer();

    // Start drawing animation
    const totalSequenceLength = state.drawingData.sequence.length;
    const timePerLine = 10000 / totalSequenceLength; // Complete drawing in 10 seconds

    // Initial draw
    redrawCanvas();

    state.animationTimer = setInterval(() => {
        if (!state.guessMode && state.gameStarted) {
            state.drawingProgress++;

            // Redraw the canvas with updated progress
            redrawCanvas();

            // When drawing is complete, stop the animation timer but keep the time counting
            if (state.drawingProgress >= totalSequenceLength) {
                clearInterval(state.animationTimer);
            }
        }
    }, timePerLine);
}

function startElapsedTimer() {
    // Clear any existing timer
    if (state.elapsedTimer) {
        clearInterval(state.elapsedTimer);
    }

    // Update timer every 10ms for hundredths of seconds precision
    state.elapsedTimer = setInterval(() => {
        if (!state.guessMode && state.timerActive) {
            state.elapsedTimeHundredths += 1;

            if (state.elapsedTimeHundredths >= 100) {
                state.elapsedTime += 1;
                state.elapsedTimeHundredths = 0;
            }

            // Format and display timer
            updateTimerDisplay();
        }
    }, 10);
}

function updateTimerDisplay() {
    const seconds = String(state.elapsedTime).padStart(2, '0');
    const hundredths = String(state.elapsedTimeHundredths).padStart(2, '0');
    timerDisplay.textContent = `${seconds}:${hundredths}`;
}

function enterGuessMode() {
    // Pause animation and timer
    state.guessMode = true;

    // Show input field
    guessInput.style.display = 'block';
    guessInput.focus();
    guessInput.value = state.currentInput;

    // Focus and show keyboard on mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            guessInput.click();
        }, 100);
    }
}

function exitGuessMode() {
    // Resume animation and timer
    state.guessMode = false;

    // Hide input field
    guessInput.style.display = 'none';
    guessInput.blur();
}

function handleLetterInput(input) {
    const currentWord = state.drawingData.name;
    const upperInput = input.toUpperCase();
    state.currentInput = upperInput;

    // Compare input with answer, tracking correct letters
    let allCorrect = true;
    let anyIncorrect = false;

    // Process each character of the input
    for (let i = 0; i < upperInput.length; i++) {
        if (i < currentWord.length) {
            if (upperInput[i] === currentWord[i]) {
                // Mark this letter as correct
                state.correctLetters[i] = upperInput[i];
            } else {
                // Not a correct letter
                allCorrect = false;
                anyIncorrect = true;
            }
        } else {
            // Input is longer than answer
            allCorrect = false;
            anyIncorrect = true;
        }
    }

    // If input is shorter than full word, it's not complete
    if (upperInput.length < currentWord.length) {
        allCorrect = false;
    }

    if (anyIncorrect) {
        // Show incorrect feedback animation
        canvas.classList.add('incorrect');
        setTimeout(() => {
            canvas.classList.remove('incorrect');
        }, 500);

        // Reset input to show only correct letters collected so far
        let correctInput = '';
        for (let i = 0; i < state.correctLetters.length; i++) {
            correctInput += state.correctLetters[i] ? state.correctLetters[i] : '';
        }
        state.currentInput = correctInput;
        guessInput.value = correctInput;
    }

    // Check if complete correct answer
    if (allCorrect && upperInput === currentWord) {
        setTimeout(() => {
            endGame(true);
        }, 500);
    } else {
        // Exit guess mode after feedback (if there was an incorrect letter)
        if (anyIncorrect) {
            exitGuessMode();
        }
    }

    // Redraw to show correct letters
    redrawCanvas();
}

function redrawCanvas() {
    clearCanvas();

    if (state.difficulty === 'easy') {
        drawDots();
        drawWordSpaces();
    }

    drawLines();
}

function endGame(success) {
    // Clear timers
    clearInterval(state.animationTimer);
    clearInterval(state.elapsedTimer);

    // Reset state
    state.gameStarted = false;
    state.timerActive = false;
    state.guessMode = false;

    // Update puzzle state
    if (success) {
        state.puzzles[state.currentColor].completed = true;
        state.puzzles[state.currentColor].time = state.elapsedTime + (state.elapsedTimeHundredths / 100);

        // Update result overlay
        const resultOverlay = document.getElementById(`${state.currentColor}-result`);
        resultOverlay.querySelector('.time-count').textContent = `Time: ${state.elapsedTime}.${String(state.elapsedTimeHundredths).padStart(2, '0')}s`;
        resultOverlay.classList.add('visible');

        state.completedCategories++;
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
        // Scale dot positions to fit canvas size
        const x = (dot.x / 400) * canvas.width;
        const y = (dot.y / 400) * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
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

            // Scale line positions to fit canvas size
            const fromX = (from.x / 400) * canvas.width;
            const fromY = (from.y / 400) * canvas.height;
            const toX = (to.x / 400) * canvas.width;
            const toY = (to.y / 400) * canvas.height;

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
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
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let i = 0; i < answer.length; i++) {
        const x = startX + (i * charWidth) + (charWidth / 2);

        if (answer[i] !== ' ') {
            // Draw underline
            ctx.beginPath();
            ctx.moveTo(x - (charWidth / 2) + 5, y);
            ctx.lineTo(x + (charWidth / 2) - 5, y);
            ctx.stroke();

            // Draw correct letter if it exists
            if (state.correctLetters[i]) {
                ctx.fillText(state.correctLetters[i], x, y - 5);
            }
        } else {
            // For spaces, just add a visible gap
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(x - 5, y - 2, 10, 2);
            ctx.fillStyle = '#333';
        }
    }
}

// Initialize the game when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);
