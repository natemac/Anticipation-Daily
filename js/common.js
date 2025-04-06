// Utility function to load JSON data from file
async function loadJsonData(filename) {
    try {
        const response = await fetch(filename);
        if (!response.ok) {
            console.log(`Could not find ${filename}, will use default data`);
            return null;
        }
        return await response.json();
    } catch (error) {
        console.log(`Error loading ${filename}, will use default data`);
        return null;
    }
}

// Resize canvas to match container
function resizeCanvas(canvas) {
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
}

// Update timer bar
function updateTimerBar(timerBar, current, total) {
    const percentage = (current / total) * 100;
    timerBar.style.width = `${percentage}%`;

    // Change color based on time remaining
    if (percentage > 60) {
        timerBar.style.backgroundColor = '#4CAF50'; // Green
    } else if (percentage > 30) {
        timerBar.style.backgroundColor = '#FFC107'; // Yellow
    } else {
        timerBar.style.backgroundColor = '#F44336'; // Red
    }
}

// Prevent default touch behavior to enhance app-like feel
document.addEventListener('DOMContentLoaded', function() {
    // Prevent pull-to-refresh and other touch gestures
    document.addEventListener('touchmove', function(e) {
        // Allow scrolling in scrollable containers
        if (!e.target.closest('.app-content') && !e.target.closest('.scrollable-container')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Prevent double-tap to zoom
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
            e.preventDefault();
        }

        lastTap = now;
    }, { passive: false });

    // Disable zoom on input fields (iOS-specific)
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
        viewportMeta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
    }

    // Add touch-action: none to specific game elements
    const touchElements = document.querySelectorAll('.grid-canvas, .canvas-container, .color-square');
    touchElements.forEach(elem => {
        if (elem) {
            elem.style.touchAction = 'none';
        }
    });

    // Initialize lastTap for double-tap detection
    let lastTap = 0;

    console.log('Touch handling enhancements initialized for app-like experience');
});
