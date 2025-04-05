// renderer.js - Handles all canvas drawing and rendering operations with defensive coding

import GameState from './state.js';
import { log } from '../game.js';

// Module variables - initialize with null to make it clear they haven't been set yet
let canvas = null, ctx = null;
let confettiCanvas = null, confettiCtx = null;
let canvasInitialized = false;

// Initialize the renderer
function init() {
    try {
        log("Initializing renderer - defensive implementation");

        // Get canvas element
        if (!canvas) {
            canvas = document.getElementById('gameCanvas');
        }

        // Safety check - if canvas doesn't exist, log error and exit initialization
        if (!canvas) {
            console.error("Canvas element with ID 'gameCanvas' not found. Initialization aborted.");
            return {
                canvas: null,
                ctx: null,
                confettiCanvas: null,
                confettiCtx: null
            };
        }

        // Initialize main canvas
        initializeGameCanvas();

        // Initialize confetti canvas
        createConfettiCanvas();

        canvasInitialized = true;

        return {
            canvas,
            ctx,
            confettiCanvas,
            confettiCtx
        };
    } catch (error) {
        console.error("Error during renderer initialization:", error);
        return {
            canvas: null,
            ctx: null,
            confettiCanvas: null,
            confettiCtx: null
        };
    }
}

// Safe canvas getter - always checks and tries to get canvas if not already set
function getCanvas() {
    if (!canvas) {
        canvas = document.getElementById('gameCanvas');
        if (canvas) {
            log("Canvas element found and set");
        } else {
            log("Canvas element not found");
        }
    }
    return canvas;
}

// Initialize game canvas with optimized settings
function initializeGameCanvas() {
    log("Setting up canvas with improved defensive initialization...");

    try {
        // Ensure canvas is available
        const canvasElement = getCanvas();
        if (!canvasElement) {
            log("Cannot initialize game canvas - element not found");
            return false;
        }

        // Get a standard 2D context with explicit options for better performance
        try {
            ctx = canvasElement.getContext('2d', {
                alpha: false,          // Disable alpha for better performance
                desynchronized: true,  // Use desynchronized mode for better performance
                willReadFrequently: false
            });
        } catch (e) {
            console.error("Error getting 2D context:", e);
            return false;
        }

        if (!ctx) {
            log("Could not get 2D context for canvas");
            return false;
        }

        // Ensure the canvas container is visible
        const container = canvasElement.parentElement;
        if (container) {
            container.style.visibility = 'visible';
            container.style.opacity = '1';
        }

        // Set proper dimensions immediately
        try {
            safeResizeCanvas();
        } catch (e) {
            console.error("Error during initial canvas resize:", e);
        }

        // Draw initial content to ensure browser initializes canvas properly
        try {
            preRenderCanvas();
        } catch (e) {
            console.error("Error during pre-rendering:", e);
        }

        // Add a slight delay before finalizing initialization
        setTimeout(() => {
            // Mark canvas as ready
            GameState.canvasReady = true;
            canvasInitialized = true;
            log("Canvas fully initialized and ready");
        }, 100);

        return true;
    } catch (e) {
        console.error("Error initializing canvas:", e);
        return false;
    }
}

// Create confetti canvas for successful completion
function createConfettiCanvas() {
    try {
        if (!confettiCanvas) {
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
        }

        const gameScreen = document.querySelector('.game-screen');
        if (gameScreen && !gameScreen.contains(confettiCanvas)) {
            gameScreen.appendChild(confettiCanvas);
            confettiCtx = confettiCanvas.getContext('2d');
        }
    } catch (error) {
        console.error("Error creating confetti canvas:", error);
    }
}

// Pre-render to ensure the browser has initialized the canvas properly
function preRenderCanvas() {
    if (!ctx || !canvas) return;

    try {
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
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(10, 10, 50, 50);
            }
        }, 0);
    } catch (error) {
        console.error("Error in preRenderCanvas:", error);
    }
}

// Safe resize canvas - handles case where canvas isn't ready yet
function safeResizeCanvas() {
    // Check if canvas reference exists before trying to use it
    const canvasElement = getCanvas();
    if (!canvasElement) {
        console.log("Canvas not available yet, skipping resize");
        return;
    }

    // Check if context is available
    if (!ctx) {
        try {
            ctx = canvasElement.getContext('2d');
        } catch (e) {
            console.error("Error getting 2D context during resize:", e);
            return;
        }
    }

    if (!ctx) {
        console.log("Canvas context not available yet, skipping resize");
        return;
    }

    try {
        const container = canvasElement.parentElement;
        if (!container) return;

        // Get the container's bounding rectangle
        const rect = container.getBoundingClientRect();
        const displayWidth = rect.width;
        const displayHeight = rect.height;

        // Calculate device pixel ratio for high-DPI displays
        const devicePixelRatio = window.devicePixelRatio || 1;

        // Set actual size in memory (scaled for retina)
        canvasElement.width = displayWidth * devicePixelRatio;
        canvasElement.height = displayHeight * devicePixelRatio;

        // Scale all drawing operations by the device pixel ratio
        ctx.scale(devicePixelRatio, devicePixelRatio);

        // Set display size (CSS pixels)
        canvasElement.style.width = displayWidth + "px";
        canvasElement.style.height = displayHeight + "px";

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
    } catch (error) {
        console.error("Error in resizeCanvas:", error);
    }
}

// Safe render frame - ensures canvas is initialized before rendering
function safeRenderFrame() {
    // Get canvas and check if available
    const canvasElement = getCanvas();
    if (!canvasElement || !ctx) {
        log("Canvas or context not available for rendering, skipping render");
        return;
    }

    try {
        // Get logical size in CSS pixels
        const displayWidth = canvasElement.clientWidth;
        const displayHeight = canvasElement.clientHeight;

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
    } catch (error) {
        console.error("Error in renderFrame:", error);
    }
}

// Render frame with a partially drawn line for smooth animation
function renderPartialLine(lineIndex, progress) {
    // Check if canvas and context are available
    const canvasElement = getCanvas();
    if (!canvasElement || !ctx || !GameState.drawingData) {
        log("Canvas or context not available for partial line rendering");
        return;
    }

    try {
        // Get logical size in CSS pixels
        const displayWidth = canvasElement.clientWidth;
        const displayHeight = canvasElement.clientHeight;

        // Clear the entire canvas
        ctx.clearRect(0, 0, displayWidth, displayHeight);

        // Set white background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, displayWidth, displayHeight);

        // In easy mode, draw dots first
        if (GameState.difficulty === 'easy') {
            drawDots();
        }

        // Draw completed lines (before the current one)
        drawCompletedLines(lineIndex);

        // Draw current line with partial progress
        drawPartialLine(lineIndex, progress);
    } catch (error) {
        console.error("Error in renderPartialLine:", error);
    }
}

// Draw completed lines up to but not including the specified index
function drawCompletedLines(upToIndex) {
    if (!GameState.drawingData || !GameState.drawingData.sequence || !ctx) {
        return;
    }

    try {
        // Calculate scaling if not done yet
        if (!GameState.scaling) {
            calculateScaling();
        }

        const scaling = GameState.scaling;
        if (!scaling) return;

        const sequence = GameState.drawingData.sequence;
        const dots = GameState.drawingData.dots;

        // Draw line shadows for depth (only in easy mode)
        if (GameState.difficulty === 'easy') {
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            for (let i = 0; i < upToIndex; i++) {
                if (i >= sequence.length) break;

                const line = sequence[i];
                if (!line) continue;

                const from = dots[line.from];
                const to = dots[line.to];

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

        // Draw the actual completed lines
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < upToIndex; i++) {
            if (i >= sequence.length) break;

            const line = sequence[i];
            if (!line) continue;

            const from = dots[line.from];
            const to = dots[line.to];

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
    } catch (error) {
        console.error("Error in drawCompletedLines:", error);
    }
}

// Draw a single line with partial progress for animation
function drawPartialLine(lineIndex, progress) {
    const canvasElement = getCanvas();
    if (!GameState.drawingData || !GameState.drawingData.sequence ||
        lineIndex >= GameState.drawingData.sequence.length || !ctx || !canvasElement) {
        return;
    }

    try {
        // Calculate scaling if not done yet
        if (!GameState.scaling) {
            calculateScaling();
        }

        const scaling = GameState.scaling;
        if (!scaling) return;

        const line = GameState.drawingData.sequence[lineIndex];
        const dots = GameState.drawingData.dots;

        if (!line || !dots) return;

        const from = dots[line.from];
        const to = dots[line.to];

        if (!from || !to) return;

        // Apply scaling
        const fromX = (from.x * scaling.scale) + scaling.offsetX;
        const fromY = (from.y * scaling.scale) + scaling.offsetY;
        const toX = (to.x * scaling.scale) + scaling.offsetX;
        const toY = (to.y * scaling.scale) + scaling.offsetY;

        // Calculate partial endpoint using progress value (0-1)
        const currentX = fromX + (toX - fromX) * progress;
        const currentY = fromY + (toY - fromY) * progress;

        // Draw shadow for partial line (only in easy mode)
        if (GameState.difficulty === 'easy') {
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';

            ctx.beginPath();
            ctx.moveTo(fromX + 1, fromY + 1);
            ctx.lineTo(currentX + 1, currentY + 1);
            ctx.stroke();
        }

        // Draw partial line
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        ctx.beginPath();
        ctx.moveTo(fromX, fromY);
        ctx.lineTo(currentX, currentY);
        ctx.stroke();
    } catch (error) {
        console.error("Error in drawPartialLine:", error);
    }
}

// Calculate scaling to match builder view
function calculateScaling() {
    const canvasElement = getCanvas();
    if (!GameState.drawingData || !canvasElement) {
        return;
    }

    try {
        const displayWidth = canvasElement.clientWidth;
        const displayHeight = canvasElement.clientHeight;

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
    } catch (error) {
        console.error("Error in calculateScaling:", error);
    }
}

// Draw dots with enhanced visuals
function drawDots() {
    const canvasElement = getCanvas();
    if (!GameState.drawingData || !GameState.drawingData.dots || !ctx || !canvasElement) {
        log("No dot data to draw or canvas/context not available");
        return;
    }

    try {
        // Calculate scaling if not done yet
        if (!GameState.scaling) {
            calculateScaling();
        }

        const scaling = GameState.scaling;
        if (!scaling) return;

        // Use the dot radius from centralized config
        const DOT_RADIUS = GameState.CONFIG.DOT_RADIUS;

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
    } catch (error) {
        console.error("Error in drawDots:", error);
    }
}

// Draw lines with enhanced visuals
function drawLines() {
    const canvasElement = getCanvas();
    if (!GameState.drawingData || !GameState.drawingData.sequence || !ctx || !canvasElement) {
        log("No line data to draw or canvas/context not available");
        return;
    }

    try {
        // Calculate scaling if not done yet
        if (!GameState.scaling) {
            calculateScaling();
        }

        const scaling = GameState.scaling;
        if (!scaling) return;

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
    } catch (error) {
        console.error("Error in drawLines:", error);
    }
}

// Check if canvas is properly initialized after page load
function checkCanvasInitialization() {
    if (!canvas && document.getElementById('gameCanvas')) {
        log("Reinitializing canvas after full page load");
        init();
    } else if (canvas && !GameState.canvasReady) {
        initializeGameCanvas();
    }
}

// Clear canvas
function clearCanvas() {
    const canvasElement = getCanvas();
    if (ctx && canvasElement) {
        try {
            ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        } catch (error) {
            console.error("Error in clearCanvas:", error);
        }
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
        console.error("Error in resizeConfettiCanvas:", error);
    }
}

// Reinitialize canvas - can be called when switching to game screen
function reinitializeCanvas() {
    // Get canvas element again to ensure it's available
    canvas = document.getElementById('gameCanvas');

    // Skip if canvas isn't available yet
    if (!canvas) {
        console.log("Canvas not found during reinitialization");
        return false;
    }

    // Initialize main canvas
    initializeGameCanvas();

    // Return success
    return true;
}

// Export public functions - provide both regular and safe versions
export {
    init,
    renderFrame: safeRenderFrame, // Use the safe version by default
    safeRenderFrame,
    renderPartialLine,
    resizeCanvas: safeResizeCanvas, // Use the safe version by default
    safeResizeCanvas,
    clearCanvas,
    drawDots,
    drawLines,
    calculateScaling,
    checkCanvasInitialization,
    resizeConfettiCanvas,
    reinitializeCanvas,
    getCanvas // Export the safe canvas getter
};
