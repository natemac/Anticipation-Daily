// This script consolidates all the fixes and should be included just before </body>

(function() {
    console.log("Applying keyboard and input fixes...");
    
    // Global flag to track if keyboard events are already initialized
    window.keyboardEventsInitialized = false;
    
    // Function to fix double keypresses
    function fixKeyboardDuplication() {
        // First, check if we've already fixed this
        if (window.keyboardFixed) {
            return;
        }
        
        console.log("Fixing keyboard duplication issue...");
        
        // 1. First, clear all keydown event listeners by cloning the body
        const oldBody = document.body;
        const newBody = oldBody.cloneNode(true);
        oldBody.parentNode.replaceChild(newBody, oldBody);
        
        // 2. Re-add a single event listener for keydown
        document.addEventListener('keydown', function(e) {
            console.log(`Single key handler: ${e.key}`);
            
            // Only process keypresses when in guess mode
            if (!window.GameState || !window.GameState.guessMode) return;
            
            // Handle different key types
            if (e.key === 'Backspace') {
                // Remove the last character
                if (window.GameState.currentInput.length > 0) {
                    window.GameState.currentInput = window.GameState.currentInput.slice(0, -1);
                    if (window.WordHandler && typeof window.WordHandler.updateWordSpaces === 'function') {
                        window.WordHandler.updateWordSpaces();
                    }
                }
                e.preventDefault(); // Prevent default backspace behavior
            } else if (e.key === 'Enter') {
                // Submit full word
                if (window.GameState.guessMode && window.GameState.currentInput.length > 0 && 
                    window.WordHandler && typeof window.WordHandler.processFullWord === 'function') {
                    window.WordHandler.processFullWord();
                }
                e.preventDefault(); // Prevent default enter behavior
            } else if (e.key.length === 1 && /[a-zA-Z]/.test(e.key)) {
                // Process letter input
                if (window.WordHandler && typeof window.WordHandler.processLetter === 'function') {
                    window.WordHandler.processLetter(e.key);
                }
            }
        });
        
        // 3. Fix the mobile input field by removing duplicate event listeners
        const guessInput = document.getElementById('guessInput');
        if (guessInput) {
            // Clone and replace the input to remove all event listeners
            const parent = guessInput.parentNode;
            if (parent) {
                const newInput = guessInput.cloneNode(true);
                parent.replaceChild(newInput, guessInput);
                
                // Add a single input handler for mobile
                newInput.addEventListener('input', function(e) {
                    if (!window.GameState || !window.GameState.guessMode) return;
                    
                    // Get the last character typed
                    const lastChar = this.value.slice(-1);
                    
                    // Clear input for next character
                    this.value = '';
                    
                    // Process the character if it's a letter
                    if (/[a-zA-Z]/.test(lastChar) && 
                        window.WordHandler && typeof window.WordHandler.processLetter === 'function') {
                        window.WordHandler.processLetter(lastChar);
                    }
                });
                
                // Show the input properly
                newInput.style.display = 'block';
            }
        }
        
        // 4. Enhance the beginButton to ensure keyboard appears on touch devices
        const beginButton = document.getElementById('beginButton');
        if (beginButton) {
            // Replace the event handler to ensure keyboard appears
            beginButton.addEventListener('click', function() {
                if (!window.GameState.gameStarted) {
                    if (typeof window.GameLogic.startDrawing === 'function') {
                        window.GameLogic.startDrawing();
                    }
                } else {
                    // Entering guess mode
                    if (window.UI && typeof window.UI.enterGuessMode === 'function') {
                        window.UI.enterGuessMode();
                        
                        // Force keyboard to appear on mobile devices
                        setTimeout(function() {
                            const guessInput = document.getElementById('guessInput');
                            if (guessInput) {
                                guessInput.style.display = 'block';
                                guessInput.focus();
                                console.log("Forcing focus on guess input");
                            }
                        }, 300);
                    }
                }
            });
        }
        
        window.keyboardFixed = true;
        console.log("Keyboard duplication fixed!");
    }
    
    // Run the fix when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fixKeyboardDuplication);
    } else {
        fixKeyboardDuplication();
    }
    
    // Also run the fix after a short delay to ensure it works after all modules are loaded
    setTimeout(fixKeyboardDuplication, 1000);
})();
