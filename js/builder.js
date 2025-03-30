// Constants
const GRID_SIZE = 16; // 16x16 grid (17x17 points)
const DOT_RADIUS = 5;
// Define the drawing bounds - prevent drawing on the edges
const MIN_DRAW_GRID = 1;  // Minimum grid coordinate for drawing
const MAX_DRAW_GRID = 15; // Maximum grid coordinate for drawing

// Global variable to track recording state
var isCurrentlyRecording = false;

// DOM Elements
let gridCanvas, previewCanvas;
let sketchBtn, editBtn, recordBtn, previewBtn;
let setPointBtn, cancelPointBtn;
let touchIndicator;
let itemNameInput, categorySelect;
let submitBtn, shareBtn, exportBtn;
let shareCode, shareLink, copyBtn;
let previewOverlay, closePreviewBtn;
let exportOverlay, exportData, copyExportBtn, closeExportBtn;
let recordingIndicator, positionDisplay;

// Setup canvas contexts
let gridCtx, previewCtx;

// State - COMPLETELY SEPARATE data structures for sketch and record
const state = {
    mode: 'sketch', // 'sketch', 'edit', 'record', or 'preview'
    // Touch input state
    touch: {
        active: false,         // Is a point currently being set
        tempPoint: null,       // Temporary point location {x, y, gridX, gridY}
        pendingPoint: null,    // Index of point waiting for connection
        previewLine: null,     // Preview line from pendingPoint to tempPoint
        lastTouchX: 0,         // Last touch X position
        lastTouchY: 0          // Last touch Y position
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
    gridPointSize: 0           // Size of each grid cell, calculated on init
};

// Initialize the builder
function initBuilder() {
    // Get DOM elements
    gridCanvas = document.getElementById('gridCanvas');
    previewCanvas = document.getElementById('previewCanvas');
    sketchBtn = document.getElementById('sketchBtn');
    editBtn = document.getElementById('editBtn');
    recordBtn = document.getElementById('recordBtn');
    previewBtn = document.getElementById('previewBtn');
    setPointBtn = document.getElementById('setPointBtn');
    cancelPointBtn = document.getElementById('cancelPointBtn');
    touchIndicator = document.getElementById('touchIndicator');
    itemNameInput = document.getElementById('itemName');
    categorySelect = document.getElementById('category');
    submitBtn = document.getElementById('submitBtn');
    shareBtn = document.getElementById('shareBtn');
    exportBtn = document.getElementById('exportBtn');
    shareCode = document.getElementById('shareCode');
    shareLink = document.getElementById('shareLink');
    copyBtn = document.getElementById('copyBtn');
    previewOverlay = document.getElementById('previewOverlay');
    closePreviewBtn = document.getElementById('closePreviewBtn');
    exportOverlay = document.getElementById('exportOverlay');
    exportData = document.getElementById('exportData');
    copyExportBtn = document.getElementById('copyExportBtn');
    closeExportBtn = document.getElementById('closeExportBtn');
    recordingIndicator = document.querySelector('.recording-indicator');
    positionDisplay = document.getElementById('positionDisplay');

    // Setup canvas contexts
    gridCtx = gridCanvas.getContext('2d');
    previewCtx = previewCanvas.getContext('2d');

    // Initialize canvas
    initCanvas();

    // Set up event listeners
    setupEventListeners();

    // Start in sketch mode
    setMode('sketch');
}

// Initialize canvas
function initCanvas() {
    const container = gridCanvas.parentElement;
    gridCanvas.width = container.offsetWidth;
    gridCanvas.height = container.offsetHeight;

    // Calculate cell size
    state.gridPointSize = gridCanvas.width / GRID_SIZE;

    // Draw grid
    drawGrid();
}

// Set up event listeners
function setupEventListeners() {
    // Window resize
    window.addEventListener('resize', () => {
        initCanvas();
        redrawCanvas();
    });

    // Touch-specific canvas event listeners
    gridCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    gridCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    gridCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Mouse event listeners (for desktop)
    gridCanvas.addEventListener('mousedown', handleMouseDown);
    gridCanvas.addEventListener('mousemove', handleMouseMove);
    gridCanvas.addEventListener('mouseup', handleMouseUp);

    // Touch control buttons
    setPointBtn.addEventListener('click', handleSetPoint);
    cancelPointBtn.addEventListener('click', handleCancelPoint);

    // Mode buttons
    sketchBtn.addEventListener('click', () => {
        setMode('sketch');
    });

    editBtn.addEventListener('click', () => {
        setMode('edit');
    });

    // FIXED RECORD BUTTON - This is where the fix is applied
    recordBtn.addEventListener('click', () => {
        if (state.recording.isRecording) {
            // Stop recording but don't automatically restart
            stopRecording();
        } else {
            // Clear ALL previous recording data when starting a new recording
            state.recording.dots = [];     // Clear all dots
            state.recording.lines = [];    // Clear all lines
            state.recording.sequence = []; // Clear sequence
            state.recording.selectedDot = null; // Reset selection
            startRecording();
        }
        setMode('record');
    });

    previewBtn.addEventListener('click', () => {
        previewAnimation();
    });

    submitBtn.addEventListener('click', submitDrawing);
    shareBtn.addEventListener('click', shareDrawing);
    exportBtn.addEventListener('click', exportDrawingData);

    copyBtn.addEventListener('click', copyShareLinkToClipboard);
    closePreviewBtn.addEventListener('click', stopPreview);
    copyExportBtn.addEventListener('click', copyExportDataToClipboard);
    closeExportBtn.addEventListener('click', () => {
        exportOverlay.style.display = 'none';
    });
}

// Touch Event Handlers
function handleTouchStart(e) {
    e.preventDefault();

    // Process based on mode and recording state
    if ((state.mode === 'sketch') ||
        (state.mode === 'record' && isCurrentlyRecording)) {
        const touch = e.touches[0];
        const rect = gridCanvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        // Find the nearest grid point
        const gridPoint = findNearestGridPoint(touchX, touchY);

        // Store the snapped grid position (not the exact touch position)
        state.touch.lastTouchX = gridPoint.canvasX;
        state.touch.lastTouchY = gridPoint.canvasY;

        // Show the touch indicator at the snapped grid position
        updateTouchIndicator(gridPoint.canvasX, gridPoint.canvasY);

        // Create tempPoint right away on tap (whether we have a pending point or not)
        // Skip if we're on grid edges
        if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
            gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
            return;
        }

        state.touch.tempPoint = {
            gridX: gridPoint.x,
            gridY: gridPoint.y,
            x: gridPoint.canvasX,
            y: gridPoint.canvasY
        };

        // Update preview line if we have a pending point
        redrawCanvas();
    }
    else if (state.mode === 'edit') {
        // In edit mode, we highlight the dot the user touches
        const touch = e.touches[0];
        const rect = gridCanvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        // Find the nearest grid point
        const gridPoint = findNearestGridPoint(touchX, touchY);

        // Store for potential removal
        state.touch.lastTouchX = gridPoint.canvasX;
        state.touch.lastTouchY = gridPoint.canvasY;

        // Check if there's a dot at this position
        const dotIndex = findDotAtGridPoint(gridPoint.x, gridPoint.y);

        if (dotIndex !== -1) {
            // Highlight the dot for potential removal
            state.sketch.selectedDot = dotIndex;

            // Show indicator at the correct position
            const selectedDot = state.sketch.dots[dotIndex];
            updateTouchIndicator(selectedDot.x, selectedDot.y);
            touchIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            touchIndicator.style.borderColor = 'red';
        }

        redrawCanvas();
    }
    // If in record mode but not recording, don't react to touches
}

function handleTouchMove(e) {
    e.preventDefault();

    // Only process in sketch or record mode
    if (state.mode !== 'sketch' && state.mode !== 'record') return;

    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = gridCanvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        // Find the nearest grid point
        const gridPoint = findNearestGridPoint(touchX, touchY);

        // Store the snapped grid position (not the exact touch position)
        state.touch.lastTouchX = gridPoint.canvasX;
        state.touch.lastTouchY = gridPoint.canvasY;

        // Update the touch indicator at the snapped grid position
        updateTouchIndicator(gridPoint.canvasX, gridPoint.canvasY);

        // Skip if we're on grid edges
        if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
            gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
            return;
        }

        // Always update tempPoint, regardless of whether we have a pending point
        state.touch.tempPoint = {
            gridX: gridPoint.x,
            gridY: gridPoint.y,
            x: gridPoint.canvasX,
            y: gridPoint.canvasY
        };

        // Always redraw - the canvas drawing function will only show preview lines when appropriate
        redrawCanvas();
    }
}

function handleTouchEnd(e) {
    e.preventDefault();

    // Only process in sketch or record mode
    if (state.mode !== 'sketch' && state.mode !== 'record') return;

    // Keep the touch indicator visible at the last position
    // User will confirm with Set Point button
}

// Mouse Event Handlers (for desktop)
function handleMouseDown(e) {
    // Process based on mode
    if (state.mode === 'sketch' || state.mode === 'record') {
        const rect = gridCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Find the nearest grid point
        const gridPoint = findNearestGridPoint(mouseX, mouseY);

        // Store the snapped grid position (not the exact mouse position)
        state.touch.lastTouchX = gridPoint.canvasX;
        state.touch.lastTouchY = gridPoint.canvasY;

        // Show the touch indicator at the snapped grid position
        updateTouchIndicator(gridPoint.canvasX, gridPoint.canvasY);

        // Create tempPoint right away on click (whether we have a pending point or not)
        // Skip if we're on grid edges
        if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
            gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
            return;
        }

        state.touch.tempPoint = {
            gridX: gridPoint.x,
            gridY: gridPoint.y,
            x: gridPoint.canvasX,
            y: gridPoint.canvasY
        };

        // Update preview line if we have a pending point
        redrawCanvas();
    }
    else if (state.mode === 'edit') {
        // In edit mode, we highlight the dot the user clicks
        const rect = gridCanvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Find the nearest grid point
        const gridPoint = findNearestGridPoint(mouseX, mouseY);

        // Store for potential removal
        state.touch.lastTouchX = gridPoint.canvasX;
        state.touch.lastTouchY = gridPoint.canvasY;

        // Check if there's a dot at this position
        const dotIndex = findDotAtGridPoint(gridPoint.x, gridPoint.y);

        if (dotIndex !== -1) {
            // Highlight the dot for potential removal
            state.sketch.selectedDot = dotIndex;

            // Show indicator at the correct position
            const selectedDot = state.sketch.dots[dotIndex];
            updateTouchIndicator(selectedDot.x, selectedDot.y);
            touchIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
            touchIndicator.style.borderColor = 'red';
        }

        redrawCanvas();
    }
}

function handleMouseMove(e) {
    // Only process in sketch or record mode
    if (state.mode !== 'sketch' && state.mode !== 'record') return;

    const rect = gridCanvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Find the nearest grid point
    const gridPoint = findNearestGridPoint(mouseX, mouseY);

    // Store the snapped grid position (not the exact mouse position)
    state.touch.lastTouchX = gridPoint.canvasX;
    state.touch.lastTouchY = gridPoint.canvasY;

    // Update the touch indicator at the snapped grid position
    updateTouchIndicator(gridPoint.canvasX, gridPoint.canvasY);

    // Skip if we're on grid edges
    if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
        gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
        return;
    }

    // Always update tempPoint, regardless of whether we have a pending point
    state.touch.tempPoint = {
        gridX: gridPoint.x,
        gridY: gridPoint.y,
        x: gridPoint.canvasX,
        y: gridPoint.canvasY
    };

    // Always redraw - the canvas drawing function will only show preview lines when appropriate
    redrawCanvas();
}

function handleMouseUp(e) {
    // Only process in sketch or record mode
    if (state.mode !== 'sketch' && state.mode !== 'record') return;

    // Keep the touch indicator visible
    // User will confirm with Set Point button
}

// Button Handlers
function handleSetPoint() {
    // Only process in sketch or record mode
    if (state.mode !== 'sketch' && state.mode !== 'record') return;

    const lastX = state.touch.lastTouchX;
    const lastY = state.touch.lastTouchY;

    if (lastX === 0 && lastY === 0) return; // No touch registered

    const gridPoint = findNearestGridPoint(lastX, lastY);

    // Prevent placing points on the edges
    if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
        gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
        showEdgeWarning();
        return;
    }

    // Get the data arrays based on current mode
    const dotsArray = (state.mode === 'sketch') ? state.sketch.dots : state.recording.dots;

    // If we have a pending point, create a line
    if (state.touch.pendingPoint !== null) {
        // Check if there's already a dot at this location
        const existingDotIndex = findDotAtGridPoint(gridPoint.x, gridPoint.y);
        let newDotIndex;

        if (existingDotIndex !== -1) {
            // Use existing dot
            newDotIndex = existingDotIndex;
        } else {
            // Create a new dot
            const newDot = {
                gridX: gridPoint.x,
                gridY: gridPoint.y,
                x: gridPoint.canvasX,
                y: gridPoint.canvasY
            };

            dotsArray.push(newDot);
            newDotIndex = dotsArray.length - 1;
        }

        // Add line between pending point and new point
        if (state.touch.pendingPoint !== newDotIndex) { // Prevent self-connections
            addLine(state.touch.pendingPoint, newDotIndex);

            // Make the new dot the pending point for continued line drawing
            state.touch.pendingPoint = newDotIndex;
        }
    } else {
        // No pending point, just create or select a dot
        const existingDotIndex = findDotAtGridPoint(gridPoint.x, gridPoint.y);

        if (existingDotIndex !== -1) {
            // Use existing dot as the pending point
            state.touch.pendingPoint = existingDotIndex;
        } else {
            // Create a new dot
            const newDot = {
                gridX: gridPoint.x,
                gridY: gridPoint.y,
                x: gridPoint.canvasX,
                y: gridPoint.canvasY
            };

            dotsArray.push(newDot);
            state.touch.pendingPoint = dotsArray.length - 1;
        }
    }

    // Reset temp point - we'll create a new one on next touch/move
    state.touch.tempPoint = null;
    state.touch.previewLine = null;

    // Reset the touch indicator style to the pending point
    const pendingDot = dotsArray[state.touch.pendingPoint];
    updateTouchIndicator(pendingDot.x, pendingDot.y);

    // Redraw canvas
    redrawCanvas();
}

function handleCancelPoint() {
    // Handle differently based on mode
    if (state.mode === 'edit') {
        // In edit mode, delete selected dot
        if (state.touch.lastTouchX && state.touch.lastTouchY) {
            const gridPoint = findNearestGridPoint(state.touch.lastTouchX, state.touch.lastTouchY);
            const dotIndex = findDotAtGridPoint(gridPoint.x, gridPoint.y);

            if (dotIndex !== -1) {
                deleteDotAndConnectedLines(dotIndex);
            }
        }
    } else {
        // In sketch/record mode, cancel the pending point
        state.touch.pendingPoint = null;
        state.touch.tempPoint = null;
        state.touch.previewLine = null;

        // Hide touch indicator
        touchIndicator.style.display = 'none';
    }

    // Redraw canvas
    redrawCanvas();
}

// Touch Indicator
function updateTouchIndicator(x, y) {
    // Find the nearest grid point
    const gridPoint = findNearestGridPoint(x, y);

    // Use the snapped grid coordinates
    touchIndicator.style.display = 'block';
    touchIndicator.style.left = gridPoint.canvasX + 'px';
    touchIndicator.style.top = gridPoint.canvasY + 'px';

    // Update the grid position display
    positionDisplay.textContent = `Grid: ${gridPoint.x},${gridPoint.y}`;

    // Check if we're on an edge
    const isOnEdge = gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
                      gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID;

    // Change indicator color if on edge
    if (isOnEdge) {
        touchIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        touchIndicator.style.borderColor = 'red';
    } else {
        touchIndicator.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
        touchIndicator.style.borderColor = 'green';
    }

    // Set the hover point for drawing
    state.hoveredGridPoint = gridPoint;
}

// Update preview line
function updatePreviewLine() {
    if (!state.touch.pendingPoint || !state.touch.tempPoint) return;

    const dotsArray = (state.mode === 'sketch') ? state.sketch.dots : state.recording.dots;

    if (state.touch.pendingPoint >= dotsArray.length) return;

    // Always create a preview line regardless of existing lines
    state.touch.previewLine = {
        from: state.touch.pendingPoint,
        to: state.touch.tempPoint
    };

    redrawCanvas();
}

function showEdgeWarning() {
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

// Draw the grid
function drawGrid() {
    gridCtx.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // Draw grid lines - all with the same style
    gridCtx.strokeStyle = '#ddd';
    gridCtx.lineWidth = 1;

    // Draw vertical lines
    for (let i = 0; i <= GRID_SIZE; i++) {
        const x = i * state.gridPointSize;
        gridCtx.beginPath();
        gridCtx.moveTo(x, 0);
        gridCtx.lineTo(x, gridCanvas.height);
        gridCtx.stroke();
    }

    // Draw horizontal lines
    for (let i = 0; i <= GRID_SIZE; i++) {
        const y = i * state.gridPointSize;
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

            const pointX = x * state.gridPointSize;
            const pointY = y * state.gridPointSize;

            // Style all points the same
            gridCtx.fillStyle = '#bbb';
            gridCtx.beginPath();
            gridCtx.arc(pointX, pointY, 3, 0, Math.PI * 2);
            gridCtx.fill();
        }
    }

    // Highlight hovered grid point
    if (state.hoveredGridPoint) {
        // Check if we're on an edge - still maintain functionality restriction
        const isOnEdge = state.hoveredGridPoint.x < MIN_DRAW_GRID ||
                        state.hoveredGridPoint.x > MAX_DRAW_GRID ||
                        state.hoveredGridPoint.y < MIN_DRAW_GRID ||
                        state.hoveredGridPoint.y > MAX_DRAW_GRID;

        if (isOnEdge) {
            gridCtx.fillStyle = '#f88'; // Red tint for edge (not allowed)
        } else {
            gridCtx.fillStyle = '#aaa'; // Normal highlight
        }

        gridCtx.beginPath();
        gridCtx.arc(
            state.hoveredGridPoint.x * state.gridPointSize,
            state.hoveredGridPoint.y * state.gridPointSize,
            4, 0, Math.PI * 2
        );
        gridCtx.fill();
    }
}

// Redraw canvas with all elements
function redrawCanvas() {
    // Start with grid
    drawGrid();

    if (state.mode === 'sketch' || state.mode === 'edit') {
        // Draw sketch data
        drawSketch();
    } else if (state.mode === 'record') {
        // Draw sketch data with reduced opacity
        drawSketch(0.3);

        // Draw recording data on top at full opacity
        drawRecording();
    } else if (state.mode === 'preview') {
        // Only draw recording in preview mode
        drawRecording();
    }

    // Draw preview line if it exists (this should show for all connections)
    if (state.touch.pendingPoint !== null && state.touch.tempPoint !== null) {
        const dotsArray = (state.mode === 'sketch') ? state.sketch.dots : state.recording.dots;

        if (state.touch.pendingPoint < dotsArray.length) {
            const fromDot = dotsArray[state.touch.pendingPoint];
            const toDot = state.touch.tempPoint;

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
    if (state.touch.pendingPoint !== null) {
        const dotsArray = (state.mode === 'sketch') ? state.sketch.dots : state.recording.dots;

        if (state.touch.pendingPoint < dotsArray.length) {
            const dot = dotsArray[state.touch.pendingPoint];

            gridCtx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            gridCtx.lineWidth = 3;

            gridCtx.beginPath();
            gridCtx.arc(dot.x, dot.y, DOT_RADIUS + 5, 0, Math.PI * 2);
            gridCtx.stroke();
        }
    }
}

// Draw sketch data
function drawSketch(opacity = 1.0) {
    gridCtx.globalAlpha = opacity;

    // Draw lines
    gridCtx.strokeStyle = '#000';
    gridCtx.lineWidth = 2;

    state.sketch.lines.forEach(line => {
        const from = state.sketch.dots[line.from];
        const to = state.sketch.dots[line.to];

        gridCtx.beginPath();
        gridCtx.moveTo(from.x, from.y);
        gridCtx.lineTo(to.x, to.y);
        gridCtx.stroke();
    });

    // Draw dots
    state.sketch.dots.forEach((dot, index) => {
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
    if (state.sketch.selectedDot !== null) {
        gridCtx.globalAlpha = 1.0; // Always full opacity for selection highlight
        const dot = state.sketch.dots[state.sketch.selectedDot];
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
function drawRecording() {
    // Always full opacity for recording data
    gridCtx.globalAlpha = 1.0;

    // Draw lines
    state.recording.lines.forEach(line => {
        const from = state.recording.dots[line.from];
        const to = state.recording.dots[line.to];

        // Check if this line is in the recording sequence
        const inSequence = state.recording.sequence.some(
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
    state.recording.dots.forEach((dot, index) => {
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
    if (state.recording.selectedDot !== null) {
        const dot = state.recording.dots[state.recording.selectedDot];
        gridCtx.strokeStyle = '#f00';
        gridCtx.lineWidth = 2;
        gridCtx.beginPath();
        gridCtx.arc(dot.x, dot.y, DOT_RADIUS + 3, 0, Math.PI * 2);
        gridCtx.stroke();
    }
}

// Find the nearest grid point to coordinates
function findNearestGridPoint(x, y) {
    const gridX = Math.round(x / state.gridPointSize);
    const gridY = Math.round(y / state.gridPointSize);

    // Ensure we're within grid bounds
    const boundedGridX = Math.max(0, Math.min(GRID_SIZE, gridX));
    const boundedGridY = Math.max(0, Math.min(GRID_SIZE, gridY));

    return {
        x: boundedGridX,
        y: boundedGridY,
        canvasX: boundedGridX * state.gridPointSize,
        canvasY: boundedGridY * state.gridPointSize
    };
}

// Check if a dot already exists at grid position in the current mode's data
function dotExistsAtGridPoint(gridX, gridY) {
    const dotsArray = (state.mode === 'sketch' || state.mode === 'edit')
        ? state.sketch.dots
        : state.recording.dots;

    return dotsArray.some(dot => dot.gridX === gridX && dot.gridY === gridY);
}

// Find a dot at grid position in the current mode's data
function findDotAtGridPoint(gridX, gridY) {
    const dotsArray = (state.mode === 'sketch' || state.mode === 'edit')
        ? state.sketch.dots
        : state.recording.dots;

    for (let i = 0; i < dotsArray.length; i++) {
        if (dotsArray[i].gridX === gridX && dotsArray[i].gridY === gridY) {
            return i;
        }
    }
    return -1;
}

// Add a line between dots in the current mode's data
function addLine(fromIndex, toIndex) {
    // Don't add if it's the same point
    if (fromIndex === toIndex) return;

    // Get the correct data arrays based on mode
    const linesArray = (state.mode === 'sketch' || state.mode === 'edit')
        ? state.sketch.lines
        : state.recording.lines;

    // Check if the line already exists
    const lineExists = linesArray.some(line =>
        (line.from === fromIndex && line.to === toIndex) ||
        (line.from === toIndex && line.to === fromIndex)
    );

    if (!lineExists) {
        const newLine = { from: fromIndex, to: toIndex };

        if (state.mode === 'sketch' || state.mode === 'edit') {
            state.sketch.lines.push(newLine);
        } else if (state.mode === 'record') {
            state.recording.lines.push(newLine);

            // Also add to recording sequence if we're recording
            if (state.recording.isRecording) {
                state.recording.sequence.push({ from: fromIndex, to: toIndex });
            }
        }
    }
}

// Delete a dot and all connected lines in edit mode
function deleteDotAndConnectedLines(dotIndex) {
    // Get the correct data arrays based on mode
    const dotsArray = state.sketch.dots;
    const linesArray = state.sketch.lines;

    if (dotIndex < 0 || dotIndex >= dotsArray.length) return;

    // Find all lines connected to this dot
    const connectedLines = [];

    for (let i = 0; i < linesArray.length; i++) {
        if (linesArray[i].from === dotIndex || linesArray[i].to === dotIndex) {
            connectedLines.push(i);
        }
    }

    // Remove lines in reverse order to avoid index shifting problems
    connectedLines.sort((a, b) => b - a);
    for (let i = 0; i < connectedLines.length; i++) {
        const lineIndex = connectedLines[i];
        linesArray.splice(lineIndex, 1);
    }

    // Remove the dot
    dotsArray.splice(dotIndex, 1);

    // Update indices in lines that reference dots after the deleted one
    for (let i = 0; i < linesArray.length; i++) {
        if (linesArray[i].from > dotIndex) {
            linesArray[i].from--;
        }
        if (linesArray[i].to > dotIndex) {
            linesArray[i].to--;
        }
    }

    // Reset selection
    state.sketch.selectedDot = null;

    // Reset touch state
    state.touch.pendingPoint = null;
    state.touch.tempPoint = null;
    state.touch.previewLine = null;
    touchIndicator.style.display = 'none';

    redrawCanvas();
}

// Set mode
function setMode(mode) {
    // Don't change mode if we're recording
    if (isCurrentlyRecording && mode !== 'record') {
        console.log("Can't change mode during recording");
        return;
    }

    state.mode = mode;

    // Reset all buttons to inactive state
    sketchBtn.className = 'tertiary-btn';
    editBtn.className = 'tertiary-btn';
    recordBtn.className = 'tertiary-btn';
    previewBtn.className = 'tertiary-btn';

    // Set appropriate button to active state based on mode
    switch(mode) {
        case 'sketch':
            sketchBtn.className = 'primary-btn';
            setPointBtn.style.display = 'block';
            setPointBtn.textContent = 'Set Point';
            cancelPointBtn.textContent = 'Cancel Point';
            break;

        case 'edit':
            editBtn.className = 'primary-btn';
            // In edit mode, change behavior of touch controls
            setPointBtn.style.display = 'none';
            cancelPointBtn.textContent = 'Remove Point';
            break;

        case 'record':
            recordBtn.className = 'primary-btn';

            // If we're not currently recording, hide the Set Point button
            if (!isCurrentlyRecording) {
                setPointBtn.style.display = 'none';
            } else {
                setPointBtn.style.display = 'block';
                setPointBtn.textContent = 'Set Point';
                cancelPointBtn.textContent = 'Cancel Point';
            }
            break;

        case 'preview':
            previewBtn.className = 'primary-btn';
            break;
    }

    // Reset selections and touch state
    state.sketch.selectedDot = null;
    state.recording.selectedDot = null;
    state.touch.pendingPoint = null;
    state.touch.tempPoint = null;
    state.touch.previewLine = null;
    touchIndicator.style.display = 'none';

    redrawCanvas();
}

// Start recording
function startRecording() {
    // Update state
    state.recording.isRecording = true;
    isCurrentlyRecording = true;

    // Update UI
    recordingIndicator.style.display = 'block';
    recordBtn.textContent = 'Stop-11:59';
    recordBtn.classList.remove('tertiary-btn', 'primary-btn');
    recordBtn.classList.add('secondary-btn');

    // Show Set Point button during active recording
    setPointBtn.style.display = 'block';

    console.log('Recording started');
}

// Stop recording
function stopRecording() {
    // Update state
    state.recording.isRecording = false;
    isCurrentlyRecording = false;

    // Update UI
    recordingIndicator.style.display = 'none';
    recordBtn.textContent = 'Record';
    recordBtn.classList.remove('secondary-btn');
    recordBtn.classList.add('tertiary-btn');

    // Keep in record mode but with record button inactive
    // (user must explicitly switch to Sketch to edit)
    setPointBtn.style.display = 'none'; // Hide Set Point button while not recording

    console.log('Recording stopped. Sequence:', state.recording.sequence);
}

// Preview animation - shows how drawing will look in the game
function previewAnimation() {
    if (state.recording.sequence.length === 0) {
        alert('Please record a drawing sequence first.');
        return;
    }

    previewOverlay.style.display = 'flex';

    // Set mode to preview without clearing recording state
    state.mode = 'preview';

    // Update UI for preview mode
    sketchBtn.classList.remove('primary-btn');
    sketchBtn.classList.add('tertiary-btn');
    editBtn.classList.remove('primary-btn');
    editBtn.classList.add('tertiary-btn');
    recordBtn.classList.remove('primary-btn', 'secondary-btn');
    recordBtn.classList.add('tertiary-btn');
    previewBtn.classList.remove('tertiary-btn');
    previewBtn.classList.add('primary-btn');

    // Setup preview canvas
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // Make sure preview canvas is properly sized
    const previewSize = Math.min(400, window.innerWidth * 0.8);
    previewCanvas.width = previewSize;
    previewCanvas.height = previewSize;

    // Calculate scale factor for preview canvas
    const scaleX = previewCanvas.width / gridCanvas.width;
    const scaleY = previewCanvas.height / gridCanvas.height;
    const scale = Math.min(scaleX, scaleY);

    // Collect all dots used in the recording sequence
    const usedDotIndices = new Set();
    state.recording.sequence.forEach(line => {
        usedDotIndices.add(line.from);
        usedDotIndices.add(line.to);
    });

    // Animation variables
    let currentLineIndex = 0;
    let completedLines = [];
    let animationProgress = 0;
    let animationId = null;
    state.recording.isPlaying = true;

    // Function to draw everything in its current state
    function drawPreviewFrame() {
        // Clear canvas
        previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // Draw grid
        previewCtx.strokeStyle = '#eee';
        previewCtx.lineWidth = 1;

        for (let i = 0; i <= GRID_SIZE; i++) {
            const x = i * state.gridPointSize * scale;
            previewCtx.beginPath();
            previewCtx.moveTo(x, 0);
            previewCtx.lineTo(x, previewCanvas.height);
            previewCtx.stroke();

            const y = i * state.gridPointSize * scale;
            previewCtx.beginPath();
            previewCtx.moveTo(0, y);
            previewCtx.lineTo(previewCanvas.width, y);
            previewCtx.stroke();
        }

        // Draw ALL dots from the beginning
        previewCtx.fillStyle = '#333';
        usedDotIndices.forEach(dotIndex => {
            if (state.recording.dots[dotIndex]) { // Safety check
                const dot = state.recording.dots[dotIndex];
                previewCtx.beginPath();
                previewCtx.arc(dot.x * scale, dot.y * scale, DOT_RADIUS, 0, Math.PI * 2);
                previewCtx.fill();

                // Draw index number
                previewCtx.fillStyle = '#fff';
                previewCtx.textAlign = 'center';
                previewCtx.textBaseline = 'middle';
                previewCtx.font = '8px Arial';
                previewCtx.fillText(dotIndex.toString(), dot.x * scale, dot.y * scale);
                previewCtx.fillStyle = '#333';
            }
        });

        // Draw completed lines
        previewCtx.strokeStyle = '#4CAF50'; // Green for recording lines
        previewCtx.lineWidth = 4; // Double thickness

        for (let i = 0; i < completedLines.length; i++) {
            const lineIndex = completedLines[i];
            const line = state.recording.sequence[lineIndex];
            const from = state.recording.dots[line.from];
            const to = state.recording.dots[line.to];

            previewCtx.beginPath();
            previewCtx.moveTo(from.x * scale, from.y * scale);
            previewCtx.lineTo(to.x * scale, to.y * scale);
            previewCtx.stroke();
        }

        // Draw animated line (if we're still animating)
        if (currentLineIndex < state.recording.sequence.length) {
            const line = state.recording.sequence[currentLineIndex];
            const from = state.recording.dots[line.from];
            const to = state.recording.dots[line.to];

            // Calculate endpoints of the animated line segment
            const startX = from.x * scale;
            const startY = from.y * scale;
            const endX = to.x * scale;
            const endY = to.y * scale;

            // Calculate current end point based on progress
            const currentEndX = startX + (endX - startX) * animationProgress;
            const currentEndY = startY + (endY - startY) * animationProgress;

            // Draw the partially completed line
            previewCtx.strokeStyle = '#4CAF50';
            previewCtx.lineWidth = 4;
            previewCtx.beginPath();
            previewCtx.moveTo(startX, startY);
            previewCtx.lineTo(currentEndX, currentEndY);
            previewCtx.stroke();
        }
    }

    // Function to animate the current line
    function animateLine() {
        if (!state.recording.isPlaying || currentLineIndex >= state.recording.sequence.length) {
            cancelAnimationFrame(animationId);
            return;
        }

        // Increment progress
        animationProgress += 0.05; // Adjust for speed

        // If line is complete
        if (animationProgress >= 1) {
            // Add to completed lines
            completedLines.push(currentLineIndex);

            // Move to next line
            currentLineIndex++;
            animationProgress = 0;

            // Draw the current state
            drawPreviewFrame();

            // Pause briefly between lines
            setTimeout(() => {
                if (state.recording.isPlaying) {
                    animationId = requestAnimationFrame(animateLine);
                }
            }, 200);
            return;
        }

        // Draw the current frame
        drawPreviewFrame();

        // Continue animation
        animationId = requestAnimationFrame(animateLine);
    }

    // Start by drawing the initial frame with all dots
    drawPreviewFrame();

    // Start the animation
    animationId = requestAnimationFrame(animateLine);
}

// Stop preview
function stopPreview() {
    state.recording.isPlaying = false;
    previewOverlay.style.display = 'none';

    // Cancel any ongoing animations
    if (window.animationId) {
        cancelAnimationFrame(window.animationId);
    }

    setMode('record');
}

// Generate random ID
function generateRandomId(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Validate recording data
function validateRecording() {
    if (state.recording.dots.length < 2) {
        alert('Please create at least 2 points in the recording.');
        return false;
    }

    if (state.recording.sequence.length === 0) {
        alert('Please record a drawing sequence.');
        return false;
    }

    if (!itemNameInput.value.trim()) {
        alert('Please enter a name for the item.');
        itemNameInput.focus();
        return false;
    }

    return true;
}

// Get recording data for export
function getExportData() {
    // Collect only dots used in the recording sequence
    const usedDotIndices = new Set();
    state.recording.sequence.forEach(line => {
        usedDotIndices.add(line.from);
        usedDotIndices.add(line.to);
    });

    // Create a map from old indices to new indices
    const indexMap = {};
    const usedDots = [];

    // Add only the used dots to the exported data
    Array.from(usedDotIndices).sort((a, b) => a - b).forEach((oldIndex, newIndex) => {
        indexMap[oldIndex] = newIndex;
        usedDots.push({
            x: state.recording.dots[oldIndex].x,
            y: state.recording.dots[oldIndex].y
        });
    });

    // Remap the line indices
    const remappedSequence = state.recording.sequence.map(line => ({
        from: indexMap[line.from],
        to: indexMap[line.to]
    }));

    // Return clean data for export
    return {
        name: itemNameInput.value.trim().toUpperCase(),
        category: categorySelect.value,
        dots: usedDots,
        sequence: remappedSequence,
    };
}

// Share drawing
function shareDrawing() {
    if (!validateRecording()) return;

    const shareId = generateRandomId();

    // In a real app, you would save to server here

    shareLink.value = `https://yourdomain.com/share/${shareId}`;
    shareCode.style.display = 'flex';
}

// Submit drawing
function submitDrawing() {
    if (!validateRecording()) return;

    const exportData = getExportData();

    // In a real app, you would send to server here

    alert('Drawing submitted for review!');
}

// Export drawing data
function exportDrawingData() {
    if (!validateRecording()) return;

    const exportData = getExportData();

    // Format the data as a JSON string with proper indentation
    const jsonString = JSON.stringify(exportData, null, 2);

    // Create a download link for the text file
    const blob = new Blob([jsonString], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    // Create filename based on the item name
    const filename = (exportData.name.toLowerCase().replace(/\s+/g, '_') || 'drawing') + '.json';

    // Set up download link
    const downloadLink = document.createElement('a');
    downloadLink.href = url;
    downloadLink.download = filename;

    // Add to DOM, click, then remove
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    // Also show in the export overlay
    document.getElementById('exportData').value = jsonString;
    exportOverlay.style.display = 'flex';
}

// Copy to clipboard
function copyExportDataToClipboard() {
    exportData.select();
    document.execCommand('copy');
    alert('Drawing data copied to clipboard!');
}

// Copy share link
function copyShareLinkToClipboard() {
    shareLink.select();
    document.execCommand('copy');
    alert('Share link copied to clipboard!');
}

// Initialize the builder when the DOM is loaded
document.addEventListener('DOMContentLoaded', initBuilder);
