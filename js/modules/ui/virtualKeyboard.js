// virtualKeyboard.js - Virtual keyboard functionality

import GameState from '../state.js';
import * as WordHandler from '../wordHandler.js';
import * as Audio from '../audio.js';
import { log } from '../../game.js';

let virtualKeyboard;
let isKeyboardVisible = false;

// Create virtual keyboard
function createVirtualKeyboard() {
    if (virtualKeyboard) return virtualKeyboard;

    virtualKeyboard = document.createElement('div');
    virtualKeyboard.id = 'virtualKeyboard';
    virtualKeyboard.style.display = 'none';
    virtualKeyboard.style.position = 'fixed';
    virtualKeyboard.style.bottom = '0';
    virtualKeyboard.style.left = '0';
    virtualKeyboard.style.width = '100%';
    virtualKeyboard.style.backgroundColor = '#f0f0f0';
    virtualKeyboard.style.padding = '10px';
    virtualKeyboard.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.1)';
    virtualKeyboard.style.zIndex = '1000';

    // Create keyboard rows
    const rows = [
        ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
        ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
        ['Z', 'X', 'C', 'V', 'B', 'N', 'M']
    ];

    rows.forEach(row => {
        const rowDiv = document.createElement('div');
        rowDiv.style.display = 'flex';
        rowDiv.style.justifyContent = 'center';
        rowDiv.style.marginBottom = '5px';

        row.forEach(letter => {
            const button = document.createElement('button');
            button.textContent = letter;
            button.style.width = '40px';
            button.style.height = '40px';
            button.style.margin = '0 2px';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.backgroundColor = '#fff';
            button.style.fontSize = '18px';
            button.style.cursor = 'pointer';
            button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            button.style.transition = 'background-color 0.2s';

            button.addEventListener('click', () => handleKeyPress(letter));
            rowDiv.appendChild(button);
        });

        virtualKeyboard.appendChild(rowDiv);
    });

    document.body.appendChild(virtualKeyboard);
    return virtualKeyboard;
}

// Handle key press
function handleKeyPress(letter) {
    if (!GameState.gameStarted || !GameState.inGuessMode) return;

    log(`Virtual keyboard key pressed: ${letter}`);
    
    // Play sound effect
    Audio.playSound('tick');

    // Update word progress
    WordHandler.handleLetterInput(letter);
}

// Update virtual keyboard visibility
function updateVirtualKeyboard(show) {
    if (!virtualKeyboard) {
        virtualKeyboard = createVirtualKeyboard();
    }

    isKeyboardVisible = show;
    virtualKeyboard.style.display = show ? 'block' : 'none';

    // Adjust body padding to prevent content from being hidden behind keyboard
    document.body.style.paddingBottom = show ? '200px' : '0';
}

// Check if keyboard is visible
function isKeyboardShown() {
    return isKeyboardVisible;
}

export {
    createVirtualKeyboard,
    updateVirtualKeyboard,
    isKeyboardShown
}; 