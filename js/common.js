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

// Enhanced touch handling with orientation support
document.addEventListener('DOMContentLoaded', function() {
    // Track current orientation
    let isLandscape = window.innerWidth > window.innerHeight;

    // Function to update touch behavior based on orientation
    function updateTouchBehavior() {
        isLandscape = window.innerWidth > window.innerHeight;

        // Log orientation change for debugging
        console.log('Orientation changed. Landscape: ' + isLandscape);

        // Reset body overflow based on orientation
        if (isLandscape) {
            document.body.style.overflow = 'auto';
            document.documentElement.style.overflow = 'auto';
        } else {
            document.body.style.overflow = 'hidden';
            document.documentElement.style.overflow = 'hidden';
        }
    }

    // Listen for orientation changes and resize events
    window.addEventListener('orientationchange', function() {
        // Small delay to ensure dimensions have updated
        setTimeout(updateTouchBehavior, 100);
    });

    window.addEventListener('resize', function() {
        // Check if orientation actually changed
        const newIsLandscape = window.innerWidth > window.innerHeight;
        if (newIsLandscape !== isLandscape) {
            updateTouchBehavior();
        }
    });

    // Prevent default touch behavior in portrait mode only
    document.addEventListener('touchmove', function(e) {
        if (!isLandscape) {
            // Allow scrolling in scrollable containers
            if (!e.target.closest('.app-content') &&
                !e.target.closest('.scrollable-container')) {
                e.preventDefault();
            }
        }
    }, { passive: false });

    // Prevent double-tap to zoom
    let lastTap = 0;
    document.addEventListener('touchend', function(e) {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
            e.preventDefault();
        }

        lastTap = now;
    }, { passive: false });

    // Set initial state
    updateTouchBehavior();

    // Add orientation message for users
    if (isLandscape) {
        const orientationMsg = document.createElement('div');
        orientationMsg.className = 'orientation-message';
        orientationMsg.innerHTML = 'For best experience, rotate your device to portrait mode';
        orientationMsg.style.textAlign = 'center';
        orientationMsg.style.padding = '5px';
        orientationMsg.style.backgroundColor = 'rgba(0,0,0,0.7)';
        orientationMsg.style.color = 'white';
        orientationMsg.style.position = 'fixed';
        orientationMsg.style.bottom = '0';
        orientationMsg.style.left = '0';
        orientationMsg.style.right = '0';
        orientationMsg.style.zIndex = '9999';
        orientationMsg.style.fontSize = '14px';
        orientationMsg.style.fontWeight = 'bold';

        document.body.appendChild(orientationMsg);

        // Hide after 5 seconds
        setTimeout(() => {
            orientationMsg.style.opacity = '0';
            orientationMsg.style.transition = 'opacity 0.5s';

            // Remove from DOM after fade out
            setTimeout(() => {
                if (orientationMsg.parentNode) {
                    orientationMsg.parentNode.removeChild(orientationMsg);
                }
            }, 600);
        }, 5000);
    }

    console.log('Touch handling with orientation support initialized');
});

// Set a CSS class on the body based on orientation
function updateOrientationClass() {
    if (window.innerWidth > window.innerHeight) {
        document.body.classList.add('landscape');
        document.body.classList.remove('portrait');
    } else {
        document.body.classList.add('portrait');
        document.body.classList.remove('landscape');
    }
}

// Add listener for orientation change
window.addEventListener('orientationchange', function() {
    setTimeout(updateOrientationClass, 100);
});

// Add listener for resize (which happens on orientation change)
window.addEventListener('resize', updateOrientationClass);

// Set initial orientation class
document.addEventListener('DOMContentLoaded', function() {
    updateOrientationClass();
});
