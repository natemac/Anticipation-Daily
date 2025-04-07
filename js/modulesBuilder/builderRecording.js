// builderRecording.js - Handles recording and animation playback

import BuilderState, { DOT_RADIUS, GRID_SIZE } from './builderState.js';

// Start recording
export function startRecording(recordBtn, recordingIndicator) {
    // Update state
    BuilderState.recording.isRecording = true;
    BuilderState.isCurrentlyRecording = true;

    // Update UI
    recordingIndicator.style.display = 'block';
    recordBtn.textContent = 'Stop';
    recordBtn.classList.remove('tertiary-btn', 'primary-btn');
    recordBtn.classList.add('secondary-btn');

    // Make sure the Set Point button is enabled and visible during active recording
    const setPointBtn = document.getElementById('setPointBtn');
    const cancelPointBtn = document.getElementById('cancelPointBtn');

    if (setPointBtn) {
        setPointBtn.style.display = 'block';
        setPointBtn.disabled = false;
        setPointBtn.style.opacity = '1';
    }

    if (cancelPointBtn) {
        cancelPointBtn.style.display = 'block';
        cancelPointBtn.disabled = false;
        cancelPointBtn.style.opacity = '1';
    }

    console.log('Recording started');
    return true;
}

// Stop recording
export function stopRecording(recordBtn, recordingIndicator, setPointBtn) {
    // Update state
    BuilderState.recording.isRecording = false;
    BuilderState.isCurrentlyRecording = false;

    // Update UI
    recordingIndicator.style.display = 'none';
    recordBtn.textContent = 'Record';
    recordBtn.classList.remove('secondary-btn');
    recordBtn.classList.add('tertiary-btn');

    // Keep in record mode but with both buttons disabled when not recording
    const cancelPointBtn = document.getElementById('cancelPointBtn');

    if (setPointBtn) {
        // Keep the Set Point button visible but disabled when not recording
        setPointBtn.style.display = 'block';
        setPointBtn.disabled = true;
        setPointBtn.style.opacity = '0.5';
    }

    if (cancelPointBtn) {
        // Also keep Cancel Point button visible but disabled when not recording
        cancelPointBtn.style.display = 'block';
        cancelPointBtn.disabled = true;
        cancelPointBtn.style.opacity = '0.5';
    }

    console.log('Recording stopped. Sequence:', BuilderState.recording.sequence);
    return BuilderState.recording.sequence;
}

// Preview animation
export function previewAnimation(previewOverlay) {
    if (BuilderState.recording.sequence.length === 0) {
        alert('Please record a drawing sequence first.');
        return false;
    }

    previewOverlay.style.display = 'flex';

    // Set mode to preview without clearing recording state
    BuilderState.mode = 'preview';

    const { previewCtx, gridCanvas } = getCanvasElements();

    // Setup preview canvas
    previewCtx.clearRect(0, 0, previewCtx.canvas.width, previewCtx.canvas.height);

    // Make sure preview canvas is properly sized
    const previewSize = Math.min(400, window.innerWidth * 0.8);
    previewCtx.canvas.width = previewSize;
    previewCtx.canvas.height = previewSize;

    // Calculate scale factor for preview canvas
    const scaleX = previewCtx.canvas.width / gridCanvas.width;
    const scaleY = previewCtx.canvas.height / gridCanvas.height;
    const scale = Math.min(scaleX, scaleY);

    // Collect all dots used in the recording sequence
    const usedDotIndices = new Set();
    BuilderState.recording.sequence.forEach(line => {
        usedDotIndices.add(line.from);
        usedDotIndices.add(line.to);
    });

    // Animation variables
    let currentLineIndex = 0;
    let completedLines = [];
    let animationProgress = 0;
    let animationId = null;
    BuilderState.recording.isPlaying = true;

    // Function to draw everything in its current state
    function drawPreviewFrame() {
        // Clear canvas
        previewCtx.clearRect(0, 0, previewCtx.canvas.width, previewCtx.canvas.height);

        // Draw grid
        previewCtx.strokeStyle = '#eee';
        previewCtx.lineWidth = 1;

        for (let i = 0; i <= GRID_SIZE; i++) {
            const x = i * BuilderState.gridPointSize * scale;
            previewCtx.beginPath();
            previewCtx.moveTo(x, 0);
            previewCtx.lineTo(x, previewCtx.canvas.height);
            previewCtx.stroke();

            const y = i * BuilderState.gridPointSize * scale;
            previewCtx.beginPath();
            previewCtx.moveTo(0, y);
            previewCtx.lineTo(previewCtx.canvas.width, y);
            previewCtx.stroke();
        }

        // Draw ALL dots from the beginning
        previewCtx.fillStyle = '#333';
        usedDotIndices.forEach(dotIndex => {
            if (BuilderState.recording.dots[dotIndex]) { // Safety check
                const dot = BuilderState.recording.dots[dotIndex];
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
            const line = BuilderState.recording.sequence[lineIndex];
            const from = BuilderState.recording.dots[line.from];
            const to = BuilderState.recording.dots[line.to];

            previewCtx.beginPath();
            previewCtx.moveTo(from.x * scale, from.y * scale);
            previewCtx.lineTo(to.x * scale, to.y * scale);
            previewCtx.stroke();
        }

        // Draw animated line (if we're still animating)
        if (currentLineIndex < BuilderState.recording.sequence.length) {
            const line = BuilderState.recording.sequence[currentLineIndex];
            const from = BuilderState.recording.dots[line.from];
            const to = BuilderState.recording.dots[line.to];

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
    function animateLine(timestamp) {
        if (!BuilderState.recording.isPlaying || currentLineIndex >= BuilderState.recording.sequence.length) {
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
                if (BuilderState.recording.isPlaying) {
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

    return true;
}

// Stop preview
export function stopPreview(previewOverlay, setMode) {
    BuilderState.recording.isPlaying = false;

    if (previewOverlay) {
        previewOverlay.style.display = 'none';
    }

    // Cancel any ongoing animations
    if (window.animationId) {
        cancelAnimationFrame(window.animationId);
    }

    if (typeof setMode === 'function') {
        setMode('record');
    } else {
        BuilderState.mode = 'record';
    }

    return true;
}

// Helper function to get canvas elements
function getCanvasElements() {
    const previewCanvas = document.getElementById('previewCanvas');
    const previewCtx = previewCanvas.getContext('2d');
    const gridCanvas = document.getElementById('gridCanvas');

    return { previewCanvas, previewCtx, gridCanvas };
}
