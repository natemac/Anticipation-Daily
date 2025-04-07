// builder.js - Main entry point for the Anticipation Builder
// This file coordinates all the builder modules

import BuilderState from './modulesBuilder/builderState.js';
import * as BuilderRenderer from './modulesBuilder/builderRenderer.js';
import * as BuilderUI from './modulesBuilder/builderUI.js';
import * as BuilderGrid from './modulesBuilder/builderGrid.js';
import * as BuilderRecording from './modulesBuilder/builderRecording.js';
import * as BuilderExport from './modulesBuilder/builderExport.js';
import * as BuilderInput from './modulesBuilder/builderInput.js';

// DOM Elements - to be initialized
let gridCanvas, previewCanvas;
let sketchBtn, editBtn, recordBtn, previewBtn;
let setPointBtn, cancelPointBtn;
let touchIndicator;
let itemNameInput, categoryName;
let submitBtn, shareBtn, exportBtn;
let shareCode, shareLink, copyBtn;
let previewOverlay, closePreviewBtn;
let exportOverlay, exportData, copyExportBtn, closeExportBtn;
let recordingIndicator, positionDisplay;

// Initialize the builder when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize modules
    initBuilder();
});

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
    categoryName = document.getElementById('categoryName');
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

    // Initialize each module
    // 1. Initialize UI elements
    BuilderUI.initUI({
        gridCanvas,
        previewCanvas,
        sketchBtn,
        editBtn,
        recordBtn,
        previewBtn,
        setPointBtn,
        cancelPointBtn,
        touchIndicator,
        itemNameInput,
        categoryName,
        submitBtn,
        shareBtn,
        exportBtn,
        shareCode,
        shareLink,
        copyBtn,
        previewOverlay,
        closePreviewBtn,
        exportOverlay,
        exportData,
        copyExportBtn,
        closeExportBtn,
        recordingIndicator,
        positionDisplay
    });

    // 2. Initialize the canvas
    BuilderRenderer.initCanvas(gridCanvas, previewCanvas);

    // 3. Set up button event listeners
    BuilderUI.setupButtonListeners();

    // 4. Initialize input handling
    BuilderInput.initInput(gridCanvas, touchIndicator);

    // 5. Start in sketch mode
    BuilderUI.setMode('sketch');

    console.log('Builder initialized');
}

// Export useful functions to window for direct usage
window.handleSetPoint = () => BuilderGrid.handleSetPoint(touchIndicator);
window.handleCancelPoint = () => BuilderGrid.handleCancelPoint(touchIndicator);
window.startRecording = () => BuilderRecording.startRecording(recordBtn, recordingIndicator);
window.stopRecording = () => BuilderRecording.stopRecording(recordBtn, recordingIndicator, setPointBtn);
window.previewAnimation = () => BuilderRecording.previewAnimation(previewOverlay);
window.stopPreview = () => BuilderRecording.stopPreview(previewOverlay, BuilderUI.setMode);
window.setMode = BuilderUI.setMode;
window.redrawCanvas = BuilderRenderer.redrawCanvas;
window.validateExport = BuilderExport.validateRecording;
window.getExportData = BuilderExport.getExportData;
window.importDrawing = BuilderExport.importDrawingData;
