// core.js - Core UI functionality and initialization

import GameState from '../state.js';
import * as GameLogic from '../gameLogic.js';
import { log } from '../../game.js';

// Module variables
let timerDisplay, beginButton, wrongMessage, backButton, buttonTimer;
let wordSpacesDiv, hintButton;

// Initialize UI module
function init() {
    // Get DOM elements
    timerDisplay = document.getElementById('timerDisplay');
    beginButton = document.getElementById('beginButton');
    wrongMessage = document.getElementById('wrongMessage');
    backButton = document.getElementById('backButton');
    buttonTimer = document.getElementById('buttonTimer');

    // Set up back button event listener
    if (backButton) {
        backButton.addEventListener('click', handleBackButton);
    }

    // Create UI elements
    createWordSpacesDiv();
    createHintButton();

    log("UI core module initialized");

    return {
        timerDisplay,
        beginButton,
        wrongMessage,
        backButton,
        buttonTimer,
        wordSpacesDiv,
        hintButton
    };
}

// Handle back button clicks
function handleBackButton() {
    log("Back button clicked");
    if (GameState.gameStarted) {
        GameLogic.endGame(false);
    }
}

// Create the word spaces div
function createWordSpacesDiv() {
    // Check if already exists
    if (document.getElementById('wordSpacesDiv')) {
        wordSpacesDiv = document.getElementById('wordSpacesDiv');
        return wordSpacesDiv;
    }

    // Create the div for word spaces
    wordSpacesDiv = document.createElement('div');
    wordSpacesDiv.id = 'wordSpacesDiv';
    wordSpacesDiv.style.width = '100%';
    wordSpacesDiv.style.height = '60px';
    wordSpacesDiv.style.margin = '10px 0';
    wordSpacesDiv.style.textAlign = 'center';
    wordSpacesDiv.style.position = 'relative';
    wordSpacesDiv.style.backgroundColor = 'white';
    wordSpacesDiv.style.borderRadius = '8px';
    wordSpacesDiv.style.padding = '10px';
    wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
    wordSpacesDiv.style.transition = 'box-shadow 0.3s ease, transform 0.2s ease';

    // Find the game controls div to insert before it
    const gameControlsDiv = document.querySelector('.game-controls');

    if (gameControlsDiv && gameControlsDiv.parentElement) {
        // Insert it before the game controls
        gameControlsDiv.parentElement.insertBefore(wordSpacesDiv, gameControlsDiv);
    } else {
        // Fallback: insert after canvas container
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer && canvasContainer.parentElement) {
            canvasContainer.parentElement.insertBefore(wordSpacesDiv, canvasContainer.nextSibling);
        }
    }

    return wordSpacesDiv;
}

// Show error message
function showError(message) {
    if (wrongMessage) {
        wrongMessage.textContent = message;
        wrongMessage.style.display = 'block';
        setTimeout(() => {
            wrongMessage.style.display = 'none';
        }, 2000);
    }
}

// Hide all messages
function hideMessages() {
    if (wrongMessage) {
        wrongMessage.style.display = 'none';
    }
}

// Reposition UI elements
function repositionElements() {
    // Add any common repositioning logic here
}

export {
    init,
    handleBackButton,
    createWordSpacesDiv,
    showError,
    hideMessages,
    repositionElements
}; 