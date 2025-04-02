// Menu script for Daily Anticipation game
document.addEventListener('DOMContentLoaded', initMenu);

// Global game state variables
const gameState = {
    category: null,
    difficulty: 'easy',
    currentScreen: 'menu'
};

// DOM Elements
let menuScreen, gameScreen, startScreen, resultScreen;
let categoryCards, difficultyToggle, createButton;
let backButton, startBackButton, beginButton;
let newGameButton, shareResultButton;

// Initialize the menu
function initMenu() {
    // Get screen elements
    menuScreen = document.getElementById('menuScreen');
    gameScreen = document.getElementById('gameScreen');
    startScreen = document.getElementById('startScreen');
    resultScreen = document.getElementById('resultScreen');

    // Get menu UI elements
    categoryCards = document.querySelectorAll('.category-card');
    difficultyToggle = document.getElementById('difficultyToggle');
    createButton = document.getElementById('createButton');

    // Get navigation elements
    backButton = document.getElementById('backButton');
    startBackButton = document.getElementById('startBackButton');
    beginButton = document.getElementById('beginButton');
    newGameButton = document.getElementById('newGameButton');
    shareResultButton = document.getElementById('shareResultButton');

    // Set up event listeners
    setupEventListeners();

    // Show the menu screen initially
    showScreen('menu');
}

// Set up event listeners for menu interactions
function setupEventListeners() {
    // Category selection
    categoryCards.forEach(card => {
        card.addEventListener('click', () => {
            const category = card.getAttribute('data-category');
            selectCategory(category);
        });
    });

    // Difficulty toggle
    difficultyToggle.addEventListener('change', () => {
        gameState.difficulty = difficultyToggle.checked ? 'hard' : 'easy';
        console.log(`Difficulty set to: ${gameState.difficulty}`);
    });

    // Create button navigates to builder
    createButton.addEventListener('click', () => {
        window.location.href = 'anticipation-builder.html';
    });

    // Back buttons
    backButton.addEventListener('click', () => {
        showScreen('menu');
    });

    startBackButton.addEventListener('click', () => {
        showScreen('menu');
    });

    // Begin button starts the game
    beginButton.addEventListener('click', async () => {
        console.log(`Begin button clicked. Starting game with category: ${gameState.category}, difficulty: ${gameState.difficulty}`);
        showScreen('game');

        try {
            // Call startGame and wait for it to complete
            await startGame(gameState.category, gameState.difficulty);
        } catch (error) {
            console.error("Error starting game:", error);
            alert("Failed to start game. Please try again.");
            showScreen('menu');
        }
    });

    // Result screen buttons
    newGameButton.addEventListener('click', () => {
        showScreen('menu');
    });

    shareResultButton.addEventListener('click', shareResult);
}

// Handle category selection
function selectCategory(category) {
    gameState.category = category;
    console.log(`Selected category: ${category}`);

    // Display the start screen
    showScreen('start');

    // Load and show a preview of the game
    prepareStartScreen(category);
}

// Show the specified screen and hide others
function showScreen(screenName) {
    gameState.currentScreen = screenName;

    // Hide all screens
    menuScreen.classList.add('hidden');
    gameScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');

    // Show the requested screen
    switch(screenName) {
        case 'menu':
            menuScreen.classList.remove('hidden');
            break;
        case 'game':
            gameScreen.classList.remove('hidden');
            break;
        case 'start':
            startScreen.classList.remove('hidden');
            break;
        case 'result':
            resultScreen.classList.remove('hidden');
            break;
    }
}

// Prepare the start screen with a preview
function prepareStartScreen(category) {
    // Reset timer display
    document.getElementById('startTimer').textContent = '00:00';

    // Clear the start canvas
    const startCanvas = document.getElementById('startCanvas');
    const ctx = startCanvas.getContext('2d');
    ctx.clearRect(0, 0, startCanvas.width, startCanvas.height);

    // Get the category name
    const categoryName = gameCategories[category]?.name || getCategoryName(category);

    // Add a message about the category
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.font = '20px Arial';
    ctx.fillText(`Get ready to guess a ${categoryName} item!`,
                 startCanvas.width/2, startCanvas.height/2 - 20);

    // Add a "Press Begin" instruction
    ctx.font = '16px Arial';
    ctx.fillText('Press Begin when you\'re ready!',
                 startCanvas.width/2, startCanvas.height/2 + 20);
}

// Get human-readable category name
function getCategoryName(category) {
    switch(category) {
        case 'travel': return 'Travel';
        case 'food': return 'Food';
        case 'manmade': return 'Man-made';
        case 'leisure': return 'Leisure';
        default: return category;
    }
}

// Share result on social media or copy link
function shareResult() {
    const shareText = `I guessed the Daily Anticipation puzzle in ${document.querySelector('.result-time').textContent}!`;

    // Check if Web Share API is available
    if (navigator.share) {
        navigator.share({
            title: 'Daily Anticipation',
            text: shareText,
            url: window.location.href
        }).catch(err => {
            console.error('Share failed:', err);
            copyToClipboard(shareText + ' ' + window.location.href);
        });
    } else {
        // Fallback to clipboard copy
        copyToClipboard(shareText + ' ' + window.location.href);
    }
}

// Copy text to clipboard with user feedback
function copyToClipboard(text) {
    // Create a temporary input element
    const input = document.createElement('input');
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);

    // Alert the user
    alert('Result copied to clipboard!');
}

// Expose functions for other scripts
window.gameMenu = {
    showScreen,
    showResult,
};

// Function to display the result screen with game data
function showResult(word, timeString) {
    // Set the result text
    document.querySelector('.result-word').textContent = word;
    document.querySelector('.result-time').textContent = timeString;

    // Display the result screen
    showScreen('result');

    // Copy the final drawing to the result canvas
    const drawingCanvas = document.getElementById('drawingCanvas');
    const resultCanvas = document.getElementById('resultCanvas');
    const resultCtx = resultCanvas.getContext('2d');

    resultCtx.clearRect(0, 0, resultCanvas.width, resultCanvas.height);
    resultCtx.drawImage(drawingCanvas, 0, 0);
}
