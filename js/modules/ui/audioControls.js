// audioControls.js - Audio-related UI controls

import GameState from '../state.js';
import * as Audio from '../audio.js';

// Add audio toggle to settings
function addAudioToggle() {
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
function updateAudioToggleUI(isOn) {
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

export {
    addAudioToggle,
    updateAudioToggleUI
}; 