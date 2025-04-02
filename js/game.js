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
    guessTimer: null,
    // Animation properties
    animationId: null,
    pendingAnimationStart: false,
    // Canvas properties
    canvasReady: false,
    // Scaling properties
    scaling: null
};

// DOM elements
let canvas, ctx, timerDisplay, guessInput, beginButton, wrongMessage, backButton, buttonTimer;
let wordSpacesDiv; // New element for word spaces

// Simple logging function for debugging
function log(message) {
    console.log(`[AnticipationGame] ${message}`);
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

    // Create word spaces div if it doesn't exist
    if (!document.getElementById('wordSpacesDiv')) {
        createWordSpacesDiv();
    } else {
        wordSpacesDiv = document.getElementById('wordSpacesDiv');
    }

    // Set up canvas with improved initialization
    initializeGameCanvas();

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

// Create the word spaces div
function createWordSpacesDiv() {
    // Create the div for word spaces
    wordSpacesDiv = document.createElement('div');
    wordSpacesDiv.id = 'wordSpacesDiv';
    wordSpacesDiv.style.width = '100%';
    wordSpacesDiv.style.height = '50px';
    wordSpacesDiv.style.marginTop = '10px';
    wordSpacesDiv.style.textAlign = 'center';
    wordSpacesDiv.style.position = 'relative';

    // Insert it after the canvas container
    const canvasContainer = canvas.parentElement;
    if (canvasContainer && canvasContainer.parentElement) {
        canvasContainer.parentElement.insertBefore(wordSpacesDiv, canvasContainer.nextSibling);
    }
}

// Improved canvas initialization
function initializeGameCanvas() {
    log("Setting up canvas with improved initialization...");

    // Get a standard 2D context with explicit options for better performance
    ctx = canvas.getContext('2d', {
        alpha: false,          // Disable alpha for better performance
        desynchronized: false, // Ensure synchronous rendering
        willReadFrequently: false
    });

    // Ensure the canvas container is visible
    const container = canvas.parentElement;
    if (container) {
        container.style.visibility = 'visible';
        container.style.opacity = '1';
    }

    // Set proper dimensions immediately
    resizeCanvasProperly();

    // Draw initial content to ensure browser initializes canvas properly
    preRenderCanvas();

    // Add a slight delay before finalizing initialization
    setTimeout(() => {
        // Mark canvas as ready
        gameState.canvasReady = true;
        log("Canvas fully initialized and ready");
    }, 100);
}

// Comprehensive canvas resize function accounting for device pixel ratio
function resizeCanvasProperly() {
    const container = canvas.parentElement;
    if (!container) return;

    // Get the container's bounding rectangle
    const rect = container.getBoundingClientRect();
    const displayWidth = rect.width;
    const displayHeight = rect.height;

    // Calculate device pixel ratio for high-DPI displays
    const devicePixelRatio = window.devicePixelRatio || 1;

    // Set actual size in memory (scaled for retina)
    canvas.width = displayWidth * devicePixelRatio;
    canvas.height = displayHeight * devicePixelRatio;

    // Scale all drawing operations by the device pixel ratio
    ctx.scale(devicePixelRatio, devicePixelRatio);

    // Set display size (CSS pixels)
    canvas.style.width = displayWidth + "px";
    canvas.style.height = displayHeight + "px";

    log(`Canvas resized: ${displayWidth}x${displayHeight}, ratio: ${devicePixelRatio}`);

    // Reset scaling to force recalculation with new dimensions
    gameState.scaling = null;

    // If game is active, redraw content
    if (gameState.gameStarted) {
        renderFrame();
    } else {
        // Just draw a clean background if game isn't active
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, displayWidth, displayHeight);
        ctx.strokeStyle = '#ddd';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, displayWidth, displayHeight);
    }
}

// Pre-render to ensure the browser has initialized the canvas properly
function preRenderCanvas() {
    // Clear with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw a border
    ctx.strokeStyle = '#cccccc';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // Draw and immediately clear a temporary element to ensure rendering
    // This forces the browser to commit the initial render
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(10, 10, 50, 50);
    setTimeout(() => {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(10, 10, 50, 50);
    }, 0);
}

// Reliable rendering function that handles all drawing operations
function renderFrame() {
    if (!canvas || !ctx) return;

    // Get logical size in CSS pixels
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Clear the entire canvas
    ctx.clearRect(0, 0, displayWidth, displayHeight);

    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, displayWidth, displayHeight);

    // Draw grid lines for reference (uncomment for debugging)
    // drawGridLines();

    // In easy mode, draw dots first
    if (gameState.difficulty === 'easy') {
        drawDots();
    }

    // Always draw lines based on current progress
    drawLines();

    // Draw word spaces in their separate div
    if (gameState.difficulty === 'easy') {
        updateWordSpacesDiv();
    }
}

// Set up game-specific event listeners
function setupGameEventListeners() {
    // Window resize event with debounce for performance
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizeCanvasProperly();
        }, 100);
    });

    // Add visibility change event
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden && gameState.gameStarted) {
            log("Page became visible, redrawing canvas");

            // Cancel any existing animation
            if (gameState.animationId) {
                cancelAnimationFrame(gameState.animationId);
                gameState.animationId = null;
            }

            // Ensure canvas is properly sized then render
            resizeCanvasProperly();

            // Restart animation if needed
            if (gameState.gameStarted && !gameState.guessMode && gameState.pendingAnimationStart) {
                improvedDrawingAnimation();
            }
        }
    });

    // Back button
    backButton.addEventListener('click', () => {
        endGame(false);
    });

    // Begin/Guess button
    beginButton.addEventListener('click', () => {
        if (!gameState.gameStarted) {
            startDrawingImproved();
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

    // Add touch event to canvas (with passive: false to prevent scrolling)
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        log("Canvas touch detected");

        // Ensure canvas is properly rendered
        if (gameState.gameStarted) {
            renderFrame();
        }
    }, { passive: false });

    // Add orientation change listener for mobile
    window.addEventListener('orientationchange', function() {
        log("Orientation changed");

        // Wait for orientation change to complete then resize
        setTimeout(() => {
            resizeCanvasProperly();
        }, 200);
    });
}

// Start a new game with the selected category
async function startGame(color, category) {
    log(`Starting game: ${category} (${color})`);

    try {
        // Try to load the exported JSON file
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

    // Cancel any existing animation
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }

    // Update game state
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
    gameState.pendingAnimationStart = false;
    gameState.scaling = null;

    // Clear word spaces div
    if (wordSpacesDiv) {
        wordSpacesDiv.innerHTML = '';
    }

    // Switch to game screen using the menu function
    if (typeof showGameScreen === 'function') {
        showGameScreen();
    }

    // Set background color based on category
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

    // Ensure canvas is properly sized and clean
    setTimeout(() => {
        resizeCanvasProperly();
    }, 100);
}

// Improved drawing start function
function startDrawingImproved() {
    log("Starting drawing animation with improved method");

    // Update game state
    gameState.gameStarted = true;
    gameState.timerActive = true;
    gameState.pendingAnimationStart = true;
    beginButton.querySelector('span').textContent = 'Guess';

    // Clear any existing timers
    if (gameState.elapsedTimer) clearInterval(gameState.elapsedTimer);
    if (gameState.guessTimer) clearInterval(gameState.guessTimer);
    if (gameState.animationId) cancelAnimationFrame(gameState.animationId);

    // Ensure canvas is properly sized
    resizeCanvasProperly();

    // Start the timer counting up
    startElapsedTimer();

    // Draw initial state
    if (gameState.difficulty === 'easy') {
        drawDots();
        updateWordSpacesDiv();
    }

    // Start animation with a short delay to ensure rendering is ready
    setTimeout(() => {
        improvedDrawingAnimation();
    }, 50);
}

// Improved animation function with reliable timing
function improvedDrawingAnimation() {
    // Prepare animation state
    const totalSequenceLength = gameState.drawingData.sequence.length;
    const timePerLine = 300; // 300ms per line

    log(`Starting animation: ${totalSequenceLength} lines, ${timePerLine}ms per line`);

    // Reset animation state
    cancelAnimationFrame(gameState.animationId);
    gameState.drawingProgress = 0;

    // Draw the first line immediately
    gameState.drawingProgress = 1;
    renderFrame();

    // Track timing
    let lastUpdateTime = 0;
    let accumulatedTime = 0;

    // Animation frame handler
    function animate(timestamp) {
        // Initialize timing on first frame
        if (!lastUpdateTime) {
            lastUpdateTime = timestamp;
            gameState.animationId = requestAnimationFrame(animate);
            return;
        }

        // Calculate time delta
        const deltaTime = timestamp - lastUpdateTime;
        lastUpdateTime = timestamp;
        accumulatedTime += deltaTime;

        // Update animation based on accumulated time
        if (accumulatedTime >= timePerLine) {
            // Draw the next line when enough time has passed
            if (gameState.drawingProgress < totalSequenceLength) {
                gameState.drawingProgress++;
                renderFrame();
                log(`Drawing line ${gameState.drawingProgress} of ${totalSequenceLength}`);
                accumulatedTime -= timePerLine;
            }
        }

        // Continue animation if not complete and game is still active
        if (gameState.drawingProgress < totalSequenceLength &&
            gameState.gameStarted && !gameState.guessMode) {
            gameState.animationId = requestAnimationFrame(animate);
        } else {
            gameState.pendingAnimationStart = false;
            log("Animation complete or interrupted");
        }
    }

    // Start animation loop
    gameState.animationId = requestAnimationFrame(animate);
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

    // Cancel any ongoing animation
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }

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

    // Restart animation if needed
    if (gameState.pendingAnimationStart) {
        improvedDrawingAnimation();
    }
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

    // Update word spaces to show current state
    updateWordSpacesDiv();

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
    renderFrame();
}

// End the current game
function endGame(success) {
    log("Ending game, success:", success);

    // Cancel any ongoing animation
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }

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
    gameState.pendingAnimationStart = false;
    gameState.scaling = null;

    // Clear word spaces div
    if (wordSpacesDiv) {
        wordSpacesDiv.innerHTML = '';
    }

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

// Calculate scaling to exactly match builder view
function calculateScaling() {
    if (!gameState.drawingData) {
        return;
    }

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Make the drawing fill almost the entire canvas area
    // This ensures we match exactly how it looks in the builder
    const canvasPercentage = 0.9; // Use 90% of the canvas area

    // Calculate the maximum size while maintaining aspect ratio
    const size = Math.min(displayWidth, displayHeight) * canvasPercentage;

    // Ensure we're using a 1:1 aspect ratio as in the builder
    const scale = size / 400; // Builder uses a 400x400 area

    // Center the drawing in the canvas
    const offsetX = (displayWidth - size) / 2;
    const offsetY = (displayHeight - size) / 2;

    gameState.scaling = {
        scale: scale,
        offsetX: offsetX,
        offsetY: offsetY,
        gridSize: 16 // Fixed 16x16 grid (17x17 points)
    };

    log(`Scaling calculated: scale=${scale}, offset=(${offsetX},${offsetY})`);
}

// Draw dots using exact builder scaling
function drawDots() {
    if (!gameState.drawingData || !gameState.drawingData.dots) {
        log("No dot data to draw");
        return;
    }

    // Calculate scaling if not done yet
    if (!gameState.scaling) {
        calculateScaling();
    }

    const scaling = gameState.scaling;
    const dotRadius = 5;

    gameState.drawingData.dots.forEach((dot, index) => {
        if (!dot) return;

        // Apply scaling directly from builder coordinates
        const x = (dot.x * scaling.scale) + scaling.offsetX;
        const y = (dot.y * scaling.scale) + scaling.offsetY;

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

// Draw lines using exact builder scaling
function drawLines() {
    if (!gameState.drawingData || !gameState.drawingData.sequence) {
        log("No line data to draw");
        return;
    }

    // Calculate scaling if not done yet
    if (!gameState.scaling) {
        calculateScaling();
    }

    const scaling = gameState.scaling;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < gameState.drawingProgress; i++) {
        if (i < gameState.drawingData.sequence.length) {
            const line = gameState.drawingData.sequence[i];
            if (!line) continue;

            const from = gameState.drawingData.dots[line.from];
            const to = gameState.drawingData.dots[line.to];

            if (!from || !to) continue;

            // Apply scaling directly from builder coordinates
            const fromX = (from.x * scaling.scale) + scaling.offsetX;
            const fromY = (from.y * scaling.scale) + scaling.offsetY;
            const toX = (to.x * scaling.scale) + scaling.offsetX;
            const toY = (to.y * scaling.scale) + scaling.offsetY;

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
        }
    }
}

// Update the word spaces in the separate div
function updateWordSpacesDiv() {
    // Only update word spaces in easy mode
    if (gameState.difficulty !== 'easy' || !gameState.drawingData) return;

    if (!wordSpacesDiv) return;

    const answer = gameState.drawingData.name;

    // Clear existing content
    wordSpacesDiv.innerHTML = '';

    // Create a container for the letters
    const letterContainer = document.createElement('div');
    letterContainer.style.display = 'flex';
    letterContainer.style.justifyContent = 'center';
    letterContainer.style.alignItems = 'center';
    letterContainer.style.height = '100%';

    // Add word spaces
    for (let i = 0; i < answer.length; i++) {
        const letterDiv = document.createElement('div');
        letterDiv.style.position = 'relative';
        letterDiv.style.width = '30px';
        letterDiv.style.height = '40px';
        letterDiv.style.margin = '0 5px';
        letterDiv.style.display = 'inline-block';
        letterDiv.style.textAlign = 'center';

        if (answer[i] !== ' ') {
            // Add underline
            const underline = document.createElement('div');
            underline.style.position = 'absolute';
            underline.style.bottom = '0';
            underline.style.left = '0';
            underline.style.width = '100%';
            underline.style.height = '2px';
            underline.style.backgroundColor = '#333';
            letterDiv.appendChild(underline);

            // Add letter if it exists in correctLetters
            if (gameState.correctLetters[i]) {
                const letterSpan = document.createElement('span');
                letterSpan.style.fontSize = '24px';
                letterSpan.style.fontWeight = 'bold';
                letterSpan.textContent = gameState.correctLetters[i];
                letterDiv.appendChild(letterSpan);
            }
        } else {
            // For spaces, add a visible gap
            const spacer = document.createElement('div');
            spacer.style.width = '100%';
            spacer.style.height = '100%';
            letterDiv.appendChild(spacer);
        }

        letterContainer.appendChild(letterDiv);
    }

    wordSpacesDiv.appendChild(letterContainer);
}

// Draw grid lines for debugging
function drawGridLines() {
    if (!gameState.scaling) {
        calculateScaling();
    }

    const scaling = gameState.scaling;
    const GRID_SIZE = scaling.gridSize;

    // Calculate cell size based on the grid cells
    const cellSize = (400 / GRID_SIZE) * scaling.scale;

    ctx.strokeStyle = '#eee';
    ctx.lineWidth = 1;

    // Draw vertical grid lines
    for (let i = 0; i <= GRID_SIZE; i++) {
        const x = scaling.offsetX + (i * cellSize);
        ctx.beginPath();
        ctx.moveTo(x, scaling.offsetY);
        ctx.lineTo(x, scaling.offsetY + (GRID_SIZE * cellSize));
        ctx.stroke();
    }

    // Draw horizontal grid lines
    for (let i = 0; i <= GRID_SIZE; i++) {
        const y = scaling.offsetY + (i * cellSize);
        ctx.beginPath();
        ctx.moveTo(scaling.offsetX, y);
        ctx.lineTo(scaling.offsetX + (GRID_SIZE * cellSize), y);
        ctx.stroke();
    }
}

// Compatibility functions for existing code
function clearCanvas() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
}

function redrawCanvas() {
    renderFrame();
}

function startDrawing() {
    startDrawingImproved();
}

// Initialize the game functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);

// Monitor window load to ensure everything is ready
window.addEventListener('load', function() {
    log("Window fully loaded");

    // Force another init check after everything loads
    setTimeout(function() {
        if (canvas && !gameState.canvasReady) {
            log("Reinitializing canvas after full page load");
            initializeGameCanvas();
        }
    }, 300);
});
