// animation.js - Handles animations and visual effects

import GameState from './state.js';
import * as Renderer from './renderer.js';
import * as Audio from './audio.js';
import * as GameLogic from './gameLogic.js';
import { log } from '../game.js';

// Initialize the animation module
function init() {
    // Nothing to initialize yet
    return true;
}

// Standard drawing animation (line by line)
function startDrawingAnimation() {
    // Prepare animation state
    const totalSequenceLength = GameState.drawingData.sequence.length;

    // Set animation speed based on difficulty and config
    const timePerLine = GameState.difficulty === 'hard' ?
        GameState.CONFIG.MINIMUM_LINE_TIME * 0.7 : // Faster in hard mode
        GameState.CONFIG.MINIMUM_LINE_TIME;        // Normal in easy mode

    log(`Starting animation: ${totalSequenceLength} lines, ${timePerLine}ms per line`);

    // Reset animation state but preserve drawing progress
    cancelAnimationFrame(GameState.animationId);

    // If no progress yet, start from beginning, otherwise continue
    if (GameState.drawingProgress === 0) {
        GameState.drawingProgress = 1;
    }

    GameState.lastFrameTime = 0;

    // Initial render
    Renderer.renderFrame();

    // Track timing
    let accumulatedTime = 0;

    // Animation frame handler with smoother timing
    function animate(timestamp) {
        // Initialize timing on first frame
        if (!GameState.lastFrameTime) {
            GameState.lastFrameTime = timestamp;
            GameState.animationId = requestAnimationFrame(animate);
            return;
        }

        // Calculate time delta with more precision
        const deltaTime = timestamp - GameState.lastFrameTime;
        GameState.lastFrameTime = timestamp;

        // Prevent large time jumps (e.g. when tab was inactive)
        const cappedDelta = Math.min(deltaTime, 100);
        accumulatedTime += cappedDelta;

        // Update animation based on accumulated time
        if (accumulatedTime >= timePerLine) {
            // Draw the next line when enough time has passed
            if (GameState.drawingProgress < totalSequenceLength) {
                GameState.drawingProgress++;
                Renderer.renderFrame();

                // Play sound for each new line drawn
                Audio.playSound('tick');

                log(`Drawing line ${GameState.drawingProgress} of ${totalSequenceLength}`);
                accumulatedTime -= timePerLine;
            }
        }

        // Continue animation if not complete and game is still active
        if (GameState.drawingProgress < totalSequenceLength &&
            GameState.gameStarted && !GameState.guessMode) {
            GameState.animationId = requestAnimationFrame(animate);
        } else {
            GameState.pendingAnimationStart = GameState.drawingProgress < totalSequenceLength;
            log("Animation complete or interrupted");
        }
    }

    // Start animation loop
    GameState.animationId = requestAnimationFrame(animate);
}

// Point-to-point drawing animation (smoother effect with consistent speed)
function startPointToPointAnimation() {
    // The sequence of lines to draw
    const sequence = GameState.drawingData.sequence;
    const dots = GameState.drawingData.dots;

    // If no sequence data, can't animate
    if (!sequence || sequence.length === 0 || !dots) {
        log("No sequence data for point-to-point animation");
        return;
    }

    // Total number of lines to draw
    const totalSequenceLength = sequence.length;

    // Use pixels per second speed from config
    const pixelsPerSecond = GameState.CONFIG.PIXELS_PER_SECOND;
    const minimumLineTime = GameState.CONFIG.MINIMUM_LINE_TIME;

    // Adjust speed based on difficulty
    const speedFactor = GameState.difficulty === 'hard' ? 1.3 : 1.0; // 30% faster in hard mode
    const adjustedPixelsPerSecond = pixelsPerSecond * speedFactor;

    log(`Starting point-to-point animation: ${totalSequenceLength} lines, ${adjustedPixelsPerSecond}px/s speed, current progress: ${GameState.drawingProgress}`);

    // Cancel any existing animation but preserve drawing progress
    cancelAnimationFrame(GameState.animationId);

    // If drawingProgress is 0, start from beginning, otherwise continue
    const startLineIndex = GameState.drawingProgress > 0 ?
        GameState.drawingProgress : 0;

    // We'll track both the line index and the progress within each line
    let currentLineIndex = startLineIndex;
    let lineProgress = 0;
    let lastTime = 0;

    // Reset lastFrameTime for new animation
    GameState.lastFrameTime = 0;

    // Animation function
    function animateLine(timestamp) {
        // Initialize timing on first frame
        if (!GameState.lastFrameTime) {
            GameState.lastFrameTime = timestamp;
            GameState.animationId = requestAnimationFrame(animateLine);
            return;
        }

        // Calculate time delta
        const deltaTime = timestamp - GameState.lastFrameTime;
        GameState.lastFrameTime = timestamp;

        // Prevent large jumps
        const cappedDelta = Math.min(deltaTime, 100);

        // Get current line info
        const line = sequence[currentLineIndex];
        if (!line) {
            return; // Safety check
        }

        // Calculate line length in pixels
        const fromDot = dots[line.from];
        const toDot = dots[line.to];
        if (!fromDot || !toDot) {
            // Skip to next line if dots are missing
            currentLineIndex++;
            lineProgress = 0;
            GameState.animationId = requestAnimationFrame(animateLine);
            return;
        }

        // Apply scaling to get screen coordinates
        if (!GameState.scaling) {
            Renderer.calculateScaling();
        }
        const scaling = GameState.scaling;

        const fromX = (fromDot.x * scaling.scale) + scaling.offsetX;
        const fromY = (fromDot.y * scaling.scale) + scaling.offsetY;
        const toX = (toDot.x * scaling.scale) + scaling.offsetX;
        const toY = (toDot.y * scaling.scale) + scaling.offsetY;

        // Calculate line length using Pythagorean theorem
        const lineLength = Math.sqrt(
            Math.pow(toX - fromX, 2) +
            Math.pow(toY - fromY, 2)
        );

        // Calculate time needed to draw this line at our pixel speed
        // Minimum time of 100ms to ensure very short lines are still visible
        const timeNeededForLine = Math.max(lineLength / adjustedPixelsPerSecond * 1000, minimumLineTime);

        // Update line progress based on time and line length
        lineProgress += cappedDelta / timeNeededForLine;

        // If line is complete
        if (lineProgress >= 1) {
            // Move to next line
            currentLineIndex++;
            lineProgress = 0;

            // Update game state progress
            GameState.drawingProgress = currentLineIndex;

            // Play sound for each new line
            Audio.playSound('tick');

            // If all lines are drawn, finish animation
            if (currentLineIndex >= totalSequenceLength) {
                Renderer.renderFrame(); // Draw final state
                GameState.pendingAnimationStart = false;
                log("Point-to-point animation complete");
                return;
            }
        }

        // Render current animation state
        Renderer.renderPartialLine(currentLineIndex, lineProgress);

        // Continue animation if game is still active and not in guess mode
        if (currentLineIndex < totalSequenceLength &&
            GameState.gameStarted && !GameState.guessMode) {
            GameState.animationId = requestAnimationFrame(animateLine);
        } else {
            // If interrupted, update progress for resumption
            GameState.drawingProgress = currentLineIndex;
            GameState.pendingAnimationStart = GameState.drawingProgress < totalSequenceLength;
            log("Point-to-point animation interrupted at line: " + GameState.drawingProgress);
        }
    }

    // Start animation
    GameState.animationId = requestAnimationFrame(animateLine);
}

// Start confetti animation for successful completion
function startConfettiAnimation() {
    const confettiCanvas = document.getElementById('confettiCanvas');
    const confettiCtx = confettiCanvas?.getContext('2d');

    if (!confettiCanvas || !confettiCtx) return;

    // Show and resize canvas
    confettiCanvas.style.display = 'block';
    Renderer.resizeConfettiCanvas();

    // Initialize particles
    GameState.showConfetti = true;
    GameState.confettiParticles = [];

    // Create particles
    for (let i = 0; i < 150; i++) {
        GameState.confettiParticles.push({
            x: Math.random() * confettiCanvas.width,
            y: -20 - Math.random() * 100,
            size: 5 + Math.random() * 10,
            color: getRandomConfettiColor(),
            speed: 1 + Math.random() * 3,
            angle: Math.random() * Math.PI * 2,
            rotation: Math.random() * 360,
            rotationSpeed: (Math.random() - 0.5) * 2
        });
    }

    // Start animation
    animateConfetti();
}

// Get random confetti color
function getRandomConfettiColor() {
    const colors = [
        '#f44336', '#e91e63', '#9c27b0', '#673ab7',
        '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
        '#009688', '#4CAF50', '#8bc34a', '#cddc39',
        '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

// Animate confetti
function animateConfetti() {
    if (!GameState.showConfetti) return;

    const confettiCanvas = document.getElementById('confettiCanvas');
    const confettiCtx = confettiCanvas?.getContext('2d');

    if (!confettiCanvas || !confettiCtx) return;

    // Clear canvas
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    // Update and draw particles
    let stillActive = false;

    GameState.confettiParticles.forEach(particle => {
        // Update position
        particle.y += particle.speed;
        particle.x += Math.sin(particle.angle) * 0.5;
        particle.rotation += particle.rotationSpeed;

        // Check if particle is still on screen
        if (particle.y < confettiCanvas.height + 20) {
            stillActive = true;

            // Draw particle
            confettiCtx.save();
            confettiCtx.translate(particle.x, particle.y);
            confettiCtx.rotate(particle.rotation * Math.PI / 180);

            confettiCtx.fillStyle = particle.color;
            confettiCtx.fillRect(-particle.size / 2, -particle.size / 2,
                                 particle.size, particle.size);

            confettiCtx.restore();
        }
    });

    // Continue animation if particles are still visible
    if (stillActive) {
        requestAnimationFrame(animateConfetti);
    } else {
        GameState.showConfetti = false;
        confettiCanvas.style.display = 'none';
    }
}

// Cancel all animations
function cancelAnimations() {
    if (GameState.animationId) {
        cancelAnimationFrame(GameState.animationId);
        GameState.animationId = null;
    }
}

// Add visual pulse effect to an element
function pulseElement(element, color = 'green') {
    if (!element) return;

    // Create animation name based on color
    const animationName = `pulse-${color}`;

    // Add the animation
    element.style.animation = `${animationName} 0.5s`;

    // Remove animation after it completes
    setTimeout(() => {
        element.style.animation = '';
    }, 500);

    // Add pulse animation style if not already added
    if (!document.getElementById(`pulse-${color}-style`)) {
        const style = document.createElement('style');
        style.id = `pulse-${color}-style`;

        // Different colors have different animation styles
        let keyframes;
        if (color === 'green') {
            keyframes = `
                @keyframes ${animationName} {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.2); background-color: rgba(76, 175, 80, 0.2); }
                    100% { transform: scale(1); }
                }
            `;
        } else if (color === 'red') {
            keyframes = `
                @keyframes ${animationName} {
                    0% { transform: scale(1); }
                    50% { transform: scale(0.9); background-color: rgba(244, 67, 54, 0.2); }
                    100% { transform: scale(1); }
                }
            `;
        } else {
            keyframes = `
                @keyframes ${animationName} {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }
            `;
        }

        style.textContent = keyframes;
        document.head.appendChild(style);
    }
}

// Highlight hint letter with animation
function highlightHintLetter(letterElement) {
    if (!letterElement) return;

    // Style the hint letter differently
    letterElement.style.color = '#FFC107';
    letterElement.style.textShadow = '0 0 5px rgba(255, 193, 7, 0.5)';

    // Add animation for hint
    letterElement.style.animation = 'hint-glow 2s infinite';

    // Add hint animation style if not already added
    if (!document.getElementById('hint-animation-style')) {
        const style = document.createElement('style');
        style.id = 'hint-animation-style';
        style.textContent = `
            @keyframes hint-glow {
                0%, 100% { text-shadow: 0 0 5px rgba(255, 193, 7, 0.5); }
                50% { text-shadow: 0 0 15px rgba(255, 193, 7, 0.9); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Add a new keyboard-related animation to a word space element
function animateWordSpaceForKeyboard(show) {
    const wordSpacesDiv = document.getElementById('wordSpacesDiv');
    if (!wordSpacesDiv) return;
    
    // Define animation based on direction
    const animation = show ? 'word-bounce-up 0.4s ease-out forwards' : 'word-bounce-down 0.3s ease-in forwards';
    wordSpacesDiv.style.animation = animation;
    
    // Ensure animation styles exist
    addKeyboardAnimationStyles();
}

// Add keyboard animation styles
function addKeyboardAnimationStyles() {
    if (document.getElementById('keyboard-animation-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'keyboard-animation-styles';
    styleElement.textContent = `
        @keyframes word-bounce-up {
            0% { transform: translateY(0); }
            50% { transform: translateY(-15px); }
            70% { transform: translateY(-10px); }
            100% { transform: translateY(-12px); }
        }
        
        @keyframes word-bounce-down {
            0% { transform: translateY(-12px); }
            100% { transform: translateY(0); }
        }
        
        @keyframes canvas-shrink {
            0% { transform: scale(1); }
            100% { transform: scale(0.9); }
        }
        
        @keyframes canvas-expand {
            0% { transform: scale(0.9); }
            100% { transform: scale(1); }
        }
        
        @keyframes key-pop {
            0% { transform: scale(1); }
            50% { transform: scale(1.15); }
            100% { transform: scale(1); }
        }
    `;
    
    document.head.appendChild(styleElement);
}

// Animate a keyboard key press with category-specific effects
function animateKeyPress(keyElement) {
    if (!keyElement) return;
    
    // Get color based on current category
    let glowColor;
    switch(GameState.currentColor) {
        case 'yellow':
            glowColor = 'rgba(255, 215, 0, 0.6)';
            break;
        case 'green':
            glowColor = 'rgba(76, 175, 80, 0.6)';
            break;
        case 'blue':
            glowColor = 'rgba(33, 150, 243, 0.6)';
            break;
        case 'red':
            glowColor = 'rgba(244, 67, 54, 0.6)';
            break;
        default:
            glowColor = 'rgba(33, 150, 243, 0.6)';
    }
    
    // Apply pop animation
    keyElement.style.animation = 'key-pop 0.2s ease-out';
    keyElement.style.boxShadow = `0 0 10px ${glowColor}`;
    
    // Clear animation and shadow after it completes
    setTimeout(() => {
        keyElement.style.animation = '';
        keyElement.style.boxShadow = '';
    }, 200);
}

// Update canvas for keyboard display
function animateCanvasForKeyboard(show) {
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) return;
    
    // Apply shrink/expand animation
    const animation = show ? 'canvas-shrink 0.3s ease-out forwards' : 'canvas-expand 0.3s ease-in forwards';
    canvasContainer.style.animation = animation;
}

// Export public functions
export {
    init,
    startDrawingAnimation,
    startPointToPointAnimation,
    startConfettiAnimation,
    animateConfetti,
    cancelAnimations,
    pulseElement,
    highlightHintLetter,
    animateWordSpaceForKeyboard,
    animateKeyPress,
    animateCanvasForKeyboard,
    addKeyboardAnimationStyles
};
