// Game state and variables
const gameState = {
    difficulty: 'easy',
    currentColor: null,
    currentCategory: null,
    drawingData: null,
    drawingProgress: 0,
    elapsedTimer: null,
    gameStarted: false,
    timerActive: false,
    elapsedTime: 0,
    elapsedTimeHundredths: 0,
    guessMode: false,
    currentInput: '',
    correctLetters: [],
    // Guess timer properties
    guessTimeRemaining: 10,
    guessTimerActive: false,
    guessTimer: null
};

// DOM elements
let canvas, ctx, timerDisplay, guessInput, beginButton, wrongMessage, backButton, buttonTimer;

// Simple logging function for debugging
function log(message) {
    console.log(message);
}

// Initialize the game
function initGame() {
    log("Initializing game...");

    // Get DOM elements
    canvas = document.getElementById('gameCanvas');
    timerDisplay = document.getElementById('timerDisplay');
    guessInput = document.getElementById('guessInput');
    beginButton = document.getElementById('beginButton');
    wrongMessage = document.getElementById('wrongMessage');
    backButton = document.getElementById('backButton');
    buttonTimer = document.getElementById('buttonTimer');

    // Set up canvas
    setupCanvas();

    // Set event listeners
    setupGameEventListeners();

    // Get difficulty setting from localStorage or menu state
    if (localStorage.getItem('difficultyMode') === 'hard') {
        gameState.difficulty = 'hard';
    } else {
        gameState.difficulty = 'easy';
    }

    log("Game initialized");
}

// Initialize the canvas with correct dimensions
function setupCanvas() {
    log("Setting up canvas...");

    // Remove alpha: false to allow transparency
    ctx = canvas.getContext('2d');

    // Set initial dimensions
    resizeCanvas();

    // Draw initial white background
    clearCanvas();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    log("Canvas setup complete: " + canvas.width + " x " + canvas.height);
}

// Resize canvas to match container
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    // Force a redraw if the game is active
    if (gameState.gameStarted) {
        redrawCanvas();
    }
}

// Set up game-specific event listeners
function setupGameEventListeners() {
    // Window resize event
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    // Add visibility change event
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && gameState.gameStarted) {
            log("Page became visible, redrawing canvas");
            setTimeout(redrawCanvas, 100);
        }
    });

    // Back button
    backButton.addEventListener('click', () => {
        endGame(false);
    });

    // Begin/Guess button
    beginButton.addEventListener('click', () => {
        if (!gameState.gameStarted) {
            startDrawing();
        } else {
            enterGuessMode();
        }
    });

    // Guess input
    guessInput.addEventListener('input', (e) => {
        if (gameState.guessMode) {
            handleLetterInput(e.target.value);
        }
    });

    // Add touch event to canvas to force rendering
    canvas.addEventListener('touchstart', function(e) {
        // Prevent default to avoid scrolling
        e.preventDefault();
        log("Canvas touch detected");

        // Force redraw if the game has started
        if (gameState.gameStarted) {
            redrawCanvas();
        }
    }, { passive: false });
}

// Start a new game with the selected category
async function startGame(color, category) {
    log(`Starting game: ${category} (${color})`);
    try {
        // Try to load the exported JSON file from the items folder
        const response = await fetch(`items/${color}.json`);
        const itemData = await response.json();
        log('Successfully loaded drawing data');
        startGameWithData(color, category, itemData);
    } catch (error) {
        log('Using default drawing data for: ' + category);
        startGameWithData(color, category, gameData[color]);
    }
}

// Function to start game with provided data
function startGameWithData(color, category, data) {
    log("Starting game with data");
    gameState.currentColor = color;
    gameState.currentCategory = category;
    gameState.drawingData = data;
    gameState.drawingProgress = 0;
    gameState.gameStarted = false;
    gameState.timerActive = false;
    gameState.elapsedTime = 0;
    gameState.elapsedTimeHundredths = 0;
    gameState.guessMode = false;
    gameState.currentInput = '';
    gameState.correctLetters = Array(data.name.length).fill(null);
    gameState.guessTimeRemaining = 10;
    gameState.guessTimerActive = false;

    // Switch to game screen using the menu function
    if (typeof showGameScreen === 'function') {
        showGameScreen();
    }

    // Set background color
    document.body.style.backgroundColor = `var(--${color}-color)`;

    // Reset UI elements
    guessInput.value = '';
    guessInput.style.display = 'none';
    wrongMessage.classList.remove('visible');
    timerDisplay.textContent = '00:00';
    beginButton.querySelector('span').textContent = 'Begin';
    canvas.classList.remove('incorrect');
    buttonTimer.classList.remove('active');
    buttonTimer.style.width = '0%';

    // Clear canvas and draw initial state
    clearCanvas();

    // Draw a visible border to ensure canvas is active
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

// Start the drawing animation
function startDrawing() {
    log("Starting drawing animation");

    // Change to game started state
    gameState.gameStarted = true;
    gameState.timerActive = true;
    beginButton.querySelector('span').textContent = 'Guess';

    // Clear any existing timers
    if (gameState.elapsedTimer) clearInterval(gameState.elapsedTimer);
    if (gameState.guessTimer) clearInterval(gameState.guessTimer);

    // Ensure canvas is properly cleared and white
    clearCanvas();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Force a redraw to ensure the canvas is white
    requestAnimationFrame(() => {
        // Continue with the rest of the function...
        // Start the timer counting up
        startElapsedTimer();

    // Immediately draw all dots if in easy mode
    if (gameState.difficulty === 'easy') {
        drawDots();
        drawWordSpaces();
    }

    // Set up animation
    const totalSequenceLength = gameState.drawingData.sequence.length;
    const timePerLine = 300; // 300ms per line for clearer animation

    log(`Animation setup: ${totalSequenceLength} lines, ${timePerLine}ms per line`);

    // Start with no lines drawn
    gameState.drawingProgress = 0;
    redrawCanvas();

    // Use direct animation approach
    let currentLine = 0;

    function drawNextLine() {
        if (gameState.guessMode || !gameState.gameStarted || currentLine >= totalSequenceLength) {
            log("Animation complete or interrupted");
            return;
        }

        // Increment progress
        gameState.drawingProgress = currentLine + 1;

        // Redraw canvas with updated progress
        redrawCanvas();

        log(`Drawing line ${currentLine + 1} of ${totalSequenceLength}`);

        // Move to next line
        currentLine++;

        // Continue animation if not paused
        if (!gameState.guessMode && gameState.gameStarted) {
            setTimeout(drawNextLine, timePerLine);
        }
    }

    // Start the animation immediately
    drawNextLine();
}

// Start the elapsed timer
function startElapsedTimer() {
    // Clear any existing timer
    if (gameState.elapsedTimer) clearInterval(gameState.elapsedTimer);

    // Update timer every 10ms for hundredths of seconds precision
    gameState.elapsedTimer = setInterval(() => {
        if (!gameState.guessMode && gameState.timerActive) {
            gameState.elapsedTimeHundredths += 1;

            if (gameState.elapsedTimeHundredths >= 100) {
                gameState.elapsedTime += 1;
                gameState.elapsedTimeHundredths = 0;
            }

            // Format and display timer
            updateTimerDisplay();
        }
    }, 10);
}

// Update the timer display
function updateTimerDisplay() {
    const seconds = String(gameState.elapsedTime).padStart(2, '0');
    const hundredths = String(gameState.elapsedTimeHundredths).padStart(2, '0');
    timerDisplay.textContent = `${seconds}:${hundredths}`;
}

// Function for the guess timer
function startGuessTimer() {
    // Reset the guess timer
    gameState.guessTimeRemaining = 10;
    gameState.guessTimerActive = true;

    // Reset and show the timer overlay
    buttonTimer.style.width = '0%';
    buttonTimer.classList.add('active');

    // Clear any existing timer
    if (gameState.guessTimer) clearInterval(gameState.guessTimer);

    // Start the timer
    gameState.guessTimer = setInterval(() => {
        gameState.guessTimeRemaining -= 0.1; // Decrease by 0.1 seconds for smoother transition

        // Update the button timer width (grows from right to left)
        const percentage = 100 - ((gameState.guessTimeRemaining / 10) * 100);
        buttonTimer.style.width = `${percentage}%`;

        // If time runs out
        if (gameState.guessTimeRemaining <= 0) {
            clearInterval(gameState.guessTimer);
            gameState.guessTimerActive = false;

            // Hide the timer overlay
            buttonTimer.classList.remove('active');
            buttonTimer.style.width = '0%';

            // Exit guess mode and continue gameplay
            exitGuessMode();

            // Flash red to indicate time ran out
            canvas.classList.add('incorrect');
            setTimeout(() => {
                canvas.classList.remove('incorrect');
            }, 500);
        }
    }, 100); // Update every 100ms for smooth animation
}

// Enter guess mode
function enterGuessMode() {
    log("Entering guess mode");

    // If already in guess mode, reset the timer instead of toggling
    if (gameState.guessMode) {
        startGuessTimer(); // Restart the timer
        guessInput.focus(); // Re-focus the input
        return;
    }

    // Pause animation and timer
    gameState.guessMode = true;

    // Start the guess timer
    startGuessTimer();

    // Show input field
    guessInput.style.display = 'block';
    guessInput.focus();
    guessInput.value = gameState.currentInput;

    // Focus and show keyboard on mobile
    if (window.innerWidth <= 768) {
        setTimeout(() => {
            guessInput.click();
        }, 100);
    }
}

// Exit guess mode
function exitGuessMode() {
    log("Exiting guess mode");

    // Resume animation and timer
    gameState.guessMode = false;

    // Stop the guess timer
    if (gameState.guessTimer) clearInterval(gameState.guessTimer);
    gameState.guessTimerActive = false;

    // Hide the timer overlay and reset it
    buttonTimer.classList.remove('active');
    buttonTimer.style.width = '0%';

    // Hide input field
    guessInput.style.display = 'none';
    guessInput.blur();
}

// Handle user input when guessing
function handleLetterInput(input) {
    const currentWord = gameState.drawingData.name;
    const upperInput = input.toUpperCase();
    gameState.currentInput = upperInput;

    // Compare input with answer, tracking correct letters
    let allCorrect = true;
    let anyIncorrect = false;

    // Process each character of the input
    for (let i = 0; i < upperInput.length; i++) {
        if (i < currentWord.length) {
            if (upperInput[i] === currentWord[i]) {
                // Mark this letter as correct
                gameState.correctLetters[i] = upperInput[i];
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
        log("Incorrect input");

        // Show incorrect feedback animation
        canvas.classList.add('incorrect');
        setTimeout(() => {
            canvas.classList.remove('incorrect');
        }, 500);

        // Reset input to show only correct letters collected so far
        let correctInput = '';
        for (let i = 0; i < gameState.correctLetters.length; i++) {
            correctInput += gameState.correctLetters[i] ? gameState.correctLetters[i] : '';
        }
        gameState.currentInput = correctInput;
        guessInput.value = correctInput;
    }

    // Check if complete correct answer
    if (allCorrect && upperInput === currentWord) {
        log("Correct answer!");

        // Stop the guess timer
        if (gameState.guessTimer) clearInterval(gameState.guessTimer);
        gameState.guessTimerActive = false;

        // Hide the timer overlay and reset it
        buttonTimer.classList.remove('active');
        buttonTimer.style.width = '0%';

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

// Redraw canvas
function redrawCanvas() {
    // Clear the canvas
    clearCanvas();

    // Set a white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw all dots first if in easy mode
    if (gameState.difficulty === 'easy') {
        drawDots();
    }

    // Then draw lines
    drawLines();

    // Finally draw word spaces in easy mode
    if (gameState.difficulty === 'easy') {
        drawWordSpaces();
    }

    log("Canvas redrawn");
}

// End the current game
function endGame(success) {
    log("Ending game, success:", success);

    // Clear all timers
    clearInterval(gameState.elapsedTimer);
    clearInterval(gameState.guessTimer);

    // Hide the timer overlay and reset it
    buttonTimer.classList.remove('active');
    buttonTimer.style.width = '0%';

    // Reset state
    gameState.gameStarted = false;
    gameState.timerActive = false;
    gameState.guessMode = false;
    gameState.guessTimerActive = false;

    // Update puzzle state in menu if successful
    if (success) {
        const time = gameState.elapsedTime + (gameState.elapsedTimeHundredths / 100);
        if (typeof updatePuzzleCompletion === 'function') {
            updatePuzzleCompletion(gameState.currentColor, time);
        }
    }

    // Switch to main menu
    if (typeof showMainMenu === 'function') {
        showMainMenu();
    }
}

// Drawing Functions
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Draw the dots
function drawDots() {
    if (!gameState.drawingData || !gameState.drawingData.dots) {
        log("No dot data to draw");
        return;
    }

    const dotRadius = 5;

    gameState.drawingData.dots.forEach((dot, index) => {
        if (!dot) return;

        // Scale dot positions to fit canvas size
        const x = Math.round((dot.x / 400) * canvas.width);
        const y = Math.round((dot.y / 400) * canvas.height);

        // Draw dot
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();

        // Draw dot index
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '8px Arial';
        ctx.fillText(index.toString(), x, y);
    });
}

// Draw the lines
function drawLines() {
    if (!gameState.drawingData || !gameState.drawingData.sequence) {
        log("No line data to draw");
        return;
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;

    for (let i = 0; i < gameState.drawingProgress; i++) {
        if (i < gameState.drawingData.sequence.length) {
            const line = gameState.drawingData.sequence[i];
            if (!line) continue;

            const from = gameState.drawingData.dots[line.from];
            const to = gameState.drawingData.dots[line.to];

            if (!from || !to) continue;

            // Scale line positions to fit canvas size
            const fromX = Math.round((from.x / 400) * canvas.width);
            const fromY = Math.round((from.y / 400) * canvas.height);
            const toX = Math.round((to.x / 400) * canvas.width);
            const toY = Math.round((to.y / 400) * canvas.height);

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
        }
    }
}

// Draw the word spaces
function drawWordSpaces() {
    // Only draw word spaces in easy mode
    if (gameState.difficulty !== 'easy' || !gameState.drawingData) return;

    const answer = gameState.drawingData.name;
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
            if (gameState.correctLetters[i]) {
                ctx.fillText(gameState.correctLetters[i], x, y - 5);
            }
        } else {
            // For spaces, just add a visible gap
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(x - 5, y - 2, 10, 2);
            ctx.fillStyle = '#333';
        }
    }
}

// Initialize the game functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);

// Monitor window load to ensure everything is ready
window.addEventListener('load', function() {
    log("Window fully loaded");
    setTimeout(function() {
        if (canvas) {
            // Force another canvas check after everything loads
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = '#ddd';
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
        }
    }, 200);
});
