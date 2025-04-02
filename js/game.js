// Game mechanics for Daily Anticipation
let gameActive = false;
let gameData = null;
let gameTimer = null;
let remainingTime = 300; // 5 minutes in seconds
let currentCategory = null;
let currentDifficulty = 'easy';
let wordToGuess = '';
let animationFrameId = null;
let drawingSequence = [];
let animationProgress = 0;
let isAnimating = false;

// DOM Elements
let drawingCanvas, ctx;
let timerElement, wordSpacesElement, guessInput, guessButton, gameMessage;

// Initialize the game
document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    drawingCanvas = document.getElementById('drawingCanvas');
    ctx = drawingCanvas.getContext('2d');
    timerElement = document.getElementById('timer');
    wordSpacesElement = document.getElementById('wordSpaces');
    guessInput = document.getElementById('guessInput');
    guessButton = document.getElementById('guessButton');
    gameMessage = document.getElementById('gameMessage');

    // Set up event listeners
    guessButton.addEventListener('click', handleGuess);
    guessInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleGuess();
        }
    });

    // Make sure canvas is properly sized
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
});

// Start a new game with selected category and difficulty
async function startGame(category, difficulty) {
    console.log(`Starting game: category=${category}, difficulty=${difficulty}`);

    try {
        // Reset game state
        gameActive = true;
        currentCategory = category;
        currentDifficulty = difficulty;
        remainingTime = 300; // 5 minutes
        isAnimating = false;

        // Clear UI
        clearCanvas();
        resetUI();

        // Show a loading message in the canvas
        showLoadingMessage("Loading game data...");

        // Load data for the selected category - await the async function
        gameData = await loadGameData(category);

        if (!gameData) {
            throw new Error("Game data is null or undefined");
        }

        console.log("Game data loaded successfully:", gameData);

        // Clear the loading message
        clearCanvas();

        // Set the word to guess
        wordToGuess = gameData.name.toUpperCase();
        console.log('Word to guess:', wordToGuess);

        // Set up the drawing sequence
        drawingSequence = prepareDrawingSequence(gameData);
        console.log(`Drawing sequence created with ${drawingSequence.length} lines`);

        // Set up word spaces
        setupWordSpaces(wordToGuess);

        // Start the timer
        startTimer();

        // Start the drawing animation
        startDrawingAnimation();
    } catch (error) {
        console.error('Error loading game data:', error);

        // Display error on canvas
        showErrorMessage(`Failed to load game data: ${error.message}`);

        // Show alert with more details
        alert(`Failed to load game data: ${error.message}\nPlease check that the items/${gameCategories[category]?.id || category}.json file exists and is valid.`);

        // Disable game state
        gameActive = false;

        // Go back to menu after a short delay
        setTimeout(() => {
            window.gameMenu.showScreen('menu');
        }, 2000);
    }
}

// Show a loading message on the canvas
function showLoadingMessage(message) {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '16px Arial';
    ctx.fillText(message, drawingCanvas.width/2, drawingCanvas.height/2);
}

// Show an error message on the canvas
function showErrorMessage(message) {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
    ctx.fillStyle = '#F44336';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 16px Arial';

    // Split message into multiple lines if too long
    const words = message.split(' ');
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        if (currentLine.length + words[i].length + 1 < 30) {
            currentLine += " " + words[i];
        } else {
            lines.push(currentLine);
            currentLine = words[i];
        }
    }
    lines.push(currentLine);

    // Draw each line
    const lineHeight = 24;
    const startY = drawingCanvas.height/2 - (lines.length - 1) * lineHeight / 2;

    lines.forEach((line, index) => {
        ctx.fillText(line, drawingCanvas.width/2, startY + index * lineHeight);
    });
}

// Load game data for a category
async function loadGameData(category) {
    console.log(`Loading game data for category: ${category}`);
    try {
        // Get today's item for the selected category
        const item = await getTodayItem(category);

        if (!item) {
            throw new Error(`No item found for category: ${category}`);
        }

        return item;
    } catch (error) {
        console.error('Error loading game data:', error);
        throw error;
    }
}

// Prepare the drawing sequence from game item data
function prepareDrawingSequence(item) {
    return item.sequence.map(seq => {
        return {
            from: item.dots[seq.from],
            to: item.dots[seq.to]
        };
    });
}

// Set up the word spaces UI
function setupWordSpaces(word) {
    wordSpacesElement.innerHTML = '';

    // Create a space for each letter
    for (let i = 0; i < word.length; i++) {
        const letterSpace = document.createElement('div');
        letterSpace.className = 'letter-space';

        // In easy mode, we'll show the first and last letter
        if (currentDifficulty === 'easy' && (i === 0 || i === word.length - 1)) {
            letterSpace.textContent = word[i];
        }

        wordSpacesElement.appendChild(letterSpace);
    }
}

// Start the countdown timer
function startTimer() {
    // Clear any existing timer
    if (gameTimer) {
        clearInterval(gameTimer);
    }

    // Update timer display
    updateTimerDisplay();

    // Set up interval for countdown
    gameTimer = setInterval(() => {
        remainingTime--;

        // Update timer display
        updateTimerDisplay();

        // Check if time's up
        if (remainingTime <= 0) {
            endGame(false); // Game over - ran out of time
        }
    }, 1000);
}

// Update the timer display
function updateTimerDisplay() {
    const minutes = Math.floor(remainingTime / 60);
    const seconds = remainingTime % 60;

    timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    // Change color based on remaining time
    if (remainingTime <= 60) { // Last minute
        timerElement.style.color = '#F44336'; // Red
    } else if (remainingTime <= 120) { // Last 2 minutes
        timerElement.style.color = '#FF9800'; // Orange
    } else {
        timerElement.style.color = ''; // Default
    }
}

// Start the drawing animation
function startDrawingAnimation() {
    // Reset animation state
    animationProgress = 0;
    isAnimating = true;

    // Start the animation loop
    animate();
}

// Animation loop for drawing
function animate() {
    // Clear canvas for fresh drawing
    if (animationProgress === 0) {
        clearCanvas();
    }

    // Calculate which lines to draw
    const totalLines = drawingSequence.length;
    const linesToDraw = Math.ceil(animationProgress * totalLines);

    // Draw all completed lines
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';

    for (let i = 0; i < linesToDraw; i++) {
        const line = drawingSequence[i];

        ctx.beginPath();
        ctx.moveTo(line.from.x, line.from.y);
        ctx.lineTo(line.to.x, line.to.y);
        ctx.stroke();
    }

    // Draw dots based on difficulty
    if (currentDifficulty === 'easy') {
        // Draw all dots in easy mode
        const dotsUsed = new Set();

        drawingSequence.forEach(line => {
            [line.from, line.to].forEach(dot => {
                // Use string key to identify unique dots
                const dotKey = `${dot.x},${dot.y}`;
                if (!dotsUsed.has(dotKey)) {
                    dotsUsed.add(dotKey);

                    // Draw the dot
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        });
    }

    // Increment progress
    animationProgress += 0.005; // Adjust for slower/faster animation

    // Continue animation if not complete
    if (animationProgress < 1 && isAnimating) {
        animationFrameId = requestAnimationFrame(animate);
    }
}

// Handle a guess submission
function handleGuess() {
    if (!gameActive) return;

    const guess = guessInput.value.trim().toUpperCase();

    // Clear the input
    guessInput.value = '';

    // Validate the guess
    if (guess.length === 0) {
        showMessage('Please enter a guess', 'incorrect');
        return;
    }

    // Check if the guess is correct
    if (guess === wordToGuess) {
        // Correct guess!
        endGame(true);
    } else {
        // Incorrect guess
        showMessage(`"${guess}" is incorrect. Try again!`, 'incorrect');
    }
}

// Show a game message
function showMessage(text, type) {
    gameMessage.textContent = text;
    gameMessage.className = 'game-message';

    if (type === 'correct') {
        gameMessage.classList.add('message-correct');
    } else if (type === 'incorrect') {
        gameMessage.classList.add('message-incorrect');
    }

    gameMessage.classList.remove('hidden');

    // Hide the message after a delay
    setTimeout(() => {
        gameMessage.classList.add('hidden');
    }, 3000);
}

// End the game
function endGame(isWin) {
    // Stop the timer
    clearInterval(gameTimer);

    // Stop the animation
    isAnimating = false;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }

    // Game is no longer active
    gameActive = false;

    if (isWin) {
        // Calculate time taken
        const timeElapsed = 300 - remainingTime; // in seconds
        const minutes = Math.floor(timeElapsed / 60);
        const seconds = timeElapsed % 60;
        const timeString = `${minutes}m ${seconds}s`;

        // Show congratulations message
        showMessage(`Congratulations! You guessed "${wordToGuess}" in ${timeString}!`, 'correct');

        // After a brief delay, show the result screen
        setTimeout(() => {
            window.gameMenu.showResult(wordToGuess, timeString);
        }, 2000);
    } else {
        // Game over - ran out of time
        showMessage(`Time's up! The word was "${wordToGuess}".`, 'incorrect');

        // After a delay, return to menu
        setTimeout(() => {
            window.gameMenu.showScreen('menu');
        }, 3000);
    }
}

// Reset UI elements
function resetUI() {
    // Clear message
    gameMessage.classList.add('hidden');

    // Clear input
    guessInput.value = '';

    // Enable input and button
    guessInput.disabled = false;
    guessButton.disabled = false;
}

// Resize canvas to maintain aspect ratio
function resizeCanvas() {
    const container = drawingCanvas.parentElement;
    const containerWidth = container.offsetWidth;

    // Set canvas size to match container while maintaining 1:1 aspect ratio
    drawingCanvas.width = containerWidth;
    drawingCanvas.height = containerWidth;

    // If we're in the middle of a game, redraw the current state
    if (gameActive && drawingSequence.length > 0) {
        redrawCurrentState();
    }
}

// Redraw the current state of the drawing
function redrawCurrentState() {
    // Clear canvas
    clearCanvas();

    // Calculate which lines to draw based on current progress
    const totalLines = drawingSequence.length;
    const linesToDraw = Math.ceil(animationProgress * totalLines);

    // Draw completed lines
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000';

    for (let i = 0; i < linesToDraw; i++) {
        const line = drawingSequence[i];

        ctx.beginPath();
        ctx.moveTo(line.from.x, line.from.y);
        ctx.lineTo(line.to.x, line.to.y);
        ctx.stroke();
    }

    // Draw dots based on difficulty
    if (currentDifficulty === 'easy') {
        // Draw all dots in easy mode
        const dotsUsed = new Set();

        drawingSequence.forEach(line => {
            [line.from, line.to].forEach(dot => {
                // Use string key to identify unique dots
                const dotKey = `${dot.x},${dot.y}`;
                if (!dotsUsed.has(dotKey)) {
                    dotsUsed.add(dotKey);

                    // Draw the dot
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(dot.x, dot.y, 4, 0, Math.PI * 2);
                    ctx.fill();
                }
            });
        });
    }
}

// Clear the canvas
function clearCanvas() {
    ctx.clearRect(0, 0, drawingCanvas.width, drawingCanvas.height);
}
