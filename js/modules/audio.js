// audio.js - Handles game audio and sound effects

import GameState from './state.js';
import { log } from '../game.js';

// Module variables
let sounds = {
    correct: null,
    incorrect: null,
    completion: null,
    tick: null
};

// Initialize the audio system
function init() {
    // Create and configure audio elements
    sounds.correct = new Audio('sounds/correct.mp3');
    sounds.incorrect = new Audio('sounds/incorrect.mp3');
    sounds.completion = new Audio('sounds/completion.mp3');
    sounds.tick = new Audio('sounds/tick.mp3');

    // Configure all sounds
    Object.values(sounds).forEach(sound => {
        if (sound) {
            sound.volume = 0.5;
            sound.load();
            updateMuteState(sound);
        }
    });

    log("Audio system initialized");

    return sounds;
}

// Update audio mute state based on game state
function updateAudioState(enabled) {
    GameState.audioEnabled = enabled;

    // Update all sounds
    Object.values(sounds).forEach(sound => {
        updateMuteState(sound);
    });

    return GameState.audioEnabled;
}

// Update individual sound mute state
function updateMuteState(sound) {
    if (!sound) return;
    sound.muted = !GameState.audioEnabled;
}

// Play a sound with error handling
function playSound(soundName) {
    const sound = sounds[soundName];

    if (!sound || !GameState.audioEnabled) return;

    // Reset to beginning
    sound.currentTime = 0;

    // Play with error catching (common on mobile)
    sound.play().catch(err => {
        // Silently handle play errors (common on mobile browsers)
    });
}

// Play correct sound
function playCorrect() {
    playSound('correct');
}

// Play incorrect sound
function playIncorrect() {
    playSound('incorrect');
}

// Play completion sound
function playCompletion() {
    playSound('completion');
}

// Play UI interaction sound
function playTick() {
    playSound('tick');
}

// Preload all audio files
function preloadAudio() {
    Object.values(sounds).forEach(sound => {
        if (sound) {
            sound.load();
        }
    });
}

// Export public functions
export {
    init,
    updateAudioState,
    playSound,
    playCorrect,
    playIncorrect,
    playCompletion,
    playTick,
    preloadAudio
};
