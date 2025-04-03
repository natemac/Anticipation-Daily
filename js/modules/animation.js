// animation.js - Handles animations and visual effects

import GameState from './state.js';
import * as Renderer from './renderer.js';
import * as Audio from './audio.js';
import { log } from '../game.js';

// Initialize the animation module
function init() {
    // Nothing to initialize yet
    return true;
}

// Start drawing animation with improved timing
function startDrawingAnimation() {
    // Prepare animation state
    const totalSequenceLength = GameState.drawingData.sequence.length;

    // Set animation speed based on difficulty
    const timePerLine = GameState.difficulty === 'hard' ?
        GameState.animationSpeed * 0.7 : // Faster in hard mode
        GameState.animationSpeed;        // Normal in easy mode

    log(`Starting animation: ${totalSequenceLength} lines, ${timePerLine}ms per line`);

    // Reset animation state
    cancelAnimationFrame(GameState.animationId);
    GameState.drawingProgress = 0;
    GameState.lastFrameTime = 0;

    // Draw the first line immediately
    GameState.drawingProgress = 1;
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
            GameState.pendingAnimationStart = false;
            log("Animation complete or interrupted");
        }
    }

    // Start animation loop
    GameState.animationId = requestAnimationFrame(animate);
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

// Export public functions
export {
    init,
    startDrawingAnimation,
    startConfettiAnimation,
    animateConfetti,
    cancelAnimations,
    pulseElement,
    highlightHintLetter
};
