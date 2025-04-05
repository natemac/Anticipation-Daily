// renderer.js - Minimal defensive version

import GameState from './state.js';
import { log } from '../game.js';

// Module variables
let canvas = null;
let ctx = null;
let confettiCanvas = null;
let confettiCtx = null;

// Initialize the renderer
function init() {
    // Get canvas element
    canvas = document.getElementById('gameCanvas');

    // Exit if canvas not found
    if (!canvas) {
        console.error("Canvas element not found");
        return false;
    }

    // Get context
    ctx = canvas.getContext('2d');

    // Set up confetti canvas
    createConfettiCanvas();

    // Initialize canvas size
    resizeCanvas();

    return true;
}

// Safely get canvas
function getCanvas() {
    if (!canvas) {
        canvas = document.getElementById('gameCanvas');
    }
    return canvas;
}

// Create confetti canvas
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

// Resize canvas
function resizeCanvas() {
    const canvasElement = getCanvas();
    if (!canvasElement || !ctx) return;

    try {
        const container = canvasElement.parentElement;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        canvasElement.width = rect.width;
        canvasElement.height = rect.height;

        // Reset scaling to force recalculation
        GameState.scaling = null;

        // Redraw if game is active
        if (GameState.gameStarted) {
            renderFrame();
        }
    } catch (error) {
        console.error("Error resizing canvas:", error);
    }
}

// Render current frame
function renderFrame() {
    const canvasElement = getCanvas();
    if (!canvasElement || !ctx) return;

    try {
        // Clear canvas
        ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        // Draw white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);

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
    if (!GameState.drawingData || !GameState.drawingData.dots || !ctx) return;

    try {
        // Calculate scaling if needed
        if (!GameState.scaling) {
            calculateScaling();
        }

        const scaling = GameState.scaling;
        if (!scaling) return;

        // Draw dots
        const DOT_RADIUS = 5;

        GameState.drawingData.dots.forEach((dot, index) => {
            if (!dot) return;

            const x = (dot.x * scaling.scale) + scaling.offsetX;
            const y = (dot.y * scaling.scale) + scaling.offsetY;

            // Draw dot
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fill();

            // Draw index
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '8px Arial';
            ctx.fillText(index.toString(), x, y);
        });
    } catch (error) {
        console.error("Error drawing dots:", error);
    }
}

// Draw lines
function drawLines() {
    if (!GameState.drawingData || !GameState.drawingData.sequence || !ctx) return;

    try {
        // Calculate scaling if needed
        if (!GameState.scaling) {
            calculateScaling();
        }

        const scaling = GameState.scaling;
        if (!scaling) return;

        // Draw lines
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';

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

            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
        }
    } catch (error) {
        console.error("Error drawing lines:", error);
    }
}

// Calculate scaling
function calculateScaling() {
    const canvasElement = getCanvas();
    if (!GameState.drawingData || !canvasElement) return;

    try {
        const displayWidth = canvasElement.width;
        const displayHeight = canvasElement.height;

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
    } catch (error) {
        console.error("Error calculating scaling:", error);
    }
}

// Render partial line for animation
function renderPartialLine(lineIndex, progress) {
    // Simplified version - just do a full render for now
    renderFrame();
}

// Check canvas initialization
function checkCanvasInitialization() {
    if (!canvas) {
        init();
    }
}

// Resize confetti canvas
function resizeConfettiCanvas() {
    if (!confettiCanvas) return;

    try {
        const gameScreen = document.querySelector('.game-screen');
        if (!gameScreen) return;

        const rect = gameScreen.getBoundingClientRect();
        confettiCanvas.width = rect.width;
        confettiCanvas.height = rect.height;
    } catch (error) {
        console.error("Error resizing confetti canvas:", error);
    }
}

// Reinitialize canvas
function reinitializeCanvas() {
    canvas = document.getElementById('gameCanvas');
    if (!canvas) return false;

    ctx = canvas.getContext('2d');
    resizeCanvas();
    return true;
}

// Clear canvas
function clearCanvas() {
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
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
