// renderer.js - Handles all canvas drawing and rendering operations

import GameState from './state.js';
import { log } from '../game.js';

// Module variables
let canvas, ctx;
let confettiCanvas, confettiCtx;

// Constants
const DOT_RADIUS = 5;

// Initialize the renderer
function init() {
    // Get canvas element
    canvas = document.getElementById('gameCanvas');

    // Initialize main canvas
    initializeGameCanvas();

    // Initialize confetti canvas
    createConfettiCanvas();

    return {
        canvas,
        ctx,
        confettiCanvas,
        confettiCtx
    };
}

// Initialize game canvas with optimized settings
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
    resizeCanvas();

    // Draw initial content to ensure browser initializes canvas properly
    preRenderCanvas();

    // Add a slight delay before finalizing initialization
    setTimeout(() => {
        // Mark canvas as ready
        GameState.canvasReady = true;
        log("Canvas fully initialized and ready");
    }, 100);
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

// Resize canvas to match container with retina display support
function resizeCanvas() {
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
    GameState.scaling = null;

    // Resize confetti canvas if it exists
    if (confettiCanvas) {
        confettiCanvas.width = displayWidth * devicePixelRatio;
        confettiCanvas.height = displayHeight * devicePixelRatio;
        if (confettiCtx) {
            confettiCtx.scale(devicePixelRatio, devicePixelRatio);
        }
    }

    // If game is active, redraw content
    if (GameState.gameStarted) {
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

// Main render function for game content
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
    if (GameState.difficulty === 'easy') {
        drawDots();
    }

    // Always draw lines based on current progress
    drawLines();
}

// Calculate scaling to match builder view
function calculateScaling() {
    if (!GameState.drawingData) {
        return;
    }

    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    // Make the drawing fill almost the entire canvas area
    const canvasPercentage = 0.9; // Use 90% of the canvas area

    // Calculate the maximum size while maintaining aspect ratio
    const size = Math.min(displayWidth, displayHeight) * canvasPercentage;

    // Ensure we're using a 1:1 aspect ratio as in the builder
    const scale = size / 560; // Builder uses a 400x400 area

    // Center the drawing in the canvas
    const offsetX = (displayWidth - size) / 2;
    const offsetY = (displayHeight - size) / 2;

    GameState.scaling = {
        scale: scale,
        offsetX: offsetX,
        offsetY: offsetY,
        gridSize: 16 // Fixed 16x16 grid (17x17 points)
    };

    log(`Scaling calculated: scale=${scale}, offset=(${offsetX},${offsetY})`);
}

// Draw dots with enhanced visuals
function drawDots() {
    if (!GameState.drawingData || !GameState.drawingData.dots) {
        log("No dot data to draw");
        return;
    }

    // Calculate scaling if not done yet
    if (!GameState.scaling) {
        calculateScaling();
    }

    const scaling = GameState.scaling;

    GameState.drawingData.dots.forEach((dot, index) => {
        if (!dot) return;

        // Apply scaling directly from builder coordinates
        const x = (dot.x * scaling.scale) + scaling.offsetX;
        const y = (dot.y * scaling.scale) + scaling.offsetY;

        // Draw dot shadow for better visibility
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.arc(x + 1, y + 1, DOT_RADIUS + 1, 0, Math.PI * 2);
        ctx.fill();

        // Draw dot
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
        ctx.fill();

        // Draw dot index
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '8px Arial';
        ctx.fillText(index.toString(), x, y);
    });
}

// Draw lines with enhanced visuals
function drawLines() {
    if (!GameState.drawingData || !GameState.drawingData.sequence) {
        log("No line data to draw");
        return;
    }

    // Calculate scaling if not done yet
    if (!GameState.scaling) {
        calculateScaling();
    }

    const scaling = GameState.scaling;

    // Draw line shadows for depth (only in easy mode)
    if (GameState.difficulty === 'easy') {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < GameState.drawingProgress; i++) {
            if (i < GameState.drawingData.sequence.length) {
                const line = GameState.drawingData.sequence[i];
                if (!line) continue;

                const from = GameState.drawingData.dots[line.from];
                const to = GameState.drawingData.dots[line.to];

                if (!from || !to) continue;

                // Apply scaling with slight offset for shadow
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

    // Draw the actual lines
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 0; i < GameState.drawingProgress; i++) {
        if (i < GameState.drawingData.sequence.length) {
            const line = GameState.drawingData.sequence[i];
            if (!line) continue;

            const from = GameState.drawingData.dots[line.from];
            const to = GameState.drawingData.dots[line.to];

            if (!from || !to) continue;

            // Apply scaling
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

// Check if canvas is properly initialized after page load
function checkCanvasInitialization() {
    if (canvas && !GameState.canvasReady) {
        log("Reinitializing canvas after full page load");
        initializeGameCanvas();
    }
}

// Clear canvas
function clearCanvas() {
    if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
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

// Export public functions
export {
    init,
    renderFrame,
    resizeCanvas,
    clearCanvas,
    drawDots,
    drawLines,
    calculateScaling,
    checkCanvasInitialization,
    resizeConfettiCanvas
};
