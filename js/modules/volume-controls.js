// volume-controls.js - Handles volume control UI and interactions

import GameState from './state.js';
import * as Audio from './audio.js';
import { log } from '../game.js';

// Module variables
let volumePanel, musicSlider, sfxSlider, testSfxButton, closeButton;
let isVolumeOpen = false;

// Initialize the volume controls
function init() {
    log("Initializing volume controls");

    // Create the volume control panel
    createVolumePanel();

    // Add button to audio toggle container
    addVolumeButton();

    return true;
}

// Create volume control panel
function createVolumePanel() {
    // Create the panel container
    volumePanel = document.createElement('div');
    volumePanel.id = 'volumePanel';
    volumePanel.className = 'volume-panel';
    volumePanel.style.position = 'fixed';
    volumePanel.style.top = '50%';
    volumePanel.style.left = '50%';
    volumePanel.style.transform = 'translate(-50%, -50%)';
    volumePanel.style.backgroundColor = 'white';
    volumePanel.style.borderRadius = '8px';
    volumePanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
    volumePanel.style.padding = '20px';
    volumePanel.style.zIndex = '1000';
    volumePanel.style.minWidth = '300px';
    volumePanel.style.display = 'none';

    // Create panel content
    volumePanel.innerHTML = `
        <h2 style="margin-top: 0; text-align: center; color: #333;">Audio Settings</h2>

        <div class="slider-container" style="margin: 15px 0;">
            <label for="musicVolume" style="display: block; margin-bottom: 5px; font-weight: bold;">
                Music Volume
            </label>
            <div style="display: flex; align-items: center;">
                <span style="margin-right: 10px;">🔈</span>
                <input type="range" id="musicVolume" min="0" max="100" value="${GameState.musicVolume * 100}"
                       style="flex-grow: 1; height: 8px; outline: none;">
                <span style="margin-left: 10px;">🔊</span>
            </div>
            <span id="musicVolumeValue" style="display: block; text-align: center; margin-top: 5px;">
                ${Math.round(GameState.musicVolume * 100)}%
            </span>
        </div>

        <div class="slider-container" style="margin: 15px 0;">
            <label for="sfxVolume" style="display: block; margin-bottom: 5px; font-weight: bold;">
                Sound Effects Volume
            </label>
            <div style="display: flex; align-items: center;">
                <span style="margin-right: 10px;">🔈</span>
                <input type="range" id="sfxVolume" min="0" max="100" value="${GameState.sfxVolume * 100}"
                       style="flex-grow: 1; height: 8px; outline: none;">
                <span style="margin-left: 10px;">🔊</span>
            </div>
            <span id="sfxVolumeValue" style="display: block; text-align: center; margin-top: 5px;">
                ${Math.round(GameState.sfxVolume * 100)}%
            </span>
        </div>

        <button id="testSfxButton" style="display: block; margin: 20px auto; padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Test Sound
        </button>

        <button id="closeVolumePanel" style="display: block; margin: 10px auto 0; padding: 8px 16px; background-color: #f5f5f5; border: 1px solid #ccc; border-radius: 4px; cursor: pointer;">
            Close
        </button>
    `;

    // Add to document
    document.body.appendChild(volumePanel);

    // Get elements
    musicSlider = document.getElementById('musicVolume');
    sfxSlider = document.getElementById('sfxVolume');
    testSfxButton = document.getElementById('testSfxButton');
    closeButton = document.getElementById('closeVolumePanel');

    // Add event listeners
    setupVolumeEventListeners();
}

// Add volume button to audio container
function addVolumeButton() {
    // Find the audio container
    const audioContainer = document.querySelector('.audio-container');
    if (!audioContainer) return;

    // Create volume button container
    const volumeButtonContainer = document.createElement('div');
    volumeButtonContainer.style.display = 'flex';
    volumeButtonContainer.style.justifyContent = 'center';
    volumeButtonContainer.style.marginTop = '10px';

    // Create volume button
    const volumeButton = document.createElement('button');
    volumeButton.id = 'volumeSettingsButton';
    volumeButton.textContent = '🔊 Settings';
    volumeButton.className = 'tertiary-btn';
    volumeButton.style.padding = '5px 5px';
    volumeButton.style.fontSize = '14px';

    // Add click handler
    volumeButton.addEventListener('click', toggleVolumePanel);

    // Add to DOM
    volumeButtonContainer.appendChild(volumeButton);
    audioContainer.appendChild(volumeButtonContainer);
}

// Set up event listeners for volume controls
function setupVolumeEventListeners() {
    // Music volume change
    musicSlider.addEventListener('input', function() {
        const value = this.value / 100;
        document.getElementById('musicVolumeValue').textContent = `${this.value}%`;
        GameState.setMusicVolume(value);
        updateMusicVolume(value);
    });

    // SFX volume change
    sfxSlider.addEventListener('input', function() {
        const value = this.value / 100;
        document.getElementById('sfxVolumeValue').textContent = `${this.value}%`;
        GameState.setSfxVolume(value);
        updateSfxVolume(value);
    });

    // Test sound button
    testSfxButton.addEventListener('click', function() {
        Audio.playCorrect();
    });

    // Close button
    closeButton.addEventListener('click', function() {
        hideVolumePanel();
    });

    // Click outside to close
    document.addEventListener('click', function(e) {
        if (isVolumeOpen &&
            !volumePanel.contains(e.target) &&
            e.target.id !== 'volumeSettingsButton') {
            hideVolumePanel();
        }
    });

    // ESC key to close
    document.addEventListener('keydown', function(e) {
        if (isVolumeOpen && e.key === 'Escape') {
            hideVolumePanel();
        }
    });
}

// Show volume panel
function showVolumePanel() {
    if (!volumePanel) return;

    volumePanel.style.display = 'block';
    isVolumeOpen = true;

    // Center in viewport
    positionVolumePanel();

    // Add animation
    volumePanel.style.animation = 'fadeIn 0.2s ease-out';

    // Add animation style if it doesn't exist
    if (!document.getElementById('volume-panel-animations')) {
        const style = document.createElement('style');
        style.id = 'volume-panel-animations';
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; transform: translate(-50%, -48%); }
                to { opacity: 1; transform: translate(-50%, -50%); }
            }
            @keyframes fadeOut {
                from { opacity: 1; transform: translate(-50%, -50%); }
                to { opacity: 0; transform: translate(-50%, -48%); }
            }
        `;
        document.head.appendChild(style);
    }
}

// Hide volume panel
function hideVolumePanel() {
    if (!volumePanel) return;

    // Add fade out animation
    volumePanel.style.animation = 'fadeOut 0.2s ease-in';

    // Hide after animation completes
    setTimeout(() => {
        volumePanel.style.display = 'none';
        isVolumeOpen = false;
    }, 200);
}

// Toggle volume panel visibility
function toggleVolumePanel() {
    if (isVolumeOpen) {
        hideVolumePanel();
    } else {
        showVolumePanel();
    }
}

// Position the volume panel in the center of the screen
function positionVolumePanel() {
    if (!volumePanel) return;

    // For mobile, make sure it fits in the viewport
    if (window.innerWidth < 500) {
        volumePanel.style.width = '90%';
        volumePanel.style.maxWidth = '90vw';
        volumePanel.style.maxHeight = '80vh';
        volumePanel.style.overflow = 'auto';
    }
}

// Update music volume
function updateMusicVolume(value) {
    // Update volume for all music tracks
    const musicTracks = ['yellowMusic', 'greenMusic', 'blueMusic', 'redMusic'];
    musicTracks.forEach(trackName => {
        if (Audio.sounds && Audio.sounds[trackName]) {
            Audio.sounds[trackName].volume = value;
        }
    });

    // Update the GameState music volume
    GameState.musicVolume = value;
}

// Update SFX volume
function updateSfxVolume(value) {
    // Update volume for all sound effects
    const sfxTracks = ['correct', 'incorrect', 'completion', 'tick', 'guess'];
    sfxTracks.forEach(sfxName => {
        if (Audio.sounds && Audio.sounds[sfxName]) {
            Audio.sounds[sfxName].volume = value;
        }
    });

    // Update the GameState SFX volume
    GameState.sfxVolume = value;
}

// Export public functions
export {
    init,
    toggleVolumePanel,
    updateMusicVolume,
    updateSfxVolume
};
