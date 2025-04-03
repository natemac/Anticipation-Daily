// state.js - Game State Management Module
// Manages the global state of the game

// Game state object
const GameState = {
    // Game configuration
    difficulty: 'easy',
    pixelsPerSecond: 300,   // Animation speed in pixels per second
    minimumLineTime: 100,   // Minimum time for short lines (milliseconds)

    // Current game data
    currentColor: null,
    currentCategory: null,
    drawingData: null,

    // Animation state
    drawingProgress: 0,
    lastFrameTime: 0,
    animationId: null,
    pendingAnimationStart: false,

    // Timer state
    elapsedTimer: null,
    timerActive: false,
    elapsedTime: 0,
    elapsedTimeHundredths: 0,

    // Guess state
    guessMode: false,
    gameStarted: false,
    currentInput: '',
    correctLetters: [],    // Store correct letters between attempts
    guessAttempts: 0,      // Track number of guess attempts

    // Guess timer properties
    guessTimeRemaining: 10,
    guessTimerActive: false,
    guessTimer: null,

    // Canvas properties
    canvasReady: false,
    scaling: null,

    // Visual effects
    showConfetti: false,
    confettiParticles: [],

    // Hint system
    hintsUsed: 0,
    hintsAvailable: 1,
    hintButtonActive: false,     // Tracks if hint button is enabled
    hintButtonCooldown: false,   // Tracks if hint button is in cooldown

    // Audio settings
    audioEnabled: true,

    // Touch handling for mobile
    touchActive: false,

    // Initialize the game state
    init() {
        // Get difficulty setting from localStorage
        if (localStorage.getItem('difficultyMode') === 'hard') {
            this.difficulty = 'hard';
        } else {
            this.difficulty = 'easy';
        }

        // Get audio setting from localStorage
        const storedAudio = localStorage.getItem('audioEnabled');
        if (storedAudio === 'false') {
            this.audioEnabled = false;
        } else {
            this.audioEnabled = true;
        }

        return this;
    },

    // Reset state for a new game
    resetForNewGame() {
        this.drawingProgress = 0;
        this.gameStarted = false;
        this.timerActive = false;
        this.elapsedTime = 0;
        this.elapsedTimeHundredths = 0;
        this.guessMode = false;
        this.currentInput = '';
        this.correctLetters = [];
        this.guessTimeRemaining = 10;
        this.guessTimerActive = false;
        this.pendingAnimationStart = false;
        this.scaling = null;
        this.hintsUsed = 0;
        this.showConfetti = false;
        this.guessAttempts = 0; // Reset guess attempts counter
        this.hintButtonActive = false;
        this.hintButtonCooldown = false;

        // Clear any existing timers
        if (this.elapsedTimer) clearInterval(this.elapsedTimer);
        if (this.guessTimer) clearInterval(this.guessTimer);
        if (this.animationId) cancelAnimationFrame(this.animationId);

        return this;
    },

    // Update difficulty setting
    setDifficulty(difficulty) {
        this.difficulty = difficulty;
        localStorage.setItem('difficultyMode', difficulty);
        return this;
    },

    // Toggle audio setting
    toggleAudio(enabled) {
        this.audioEnabled = enabled;
        localStorage.setItem('audioEnabled', enabled);
        return this;
    }
};

export default GameState;
