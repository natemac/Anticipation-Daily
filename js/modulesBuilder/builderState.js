// builderState.js - Manages state for the Anticipation Builder

// Constants
export const GRID_SIZE = 16; // 16x16 grid (17x17 points)
export const DOT_RADIUS = 5;
// Define the drawing bounds - prevent drawing on the edges
export const MIN_DRAW_GRID = 1;  // Minimum grid coordinate for drawing
export const MAX_DRAW_GRID = 15; // Maximum grid coordinate for drawing

// Track recording state globally
let _isCurrentlyRecording = false;

// Global state object - shared across modules
const BuilderState = {
    // Recording active flag (exported for other modules)
    get isCurrentlyRecording() {
        return _isCurrentlyRecording;
    },
    
    set isCurrentlyRecording(value) {
        _isCurrentlyRecording = value;
    },

    // Main mode
    mode: 'sketch', // 'sketch', 'edit', 'record', or 'preview'
    
    // Touch input state
    touch: {
        active: false,         // Is a point currently being set
        tempPoint: null,       // Temporary point location {x, y, gridX, gridY}
        pendingPoint: null,    // Index of point waiting for connection
        previewLine: null,     // Preview line from pendingPoint to tempPoint
        lastTouchX: 0,         // Last touch/mouse X position
        lastTouchY: 0          // Last touch/mouse Y position
    },
    
    // Sketch data
    sketch: {
        dots: [],              // Array of {x, y, gridX, gridY} coordinates
        lines: [],             // Array of {from, to} indices
        selectedDot: null      // Currently selected dot index for sketch
    },
    
    // Recording data - completely independent from sketch
    recording: {
        dots: [],              // Array of {x, y, gridX, gridY} coordinates
        lines: [],             // Array of {from, to} indices
        sequence: [],          // Animation sequence
        selectedDot: null,     // Currently selected dot index for recording
        isRecording: false,    // Is currently recording
        isPlaying: false       // Is preview playing
    },
    
    hoveredGridPoint: null,    // Current grid point being hovered {x, y}
    gridPointSize: 0,          // Size of each grid cell, calculated on init
    isTouch: false,            // Flag for touch devices, set during initialization
    
    // Method to reset sketch data
    resetSketch() {
        this.sketch.dots = [];
        this.sketch.lines = [];
        this.sketch.selectedDot = null;
    },
    
    // Method to reset recording data
    resetRecording() {
        this.recording.dots = [];
        this.recording.lines = [];
        this.recording.sequence = [];
        this.recording.selectedDot = null;
        this.recording.isRecording = false;
        this.recording.isPlaying = false;
    },
    
    // Method to reset touch state
    resetTouchState() {
        this.touch.pendingPoint = null;
        this.touch.tempPoint = null;
        this.touch.previewLine = null;
        this.touch.active = false;
        this.touch.lastTouchX = 0;
        this.touch.lastTouchY = 0;
    }
};

export default BuilderState;
