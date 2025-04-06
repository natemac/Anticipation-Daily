// This script will ensure that all completed categories display correctly
// Add this script at the end of game.js or create a new file and import it

import * as Menu from './menu.js';

// Function to fix the completed categories display
function fixCompletedCategories() {
    console.log("Fixing completed categories display...");
    
    // Check if refresh function exists
    if (typeof Menu.refreshCompletedPuzzles === 'function') {
        // Call the refresh function to update all completed puzzle displays
        Menu.refreshCompletedPuzzles();
    }
    
    // Manually fix result overlay visibility with CSS
    const resultOverlays = document.querySelectorAll('.result-overlay');
    
    resultOverlays.forEach(overlay => {
        // Check if this is a completed category (has the visible class)
        if (overlay.classList.contains('visible')) {
            // Force styles to ensure visibility
            overlay.style.display = 'flex';
            overlay.style.opacity = '1';
            overlay.style.pointerEvents = 'auto';
            
            // Fix completion stats
            const stats = overlay.querySelector('.completion-stats');
            if (stats) {
                stats.style.display = 'block';
                stats.style.visibility = 'visible';
                stats.style.opacity = '1';
                stats.style.background = 'rgba(0,0,0,0.6)';
                stats.style.padding = '10px 15px';
                stats.style.borderRadius = '10px';
                stats.style.marginTop = '10px';
                stats.style.color = 'white';
                stats.style.textAlign = 'center';
                
                // Fix stat lines
                const statLines = stats.querySelectorAll('.stat-line');
                statLines.forEach(line => {
                    line.style.display = 'block';
                    line.style.visibility = 'visible';
                    line.style.opacity = '1';
                    line.style.margin = '5px 0';
                });
            }
        }
    });
    
    console.log("Completed categories display fixed");
}

// Run the fix function after the page is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Run immediately
    fixCompletedCategories();
    
    // Also run after a short delay to ensure all elements are properly initialized
    setTimeout(fixCompletedCategories, 500);
});

// Export the function so it can be called elsewhere if needed
export { fixCompletedCategories };
