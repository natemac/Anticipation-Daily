// renderer.js - Fixed module that avoids temporal dead zone issues

import GameState from './state.js';
import { log } from '../game.js';

// Create a module-level object to store references instead of using top-level variables
// This avoids temporal dead zone issues with lexical declarations
const CanvasRefs = {
    canvas: null,
    ctx: null,
    confettiCanvas: null,
    confettiCtx: null,
    initialized: false
};

// Initialize the renderer
function init() {
    log("Initializing renderer module");

    // Get canvas element
    CanvasRefs.canvas = document.getElementById('gameCanvas');

    // Exit if canvas not found
    if (!CanvasRefs.canvas) {
        console.error("Canvas element not found during initialization");
        return false;
    }

    // Get context
    try {
        CanvasRefs.ctx = CanvasRefs.canvas.getContext('2d');
    } catch (e) {
        console.error("Error getting canvas context:", e);
        return false;
    }

    // Set up confetti canvas
    createConfettiCanvas();

    // Initialize canvas size
    resizeCanvas();

    // Mark as initialized
    CanvasRefs.initialized = true;

    log("Renderer initialized successfully");
    return true;
}

// Safely get canvas - avoids creating a new variable
function getCanvas() {
    if (!CanvasRefs.canvas) {
        CanvasRefs.canvas = document.getElementById('gameCanvas');
        if (CanvasRefs.canvas && !CanvasRefs.ctx) {
            try {
                CanvasRefs.ctx = CanvasRefs.canvas.getContext('2d');
            } catch (e) {
                console.error("Error getting canvas context:", e);
            }
        }
    }
    return CanvasRefs.canvas;
}

// Create confetti canvas
function createConfettiCanvas() {
    try {
        CanvasRefs.confettiCanvas = document.createElement('canvas');
        CanvasRefs.confettiCanvas.id = 'confettiCanvas';
        CanvasRefs.confettiCanvas.style.position = 'absolute';
        CanvasRefs.confettiCanvas.style.top = '0';
        CanvasRefs.confettiCanvas.style.left = '0';
        CanvasRefs.confettiCanvas.style.width = '100%';
        CanvasRefs.confettiCanvas.style.height = '100%';
        CanvasRefs.confettiCanvas.style.pointerEvents = 'none';
        CanvasRefs.confettiCanvas.style.zIndex = '100';
        CanvasRefs.confettiCanvas.style.display = 'none';

        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen) {
            gameScreen.appendChild(CanvasRefs.confettiCanvas);
            CanvasRefs.confettiCtx = CanvasRefs.confettiCanvas.getContext('2d');
        }
    } catch (error) {
        console.error("Error creating confetti canvas:", error);
    }
}

// Resize canvas
function resizeCanvas() {
    const canvas = getCanvas();
    if (!canvas || !CanvasRefs.ctx) {
        log("Cannot resize canvas - not initialized");
        return;
    }

    try {
        const container = canvas.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        // Reset scaling to force recalculation
        GameState.scaling = null;

        // Redraw if game is active
        if (GameState.gameStarted) {
            renderFrame();
        } else {
            // Draw a clean background
            CanvasRefs.ctx.fillStyle = '#ffffff';
            CanvasRefs.ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        log(`Canvas resized to ${canvas.width}x${canvas.height}`);
    } catch (error) {
        console.error("Error resizing canvas:", error);
    }
}

// Render current frame
function renderFrame() {
    const canvas = getCanvas();
    if (!canvas || !CanvasRefs.ctx) {
        log("Cannot render frame - canvas not initialized");
        return;
    }

    try {
        // Clear canvas
        CanvasRefs.ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw white background
        CanvasRefs.ctx.fillStyle = '#ffffff';
        CanvasRefs.ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw dots in easy mode
        if (GameState.difficulty === 'easy') {
            drawDots();
        }

        // Draw lines
        drawLines();
    } catch (error) {
        console.error("Error rendering frame:", error);
    }
}

// Draw dots
function drawDots() {
    if (!GameState.drawingData || !GameState.drawingData.dots || !CanvasRefs.ctx) return;

    try {
        // Calculate scaling if needed
        if (!GameState.scaling) {
            calculateScaling();
        }

        const scaling = GameState.scaling;
        if (!scaling) return;

        // Draw dots
        const DOT_RADIUS = GameState.CONFIG && GameState.CONFIG.DOT_RADIUS ?
                           GameState.CONFIG.DOT_RADIUS : 5;

        GameState.drawingData.dots.forEach((dot, index) => {
            if (!dot) return;

            const x = (dot.x * scaling.scale) + scaling.offsetX;
            const y = (dot.y * scaling.scale) + scaling.offsetY;

            // Draw dot
            CanvasRefs.ctx.fillStyle = '#333';
            CanvasRefs.ctx.beginPath();
            CanvasRefs.ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
            CanvasRefs.ctx.fill();

            // Draw index
            CanvasRefs.ctx.fillStyle = '#fff';
            CanvasRefs.ctx.textAlign = 'center';
            CanvasRefs.ctx.textBaseline = 'middle';
            CanvasRefs.ctx.font = '8px Arial';
            CanvasRefs.ctx.fillText(index.toString(), x, y);
        });
    } catch (error) {
        console.error("Error drawing dots:", error);
    }
}

// Draw lines
function drawLines() {
    if (!GameState.drawingData || !GameState.drawingData.sequence || !CanvasRefs.ctx) return;

    try {
        // Calculate scaling if needed
        if (!GameState.scaling) {
            calculateScaling();
        }

        const scaling = GameState.scaling;
        if (!scaling) return;

        // Draw lines
        CanvasRefs.ctx.strokeStyle = '#000';
        CanvasRefs.ctx.lineWidth = 3;
        CanvasRefs.ctx.lineCap = 'round';

        for (let i = 0; i < GameState.drawingProgress; i++) {
            if (i >= GameState.drawingData.sequence.length) break;

            const line = GameState.drawingData.sequence[i];
            if (!line) continue;

            const from = GameState.drawingData.dots[line.from];
            const to = GameState.drawingData.dots[line.to];

            if (!from || !to) continue;

            const fromX = (from.x * scaling.scale) + scaling.offsetX;
            const fromY = (from.y * scaling.scale) + scaling.offsetY;
            const toX = (to.x * scaling.scale) + scaling.offsetX;
            const toY = (to.y * scaling.scale) + scaling.offsetY;

            CanvasRefs.ctx.beginPath();
            CanvasRefs.ctx.moveTo(fromX, fromY);
            CanvasRefs.ctx.lineTo(toX, toY);
            CanvasRefs.ctx.stroke();
        }
    } catch (error) {
        console.error("Error drawing lines:", error);
    }
}

// Calculate scaling
function calculateScaling() {
    const canvas = getCanvas();
    if (!GameState.drawingData || !canvas) return;

    try {
        const displayWidth = canvas.width;
        const displayHeight = canvas.height;

        // Calculate scale to fit
        const size = Math.min(displayWidth, displayHeight) * 0.9;
        const scale = size / 560;

        // Center drawing
        const offsetX = (displayWidth - size) / 2;
        const offsetY = (displayHeight - size) / 2;

        GameState.scaling = {
            scale: scale,
            offsetX: offsetX,
            offsetY: offsetY,
            gridSize: 16
        };

        log(`Scaling calculated: scale=${scale}, offset=(${offsetX},${offsetY})`);
    } catch (error) {
        console.error("Error calculating scaling:", error);
    }
}

// Render partial line for animation (simplified version)
function renderPartialLine(lineIndex, progress) {
    // For now, just do a full render
    renderFrame();
}

// Check canvas initialization
function checkCanvasInitialization() {
    if (!CanvasRefs.initialized) {
        log("Checking canvas initialization");
        init();
    }
}

// Resize confetti canvas
function resizeConfettiCanvas() {
    if (!CanvasRefs.confettiCanvas) return;

    try {
        const gameScreen = document.querySelector('.game-screen');
        if (!gameScreen) return;

        const rect = gameScreen.getBoundingClientRect();
        CanvasRefs.confettiCanvas.width = rect.width;
        CanvasRefs.confettiCanvas.height = rect.height;
    } catch (error) {
        console.error("Error resizing confetti canvas:", error);
    }
}

// FIXED: Reinitialize canvas without creating a new local 'canvas' variable
// This avoids the temporal dead zone issue
function reinitializeCanvas() {
    log("Reinitializing canvas...");

    // Get a new reference without creating a new variable that shadows the module-level one
    CanvasRefs.canvas = document.getElementById('gameCanvas');

    if (!CanvasRefs.canvas) {
        log("Cannot reinitialize - canvas element not found");
        return false;
    }

    try {
        CanvasRefs.ctx = CanvasRefs.canvas.getContext('2d');
        resizeCanvas();
        CanvasRefs.initialized = true;
        log("Canvas reinitialized successfully");
        return true;
    } catch (e) {
        console.error("Error reinitializing canvas:", e);
        return false;
    }
}

// Clear canvas
function clearCanvas() {
    if (!CanvasRefs.canvas || !CanvasRefs.ctx) return;

    try {
        CanvasRefs.ctx.clearRect(0, 0, CanvasRefs.canvas.width, CanvasRefs.canvas.height);
    } catch (error) {
        console.error("Error clearing canvas:", error);
    }
}

// Export functions
export {
    init,
    renderFrame,
    renderPartialLine,
    resizeCanvas,
    clearCanvas,
    drawDots,
    drawLines,
    calculateScaling,
    checkCanvasInitialization,
    resizeConfettiCanvas,
    reinitializeCanvas,
    getCanvas
};
