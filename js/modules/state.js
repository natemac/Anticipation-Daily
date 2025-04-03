// state.js - Game State Management Module
// Manages the global state of the game and centralized configuration

// Game configuration object - All tunable parameters in one place
const CONFIG = {
    // Animation settings
    PIXELS_PER_SECOND: 300,       // Animation speed in pixels per second
    MINIMUM_LINE_TIME: 100,       // Minimum time for short lines (milliseconds)
    ANIMATION_LINE_BY_LINE: true, // Animate lines individually from point to point

    // Visual settings
    DOT_RADIUS: 5,                // Size of dots on the grid

    // Gameplay settings
    GUESS_TIME_LIMIT: 10,         // Seconds for guessing
    HIDE_INITIAL_MESSAGES: true,  // Hide any messages at game start

    // Hint system
    HINT_COOLDOWN_TIME: 5,        // Cooldown time in seconds between hints
    HINTS_AVAILABLE: 0,           // Number of hints available per game (0 = unlimited)

    // UI settings
    WRONG_MESSAGE_DURATION: 800,  // Duration to show wrong messages (milliseconds)
    CELEBRATION_DURATION: 1500,   // Duration of celebration before returning to menu

    // Debug settings
    DEBUG_MODE: false             // Enable debug logging and features
};

// Game state object
const GameState = {
    // Reference to configuration
    CONFIG: CONFIG,

    // Game configuration (applied from CONFIG)
    difficulty: 'easy',
    pixelsPerSecond: CONFIG.PIXELS_PER_SECOND,
    minimumLineTime: CONFIG.MINIMUM_LINE_TIME,

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
    guessTimeRemaining: CONFIG.GUESS_TIME_LIMIT,
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
    hintsAvailable: CONFIG.HINTS_AVAILABLE,
    hintButtonActive: false,     // Tracks if hint button is enabled
    hintButtonCooldown: false,   // Tracks if hint button is in cooldown
    hintCooldownRemaining: 0,    // Remaining cooldown time in seconds

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
        this.guessTimeRemaining = CONFIG.GUESS_TIME_LIMIT;
        this.guessTimerActive = false;
        this.pendingAnimationStart = false;
        this.scaling = null;
        this.hintsUsed = 0;
        this.showConfetti = false;
        this.guessAttempts = 0; // Reset guess attempts counter
        this.hintButtonActive = false;
        this.hintButtonCooldown = false;
        this.hintCooldownRemaining = 0;

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
    },

    // Check if hints are available
    hasHintsAvailable() {
        // When HINTS_AVAILABLE is 0, unlimited hints are allowed
        return CONFIG.HINTS_AVAILABLE === 0 || this.hintsUsed < CONFIG.HINTS_AVAILABLE;
    },

    // Debug log function (only logs when DEBUG_MODE is true)
    debug(message) {
        if (CONFIG.DEBUG_MODE) {
            console.log(`[DEBUG] ${message}`);
        }
    }
};

export default GameState;
