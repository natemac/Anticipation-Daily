// builderUI.js - Handles UI interactions for the Anticipation Builder

import BuilderState from './builderState.js';
import { redrawCanvas, resizeCanvas } from './builderRenderer.js';
import { handleSetPoint, handleCancelPoint, updateTouchIndicator } from './builderGrid.js';
import { startRecording, stopRecording, previewAnimation, stopPreview } from './builderRecording.js';
import { validateRecording, getExportData } from './builderExport.js';

// Module variables
let uiElements = {
    gridCanvas: null,
    previewCanvas: null,
    sketchBtn: null,
    editBtn: null,
    recordBtn: null,
    previewBtn: null,
    setPointBtn: null,
    cancelPointBtn: null,
    touchIndicator: null,
    itemNameInput: null,
    categoryName: null,
    submitBtn: null,
    shareBtn: null,
    exportBtn: null,
    shareCode: null,
    shareLink: null,
    copyBtn: null,
    previewOverlay: null,
    closePreviewBtn: null,
    exportOverlay: null,
    exportData: null,
    copyExportBtn: null,
    closeExportBtn: null,
    recordingIndicator: null,
    positionDisplay: null,
    mouseInstructions: null // Added for mouse instructions
};

// Detect if we're on a touch device
export function isTouchDevice() {
    return (('ontouchstart' in window) ||
            (navigator.maxTouchPoints > 0) ||
            (navigator.msMaxTouchPoints > 0));
}

// Initialize UI elements
export function initUI(elements) {
    uiElements = {...uiElements, ...elements};

    // Detect if we're on a touch device
    BuilderState.isTouch = isTouchDevice();

    // Create mouse instructions element if not already present
    createMouseInstructions();

    return uiElements;
}

// Create mouse instructions element
function createMouseInstructions() {
    // Only create if we're not on a touch device
    if (BuilderState.isTouch) {
        return;
    }

    // Check if it already exists
    if (document.querySelector('.mouse-instructions')) {
        uiElements.mouseInstructions = document.querySelector('.mouse-instructions');
        return;
    }

    // Create the instructions element
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

    uiElements.mouseInstructions = instructionsElement;

    // Hide touch controls if we're using mouse
    if (uiElements.setPointBtn) uiElements.setPointBtn.style.display = 'none';
    if (uiElements.cancelPointBtn) uiElements.cancelPointBtn.style.display = 'none';

    // Also hide the touch controls container
    const touchControlsContainer = document.querySelector('.touch-controls');
    if (touchControlsContainer) {
        touchControlsContainer.style.display = 'none';
    }
}

// Set up button event listeners
export function setupButtonListeners() {
    const {
        sketchBtn, editBtn, recordBtn, previewBtn,
        setPointBtn, cancelPointBtn, submitBtn, shareBtn, exportBtn,
        copyBtn, closePreviewBtn, copyExportBtn, closeExportBtn
    } = uiElements;

    // Window resize
    window.addEventListener('resize', () => {
        resizeCanvas();
    });

    // Mode buttons
    sketchBtn.addEventListener('click', () => {
        setMode('sketch');
    });

    editBtn.addEventListener('click', () => {
        setMode('edit');
    });

    // Record button
    recordBtn.addEventListener('click', () => {
        if (BuilderState.recording.isRecording) {
            // Stop recording but don't automatically restart
            stopRecording(recordBtn, uiElements.recordingIndicator, setPointBtn);
        } else {
            // Check if we're already in record mode (after having stopped)
            const wasInRecordMode = BuilderState.mode === 'record';

            // Switch to record mode if not already
            setMode('record');

            // Clear ALL previous recording data when starting a new recording
            BuilderState.recording.dots = [];     // Clear all dots
            BuilderState.recording.lines = [];    // Clear all lines
            BuilderState.recording.sequence = []; // Clear sequence
            BuilderState.recording.selectedDot = null; // Reset selection

            // Start recording
            startRecording(recordBtn, uiElements.recordingIndicator);
        }
    });

    previewBtn.addEventListener('click', () => {
        previewAnimation(uiElements.previewOverlay);
    });

    // Add button listeners
    setPointBtn.addEventListener('click', () => handleSetPoint(uiElements.touchIndicator));
    cancelPointBtn.addEventListener('click', () => handleCancelPoint(uiElements.touchIndicator));

    // Export/sharing buttons
    submitBtn.addEventListener('click', submitDrawing);
    shareBtn.addEventListener('click', shareDrawing);
    exportBtn.addEventListener('click', exportDrawingData);

    // Copy/close buttons
    copyBtn.addEventListener('click', copyShareLinkToClipboard);
    closePreviewBtn.addEventListener('click', () => stopPreview(uiElements.previewOverlay, setMode));
    copyExportBtn.addEventListener('click', copyExportDataToClipboard);
    closeExportBtn.addEventListener('click', () => {
        uiElements.exportOverlay.style.display = 'none';
    });
}

// Set mode
export function setMode(mode) {
    // Don't change mode if we're recording
    if (BuilderState.isCurrentlyRecording && mode !== 'record') {
        console.log("Can't change mode during recording");
        return;
    }

    BuilderState.mode = mode;

    const { sketchBtn, editBtn, recordBtn, previewBtn, setPointBtn, cancelPointBtn } = uiElements;

    // Reset all buttons to inactive state
    sketchBtn.className = 'tertiary-btn';
    editBtn.className = 'tertiary-btn';
    recordBtn.className = 'tertiary-btn';
    previewBtn.className = 'tertiary-btn';

    // Update mouse instructions based on mode
    updateMouseInstructions(mode);

    // If using touch interface, update touch buttons
    if (BuilderState.isTouch) {
        // Set appropriate button to active state based on mode
        switch(mode) {
            case 'sketch':
                sketchBtn.className = 'primary-btn';
                setPointBtn.style.display = 'block';
                setPointBtn.textContent = 'Set Point';
                cancelPointBtn.style.display = 'block';
                cancelPointBtn.textContent = 'Cancel Point';
                break;

            case 'edit':
                editBtn.className = 'primary-btn';
                // In edit mode, change behavior of touch controls
                setPointBtn.style.display = 'none';
                cancelPointBtn.style.display = 'block';
                cancelPointBtn.textContent = 'Remove Point';
                break;

            case 'record':
                recordBtn.className = 'primary-btn';

                // FIX: Always show Set Point button, but enable it only when recording
                setPointBtn.style.display = 'block';
                cancelPointBtn.style.display = 'block';

                if (!BuilderState.isCurrentlyRecording) {
                    // Disable the Set Point button if not recording
                    setPointBtn.disabled = true;
                    setPointBtn.style.opacity = '0.5';
                } else {
                    // Enable it when recording
                    setPointBtn.disabled = false;
                    setPointBtn.style.opacity = '1';
                    setPointBtn.textContent = 'Set Point';
                    cancelPointBtn.textContent = 'Cancel Point';
                }
                break;

            case 'preview':
                previewBtn.className = 'primary-btn';
                break;
        }
    } else {
        // For mouse interface, just update active button
        switch(mode) {
            case 'sketch':
                sketchBtn.className = 'primary-btn';
                break;
            case 'edit':
                editBtn.className = 'primary-btn';
                break;
            case 'record':
                recordBtn.className = 'primary-btn';
                break;
            case 'preview':
                previewBtn.className = 'primary-btn';
                break;
        }
    }

    // Reset selections and touch state
    BuilderState.sketch.selectedDot = null;
    BuilderState.recording.selectedDot = null;
    BuilderState.touch.pendingPoint = null;
    BuilderState.touch.tempPoint = null;
    BuilderState.touch.previewLine = null;
    uiElements.touchIndicator.style.display = 'none';

    redrawCanvas();
}

// Update mouse instructions based on mode
function updateMouseInstructions(mode) {
    // Skip if we're on a touch device or if instructions don't exist
    if (BuilderState.isTouch || !uiElements.mouseInstructions) {
        return;
    }

    switch(mode) {
        case 'sketch':
        case 'record':
            uiElements.mouseInstructions.innerHTML = '<p>Left click to set point • Double-click to cancel next point</p>';
            break;
        case 'edit':
            uiElements.mouseInstructions.innerHTML = '<p>Click to remove point</p>';
            break;
        case 'preview':
            uiElements.mouseInstructions.style.display = 'none';
            return;
    }

    uiElements.mouseInstructions.style.display = 'block';
}

// Generate random ID
export function generateRandomId(length = 8) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Share drawing
function shareDrawing() {
    if (!validateRecording()) return;

    const shareId = generateRandomId();

    // In a real app, you would save to server here

    uiElements.shareLink.value = `https://yourdomain.com/share/${shareId}`;
    uiElements.shareCode.style.display = 'flex';
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
    uiElements.exportOverlay.style.display = 'flex';
}

// Copy to clipboard
function copyExportDataToClipboard() {
    uiElements.exportData.select();
    document.execCommand('copy');
    alert('Drawing data copied to clipboard!');
}

// Copy share link
function copyShareLinkToClipboard() {
    uiElements.shareLink.select();
    document.execCommand('copy');
    alert('Share link copied to clipboard!');
}

// Update touch position
export function updateTouchPosition(x, y) {
    if (uiElements.touchIndicator && uiElements.positionDisplay) {
        const gridPoint = updateTouchIndicator(
            uiElements.touchIndicator,
            uiElements.positionDisplay,
            x,
            y
        );

        // Store the touch position
        BuilderState.touch.lastTouchX = gridPoint.canvasX;
        BuilderState.touch.lastTouchY = gridPoint.canvasY;

        return gridPoint;
    }

    return null;
}

// Get UI elements
export function getUIElements() {
    return uiElements;
}
