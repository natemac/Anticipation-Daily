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
    correctLetters: [],
    // New guess timer properties
    guessTimeRemaining: 10,
    guessTimerActive: false,
    guessTimer: null,
    // Canvas rendering flags
    canvasInitialized: false,
    renderAttempts: 0
};

// DOM elements
let mainScreen, gameScreen, colorSquares, difficultyToggle, backButton, canvas,
    ctx, timerDisplay, guessInput, beginButton, wrongMessage, shareButton, buttonTimer;

// Initialize the game
function initGame() {
    console.log("Initializing game...");

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
    buttonTimer = document.getElementById('buttonTimer');

    // Set up canvas with aggressive initialization
    setupCanvas();

    // Set event listeners
    setupEventListeners();

    // Initialize difficulty toggle
    initDifficultyToggle();

    // Force initial canvas render
    forceCanvasRedraw();
}

// Set up canvas with aggressive techniques to ensure it renders
function setupCanvas() {
    console.log("Setting up canvas...");

    // Get and set up the context
    ctx = canvas.getContext('2d', { alpha: false }); // Disable alpha for better performance

    // Set explicit dimensions
    resizeCanvas();

    // Ensure visible background
    canvas.style.backgroundColor = '#ffffff';

    // Force a repaint by toggling a property
    canvas.style.display = 'none';
    void canvas.offsetHeight; // Force reflow
    canvas.style.display = 'block';

    // Try drawing something immediately
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.rect(10, 10, canvas.width-20, canvas.height-20);
    ctx.stroke();

    state.canvasInitialized = true;
    console.log("Canvas setup complete. Size:", canvas.width, "x", canvas.height);
}

// Function to force canvas redraw on mobile
function forceCanvasRedraw() {
    console.log("Forcing canvas redraw...");
    state.renderAttempts++;

    // Change a property to force reflow
    canvas.style.opacity = '0.99';
    setTimeout(() => {
        canvas.style.opacity = '1';

        // Force immediate redraw
        ctx.save();
        clearCanvas();

        // Try drawing a simple shape to kickstart rendering
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // If we're in a game, redraw the game state
        if (state.gameStarted) {
            redrawCanvas();
        }

        ctx.restore();
    }, 50);
}

// Resize canvas to match container
function resizeCanvas() {
    const container = canvas.parentElement;
    const oldWidth = canvas.width;
    const oldHeight = canvas.height;

    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;

    console.log("Canvas resized from", oldWidth, "x", oldHeight, "to", canvas.width, "x", canvas.height);

    // Force a redraw after resize
    if (state.gameStarted) {
        setTimeout(forceCanvasRedraw, 10);
    }
}

// Set up event listeners
function setupEventListeners() {
    console.log("Setting up event listeners...");

    // Window resize event
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    // Visibility change event to handle tab switching
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && state.gameStarted) {
            console.log("Page became visible, forcing redraw");
            setTimeout(forceCanvasRedraw, 100);
        }
    });

    // Add various events to force canvas rendering
    document.addEventListener('touchstart', function(e) {
        if (state.gameStarted && state.renderAttempts < 5) {
            console.log("Touch detected, forcing redraw");
            forceCanvasRedraw();
        }
    }, {passive: false});

    canvas.addEventListener('touchstart', function(e) {
        // Prevent default to avoid scrolling
        e.preventDefault();
        console.log("Canvas touch detected");

        // Force redraw if the game has started
        if (state.gameStarted) {
            forceCanvasRedraw();
        }
    }, { passive: false });

    // Also add a click event for desktop
    canvas.addEventListener('click', function() {
        console.log("Canvas click detected");
        if (state.gameStarted) {
            forceCanvasRedraw();
        }
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

    console.log("Event listeners setup complete");
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
    console.log(`Starting game: ${category} (${color})`);
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
        console.log('Error in game startup, using default data:', error);
        startGameWithData(color, category, gameData[color]);
    }
}

// Function to start game with provided data
function startGameWithData(color, category, data) {
    console.log("Starting game with data:", data);
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
    state.guessTimeRemaining = 10;
    state.guessTimerActive = false;
    state.renderAttempts = 0;

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
    beginButton.querySelector('span').textContent = 'Begin';
    canvas.classList.remove('incorrect');
    buttonTimer.classList.remove('active');
    buttonTimer.style.width = '0%';

    // Aggressively reset and re-render the canvas
    ctx.save();
    clearCanvas();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    // Force canvas to show by changing layout properties
    canvas.style.display = 'none';
    void canvas.offsetHeight; // Force reflow
    canvas.style.display = 'block';

    // Force additional redraw after a short delay
    setTimeout(forceCanvasRedraw, 100);
}

function startDrawing() {
    console.log("Starting drawing animation");
    // Change to game started state
    state.gameStarted = true;
    state.timerActive = true;
    beginButton.querySelector('span').textContent = 'Guess';

    // Clear any existing timers
    if (state.animationTimer) clearInterval(state.animationTimer);
    if (state.elapsedTimer) clearInterval(state.elapsedTimer);
    if (state.guessTimer) clearInterval(state.guessTimer);

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

    // Force an immediate initial draw
    clearCanvas();
    redrawCanvas();

    // Force immediate repaint
    forceCanvasRedraw();

    // Use requestAnimationFrame to ensure smooth rendering
    requestAnimationFrame(() => {
        // Draw something immediately to "kick" the rendering engine
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);

        // Start drawing animation
        const totalSequenceLength = state.drawingData.sequence.length;
        const timePerLine = 10000 / totalSequenceLength; // Complete drawing in 10 seconds

        // Now start the animation with setInterval
        state.animationTimer = setInterval(() => {
            if (!state.guessMode && state.gameStarted) {
                state.drawingProgress++;
                console.log(`Drawing progress: ${state.drawingProgress}/${totalSequenceLength}`);

                // Make the redraw more aggressive
                ctx.save();

                // Redraw the canvas with updated progress
                redrawCanvas();

                ctx.restore();

                // When drawing is complete, stop the animation timer but keep the time counting
                if (state.drawingProgress >= totalSequenceLength) {
                    console.log("Drawing animation complete");
                    clearInterval(state.animationTimer);
                }
            }
        }, timePerLine);
    });
}

function startElapsedTimer() {
    console.log("Starting elapsed timer");
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

// Function for the guess timer
function startGuessTimer() {
    console.log("Starting guess timer");
    // Reset the guess timer
    state.guessTimeRemaining = 10;
    state.guessTimerActive = true;

    // Reset and show the timer overlay
    buttonTimer.style.width = '0%';
    buttonTimer.classList.add('active');

    // Clear any existing timer
    if (state.guessTimer) {
        clearInterval(state.guessTimer);
    }

    // Start the timer
    state.guessTimer = setInterval(() => {
        state.guessTimeRemaining -= 0.1; // Decrease by 0.1 seconds for smoother transition

        // Update the button timer width (grows from right to left)
        const percentage = 100 - ((state.guessTimeRemaining / 10) * 100);
        buttonTimer.style.width = `${percentage}%`;

        // If time runs out
        if (state.guessTimeRemaining <= 0) {
            clearInterval(state.guessTimer);
            state.guessTimerActive = false;

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

function enterGuessMode() {
    console.log("Entering guess mode");
    // If already in guess mode, reset the timer instead of toggling
    if (state.guessMode) {
        startGuessTimer(); // Restart the timer
        guessInput.focus(); // Re-focus the input
        return;
    }

    // Pause animation and timer
    state.guessMode = true;

    // Start the guess timer
    startGuessTimer();

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
    console.log("Exiting guess mode");
    // Resume animation and timer
    state.guessMode = false;

    // Stop the guess timer
    if (state.guessTimer) {
        clearInterval(state.guessTimer);
        state.guessTimerActive = false;
    }

    // Hide the timer overlay and reset it
    buttonTimer.classList.remove('active');
    buttonTimer.style.width = '0%';

    // Hide input field
    guessInput.style.display = 'none';
    guessInput.blur();

    // Force canvas redraw
    forceCanvasRedraw();
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
        console.log("Incorrect input");
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
        console.log("Correct answer!");
        // Stop the guess timer
        if (state.guessTimer) {
            clearInterval(state.guessTimer);
            state.guessTimerActive = false;
        }

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

    // Force redraw to show correct letters
    redrawCanvas();
}

function redrawCanvas() {
    // Don't bother redrawing if canvas isn't initialized
    if (!state.canvasInitialized) return;

    clearCanvas();

    // Force a visual change to the canvas to ensure it repaints
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a border to ensure something is visible
    ctx.strokeStyle = '#eeeeee';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    if (state.difficulty === 'easy') {
        drawDots();
        drawWordSpaces();
    }

    drawLines();
}

function endGame(success) {
    console.log("Ending game, success:", success);
    // Clear all timers
    clearInterval(state.animationTimer);
    clearInterval(state.elapsedTimer);
    clearInterval(state.guessTimer);

    // Hide the timer overlay and reset it
    buttonTimer.classList.remove('active');
    buttonTimer.style.width = '0%';

    // Reset state
    state.gameStarted = false;
    state.timerActive = false;
    state.guessMode = false;
    state.guessTimerActive = false;

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

    if (!state.drawingData || !state.drawingData.dots) {
        console.error("No dot data to draw");
        return;
    }

    const data = state.drawingData;
    const dotRadius = 5;

    ctx.fillStyle = '#333';
    data.dots.forEach((dot, index) => {
        if (!dot) {
            console.error(`Invalid dot at index ${index}`);
            return;
        }

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
    if (!data || !data.sequence || !data.dots) {
        console.error("No line data to draw");
        return;
    }

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;

    for (let i = 0; i < state.drawingProgress; i++) {
        if (i < data.sequence.length) {
            const line = data.sequence[i];
            if (!line || line.from === undefined || line.to === undefined) {
                console.error(`Invalid line at index ${i}`);
                continue;
            }

            const from = data.dots[line.from];
            const to = data.dots[line.to];

            if (!from || !to) {
                console.error(`Invalid dot reference in line ${i}: from=${line.from}, to=${line.to}`);
                continue; // Skip invalid lines
            }

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
    if (state.difficulty === 'hard' || !state.drawingData) return;

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

// Add an extra redraw on window focus
window.addEventListener('focus', function() {
    if (state.gameStarted) {
        setTimeout(forceCanvasRedraw, 100);
    }
});

// Additional initialization when page is fully loaded
window.addEventListener('load', function() {
    // Give extra time for all resources to load
    setTimeout(function() {
        if (canvas) {
            console.log("Window load complete, forcing canvas redraw");
            forceCanvasRedraw();
        }
    }, 200);

    // Additional force redraw after a longer delay
    setTimeout(function() {
        if (canvas && state.gameStarted) {
            console.log("Final attempt to force canvas redraw");
            forceCanvasRedraw();
        }
    }, 1000);
});

// Mobile-specific workaround for iOS/Safari
if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
    console.log("iOS device detected, adding special handling");

    // Add a touchmove handler that might help trigger repaints
    document.addEventListener('touchmove', function() {
        if (state.gameStarted && !state.guessMode) {
            // This creates a tiny visual change that forces browser repaint
            canvas.style.transform = 'translateZ(0)';
            setTimeout(() => {
                canvas.style.transform = '';
            }, 50);
        }
    }, { passive: true });

    // iOS specific hack: create a tiny animation to keep rendering active
    function keepCanvasAlive() {
        if (state.gameStarted) {
            // This invisible animation keeps the rendering engine active
            canvas.style.transform = 'translateZ(0.001px)';
            setTimeout(() => {
                canvas.style.transform = '';
                requestAnimationFrame(keepCanvasAlive);
            }, 100);
        }
    }

    // Start the keep-alive when the game starts
    document.addEventListener('click', function() {
        if (state.gameStarted) {
            keepCanvasAlive();
        }
    }, { once: true });
}

// Extra backup drawing method if all else fails
function emergencyRedraw() {
    console.log("Emergency redraw triggered");

    // If the canvas is still not showing after multiple attempts
    if (state.gameStarted && state.renderAttempts > 5) {
        console.log("Using emergency fallback drawing method");

        // Change canvas rendering approach
        // Create a new offscreen canvas
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const offCtx = offscreen.getContext('2d');

        // Draw everything to the offscreen canvas
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, offscreen.width, offscreen.height);

        // Draw dots and lines if we have data
        if (state.drawingData && state.drawingData.dots && state.drawingData.sequence) {
            // Draw dots
            if (state.difficulty === 'easy') {
                offCtx.fillStyle = '#333';
                state.drawingData.dots.forEach(dot => {
                    if (dot) {
                        const x = (dot.x / 400) * offscreen.width;
                        const y = (dot.y / 400) * offscreen.height;

                        offCtx.beginPath();
                        offCtx.arc(x, y, 5, 0, Math.PI * 2);
                        offCtx.fill();
                    }
                });
            }

            // Draw lines
            offCtx.strokeStyle = '#000';
            offCtx.lineWidth = 3;

            for (let i = 0; i < state.drawingProgress; i++) {
                if (i < state.drawingData.sequence.length) {
                    const line = state.drawingData.sequence[i];
                    if (line && state.drawingData.dots[line.from] && state.drawingData.dots[line.to]) {
                        const from = state.drawingData.dots[line.from];
                        const to = state.drawingData.dots[line.to];

                        const fromX = (from.x / 400) * offscreen.width;
                        const fromY = (from.y / 400) * offscreen.height;
                        const toX = (to.x / 400) * offscreen.width;
                        const toY = (to.y / 400) * offscreen.height;

                        offCtx.beginPath();
                        offCtx.moveTo(fromX, fromY);
                        offCtx.lineTo(toX, toY);
                        offCtx.stroke();
                    }
                }
            }
        }

        // Transfer the offscreen canvas to the visible canvas using drawImage
        ctx.drawImage(offscreen, 0, 0);

        // Draw an attention-grabbing border
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
    }
}

// Create a MutationObserver to detect when the canvas becomes visible
const canvasObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (mutation.attributeName === 'style' && canvas.offsetWidth > 0 && canvas.offsetHeight > 0) {
            console.log("Canvas became visible, forcing redraw");
            setTimeout(forceCanvasRedraw, 10);
        }
    });
});

// Start observing the canvas
if (canvas) {
    canvasObserver.observe(canvas, { attributes: true });
}

// Last resort - try emergency redraw after a delay
setTimeout(emergencyRedraw, 3000);
