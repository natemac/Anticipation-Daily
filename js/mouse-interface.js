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
    gridCanvas.addEventListener('dblclick', handleDoubleClick);

    // Additional desktop-specific features
    gridCanvas.addEventListener('mouseleave', handleMouseLeave);
    gridCanvas.addEventListener('contextmenu', handleContextMenu);

    // Hide touch buttons and show mouse instructions
    setupMouseUI();
}

// Setup mouse-specific UI
function setupMouseUI() {
    // Hide the touch buttons
    const touchControlsContainer = document.querySelector('.touch-controls');
    if (touchControlsContainer) {
        touchControlsContainer.style.display = 'none';
    }

    // Create and add mouse instructions
    const instructionsElement = document.createElement('div');
    instructionsElement.className = 'mouse-instructions';
    instructionsElement.innerHTML = '<p>Left click to set point • Double-click to cancel next point</p>';
    instructionsElement.style.textAlign = 'center';
    instructionsElement.style.padding = '10px';
    instructionsElement.style.marginBottom = '20px';
    instructionsElement.style.color = '#555';
    instructionsElement.style.fontStyle = 'italic';

    // Add instructions after grid, before the form
    const gridContainer = document.querySelector('.grid-container');
    if (gridContainer && gridContainer.nextElementSibling) {
        gridContainer.parentNode.insertBefore(instructionsElement, gridContainer.nextElementSibling);
    }
}

// Mouse Event Handlers
function handleMouseDown(e) {
    // Only process left clicks (button 0)
    if (e.button !== 0) return;

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

        // For mouse interface, immediately set the point on click
        // This replaces the "Set Point" button functionality
        setPointOnClick();
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

            // For mouse interface, immediately remove the dot on click in edit mode
            // This replaces the "Remove Point" button functionality
            deleteDotAndConnectedLines(dotIndex);
        }

        redrawCanvas();
    }
    // If in record mode but not recording, don't react to clicks
}

// Implement point setting on click (replacing Set Point button)
function setPointOnClick() {
    // Only process in sketch or record mode
    if (state.mode !== 'sketch' && state.mode !== 'record') return;

    // Skip if we're in record mode but not actively recording
    if (state.mode === 'record' && !isCurrentlyRecording) return;

    const lastX = state.touch.lastTouchX;
    const lastY = state.touch.lastTouchY;

    if (lastX === 0 && lastY === 0) return; // No mouse position registered

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

    // Reset temp point - we'll create a new one on next move
    state.touch.tempPoint = null;
    state.touch.previewLine = null;

    // Reset the touch indicator style to the pending point
    const pendingDot = dotsArray[state.touch.pendingPoint];
    updateTouchIndicator(pendingDot.x, pendingDot.y);

    // Redraw canvas
    redrawCanvas();
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
    // Nothing specific needed for mouse up in the new UI
}

// Handle double-click to cancel next point (replacing Cancel Point button)
function handleDoubleClick(e) {
    e.preventDefault();

    // Only work in sketch or recording modes
    if ((state.mode === 'sketch') ||
        (state.mode === 'record' && isCurrentlyRecording)) {

        // Cancel the pending point
        state.touch.pendingPoint = null;
        state.touch.tempPoint = null;
        state.touch.previewLine = null;

        // Hide touch indicator
        touchIndicator.style.display = 'none';

        // Redraw canvas
        redrawCanvas();
    }
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

    // Right click can also be used to cancel next point
    if ((state.mode === 'sketch') ||
        (state.mode === 'record' && isCurrentlyRecording)) {

        if (state.touch.pendingPoint !== null) {
            // Clear the pending point (alternative to double-click)
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
