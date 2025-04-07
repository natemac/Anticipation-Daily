// builderGrid.js - Handles grid and dot operations for the Anticipation Builder

import BuilderState, { GRID_SIZE, MIN_DRAW_GRID, MAX_DRAW_GRID } from './builderState.js';
import { showEdgeWarning, redrawCanvas } from './builderRenderer.js';

// Find the nearest grid point to coordinates
export function findNearestGridPoint(x, y) {
    const gridX = Math.round(x / BuilderState.gridPointSize);
    const gridY = Math.round(y / BuilderState.gridPointSize);

    // Ensure we're within grid bounds
    const boundedGridX = Math.max(0, Math.min(GRID_SIZE, gridX));
    const boundedGridY = Math.max(0, Math.min(GRID_SIZE, gridY));

    return {
        x: boundedGridX,
        y: boundedGridY,
        canvasX: boundedGridX * BuilderState.gridPointSize,
        canvasY: boundedGridY * BuilderState.gridPointSize
    };
}

// Check if a dot already exists at grid position in the current mode's data
export function dotExistsAtGridPoint(gridX, gridY) {
    const dotsArray = (BuilderState.mode === 'sketch' || BuilderState.mode === 'edit')
        ? BuilderState.sketch.dots
        : BuilderState.recording.dots;

    return dotsArray.some(dot => dot.gridX === gridX && dot.gridY === gridY);
}

// Find a dot at grid position in the current mode's data
export function findDotAtGridPoint(gridX, gridY) {
    const dotsArray = (BuilderState.mode === 'sketch' || BuilderState.mode === 'edit')
        ? BuilderState.sketch.dots
        : BuilderState.recording.dots;

    for (let i = 0; i < dotsArray.length; i++) {
        if (dotsArray[i].gridX === gridX && dotsArray[i].gridY === gridY) {
            return i;
        }
    }
    return -1;
}

// Update the touch indicator
export function updateTouchIndicator(touchIndicator, positionDisplay, x, y) {
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
    BuilderState.hoveredGridPoint = gridPoint;

    return gridPoint;
}

// Add a line between dots in the current mode's data
export function addLine(fromIndex, toIndex) {
    // Don't add if it's the same point
    if (fromIndex === toIndex) return;

    // Get the correct data arrays based on mode
    const linesArray = (BuilderState.mode === 'sketch' || BuilderState.mode === 'edit')
        ? BuilderState.sketch.lines
        : BuilderState.recording.lines;

    // Check if the line already exists
    const lineExists = linesArray.some(line =>
        (line.from === fromIndex && line.to === toIndex) ||
        (line.from === toIndex && line.to === fromIndex)
    );

    if (!lineExists) {
        const newLine = { from: fromIndex, to: toIndex };

        if (BuilderState.mode === 'sketch' || BuilderState.mode === 'edit') {
            BuilderState.sketch.lines.push(newLine);
        } else if (BuilderState.mode === 'record') {
            BuilderState.recording.lines.push(newLine);

            // Also add to recording sequence if we're recording
            if (BuilderState.recording.isRecording) {
                BuilderState.recording.sequence.push({ from: fromIndex, to: toIndex });
            }
        }

        return newLine;
    }

    return null;
}

// Delete a dot and all connected lines in edit mode
export function deleteDotAndConnectedLines(dotIndex) {
    // Get the correct data arrays based on mode
    const dotsArray = BuilderState.sketch.dots;
    const linesArray = BuilderState.sketch.lines;

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
    BuilderState.sketch.selectedDot = null;

    // Reset touch state
    BuilderState.touch.pendingPoint = null;
    BuilderState.touch.tempPoint = null;
    BuilderState.touch.previewLine = null;

    // Immediately redraw canvas to reflect changes
    redrawCanvas();
}

// Handle setting a point
export function handleSetPoint(touchIndicator) {
    // Only process in sketch or record mode
    if (BuilderState.mode !== 'sketch' && BuilderState.mode !== 'record') return;

    // Skip if we're in record mode but not actively recording
    if (BuilderState.mode === 'record' && !BuilderState.isCurrentlyRecording) return;

    const lastX = BuilderState.touch.lastTouchX;
    const lastY = BuilderState.touch.lastTouchY;

    if (lastX === 0 && lastY === 0) return; // No touch registered

    const gridPoint = findNearestGridPoint(lastX, lastY);

    // Prevent placing points on the edges
    if (gridPoint.x < MIN_DRAW_GRID || gridPoint.x > MAX_DRAW_GRID ||
        gridPoint.y < MIN_DRAW_GRID || gridPoint.y > MAX_DRAW_GRID) {
        showEdgeWarning();
        return;
    }

    // Get the data arrays based on current mode
    const dotsArray = (BuilderState.mode === 'sketch') ? BuilderState.sketch.dots : BuilderState.recording.dots;

    // If we have a pending point, create a line
    if (BuilderState.touch.pendingPoint !== null) {
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
        if (BuilderState.touch.pendingPoint !== newDotIndex) { // Prevent self-connections
            addLine(BuilderState.touch.pendingPoint, newDotIndex);

            // Make the new dot the pending point for continued line drawing
            BuilderState.touch.pendingPoint = newDotIndex;
        }
    } else {
        // No pending point, just create or select a dot
        const existingDotIndex = findDotAtGridPoint(gridPoint.x, gridPoint.y);

        if (existingDotIndex !== -1) {
            // Use existing dot as the pending point
            BuilderState.touch.pendingPoint = existingDotIndex;
        } else {
            // Create a new dot
            const newDot = {
                gridX: gridPoint.x,
                gridY: gridPoint.y,
                x: gridPoint.canvasX,
                y: gridPoint.canvasY
            };

            dotsArray.push(newDot);
            BuilderState.touch.pendingPoint = dotsArray.length - 1;
        }
    }

    // Reset temp point - we'll create a new one on next touch/move
    BuilderState.touch.tempPoint = null;
    BuilderState.touch.previewLine = null;

    // Update the touch indicator style
    if (BuilderState.touch.pendingPoint !== null && touchIndicator) {
        const pendingDot = dotsArray[BuilderState.touch.pendingPoint];
        if (pendingDot) {
            touchIndicator.style.display = 'block';
            touchIndicator.style.left = pendingDot.x + 'px';
            touchIndicator.style.top = pendingDot.y + 'px';
        }
    }

    // Immediately redraw canvas to show solid line instead of dotted preview line
    redrawCanvas();

    return gridPoint;
}

// Handle cancel/remove point button
export function handleCancelPoint(touchIndicator) {
    // Handle differently based on mode
    if (BuilderState.mode === 'edit') {
        // In edit mode, delete selected dot
        if (BuilderState.touch.lastTouchX && BuilderState.touch.lastTouchY) {
            const gridPoint = findNearestGridPoint(BuilderState.touch.lastTouchX, BuilderState.touch.lastTouchY);
            const dotIndex = findDotAtGridPoint(gridPoint.x, gridPoint.y);

            if (dotIndex !== -1) {
                deleteDotAndConnectedLines(dotIndex);

                // Immediately hide touch indicator
                if (touchIndicator) {
                    touchIndicator.style.display = 'none';
                }
            }
        }
    } else if ((BuilderState.mode === 'sketch') ||
             (BuilderState.mode === 'record' && BuilderState.isCurrentlyRecording)) {
        // In sketch/record mode, cancel the pending point
        BuilderState.touch.pendingPoint = null;
        BuilderState.touch.tempPoint = null;
        BuilderState.touch.previewLine = null;

        // Hide touch indicator
        if (touchIndicator) {
            touchIndicator.style.display = 'none';
        }

        // Immediately redraw to remove the dotted line
        redrawCanvas();
    }
}
