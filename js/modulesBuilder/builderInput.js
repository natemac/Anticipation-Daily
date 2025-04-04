// builderInput.js - Handles mouse and touch input for the Anticipation Builder

import BuilderState, { MIN_DRAW_GRID, MAX_DRAW_GRID } from './builderState.js';
import { findNearestGridPoint, findDotAtGridPoint, handleSetPoint, deleteDotAndConnectedLines } from './builderGrid.js';
import { redrawCanvas, showEdgeWarning } from './builderRenderer.js';
import { updateTouchPosition } from './builderUI.js';

// Initialize input handling based on device type
export function initInput(gridCanvas, touchIndicator) {
    if (BuilderState.isTouch) {
        // For touch devices
        initTouchHandling(gridCanvas, touchIndicator);
    } else {
        // For mouse devices
        initMouseHandling(gridCanvas, touchIndicator);
        // Also add keyboard shortcuts
        initKeyboardShortcuts();
    }
}

// Initialize touch-specific handling
function initTouchHandling(gridCanvas, touchIndicator) {
    console.log('Initializing touch interface');

    // Add touch-specific event listeners to the canvas
    gridCanvas.addEventListener('touchstart', (e) => handleTouchStart(e, touchIndicator), { passive: false });
    gridCanvas.addEventListener('touchmove', (e) => handleTouchMove(e, touchIndicator), { passive: false });
    gridCanvas.addEventListener('touchend', (e) => handleTouchEnd(e, touchIndicator), { passive: false });
}

// Initialize mouse-specific handling
function initMouseHandling(gridCanvas, touchIndicator) {
    console.log('Initializing mouse interface');

    // Add mouse-specific event listeners to the canvas
    gridCanvas.addEventListener('mousedown', (e) => handleMouseDown(e, touchIndicator));
    gridCanvas.addEventListener('mousemove', (e) => handleMouseMove(e, touchIndicator));
    gridCanvas.addEventListener('mouseup', (e) => handleMouseUp(e, touchIndicator));
    gridCanvas.addEventListener('dblclick', (e) => handleDoubleClick(e, touchIndicator));

    // Additional desktop-specific features
    gridCanvas.addEventListener('mouseleave', (e) => handleMouseLeave(e, touchIndicator));
    gridCanvas.addEventListener('contextmenu', (e) => handleContextMenu(e, touchIndicator));
}

// Handle touch events
function handleTouchStart(e, touchIndicator) {
    e.preventDefault();

    // Process based on mode and recording state
    if ((BuilderState.mode === 'sketch') ||
        (BuilderState.mode === 'record' && BuilderState.isCurrentlyRecording)) {
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        // Update touch position
        updateTouchPosition(touchX, touchY);

        // Create tempPoint right away on tap (whether we have a pending point or not)
        const gridPoint = findNearestGridPoint(touchX, touchY);

        // Skip if we're on grid edges
        if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
            gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
            return;
        }

        BuilderState.touch.tempPoint = {
            gridX: gridPoint.x,
            gridY: gridPoint.y,
            x: gridPoint.canvasX,
            y: gridPoint.canvasY
        };

        // Update preview line if we have a pending point
        redrawCanvas();
    }
    else if (BuilderState.mode === 'edit') {
        // In edit mode, we highlight the dot the user touches
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        // Update touch position
        updateTouchPosition(touchX, touchY);

        // Check if there's a dot at this position
        const gridPoint = findNearestGridPoint(touchX, touchY);
        const dotIndex = findDotAtGridPoint(gridPoint.x, gridPoint.y);

        if (dotIndex !== -1) {
            // Highlight the dot for potential removal
            BuilderState.sketch.selectedDot = dotIndex;

            // Show indicator at the correct position
            const selectedDot = BuilderState.sketch.dots[dotIndex];
            if (touchIndicator) {
                touchIndicator.style.display = 'block';
                touchIndicator.style.left = selectedDot.x + 'px';
                touchIndicator.style.top = selectedDot.y + 'px';
                touchIndicator.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
                touchIndicator.style.borderColor = 'red';
            }
        }

        redrawCanvas();
    }
}

function handleTouchMove(e, touchIndicator) {
    e.preventDefault();

    // Only process in sketch or record mode when actively recording
    if (!((BuilderState.mode === 'sketch') ||
         (BuilderState.mode === 'record' && BuilderState.isCurrentlyRecording))) {
        return;
    }

    if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = e.target.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;

        // Update touch position
        const gridPoint = updateTouchPosition(touchX, touchY);

        // Skip if we're on grid edges
        if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
            gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
            return;
        }

        // Always update tempPoint, regardless of whether we have a pending point
        BuilderState.touch.tempPoint = {
            gridX: gridPoint.x,
            gridY: gridPoint.y,
            x: gridPoint.canvasX,
            y: gridPoint.canvasY
        };

        // Redraw canvas with preview line
        redrawCanvas();
    }
}

function handleTouchEnd(e, touchIndicator) {
    e.preventDefault();
    // Touch handling mostly done by Set Point and Cancel Point buttons
}

// Handle mouse events
function handleMouseDown(e, touchIndicator) {
    // Only process left clicks (button 0)
    if (e.button !== 0) return;

    // Process based on mode and recording state
    if ((BuilderState.mode === 'sketch') ||
        (BuilderState.mode === 'record' && BuilderState.isCurrentlyRecording)) {
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Update mouse position
        updateTouchPosition(mouseX, mouseY);

        // Get the grid point
        const gridPoint = findNearestGridPoint(mouseX, mouseY);

        // Skip if we're on grid edges
        if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
            gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
            showEdgeWarning();
            return;
        }

        // Create tempPoint
        BuilderState.touch.tempPoint = {
            gridX: gridPoint.x,
            gridY: gridPoint.y,
            x: gridPoint.canvasX,
            y: gridPoint.canvasY
        };

        // Redraw with preview
        redrawCanvas();

        // For mouse interface, immediately set the point on click
        handleSetPoint(touchIndicator);
    }
    else if (BuilderState.mode === 'edit') {
        // In edit mode, try to select and delete a dot
        const rect = e.target.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Update mouse position
        updateTouchPosition(mouseX, mouseY);

        // Check if there's a dot at this position
        const gridPoint = findNearestGridPoint(mouseX, mouseY);
        const dotIndex = findDotAtGridPoint(gridPoint.x, gridPoint.y);

        if (dotIndex !== -1) {
            // Highlight the dot for potential removal
            BuilderState.sketch.selectedDot = dotIndex;

            // For mouse interface, immediately remove the dot on click in edit mode
            deleteDotAndConnectedLines(dotIndex);
        }

        redrawCanvas();
    }
}

function handleMouseMove(e, touchIndicator) {
    // Only process in sketch or record mode when actively recording
    if (!((BuilderState.mode === 'sketch') ||
          (BuilderState.mode === 'record' && BuilderState.isCurrentlyRecording))) {
        return;
    }

    const rect = e.target.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Update mouse position
    const gridPoint = updateTouchPosition(mouseX, mouseY);

    // Skip if we're on grid edges for creating tempPoint
    if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
        gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
        return;
    }

    // Always update tempPoint, regardless of whether we have a pending point
    BuilderState.touch.tempPoint = {
        gridX: gridPoint.x,
        gridY: gridPoint.y,
        x: gridPoint.canvasX,
        y: gridPoint.canvasY
    };

    // Redraw canvas with preview line
    redrawCanvas();
}

function handleMouseUp(e, touchIndicator) {
    // Nothing specific needed for mouse up
}

function handleDoubleClick(e, touchIndicator) {
    e.preventDefault();

    // Only work in sketch or recording modes
    if ((BuilderState.mode === 'sketch') ||
        (BuilderState.mode === 'record' && BuilderState.isCurrentlyRecording)) {

        // Cancel the pending point
        BuilderState.touch.pendingPoint = null;
        BuilderState.touch.tempPoint = null;
        BuilderState.touch.previewLine = null;

        // Hide touch indicator
        if (touchIndicator) {
            touchIndicator.style.display = 'none';
        }

        // Redraw canvas
        redrawCanvas();
    }
}

function handleMouseLeave(e, touchIndicator) {
    // Hide touch indicator when mouse leaves canvas
    if (BuilderState.mode !== 'edit' && touchIndicator) {
        touchIndicator.style.display = 'none';
    }
}

function handleContextMenu(e, touchIndicator) {
    // Prevent context menu on right-click
    e.preventDefault();

    // Right click can also be used to cancel next point
    if ((BuilderState.mode === 'sketch') ||
        (BuilderState.mode === 'record' && BuilderState.isCurrentlyRecording)) {

        if (BuilderState.touch.pendingPoint !== null) {
            // Clear the pending point (alternative to double-click)
            BuilderState.touch.pendingPoint = null;
            BuilderState.touch.tempPoint = null;
            BuilderState.touch.previewLine = null;
            
            if (touchIndicator) {
                touchIndicator.style.display = 'none';
            }
            
            redrawCanvas();
        }
    }
}

// Initialize keyboard shortcuts for desktop
function initKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Only handle if not typing in input field
        if (document.activeElement.tagName === 'INPUT') return;

        switch(e.key) {
            case 'Escape':
                // Cancel current action
                if ((BuilderState.mode === 'sketch') ||
                    (BuilderState.mode === 'record' && BuilderState.isCurrentlyRecording)) {

                    BuilderState.touch.pendingPoint = null;
                    BuilderState.touch.tempPoint = null;
                    BuilderState.touch.previewLine = null;
                    
                    const touchIndicator = document.getElementById('touchIndicator');
                    if (touchIndicator) {
                        touchIndicator.style.display = 'none';
                    }
                    
                    redrawCanvas();
                }
                break;

            case 's':
                // Switch to sketch mode if not recording
                if (!BuilderState.isCurrentlyRecording) {
                    const sketchBtn = document.getElementById('sketchBtn');
                    if (sketchBtn) sketchBtn.click();
                }
                break;

            case 'e':
                // Switch to edit mode if not recording
                if (!BuilderState.isCurrentlyRecording) {
                    const editBtn = document.getElementById('editBtn');
                    if (editBtn) editBtn.click();
                }
                break;

            case 'r':
                // Toggle recording
                const recordBtn = document.getElementById('recordBtn');
                if (recordBtn) recordBtn.click();
                break;

            case 'p':
                // Preview animation
                if (BuilderState.recording.sequence.length > 0) {
                    const previewBtn = document.getElementById('previewBtn');
                    if (previewBtn) previewBtn.click();
                }
                break;
        }
    });
}
