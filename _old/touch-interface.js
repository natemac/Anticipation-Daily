// Touch interface for Anticipation Builder
// This file handles all touch-specific events and interactions

// Initialize the touch interface
function initTouchInterface() {
    // Only add touch event listeners if we're actually on a touch device
    if (!state.isTouch) return;

    console.log('Initializing touch interface');

    // Add touch-specific event listeners to the canvas
    gridCanvas.addEventListener('touchstart', handleTouchStart, { passive: false });
    gridCanvas.addEventListener('touchmove', handleTouchMove, { passive: false });
    gridCanvas.addEventListener('touchend', handleTouchEnd, { passive: false });
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

    // Only process in sketch or record mode when actively recording
    if (!((state.mode === 'sketch') ||
         (state.mode === 'record' && isCurrentlyRecording))) {
        return;
    }

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

    // Only process in sketch or record mode when actively recording
    if (!((state.mode === 'sketch') ||
         (state.mode === 'record' && isCurrentlyRecording))) {
        return;
    }

    // Keep the touch indicator visible at the last position
    // User will confirm with Set Point button
}

// Add touch event listeners after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    if (typeof initBuilder === 'function') {
        // Wait for builder.js to initialize first
        setTimeout(initTouchInterface, 100);
    }
});
