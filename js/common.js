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

// Handle device rotation and touch events
document.addEventListener('DOMContentLoaded', function() {
    // Prevent default touch behavior to enhance app-like feel
    document.addEventListener('touchmove', function(e) {
        // Allow scrolling in scrollable containers
        if (!e.target.closest('.app-content') && !e.target.closest('.scrollable-container')) {
            e.preventDefault();
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
    
    // Add touch-action: none to specific game elements
    const touchElements = document.querySelectorAll('.grid-canvas, .canvas-container, .color-square');
    touchElements.forEach(elem => {
        if (elem) {
            elem.style.touchAction = 'none';
        }
    });
    
    // Get the rotation overlay element
    const rotationOverlay = document.querySelector('.rotation-overlay');
    const closeButton = document.querySelector('.close-rotation-message');
    
    if (rotationOverlay && closeButton) {
        // Set up the close button
        closeButton.addEventListener('click', function() {
            // Hide the overlay when close button is clicked
            rotationOverlay.style.display = 'none';
            
            // Allow the app to display in landscape mode
            document.querySelector('.app-content').style.display = 'block';
            
            // Store the user's preference in localStorage
            localStorage.setItem('allowLandscape', 'true');
            
            // Recheck after a delay (for transition effects)
            setTimeout(checkOrientation, 300);
        });
        
        // Function to check orientation and manage overlay
        function checkOrientation() {
            const isLandscape = window.innerWidth > window.innerHeight;
            const allowLandscape = localStorage.getItem('allowLandscape') === 'true';
            
            // Only show overlay if in landscape AND user hasn't dismissed it
            if (isLandscape && !allowLandscape) {
                rotationOverlay.style.display = 'flex';
                
                // Hide the app content
                if (document.querySelector('.app-content')) {
                    document.querySelector('.app-content').style.display = 'none';
                }
            } else {
                rotationOverlay.style.display = 'none';
                
                // Show the app content
                if (document.querySelector('.app-content')) {
                    document.querySelector('.app-content').style.display = 'block';
                }
            }
            
            // Reset landscape permission when returning to portrait
            if (!isLandscape) {
                localStorage.removeItem('allowLandscape');
            }
        }
        
        // Check orientation on page load
        checkOrientation();
        
        // Listen for orientation changes
        window.addEventListener('orientationchange', function() {
            // Small delay to ensure browser has updated dimensions
            setTimeout(checkOrientation, 100);
        });
        
        // Also listen for resize events (which happen on orientation change)
        window.addEventListener('resize', function() {
            // Only trigger if it's an actual orientation change
            const newIsLandscape = window.innerWidth > window.innerHeight;
            const currentDisplay = rotationOverlay.style.display;
            const currentIsLandscape = currentDisplay === 'flex';
            
            if (newIsLandscape !== currentIsLandscape) {
                checkOrientation();
            }
        });
    }
    
    console.log('Touch handling and rotation detection initialized');
});
