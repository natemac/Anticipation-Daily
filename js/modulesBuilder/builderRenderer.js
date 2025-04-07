// builderRenderer.js - Handles canvas drawing and rendering for the Anticipation Builder

import BuilderState, { DOT_RADIUS, GRID_SIZE, MIN_DRAW_GRID, MAX_DRAW_GRID } from './builderState.js';
import { findNearestGridPoint, findDotAtGridPoint } from './builderGrid.js';

// Canvas and context references
let gridCanvas, gridCtx;
let previewCanvas, previewCtx;

// Initialize canvases
export function initCanvas(canvas, previewCanvasEl) {
    gridCanvas = canvas;
    previewCanvas = previewCanvasEl;
    
    gridCtx = gridCanvas.getContext('2d');
    previewCtx = previewCanvas.getContext('2d');
    
    const container = gridCanvas.parentElement;
    gridCanvas.width = container.offsetWidth;
    gridCanvas.height = container.offsetHeight;

    // Calculate cell size
    BuilderState.gridPointSize = gridCanvas.width / GRID_SIZE;

    // Draw grid
    drawGrid();
    
    return { gridCtx, previewCtx };
}

// Draw the grid
export function drawGrid() {
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Draw grid lines - all with the same style
    gridCtx.strokeStyle = '#ddd';
    gridCtx.lineWidth = 1;

    // Draw vertical lines
    for (let i = 0; i <= GRID_SIZE; i++) {
        const x = i * BuilderState.gridPointSize;
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, gridCanvas.height);
        gridCtx.stroke();
    }

    // Draw horizontal lines
    for (let i = 0; i <= GRID_SIZE; i++) {
        const y = i * BuilderState.gridPointSize;
        gridCtx.beginPath();
        gridCtx.moveTo(0, y);
        gridCtx.lineTo(gridCanvas.width, y);
        gridCtx.stroke();
    }

    // Draw grid points (skip edge points)
    for (let x = 0; x <= GRID_SIZE; x++) {
        for (let y = 0; y <= GRID_SIZE; y++) {
            // Skip drawing points on the edges
            if (x === 0 || x === GRID_SIZE || y === 0 || y === GRID_SIZE) {
                continue; // Skip to next iteration
            }

            const pointX = x * BuilderState.gridPointSize;
            const pointY = y * BuilderState.gridPointSize;

            // Style all points the same
            gridCtx.fillStyle = '#bbb';
            gridCtx.beginPath();
            gridCtx.arc(pointX, pointY, 3, 0, Math.PI * 2);
            gridCtx.fill();
        }
    }

    // Highlight hovered grid point
    if (BuilderState.hoveredGridPoint) {
        // Check if we're on an edge - still maintain functionality restriction
        const isOnEdge = BuilderState.hoveredGridPoint.x < MIN_DRAW_GRID ||
                        BuilderState.hoveredGridPoint.x > MAX_DRAW_GRID ||
                        BuilderState.hoveredGridPoint.y < MIN_DRAW_GRID ||
                        BuilderState.hoveredGridPoint.y > MAX_DRAW_GRID;

        if (isOnEdge) {
            gridCtx.fillStyle = '#f88'; // Red tint for edge (not allowed)
        } else {
            gridCtx.fillStyle = '#aaa'; // Normal highlight
        }

        gridCtx.beginPath();
        gridCtx.arc(
            BuilderState.hoveredGridPoint.x * BuilderState.gridPointSize,
            BuilderState.hoveredGridPoint.y * BuilderState.gridPointSize,
            4, 0, Math.PI * 2
        );
        gridCtx.fill();
    }
}

// Redraw canvas with all elements
export function redrawCanvas() {
    // Start with grid
    drawGrid();

    if (BuilderState.mode === 'sketch' || BuilderState.mode === 'edit') {
        // Draw sketch data
        drawSketch();
    } else if (BuilderState.mode === 'record') {
        // Draw sketch data with reduced opacity
        drawSketch(0.3);

        // Draw recording data on top at full opacity
        drawRecording();
    } else if (BuilderState.mode === 'preview') {
        // Only draw recording in preview mode
        drawRecording();
    }

    // Draw preview line if we have a pending point and temp point
    if (BuilderState.touch.pendingPoint !== null && BuilderState.touch.tempPoint !== null) {
        const dotsArray = (BuilderState.mode === 'sketch') ? BuilderState.sketch.dots : BuilderState.recording.dots;

        if (BuilderState.touch.pendingPoint < dotsArray.length) {
            const fromDot = dotsArray[BuilderState.touch.pendingPoint];
            const toDot = BuilderState.touch.tempPoint;

            // Always draw the preview line when we have a pendingPoint and tempPoint
            gridCtx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
            gridCtx.lineWidth = 2;
            gridCtx.setLineDash([5, 5]);

            gridCtx.beginPath();
            gridCtx.moveTo(fromDot.x, fromDot.y);
            gridCtx.lineTo(toDot.x, toDot.y);
            gridCtx.stroke();

            gridCtx.setLineDash([]);
        }
    }

    // Highlight pending point if it exists
    if (BuilderState.touch.pendingPoint !== null) {
        const dotsArray = (BuilderState.mode === 'sketch') ? BuilderState.sketch.dots : BuilderState.recording.dots;

        if (BuilderState.touch.pendingPoint < dotsArray.length) {
            const dot = dotsArray[BuilderState.touch.pendingPoint];

            gridCtx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            gridCtx.lineWidth = 3;

            gridCtx.beginPath();
            gridCtx.arc(dot.x, dot.y, DOT_RADIUS + 5, 0, Math.PI * 2);
            gridCtx.stroke();
        }
    }
}

// Draw sketch data
export function drawSketch(opacity = 1.0) {
    gridCtx.globalAlpha = opacity;

    // Draw lines
    gridCtx.strokeStyle = '#000';
    gridCtx.lineWidth = 2;

    BuilderState.sketch.lines.forEach(line => {
        const from = BuilderState.sketch.dots[line.from];
        const to = BuilderState.sketch.dots[line.to];

        gridCtx.beginPath();
        gridCtx.moveTo(from.x, from.y);
        gridCtx.lineTo(to.x, to.y);
        gridCtx.stroke();
    });

    // Draw dots
    BuilderState.sketch.dots.forEach((dot, index) => {
        gridCtx.fillStyle = '#333';
        gridCtx.beginPath();
        gridCtx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        gridCtx.fill();

        // Draw dot index
        gridCtx.fillStyle = '#fff';
        gridCtx.textAlign = 'center';
        gridCtx.textBaseline = 'middle';
        gridCtx.font = '8px Arial';
        gridCtx.fillText(index.toString(), dot.x, dot.y);
    });

    // Highlight selected dot
    if (BuilderState.sketch.selectedDot !== null) {
        gridCtx.globalAlpha = 1.0; // Always full opacity for selection highlight
        const dot = BuilderState.sketch.dots[BuilderState.sketch.selectedDot];
        gridCtx.strokeStyle = '#f00';
        gridCtx.lineWidth = 2;
        gridCtx.beginPath();
        gridCtx.arc(dot.x, dot.y, DOT_RADIUS + 3, 0, Math.PI * 2);
        gridCtx.stroke();
    }

    // Reset opacity
    gridCtx.globalAlpha = 1.0;
}

// Draw recording data
export function drawRecording() {
    // Always full opacity for recording data
    gridCtx.globalAlpha = 1.0;

    // Draw lines
    BuilderState.recording.lines.forEach(line => {
        const from = BuilderState.recording.dots[line.from];
        const to = BuilderState.recording.dots[line.to];

        // Check if this line is in the recording sequence
        const inSequence = BuilderState.recording.sequence.some(
            seqLine => seqLine.from === line.from && seqLine.to === line.to
        );

        if (inSequence) {
            gridCtx.strokeStyle = '#4CAF50'; // Green for recorded lines
            gridCtx.lineWidth = 4; // Double thickness
        } else {
            gridCtx.strokeStyle = '#000'; // Black for non-recorded lines
            gridCtx.lineWidth = 2;
        }

        gridCtx.beginPath();
        gridCtx.moveTo(from.x, from.y);
        gridCtx.lineTo(to.x, to.y);
        gridCtx.stroke();
    });

    // Draw dots
    BuilderState.recording.dots.forEach((dot, index) => {
        gridCtx.fillStyle = '#333';
        gridCtx.beginPath();
        gridCtx.arc(dot.x, dot.y, DOT_RADIUS, 0, Math.PI * 2);
        gridCtx.fill();

        // Draw dot index
        gridCtx.fillStyle = '#fff';
        gridCtx.textAlign = 'center';
        gridCtx.textBaseline = 'middle';
        gridCtx.font = '8px Arial';
        gridCtx.fillText(index.toString(), dot.x, dot.y);
    });

    // Highlight selected dot
    if (BuilderState.recording.selectedDot !== null) {
        const dot = BuilderState.recording.dots[BuilderState.recording.selectedDot];
        gridCtx.strokeStyle = '#f00';
        gridCtx.lineWidth = 2;
        gridCtx.beginPath();
        gridCtx.arc(dot.x, dot.y, DOT_RADIUS + 3, 0, Math.PI * 2);
        gridCtx.stroke();
    }
}

// Resize canvas handler 
export function resizeCanvas() {
    const container = gridCanvas.parentElement;
    gridCanvas.width = container.offsetWidth;
    gridCanvas.height = container.offsetHeight;

    // Recalculate grid point size
    BuilderState.gridPointSize = gridCanvas.width / GRID_SIZE;

    // Redraw everything
    redrawCanvas();
}

// Show edge warning
export function showEdgeWarning() {
    // Create a temporary flash element
    const flash = document.createElement('div');
    flash.style.position = 'absolute';
    flash.style.top = '50%';
    flash.style.left = '50%';
    flash.style.transform = 'translate(-50%, -50%)';
    flash.style.backgroundColor = 'rgba(255, 0, 0, 0.3)';
    flash.style.padding = '10px 20px';
    flash.style.borderRadius = '5px';
    flash.style.color = 'white';
    flash.style.fontWeight = 'bold';
    flash.style.zIndex = '10';
    flash.textContent = 'Cannot draw on edges';

    // Add it to the grid container
    gridCanvas.parentElement.appendChild(flash);

    // Remove after duration
    setTimeout(() => {
        gridCanvas.parentElement.removeChild(flash);
    }, 300);
}

// Get canvas elements
export function getCanvasElements() {
    return {
        gridCanvas,
        gridCtx,
        previewCanvas,
        previewCtx
    };
}
