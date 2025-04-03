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
    scaling: null,
    // Animation smoothness properties
    lastFrameTime: 0,
    animationSpeed: 300, // ms per line (can be adjusted for difficulty)
    // New confirmation properties
    showConfetti: false,
    confettiParticles: [],
    // New hint system
    hintsUsed: 0,
    hintsAvailable: 1,
    // Audio feedback
    audioEnabled: true,
    // Touch handling for mobile
    touchActive: false
};

// DOM elements
let canvas, ctx, timerDisplay, guessInput, beginButton, wrongMessage, backButton, buttonTimer;
let wordSpacesDiv; // Element for word spaces
let hintButton; // Hint button
let confettiCanvas, confettiCtx; // Confetti overlay canvas

// Audio elements
let correctSound, incorrectSound, completionSound, tickSound;

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

    // Create hint button
    createHintButton();

    // Initialize audio elements
    initAudio();

    // Create confetti canvas
    createConfettiCanvas();

    // Set event listeners
    setupGameEventListeners();

    // Get difficulty setting from localStorage or menu state
    if (localStorage.getItem('difficultyMode') === 'hard') {
        gameState.difficulty = 'hard';
    } else {
        gameState.difficulty = 'easy';
    }

    // Initialize touch handling for mobile
    initTouchHandling();

    log("Game initialized");
}

// Initialize audio elements
function initAudio() {
    // Create audio elements
    correctSound = new Audio();
    incorrectSound = new Audio();
    completionSound = new Audio();
    tickSound = new Audio();

    // Set audio sources (assuming these will be added to the project)
    correctSound.src = 'sounds/correct.mp3';
    incorrectSound.src = 'sounds/incorrect.mp3';
    completionSound.src = 'sounds/completion.mp3';
    tickSound.src = 'sounds/tick.mp3';

    // Preload audio
    correctSound.load();
    incorrectSound.load();
    completionSound.load();
    tickSound.load();

    // Disable audio initially to prevent unwanted sounds on mobile
    const audioElements = [correctSound, incorrectSound, completionSound, tickSound];
    audioElements.forEach(audio => {
        audio.volume = 0.5;
        audio.muted = !gameState.audioEnabled;
    });
}

// Create the word spaces div with enhanced styling
function createWordSpacesDiv() {
    // Create the div for word spaces
    wordSpacesDiv = document.createElement('div');
    wordSpacesDiv.id = 'wordSpacesDiv';
    wordSpacesDiv.style.width = '100%';
    wordSpacesDiv.style.height = '60px';
    wordSpacesDiv.style.margin = '10px 0';
    wordSpacesDiv.style.textAlign = 'center';
    wordSpacesDiv.style.position = 'relative';
    wordSpacesDiv.style.backgroundColor = 'white';
    wordSpacesDiv.style.borderRadius = '8px';
    wordSpacesDiv.style.padding = '10px';
    wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    wordSpacesDiv.style.transition = 'box-shadow 0.3s ease, transform 0.2s ease';

    // Find the game controls div to insert before it
    const gameControlsDiv = document.querySelector('.game-controls');

    if (gameControlsDiv && gameControlsDiv.parentElement) {
        // Insert it before the game controls (guess button)
        gameControlsDiv.parentElement.insertBefore(wordSpacesDiv, gameControlsDiv);
    } else {
        // Fallback: insert after canvas container
        const canvasContainer = canvas.parentElement;
        if (canvasContainer && canvasContainer.parentElement) {
            canvasContainer.parentElement.insertBefore(wordSpacesDiv, canvasContainer.nextSibling);
        }
    }
}

// Create hint button
function createHintButton() {
    hintButton = document.createElement('button');
    hintButton.id = 'hintButton';
    hintButton.className = 'hint-button';
    hintButton.textContent = 'Hint (1)';
    hintButton.style.display = 'none';
    hintButton.style.backgroundColor = '#FFC107';
    hintButton.style.color = '#333';
    hintButton.style.border = 'none';
    hintButton.style.borderRadius = '8px';
    hintButton.style.padding = '8px 15px';
    hintButton.style.margin = '10px 0';
    hintButton.style.fontWeight = 'bold';
    hintButton.style.cursor = 'pointer';
    hintButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    hintButton.style.transition = 'background-color 0.3s, transform 0.2s';

    // Add event listener
    hintButton.addEventListener('click', useHint);

    // Add to game controls
    const gameControlsDiv = document.querySelector('.game-controls');
    if (gameControlsDiv) {
        gameControlsDiv.appendChild(hintButton);
    }
}

// Create confetti canvas for successful completion
function createConfettiCanvas() {
    confettiCanvas = document.createElement('canvas');
    confettiCanvas.id = 'confettiCanvas';
    confettiCanvas.style.position = 'absolute';
    confettiCanvas.style.top = '0';
    confettiCanvas.style.left = '0';
    confettiCanvas.style.width = '100%';
    confettiCanvas.style.height = '100%';
    confettiCanvas.style.pointerEvents = 'none';
    confettiCanvas.style.zIndex = '100';
    confettiCanvas.style.display = 'none';

    const gameScreen = document.querySelector('.game-screen');
    if (gameScreen) {
        gameScreen.appendChild(confettiCanvas);
        confettiCtx = confettiCanvas.getContext('2d');
    }
}

// Initialize touch handling for mobile
function initTouchHandling() {
    // Add touch events for mobile
    if (isMobileDevice()) {
        canvas.addEventListener('touchstart', function(e) {
            if (gameState.gameStarted && !gameState.guessMode) {
                // Enter guess mode on tap if game is in progress
                enterGuessMode();
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// Improved canvas initialization
function initializeGameCanvas() {
    log("Setting up canvas with improved initialization...");

    // Get a standard 2D context with explicit options for better performance
    ctx = canvas.getContext('2d', {
        alpha: false,          // Disable alpha for better performance
        desynchronized: true,  // Use desynchronized mode for better performance
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

    // Resize confetti canvas if it exists
    if (confettiCanvas) {
        confettiCanvas.width = displayWidth * devicePixelRatio;
        confettiCanvas.height = displayHeight * devicePixelRatio;
        if (confettiCtx) {
            confettiCtx.scale(devicePixelRatio, devicePixelRatio);
        }
    }

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

    // Key press events for direct typing
    document.addEventListener('keydown', (e) => {
        // Only process keypresses when in guess mode
        if (!gameState.guessMode) return;

        // Handle different key types
        if (e.key === 'Backspace') {
            // Remove the last character
            if (gameState.currentInput.length > 0) {
                gameState.currentInput = gameState.currentInput.slice(0, -1);
                updateWordSpacesDiv();
            }
        } else if (e.key === 'Enter') {
            // Skip to next stage if Enter is pressed in guess mode
            if (gameState.guessMode && gameState.currentInput.length > 0) {
                // Attempt to submit current guess
                processFullWord();
            }
        } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
            // Only add letter characters (a-z, A-Z)
            processLetter(e.key);
        }
    });

    // Hide the original input field completely
    if (guessInput) {
        guessInput.style.display = 'none';
    }

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

    // Add audio toggle button listener
    const audioToggle = document.getElementById('audioToggle');
    if (audioToggle) {
        audioToggle.addEventListener('change', function() {
            gameState.audioEnabled = audioToggle.checked;
            const audioElements = [correctSound, incorrectSound, completionSound, tickSound];
            audioElements.forEach(audio => {
                audio.muted = !gameState.audioEnabled;
            });
            localStorage.setItem('audioEnabled', gameState.audioEnabled);
        });
    }
}

// Process letter input with validation and enhanced feedback
function processLetter(letter) {
    if (!gameState.guessMode) return;

    const currentWord = gameState.drawingData.name;
    const letterIndex = gameState.currentInput.length;

    // Only process if we still have space for more letters
    if (letterIndex < currentWord.length) {
        const newLetter = letter.toUpperCase();

        // Skip if the current position is a space
        if (currentWord[letterIndex] === ' ') {
            gameState.currentInput += ' ';
            updateWordSpacesDiv();

            // Play tick sound
            if (gameState.audioEnabled) {
                tickSound.currentTime = 0;
                tickSound.play().catch(err => {
                    // Ignore errors (common on mobile)
                });
            }

            // Continue with next letter
            processLetter(letter);
            return;
        }

        const correctLetter = currentWord[letterIndex].toUpperCase();

        // Check if this letter is correct at this position
        if (newLetter === correctLetter) {
            // Add the correct letter
            gameState.currentInput += newLetter;
            updateWordSpacesDiv();

            // Play correct sound
            if (gameState.audioEnabled) {
                tickSound.currentTime = 0;
                tickSound.play().catch(err => {
                    // Ignore errors (common on mobile)
                });
            }

            // Add satisfying visual feedback for correct letter
            pulseLetterSpace(letterIndex);

            // If we've completed the word successfully
            if (gameState.currentInput.length === currentWord.length) {
                log("Word completed correctly!");

                // Stop the guess timer
                if (gameState.guessTimer) clearInterval(gameState.guessTimer);
                gameState.guessTimerActive = false;

                // Hide the timer overlay and reset it
                buttonTimer.classList.remove('active');
                buttonTimer.style.width = '0%';

                // Success feedback
                if (wordSpacesDiv) {
                    wordSpacesDiv.style.boxShadow = '0 0 12px rgba(76, 175, 80, 0.8)';
                    wordSpacesDiv.style.transform = 'scale(1.05)';
                }

                // Play completion sound
                if (gameState.audioEnabled) {
                    completionSound.currentTime = 0;
                    completionSound.play().catch(err => {
                        // Ignore errors (common on mobile)
                    });
                }

                // Start confetti animation
                startConfettiAnimation();

                setTimeout(() => {
                    endGame(true);
                }, 1500); // Give time for celebration animation
            }
        } else {
            // Wrong letter - show feedback and exit guess mode
            log("Incorrect letter");

            // Play incorrect sound
            if (gameState.audioEnabled) {
                incorrectSound.currentTime = 0;
                incorrectSound.play().catch(err => {
                    // Ignore errors (common on mobile)
                });
            }

            // Show incorrect feedback animation
            canvas.classList.add('incorrect');
            if (wordSpacesDiv) {
                wordSpacesDiv.style.boxShadow = '0 0 12px rgba(244, 67, 54, 0.8)';
                wordSpacesDiv.style.transform = 'scale(0.95)';
            }

            // Show the wrong message
            wrongMessage.textContent = `WRONG! It's not "${gameState.currentInput + newLetter}..."`;
            wrongMessage.classList.add('visible');

            setTimeout(() => {
                canvas.classList.remove('incorrect');
                if (wordSpacesDiv) {
                    wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                    wordSpacesDiv.style.transform = 'scale(1)';
                }
                wrongMessage.classList.remove('visible');

                // Reset input and exit guess mode
                gameState.currentInput = '';
                exitGuessMode();
            }, 800);
        }
    }
}

// Process full word submission
function processFullWord() {
    if (!gameState.guessMode) return;

    const currentWord = gameState.drawingData.name;
    const currentGuess = gameState.currentInput;

    // If the input is complete and matches exactly
    if (currentGuess.length === currentWord.length &&
        currentGuess.toUpperCase() === currentWord.toUpperCase()) {
        // Handle successful completion
        log("Word completed correctly!");

        // Stop the guess timer
        if (gameState.guessTimer) clearInterval(gameState.guessTimer);
        gameState.guessTimerActive = false;

        // Hide the timer overlay and reset it
        buttonTimer.classList.remove('active');
        buttonTimer.style.width = '0%';

        // Success feedback
        if (wordSpacesDiv) {
            wordSpacesDiv.style.boxShadow = '0 0 12px rgba(76, 175, 80, 0.8)';
            wordSpacesDiv.style.transform = 'scale(1.05)';
        }

        // Play completion sound
        if (gameState.audioEnabled) {
            completionSound.currentTime = 0;
            completionSound.play().catch(err => {
                // Ignore errors (common on mobile)
            });
        }

        // Start confetti animation
        startConfettiAnimation();

        setTimeout(() => {
            endGame(true);
        }, 1500); // Give time for celebration animation
    } else {
        // Incorrect or incomplete word
        // Play incorrect sound
        if (gameState.audioEnabled) {
            incorrectSound.currentTime = 0;
            incorrectSound.play().catch(err => {
                // Ignore errors (common on mobile)
            });
        }

        // Show incorrect feedback animation
        canvas.classList.add('incorrect');
        if (wordSpacesDiv) {
            wordSpacesDiv.style.boxShadow = '0 0 12px rgba(244, 67, 54, 0.8)';
            wordSpacesDiv.style.transform = 'scale(0.95)';
        }

        // Show the wrong message
        wrongMessage.textContent = `WRONG! Try again`;
        wrongMessage.classList.add('visible');

        setTimeout(() => {
            canvas.classList.remove('incorrect');
            if (wordSpacesDiv) {
                wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                wordSpacesDiv.style.transform = 'scale(1)';
            }
            wrongMessage.classList.remove('visible');

            // Reset input but stay in guess mode
            gameState.currentInput = '';
            updateWordSpacesDiv();
        }, 800);
    }
}

// Visual feedback for correct letter
function pulseLetterSpace(index) {
    const letterDivs = wordSpacesDiv.querySelector('div')?.children;
    if (!letterDivs || index >= letterDivs.length) return;

    const letterDiv = letterDivs[index];

    // Add pulse animation class
    letterDiv.style.animation = 'pulse-green 0.5s';

    // Remove animation class after it completes
    setTimeout(() => {
        letterDiv.style.animation = '';
    }, 500);

    // Add pulse animation style if not already added
    if (!document.getElementById('pulse-animation-style')) {
        const style = document.createElement('style');
        style.id = 'pulse-animation-style';
        style.textContent = `
            @keyframes pulse-green {
                0% { transform: scale(1); }
                50% { transform: scale(1.2); background-color: rgba(76, 175, 80, 0.2); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Use hint feature
function useHint() {
    if (!gameState.gameStarted || gameState.hintsUsed >= gameState.hintsAvailable) return;

    // Get current word
    const currentWord = gameState.drawingData.name;

    // If we're in guess mode, provide the next letter
    if (gameState.guessMode) {
        const letterIndex = gameState.currentInput.length;

        // If we have room for more letters
        if (letterIndex < currentWord.length) {
            // Add the next correct letter
            const nextLetter = currentWord[letterIndex].toUpperCase();
            gameState.currentInput += nextLetter;
            updateWordSpacesDiv();

            // Highlight this letter as a hint
            highlightHintLetter(letterIndex);

            // Check if we've completed the word with this hint
            if (gameState.currentInput.length === currentWord.length) {
                // Handle successful completion
                log("Word completed with hint!");

                // Stop the guess timer
                if (gameState.guessTimer) clearInterval(gameState.guessTimer);
                gameState.guessTimerActive = false;

                // Success feedback
                if (wordSpacesDiv) {
                    wordSpacesDiv.style.boxShadow = '0 0 12px rgba(76, 175, 80, 0.8)';
                }

                setTimeout(() => {
                    endGame(true);
                }, 500);
            }
        }
    } else {
        // If not in guess mode, enter guess mode and reveal first letter
        enterGuessMode();

        // Add the first letter as a hint
        const firstLetter = currentWord[0].toUpperCase();
        gameState.currentInput = firstLetter;
        updateWordSpacesDiv();

        // Highlight this letter as a hint
        highlightHintLetter(0);
    }

    // Update hint count
    gameState.hintsUsed++;
    hintButton.textContent = `Hint (${Math.max(0, gameState.hintsAvailable - gameState.hintsUsed)})`;

    // Disable if no hints remain
    if (gameState.hintsUsed >= gameState.hintsAvailable) {
        hintButton.disabled = true;
        hintButton.style.opacity = "0.5";
        hintButton.style.cursor = "not-allowed";
    }
}

// Highlight a letter provided as a hint
function highlightHintLetter(index) {
    const letterDivs = wordSpacesDiv.querySelector('div')?.children;
    if (!letterDivs || index >= letterDivs.length) return;

    const letterDiv = letterDivs[index];
    const letterSpan = letterDiv.querySelector('span');

    if (letterSpan) {
        // Style the hint letter differently
        letterSpan.style.color = '#FFC107';
        letterSpan.style.textShadow = '0 0 5px rgba(255, 193, 7, 0.5)';

        // Add animation for hint
        letterSpan.style.animation = 'hint-glow 2s infinite';

        // Add hint animation style if not already added
        if (!document.getElementById('hint-animation-style')) {
            const style = document.createElement('style');
            style.id = 'hint-animation-style';
            style.textContent = `
                @keyframes hint-glow {
                    0%, 100% { text-shadow: 0 0 5px rgba(255, 193, 7, 0.5); }
                    50% { text-shadow: 0 0 15px rgba(255, 193, 7, 0.9); }
                }
            `;
            document.head.appendChild(style);
        }
    }
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
    gameState.hintsUsed = 0;
    gameState.showConfetti = false;

    // Clear word spaces div
    if (wordSpacesDiv) {
        wordSpacesDiv.innerHTML = '';
        wordSpacesDiv.style.transform = 'scale(1)';
        wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }

    // Reset hint button
    if (hintButton) {
        hintButton.textContent = `Hint (${gameState.hintsAvailable})`;
        hintButton.disabled = false;
        hintButton.style.opacity = "1";
        hintButton.style.cursor = "pointer";
        hintButton.style.display = 'none'; // Initially hidden until game starts
    }

    // Hide confetti canvas
    if (confettiCanvas) {
        confettiCanvas.style.display = 'none';
    }

    // Switch to game screen using the menu function
    if (typeof showGameScreen === 'function') {
        showGameScreen();
    }

    // Set background color based on category
    document.body.style.backgroundColor = `var(--${color}-color)`;

    // Reset UI elements
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

    // Show hint button
    if (hintButton) {
        hintButton.style.display = 'block';
    }

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

    // Set animation speed based on difficulty
    const timePerLine = gameState.difficulty === 'hard' ?
        gameState.animationSpeed * 0.7 : // Faster in hard mode
        gameState.animationSpeed;        // Normal in easy mode

    log(`Starting animation: ${totalSequenceLength} lines, ${timePerLine}ms per line`);

    // Reset animation state
    cancelAnimationFrame(gameState.animationId);
    gameState.drawingProgress = 0;
    gameState.lastFrameTime = 0;

    // Draw the first line immediately
    gameState.drawingProgress = 1;
    renderFrame();

    // Track timing
    let accumulatedTime = 0;

    // Animation frame handler with smoother timing
    function animate(timestamp) {
        // Initialize timing on first frame
        if (!gameState.lastFrameTime) {
            gameState.lastFrameTime = timestamp;
            gameState.animationId = requestAnimationFrame(animate);
            return;
        }

        // Calculate time delta with more precision
        const deltaTime = timestamp - gameState.lastFrameTime;
        gameState.lastFrameTime = timestamp;

        // Prevent large time jumps (e.g. when tab was inactive)
        const cappedDelta = Math.min(deltaTime, 100);
        accumulatedTime += cappedDelta;

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

// Start the elapsed timer with improved precision
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

// Update the timer display with improved formatting
function updateTimerDisplay() {
    const seconds = String(gameState.elapsedTime).padStart(2, '0');
    const hundredths = String(gameState.elapsedTimeHundredths).padStart(2, '0');
    timerDisplay.textContent = `${seconds}:${hundredths}`;

    // Add visual feedback as time increases
    // Change color based on time elapsed
    if (gameState.elapsedTime < 10) {
        timerDisplay.style.color = '#4CAF50'; // Green for quick
    } else if (gameState.elapsedTime < 30) {
        timerDisplay.style.color = '#FFC107'; // Yellow for medium
    } else {
        timerDisplay.style.color = '#F44336'; // Red for slow
    }
}

// Function for the guess timer with improved visual feedback
function startGuessTimer() {
    // Reset the guess timer
    gameState.guessTimeRemaining = 10;
    gameState.guessTimerActive = true;

    // Reset and show the timer overlay
    buttonTimer.style.width = '0%';
    buttonTimer.classList.add('active');

    // Update timer color based on remaining time
    function updateTimerColor() {
        const percentage = (gameState.guessTimeRemaining / 10) * 100;
        if (percentage > 60) {
            buttonTimer.style.backgroundColor = '#4CAF50'; // Green
        } else if (percentage > 30) {
            buttonTimer.style.backgroundColor = '#FFC107'; // Yellow
        } else {
            buttonTimer.style.backgroundColor = '#F44336'; // Red
        }
    }

    // Initial color
    updateTimerColor();

    // Clear any existing timer
    if (gameState.guessTimer) clearInterval(gameState.guessTimer);

    // Start the timer
    gameState.guessTimer = setInterval(() => {
        gameState.guessTimeRemaining -= 0.1; // Decrease by 0.1 seconds for smoother transition

        // Update the button timer width (grows from right to left)
        const percentage = 100 - ((gameState.guessTimeRemaining / 10) * 100);
        buttonTimer.style.width = `${percentage}%`;

        // Update color
        updateTimerColor();

        // If time runs out
        if (gameState.guessTimeRemaining <= 0) {
            clearInterval(gameState.guessTimer);
            gameState.guessTimerActive = false;

            // Hide the timer overlay and reset it
            buttonTimer.classList.remove('active');
            buttonTimer.style.width = '0%';

            // Exit guess mode and continue gameplay
            exitGuessMode();

            // Flash red to indicate time ran out
            canvas.classList.add('incorrect');
            wrongMessage.textContent = "TIME'S UP!";
            wrongMessage.classList.add('visible');

            // Play incorrect sound
            if (gameState.audioEnabled) {
                incorrectSound.currentTime = 0;
                incorrectSound.play().catch(err => {
                    // Ignore errors (common on mobile)
                });
            }

            setTimeout(() => {
                canvas.classList.remove('incorrect');
                wrongMessage.classList.remove('visible');
            }, 800);
        }
    }, 100); // Update every 100ms for smooth animation
}

// Enter guess mode with improved transition
function enterGuessMode() {
    log("Entering guess mode");

    // If already in guess mode, reset the timer instead of toggling
    if (gameState.guessMode) {
        startGuessTimer(); // Restart the timer
        return;
    }

    // Pause animation and timer
    gameState.guessMode = true;

    // Cancel any ongoing animation
    if (gameState.animationId) {
        cancelAnimationFrame(gameState.animationId);
        gameState.animationId = null;
    }

    // Clear current input
    gameState.currentInput = '';
    if (wordSpacesDiv) {
        wordSpacesDiv.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.6)';
    }

    // Update the word spaces to show empty slots
    updateWordSpacesDiv();

    // Add pulse animation to the word spaces div to draw attention
    wordSpacesDiv.style.animation = 'pulse-attention 1s';
    setTimeout(() => {
        wordSpacesDiv.style.animation = '';
    }, 1000);

    // Add the animation if it doesn't exist
    if (!document.getElementById('pulse-attention-style')) {
        const style = document.createElement('style');
        style.id = 'pulse-attention-style';
        style.textContent = `
            @keyframes pulse-attention {
                0% { transform: scale(1); }
                50% { transform: scale(1.05); }
                100% { transform: scale(1); }
            }
        `;
        document.head.appendChild(style);
    }

    // Start the guess timer
    startGuessTimer();

    // Change button text to emphasize mode
    beginButton.querySelector('span').textContent = 'Reset Guess';

    // Show virtual keyboard on mobile
    updateVirtualKeyboard();
}

// Exit guess mode with smooth transition
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

    // Reset word spaces appearance
    if (wordSpacesDiv) {
        wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    }

    // Change button text back
    beginButton.querySelector('span').textContent = 'Guess';

    // Restart animation if needed
    if (gameState.pendingAnimationStart) {
        improvedDrawingAnimation();
    }

    // Hide virtual keyboard on mobile
    updateVirtualKeyboard();
}

// Start confetti animation for successful completion
function startConfettiAnimation() {
    if (!confettiCanvas || !confettiCtx) return;

    // Show and resize canvas
    confettiCanvas.style.display = 'block';
    resizeConfettiCanvas();

    // Initialize particles
    gameState.showConfetti = true;
    gameState.confettiParticles = [];

    // Create particles
    for (let i = 0; i < 150; i++) {
        gameState.confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: -20 - Math.random() * 100,
            size: 5 + Math.random() * 10,
            color: getRandomConfettiColor(),
            speed: 1 + Math.random() * 3,
            angle: Math.random() * Math.PI * 2,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2
        });
    }

    // Start animation
    animateConfetti();
}

// Resize confetti canvas
function resizeConfettiCanvas() {
    if (!confettiCanvas) return;

    const gameScreen = document.querySelector('.game-screen');
    if (!gameScreen) return;

    const rect = gameScreen.getBoundingClientRect();
    confettiCanvas.width = rect.width;
    confettiCanvas.height = rect.height;
}

// Get random confetti color
function getRandomConfettiColor() {
    const colors = [
        '#f44336', '#e91e63', '#9c27b0', '#673ab7',
        '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
        '#009688', '#4CAF50', '#8bc34a', '#cddc39',
        '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Animate confetti
function animateConfetti() {
    if (!gameState.showConfetti || !confettiCanvas || !confettiCtx) return;

    // Clear canvas
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    // Update and draw particles
    let stillActive = false;

    gameState.confettiParticles.forEach(particle => {
        // Update position
        particle.y += particle.speed;
        particle.x += Math.sin(particle.angle) * 0.5;
        particle.rotation += particle.rotationSpeed;

        // Check if particle is still on screen
        if (particle.y < confettiCanvas.height + 20) {
            stillActive = true;

            // Draw particle
            confettiCtx.save();
            confettiCtx.translate(particle.x, particle.y);
            confettiCtx.rotate(particle.rotation * Math.PI / 180);

            confettiCtx.fillStyle = particle.color;
            confettiCtx.fillRect(-particle.size / 2, -particle.size / 2,
                                 particle.size, particle.size);

            confettiCtx.restore();
        }
    });

    // Continue animation if particles are still visible
    if (stillActive) {
        requestAnimationFrame(animateConfetti);
    } else {
        gameState.showConfetti = false;
        confettiCanvas.style.display = 'none';
    }
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

    // Stop confetti after a delay if successful
    if (success) {
        setTimeout(() => {
            gameState.showConfetti = false;
        }, 3000);
    } else {
        gameState.showConfetti = false;
        if (confettiCanvas) {
            confettiCanvas.style.display = 'none';
        }
    }

    // Reset word spaces appearance
    if (wordSpacesDiv) {
        wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
        wordSpacesDiv.style.transform = 'scale(1)';
    }

    // Hide hint button
    if (hintButton) {
        hintButton.style.display = 'none';
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

    // Hide virtual keyboard on mobile
    updateVirtualKeyboard();
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
    const scale = size / 560; // Builder uses a 400x400 area

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

// Draw dots using exact builder scaling with improved visuals
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

        // Draw dot shadow for better visibility
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(x + 1, y + 1, dotRadius + 1, 0, Math.PI * 2);
        ctx.fill();

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

// Draw lines using exact builder scaling with improved visuals
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

    // Draw line shadows for depth (only in easy mode)
    if (gameState.difficulty === 'easy') {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < gameState.drawingProgress; i++) {
            if (i < gameState.drawingData.sequence.length) {
                const line = gameState.drawingData.sequence[i];
                if (!line) continue;

                const from = gameState.drawingData.dots[line.from];
                const to = gameState.drawingData.dots[line.to];

                if (!from || !to) continue;

                // Apply scaling directly from builder coordinates with slight offset for shadow
                const fromX = (from.x * scaling.scale) + scaling.offsetX + 1;
                const fromY = (from.y * scaling.scale) + scaling.offsetY + 1;
                const toX = (to.x * scaling.scale) + scaling.offsetX + 1;
                const toY = (to.y * scaling.scale) + scaling.offsetY + 1;

                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.stroke();
            }
        }
    }

    // Draw the actual lines with enhanced visual style
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

// Update the word spaces in the separate div with enhanced styling
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
    letterContainer.style.gap = '5px'; // Consistent spacing

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
            if (i < gameState.currentInput.length) {
                const letterSpan = document.createElement('span');
                letterSpan.style.fontSize = '24px';
                letterSpan.style.fontWeight = 'bold';
                letterSpan.style.color = '#333';
                letterSpan.textContent = gameState.currentInput[i];
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
    if (gameState.guessMode && gameState.currentInput.length < answer.length) {
        const cursorIndex = gameState.currentInput.length;
        const letterDivs = letterContainer.children;

        if (cursorIndex < letterDivs.length) {
            const currentLetterDiv = letterDivs[cursorIndex];

            // Skip spaces
            if (answer[cursorIndex] === ' ') {
                gameState.currentInput += ' ';
                updateWordSpacesDiv();
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

    // In easy mode, draw dots first
    if (gameState.difficulty === 'easy') {
        drawDots();
    }

    // Always draw lines based on current progress
    drawLines();

    // Update word spaces in their div
    if (gameState.difficulty === 'easy') {
        updateWordSpacesDiv();
    }
}

// Add virtual keyboard for mobile devices with improved styling
function createVirtualKeyboard() {
    // Only create if we're on a mobile device and it doesn't already exist
    if (!document.getElementById('virtual-keyboard') && isMobileDevice()) {
        const keyboard = document.createElement('div');
        keyboard.id = 'virtual-keyboard';
        keyboard.style.display = 'none';
        keyboard.style.position = 'fixed';
        keyboard.style.bottom = '0';
        keyboard.style.left = '0';
        keyboard.style.width = '100%';
        keyboard.style.backgroundColor = '#f5f5f5';
        keyboard.style.padding = '10px';
        keyboard.style.boxShadow = '0 -2px 5px rgba(0,0,0,0.1)';
        keyboard.style.zIndex = '1000';
        keyboard.style.borderTopLeftRadius = '15px';
        keyboard.style.borderTopRightRadius = '15px';
        keyboard.style.transition = 'transform 0.3s ease';
        keyboard.style.transform = 'translateY(100%)';

        // Add keyboard rows with improved styling
        const rows = [
            'QWERTYUIOP',
            'ASDFGHJKL',
            'ZXCVBNM'
        ];

        rows.forEach((row, rowIndex) => {
            const rowDiv = document.createElement('div');
            rowDiv.style.display = 'flex';
            rowDiv.style.justifyContent = 'center';
            rowDiv.style.margin = '5px 0';
            rowDiv.style.gap = '4px'; // Consistent spacing

            // Add padding for the bottom row (for alignment)
            if (rowIndex === 2) {
                rowDiv.style.paddingLeft = '20px';
                rowDiv.style.paddingRight = '20px';
            }

            // Add keys for this row
            for (let i = 0; i < row.length; i++) {
                const key = document.createElement('button');
                key.textContent = row[i];
                key.style.margin = '2px';
                key.style.padding = '12px 0';
                key.style.width = '9%'; // Makes keys more consistently sized
                key.style.minWidth = '30px';
                key.style.fontSize = '16px';
                key.style.border = 'none';
                key.style.borderRadius = '8px';
                key.style.backgroundColor = 'white';
                key.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                key.style.transition = 'all 0.2s ease';
                key.style.fontWeight = 'bold';
                key.style.color = '#333';

                // Add "active" effect on press
                key.addEventListener('touchstart', function() {
                    key.style.backgroundColor = '#e0e0e0';
                    key.style.transform = 'translateY(2px)';
                    key.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
                });

                key.addEventListener('touchend', function() {
                    key.style.backgroundColor = 'white';
                    key.style.transform = 'translateY(0)';
                    key.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                });

                // Add letter-by-letter validation
                key.addEventListener('click', () => {
                    if (gameState.guessMode) {
                        // Process this letter
                        const letter = key.textContent;
                        processLetter(letter);
                    }
                });

                rowDiv.appendChild(key);
            }

            keyboard.appendChild(rowDiv);
        });

        // Add additional buttons row (space, delete, enter)
        const actionRow = document.createElement('div');
        actionRow.style.display = 'flex';
        actionRow.style.justifyContent = 'center';
        actionRow.style.margin = '5px 0';
        actionRow.style.gap = '8px';

        // Delete button
        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '&larr;'; // Left arrow
        deleteButton.style.padding = '12px 15px';
        deleteButton.style.fontSize = '16px';
        deleteButton.style.border = 'none';
        deleteButton.style.borderRadius = '8px';
        deleteButton.style.backgroundColor = '#f44336';
        deleteButton.style.color = 'white';
        deleteButton.style.fontWeight = 'bold';
        deleteButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        deleteButton.style.minWidth = '60px';
        deleteButton.style.transition = 'all 0.2s ease';

        deleteButton.addEventListener('click', () => {
            if (gameState.guessMode && gameState.currentInput.length > 0) {
                gameState.currentInput = gameState.currentInput.slice(0, -1);
                updateWordSpacesDiv();
            }
        });

        // Space button
        const spaceButton = document.createElement('button');
        spaceButton.textContent = 'Space';
        spaceButton.style.padding = '12px 15px';
        spaceButton.style.fontSize = '16px';
        spaceButton.style.border = 'none';
        spaceButton.style.borderRadius = '8px';
        spaceButton.style.backgroundColor = '#9e9e9e';
        spaceButton.style.color = 'white';
        spaceButton.style.fontWeight = 'bold';
        spaceButton.style.flexGrow = '1';
        spaceButton.style.maxWidth = '150px';
        spaceButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        spaceButton.style.transition = 'all 0.2s ease';

        spaceButton.addEventListener('click', () => {
            if (gameState.guessMode) {
                processLetter(' ');
            }
        });

        // Enter button
        const enterButton = document.createElement('button');
        enterButton.textContent = 'Enter';
        enterButton.style.padding = '12px 15px';
        enterButton.style.fontSize = '16px';
        enterButton.style.border = 'none';
        enterButton.style.borderRadius = '8px';
        enterButton.style.backgroundColor = '#4CAF50';
        enterButton.style.color = 'white';
        enterButton.style.fontWeight = 'bold';
        enterButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        enterButton.style.minWidth = '60px';
        enterButton.style.transition = 'all 0.2s ease';

        enterButton.addEventListener('click', () => {
            if (gameState.guessMode) {
                processFullWord();
            }
        });

        // Add active effects
        [deleteButton, spaceButton, enterButton].forEach(button => {
            button.addEventListener('touchstart', function() {
                this.style.transform = 'translateY(2px)';
                this.style.boxShadow = '0 1px 2px rgba(0,0,0,0.1)';
            });

            button.addEventListener('touchend', function() {
                this.style.transform = 'translateY(0)';
                this.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            });
        });

        actionRow.appendChild(deleteButton);
        actionRow.appendChild(spaceButton);
        actionRow.appendChild(enterButton);
        keyboard.appendChild(actionRow);

        // Add to document
        document.body.appendChild(keyboard);

        // Add dismiss handle for better UX
        const dismissHandle = document.createElement('div');
        dismissHandle.style.width = '40px';
        dismissHandle.style.height = '5px';
        dismissHandle.style.backgroundColor = '#ccc';
        dismissHandle.style.borderRadius = '3px';
        dismissHandle.style.margin = '0 auto 10px auto';
        keyboard.insertBefore(dismissHandle, keyboard.firstChild);

        // Show keyboard when in guess mode with animation
        document.addEventListener('guessmode-changed', (e) => {
            if (e.detail.active) {
                keyboard.style.display = 'block';
                // Trigger reflow
                void keyboard.offsetWidth;
                keyboard.style.transform = 'translateY(0)';
            } else {
                keyboard.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    keyboard.style.display = 'none';
                }, 300); // Match transition duration
            }
        });
    }
}

// Show/hide virtual keyboard when guess mode changes
function updateVirtualKeyboard() {
    // Create a custom event
    const event = new CustomEvent('guessmode-changed', {
        detail: {
            active: gameState.guessMode
        }
    });
    document.dispatchEvent(event);
}

// Check if we're on a mobile device
function isMobileDevice() {
    return (typeof window.orientation !== 'undefined') ||
           (navigator.userAgent.indexOf('IEMobile') !== -1) ||
           (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
}

// Add audio toggle to settings
function addAudioToggle() {
    // Find appropriate place to add toggle (assuming there's a difficulty container)
    const difficultyContainer = document.querySelector('.difficulty-container');
    if (!difficultyContainer) return;

    // Create audio toggle container
    const audioContainer = document.createElement('div');
    audioContainer.className = 'audio-container';
    audioContainer.style.display = 'flex';
    audioContainer.style.flexDirection = 'column';
    audioContainer.style.alignItems = 'center';
    audioContainer.style.margin = '10px 0';

    // Create title
    const audioTitle = document.createElement('div');
    audioTitle.className = 'audio-title';
    audioTitle.textContent = 'Sound Effects';
    audioTitle.style.marginBottom = '8px';
    audioTitle.style.fontSize = '18px';
    audioTitle.style.fontWeight = 'bold';

    // Create toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.gap = '10px';

    // Create labels and toggle
    const offLabel = document.createElement('span');
    offLabel.id = 'offLabel';
    offLabel.className = 'difficulty-label';
    offLabel.textContent = 'Off';

    const onLabel = document.createElement('span');
    onLabel.id = 'onLabel';
    onLabel.className = 'difficulty-label';
    onLabel.textContent = 'On';

    // Create toggle switch
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'toggle-switch';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'audioToggle';

    // Set initial state from localStorage
    const storedAudio = localStorage.getItem('audioEnabled');
    if (storedAudio === 'true') {
        toggleInput.checked = true;
        gameState.audioEnabled = true;
    } else {
        toggleInput.checked = false;
        gameState.audioEnabled = false;
    }

    const slider = document.createElement('span');
    slider.className = 'slider';

    // Assemble toggle
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(slider);

    // Assemble toggle container
    toggleContainer.appendChild(offLabel);
    toggleContainer.appendChild(toggleSwitch);
    toggleContainer.appendChild(onLabel);

    // Assemble audio container
    audioContainer.appendChild(audioTitle);
    audioContainer.appendChild(toggleContainer);

    // Add to page after difficulty container
    difficultyContainer.parentNode.insertBefore(audioContainer, difficultyContainer.nextSibling);

    // Add click handlers for labels
    offLabel.addEventListener('click', function() {
        toggleInput.checked = false;
        toggleInput.dispatchEvent(new Event('change'));
    });

    onLabel.addEventListener('click', function() {
        toggleInput.checked = true;
        toggleInput.dispatchEvent(new Event('change'));
    });

    // Initial update of label styling
    updateAudioToggleUI(toggleInput.checked);

    // Add change handler to update UI
    toggleInput.addEventListener('change', function() {
        updateAudioToggleUI(this.checked);
    });

    // Function to update toggle UI
    function updateAudioToggleUI(isOn) {
        if (isOn) {
            offLabel.style.opacity = '0.5';
            offLabel.style.fontWeight = 'normal';
            onLabel.style.opacity = '1';
            onLabel.style.fontWeight = 'bold';
        } else {
            onLabel.style.opacity = '0.5';
            onLabel.style.fontWeight = 'normal';
            offLabel.style.opacity = '1';
            offLabel.style.fontWeight = 'bold';
        }
    }
}

// Initialize the game functionality when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    addAudioToggle();

    // Monitor window load to ensure everything is ready
    window.addEventListener('load', function() {
        log("Window fully loaded");

        // Force another init check after everything loads
        setTimeout(function() {
            if (canvas && !gameState.canvasReady) {
                log("Reinitializing canvas after full page load");
                initializeGameCanvas();
            }

            // Create virtual keyboard
            createVirtualKeyboard();
        }, 300);
    });
});
