// ui-controls.js - Handles UI controls and button behaviors

import GameState from './state.js';
import * as Audio from './audio.js';
import * as GameLogic from './gameLogic.js';
import { log } from '../game.js';
import * as UiHints from './ui-hints.js';

// Import shared UI elements from core
import { buttonContainer } from './ui-core.js';

// Module variables
export let hintButton;

// Handle back button clicks
export function handleBackButton() {
    log("Back button clicked");
    if (GameState.gameStarted) {
        GameLogic.endGame(false);
    }
}

// Create hint button
export function createHintButton() {
    // Check if already exists
    if (document.getElementById('hintButton')) {
        hintButton = document.getElementById('hintButton');
        return hintButton;
    }

    hintButton = document.createElement('button');
    hintButton.id = 'hintButton';
    hintButton.className = 'hint-button';
    hintButton.textContent = 'Hint?';
    hintButton.style.display = 'none';
    hintButton.style.backgroundColor = '#FFC107';
    hintButton.style.color = '#333';
    hintButton.style.border = 'none';
    hintButton.style.borderRadius = '8px';
    hintButton.style.padding = '12px 15px'; // Match beginButton
    hintButton.style.margin = '0'; // Adjusted for side-by-side layout
    hintButton.style.fontWeight = 'bold';
    hintButton.style.cursor = 'pointer';
    hintButton.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    hintButton.style.transition = 'background-color 0.3s, transform 0.2s, opacity 0.3s';
    hintButton.style.flex = '1'; // Takes up 1/3 of the container when beginButton has flex: 2
    hintButton.style.order = '2'; // Explicitly set to second position (right)

    // Initially disable the hint button (will enable after cooldown period)
    hintButton.disabled = true;
    hintButton.style.opacity = "0.5";
    hintButton.style.cursor = "not-allowed";

    // Add event listener
    hintButton.addEventListener('click', UiHints.useHint);

    // Add to button container instead of game controls
    if (buttonContainer) {
        // Make sure to append in the correct order for left-to-right layout
        // The buttonContainer may already have the beginButton as first child
        if (buttonContainer.children.length === 0) {
            // Container is empty - we'll wait for the beginButton to be added first
            setTimeout(() => {
                buttonContainer.appendChild(hintButton); // Add hint button second
            }, 10);
        } else {
            // Container already has beginButton - add hint button after it
            buttonContainer.appendChild(hintButton);
        }
    } else {
        // Fallback to old behavior
        const gameControlsDiv = document.querySelector('.game-controls');
        if (gameControlsDiv) {
            gameControlsDiv.appendChild(hintButton);
        }
    }

    return hintButton;
}

// Show/hide hint button
export function toggleHintButton(show) {
    if (!hintButton) return;

    // Only show hint button in easy mode
    if (GameState.difficulty !== 'easy') {
        hintButton.style.display = 'none';
        return;
    }

    // Update display based on show parameter
    hintButton.style.display = show ? 'block' : 'none';

    // Also show/hide the button container for consistent space
    if (buttonContainer) {
        buttonContainer.style.display = show ? 'flex' : 'block';

        // Make sure the beginButton takes up 2/3 of the space when the hint button is showing
        const beginButton = document.getElementById('beginButton');
        if (beginButton) {
            beginButton.style.flex = show ? '2' : '1';
        }
    }

    // Reset hint button state
    if (show) {
        // Update text based on limited vs unlimited hints
        if (GameState.CONFIG.HINTS_AVAILABLE > 0) {
            hintButton.textContent = `Hint? (${GameState.CONFIG.HINTS_AVAILABLE})`;
        } else {
            hintButton.textContent = 'Hint?';
        }

        hintButton.disabled = true;
        hintButton.style.opacity = "0.5";
        hintButton.style.cursor = "not-allowed";

        // Start with inactive state but not in cooldown
        GameState.hintButtonActive = false;
        GameState.hintButtonCooldown = false;
        GameState.hintCooldownRemaining = 0;

        // Enable after initial delay if in easy mode
        if (GameState.difficulty === 'easy' &&
            GameState.elapsedTime >= GameState.CONFIG.HINT_COOLDOWN_TIME) {
            UiHints.enableHintButton();
        }
    }
}

// Add audio toggle to settings
export function addAudioToggle() {
    // Find appropriate place to add toggle
    const difficultyContainer = document.querySelector('.difficulty-container');
    if (!difficultyContainer) return;

    // Check if already exists
    if (document.querySelector('.audio-container')) return;

    // Create audio toggle container
    const audioContainer = document.createElement('div');
    audioContainer.className = 'audio-container';
    audioContainer.style.display = 'flex';
    audioContainer.style.flexDirection = 'column';
    audioContainer.style.alignItems = 'center';
    audioContainer.style.margin = '10px 0';

    // Create title
    const audioTitle = document.createElement('div');
    audioTitle.className = 'audio-title';
    audioTitle.textContent = 'Sound Effects';
    audioTitle.style.marginBottom = '8px';
    audioTitle.style.fontSize = '18px';
    audioTitle.style.fontWeight = 'bold';

    // Create toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.style.display = 'flex';
    toggleContainer.style.alignItems = 'center';
    toggleContainer.style.gap = '10px';

    // Create labels and toggle
    const offLabel = document.createElement('span');
    offLabel.id = 'offLabel';
    offLabel.className = 'difficulty-label';
    offLabel.textContent = 'Off';

    const onLabel = document.createElement('span');
    onLabel.id = 'onLabel';
    onLabel.className = 'difficulty-label';
    onLabel.textContent = 'On';

    // Create toggle switch
    const toggleSwitch = document.createElement('label');
    toggleSwitch.className = 'toggle-switch';

    const toggleInput = document.createElement('input');
    toggleInput.type = 'checkbox';
    toggleInput.id = 'audioToggle';

    // Set initial state from localStorage
    toggleInput.checked = GameState.audioEnabled;

    const slider = document.createElement('span');
    slider.className = 'slider';

    // Assemble toggle
    toggleSwitch.appendChild(toggleInput);
    toggleSwitch.appendChild(slider);

    // Assemble toggle container
    toggleContainer.appendChild(offLabel);
    toggleContainer.appendChild(toggleSwitch);
    toggleContainer.appendChild(onLabel);

    // Assemble audio container
    audioContainer.appendChild(audioTitle);
    audioContainer.appendChild(toggleContainer);

    // Add to page after difficulty container
    difficultyContainer.parentNode.insertBefore(audioContainer, difficultyContainer.nextSibling);

    // Add click handlers for labels
    offLabel.addEventListener('click', function() {
        toggleInput.checked = false;
        toggleInput.dispatchEvent(new Event('change'));
    });

    onLabel.addEventListener('click', function() {
        toggleInput.checked = true;
        toggleInput.dispatchEvent(new Event('change'));
    });

    // Initial update of label styling
    updateAudioToggleUI(toggleInput.checked);

    // Add change handler to update UI
    toggleInput.addEventListener('change', function() {
        const enabled = this.checked;
        updateAudioToggleUI(enabled);
        Audio.updateAudioState(enabled);
        GameState.toggleAudio(enabled);
    });
}

// Update audio toggle UI
export function updateAudioToggleUI(isOn) {
    const offLabel = document.getElementById('offLabel');
    const onLabel = document.getElementById('onLabel');

    if (!offLabel || !onLabel) return;

    if (isOn) {
        offLabel.style.opacity = '0.5';
        offLabel.style.fontWeight = 'normal';
        onLabel.style.opacity = '1';
        onLabel.style.fontWeight = 'bold';
    } else {
        onLabel.style.opacity = '0.5';
        onLabel.style.fontWeight = 'normal';
        offLabel.style.opacity = '1';
        offLabel.style.fontWeight = 'bold';
    }
}
