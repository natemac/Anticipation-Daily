// Updated CONFIG section in state.js to include audio settings

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

    // Audio settings
    MUSIC_ENABLED: true,          // Enable background music
    SOUND_EFFECTS_ENABLED: true,  // Enable sound effects
    MUSIC_VOLUME: 0.4,            // Default volume for background music (0-1)
    SFX_VOLUME: 0.5,              // Default volume for sound effects (0-1)
    FADE_DURATION: 500,           // Default duration for audio fades (milliseconds)

    // Audio files
    AUDIO_FILES: {
        YELLOW_MUSIC: 'sounds/yellow-music.mp3',
        GREEN_MUSIC: 'sounds/green-music.mp3',
        BLUE_MUSIC: 'sounds/blue-music.mp3',
        RED_MUSIC: 'sounds/red-music.mp3',
        GUESS_SFX: 'sounds/guess.mp3',
        CORRECT_SFX: 'sounds/correct.mp3',
        INCORRECT_SFX: 'sounds/incorrect.mp3',
        VICTORY_SFX: 'sounds/completion.mp3',
        TICK_SFX: 'sounds/tick.mp3'
    },

    // Debug settings
    DEBUG_MODE: false             // Enable debug logging and features
};

// Game state object - Add audio state properties
const GameState = {
    // Reference to configuration
    CONFIG: CONFIG,

    // Game configuration (applied from CONFIG)
    difficulty: 'normal',
    pixelsPerSecond: CONFIG.PIXELS_PER_SECOND,
    minimumLineTime: CONFIG.MINIMUM_LINE_TIME,

    // Current game data
    currentColor: '',
    currentCategory: '',
    currentWord: '',
    currentInput: '',

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

    // Game mode
    guessMode: false,
    gameStarted: false,
    gamePaused: false,
    gameOver: false,

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
    hintsRemaining: 3,
    hintCooldown: 30, // seconds
    hintsUsed: 0,
    hintsAvailable: CONFIG.HINTS_AVAILABLE,
    hintButtonActive: false,     // Tracks if hint button is enabled
    hintButtonCooldown: false,   // Tracks if hint button is in cooldown
    hintCooldownRemaining: 0,    // Remaining cooldown time in seconds

    // Audio settings
    audioEnabled: true,          // Master audio toggle
    musicEnabled: CONFIG.MUSIC_ENABLED,
    sfxEnabled: CONFIG.SOUND_EFFECTS_ENABLED,
    musicVolume: CONFIG.MUSIC_VOLUME,
    sfxVolume: CONFIG.SFX_VOLUME,

    // Audio state tracking
    currentMusicTrack: null,     // Currently playing music track
    drawingMusicTime: 0,         // Store position in drawing music for resuming

    // Touch handling for mobile
    touchActive: false,

    // UI state
    isDrawing: false,
    isAnimating: false,

    // Initialize the game state
    init() {
        // Get difficulty setting from localStorage
        if (localStorage.getItem('difficultyMode') === 'hard') {
            this.difficulty = 'hard';
        } else {
            this.difficulty = 'normal';
        }

        // Get audio setting from localStorage
        const storedAudio = localStorage.getItem('audioEnabled');
        if (storedAudio === 'false') {
            this.audioEnabled = false;
        } else {
            this.audioEnabled = true;
        }

        // Get music volume from localStorage if available
        const storedMusicVolume = localStorage.getItem('musicVolume');
        if (storedMusicVolume !== null) {
            this.musicVolume = parseFloat(storedMusicVolume);
        }

        // Get SFX volume from localStorage if available
        const storedSfxVolume = localStorage.getItem('sfxVolume');
        if (storedSfxVolume !== null) {
            this.sfxVolume = parseFloat(storedSfxVolume);
        }

        return this;
    },

    // Reset state for a new game
    resetForNewGame() {
        this.drawingProgress = 0;
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.timerActive = false;
        this.elapsedTime = 0;
        this.elapsedTimeHundredths = 0;
        this.guessMode = false;
        this.currentInput = '';
        this.currentWord = '';
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
        this.hintsRemaining = 3;
        this.isDrawing = false;
        this.isAnimating = false;

        // Reset audio state but maintain volume settings
        this.currentMusicTrack = null;
        this.drawingMusicTime = 0;

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

    // Set music volume
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('musicVolume', this.musicVolume);
        return this;
    },

    // Set sound effects volume
    setSfxVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        localStorage.setItem('sfxVolume', this.sfxVolume);
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
    },

    // Reset game state
    reset() {
        this.gameStarted = false;
        this.gamePaused = false;
        this.gameOver = false;
        this.currentColor = '';
        this.currentCategory = '';
        this.currentWord = '';
        this.currentInput = '';
        this.elapsedTime = 0;
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
        this.hintsRemaining = 3;
        this.isDrawing = false;
        this.isAnimating = false;

        // Reset audio state but maintain volume settings
        this.currentMusicTrack = null;
        this.drawingMusicTime = 0;

        // Clear any existing timers
        if (this.elapsedTimer) clearInterval(this.elapsedTimer);
        if (this.guessTimer) clearInterval(this.guessTimer);
        if (this.animationId) cancelAnimationFrame(this.animationId);

        return this;
    }
};

export default GameState;
