// Mouse interface for Anticipation Builder
// This file handles all mouse-specific events and interactions

// Initialize the mouse interface
function initMouseInterface() {
    // Only add mouse event listeners if we're not on a touch device
    if (state.isTouch) return;

    console.log('Initializing mouse interface');

    // Add mouse-specific event listeners to the canvas
    gridCanvas.addEventListener('mousedown', handleMouseDown);
    gridCanvas.addEventListener('mousemove', handleMouseMove);
    gridCanvas.addEventListener('mouseup', handleMouseUp);

    // Additional desktop-specific features
    gridCanvas.addEventListener('mouseleave', handleMouseLeave);
    gridCanvas.addEventListener('contextmenu', handleContextMenu);
}

// Mouse Event Handlers
function handleMouseDown(e) {
    // Process based on mode and recording state
    if ((state.mode === 'sketch') ||
        (state.mode === 'record' && isCurrentlyRecording)) {
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
    // If in record mode but not recording, don't react to clicks
}

function handleMouseMove(e) {
    // Only process in sketch or record mode when actively recording
    if (!((state.mode === 'sketch') ||
         (state.mode === 'record' && isCurrentlyRecording))) {
        return;
    }

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
    // Only process in sketch or record mode when actively recording
    if (!((state.mode === 'sketch') ||
         (state.mode === 'record' && isCurrentlyRecording))) {
        return;
    }

    // Nothing specific needed for mouse up, keep the indicator and temp point
}

// Additional mouse-specific handlers
function handleMouseLeave(e) {
    // Hide touch indicator when mouse leaves canvas
    if (state.mode !== 'edit') {
        touchIndicator.style.display = 'none';
    }
}

function handleContextMenu(e) {
    // Prevent context menu on right-click
    e.preventDefault();

    // Optional: treat right click as a cancel action
    if ((state.mode === 'sketch') ||
        (state.mode === 'record' && isCurrentlyRecording)) {

        if (state.touch.pendingPoint !== null) {
            // Clear the pending point (like cancel button)
            state.touch.pendingPoint = null;
            state.touch.tempPoint = null;
            state.touch.previewLine = null;
            touchIndicator.style.display = 'none';
            redrawCanvas();
        }
    }
}

// Optional: Keyboard shortcuts for desktop
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Only handle if not typing in input field
        if (document.activeElement.tagName === 'INPUT') return;

        switch(e.key) {
            case 'Escape':
                // Cancel current action
                if ((state.mode === 'sketch') ||
                    (state.mode === 'record' && isCurrentlyRecording)) {

                    state.touch.pendingPoint = null;
                    state.touch.tempPoint = null;
                    state.touch.previewLine = null;
                    touchIndicator.style.display = 'none';
                    redrawCanvas();
                }
                break;

            case 's':
                // Switch to sketch mode
                if (!isCurrentlyRecording) {
                    setMode('sketch');
                }
                break;

            case 'e':
                // Switch to edit mode
                if (!isCurrentlyRecording) {
                    setMode('edit');
                }
                break;

            case 'r':
                // Toggle recording
                recordBtn.click();
                break;

            case 'p':
                // Preview animation
                if (state.recording.sequence.length > 0) {
                    previewAnimation();
                }
                break;
        }
    });
}

// Add mouse event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initBuilder === 'function') {
        // Wait for builder.js to initialize first
        setTimeout(() => {
            initMouseInterface();
            initKeyboardShortcuts();
        }, 100);
    }
});
