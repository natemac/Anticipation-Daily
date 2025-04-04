// audio.js - Handles game audio and sound effects

import GameState from './state.js';
import { log } from '../game.js';

// Module variables
// Make sounds object accessible to other modules
export let sounds = {
    // Sound effects
    correct: null,
    incorrect: null,
    completion: null,
    tick: null,
    guess: null,  // Sound effect for entering guess mode

    // Background music for each category
    yellowMusic: null,
    greenMusic: null,
    blueMusic: null,
    redMusic: null
};

// Track music state
let musicState = {
    currentTrack: null,
    currentCategory: null,
    musicPositions: {
        yellow: 0,
        green: 0,
        blue: 0,
        red: 0
    },
    isPlaying: false
};

// Initialize the audio system
function init() {
    log("Initializing audio system");

    // Create and configure sound effects
    sounds.correct = new Audio('sounds/correct.mp3');
    sounds.incorrect = new Audio('sounds/incorrect.mp3');
    sounds.completion = new Audio('sounds/completion.mp3');
    sounds.tick = new Audio('sounds/tick.mp3');
    sounds.guess = new Audio('sounds/guess.mp3');

    // Create and configure background music for each category
    sounds.yellowMusic = new Audio('sounds/yellow-music.mp3');
    sounds.greenMusic = new Audio('sounds/green-music.mp3');
    sounds.blueMusic = new Audio('sounds/blue-music.mp3');
    sounds.redMusic = new Audio('sounds/red-music.mp3');

    // Configure all sounds
    Object.values(sounds).forEach(sound => {
        if (sound) {
            sound.load(); // Start preloading
            updateMuteState(sound);
        }
    });

    // Configure music tracks - all should loop
    sounds.yellowMusic.loop = true;
    sounds.greenMusic.loop = true;
    sounds.blueMusic.loop = true;
    sounds.redMusic.loop = true;

    // Set volume levels
    const musicVolume = 0.4;
    sounds.yellowMusic.volume = musicVolume;
    sounds.greenMusic.volume = musicVolume;
    sounds.blueMusic.volume = musicVolume;
    sounds.redMusic.volume = musicVolume;

    sounds.correct.volume = 0.5;
    sounds.incorrect.volume = 0.6;
    sounds.completion.volume = 0.7;
    sounds.tick.volume = 0.3;
    sounds.guess.volume = 0.6;

    log("Audio system initialized and preloading started");

    return sounds;
}

// Update audio mute state based on game state
function updateAudioState(enabled) {
    GameState.audioEnabled = enabled;

    // Update all sounds
    Object.values(sounds).forEach(sound => {
        updateMuteState(sound);
    });

    // If audio was enabled and music should be playing, resume it
    if (enabled && musicState.isPlaying && musicState.currentTrack) {
        sounds[musicState.currentTrack].play().catch(err => {
            // Silently handle auto-play restrictions
            log("Auto-play restricted: " + err.message);
        });
    } else if (!enabled && musicState.currentTrack) {
        // If audio was disabled, pause any playing music
        sounds[musicState.currentTrack].pause();
    }

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
        log("Error playing sound: " + err.message);
    });
}

// Start playing drawing music for the current category
function startDrawingMusic(category = null) {
    if (!GameState.audioEnabled) return;

    // Use current category from GameState if not provided
    const currentCategory = category || GameState.currentColor || 'yellow';

    // Store current category
    musicState.currentCategory = currentCategory;

    // Get the right music track for this category
    const musicTrackName = `${currentCategory}Music`;
    musicState.currentTrack = musicTrackName;
    musicState.isPlaying = true;

    // Pause any other music first
    Object.entries(sounds).forEach(([key, sound]) => {
        if (key.includes('Music') && key !== musicTrackName && sound) {
            // Store current time before pausing
            if (sound.currentTime > 0 && !sound.paused) {
                const category = key.replace('Music', '');
                musicState.musicPositions[category] = sound.currentTime;
            }
            sound.pause();
        }
    });

    const music = sounds[musicTrackName];
    if (!music) {
        log(`Music track ${musicTrackName} not found!`);
        return;
    }

    // Resume from where we left off if we have a stored position
    if (musicState.musicPositions[currentCategory] > 0) {
        music.currentTime = musicState.musicPositions[currentCategory];
    }

    // Play with fade-in effect
    music.volume = 0;
    music.play().catch(err => {
        log(`Error playing ${currentCategory} music: ${err.message}`);
    });

    // Fade in
    fadeInAudio(music, GameState.musicVolume || 0.4, 1000);

    log(`${currentCategory} music started`);
}

// Pause drawing music and store current time
function pauseDrawingMusic() {
    if (!musicState.currentTrack || !musicState.currentCategory) return;

    // Get the current music track
    const music = sounds[musicState.currentTrack];
    if (!music) return;

    // Store the current time so we can resume from here
    musicState.musicPositions[musicState.currentCategory] = music.currentTime;

    // Pause with fade-out effect
    fadeOutAudio(music, 500).then(() => {
        music.pause();
    });

    musicState.isPlaying = false;

    log(`${musicState.currentCategory} music paused at ${music.currentTime}`);
}

// Start playing guessing music
function startGuessingMusic() {
    if (!GameState.audioEnabled) return;

    // Store current track
    musicState.currentTrack = 'guessingMusic';
    musicState.isPlaying = true;

    // Pause drawing music first
    if (sounds.drawingMusic.playing) {
        pauseDrawingMusic();
    }

    const music = sounds.guessingMusic;

    // Reset to beginning each time
    music.currentTime = 0;

    // Play with fade-in
    music.volume = 0;
    music.play().catch(err => {
        log("Error playing guessing music: " + err.message);
    });

    // Fade in
    fadeInAudio(music, 0.4, 800);

    log("Guessing music started");
}

// Stop guessing music
function stopGuessingMusic() {
    if (musicState.currentTrack !== 'guessingMusic') return;

    const music = sounds.guessingMusic;

    // Fade out
    fadeOutAudio(music, 500).then(() => {
        music.pause();
        music.currentTime = 0;
    });

    musicState.isPlaying = false;

    log("Guessing music stopped");
}

// Stop all music
function stopAllMusic() {
    // Fade out and stop any playing music
    Object.entries(sounds).forEach(([key, sound]) => {
        if (key.includes('Music') && sound) {
            fadeOutAudio(sound, 300).then(() => {
                sound.pause();
                sound.currentTime = 0;
            });

            // Reset stored position
            if (key.includes('Music')) {
                const category = key.replace('Music', '');
                if (musicState.musicPositions[category] !== undefined) {
                    musicState.musicPositions[category] = 0;
                }
            }
        }
    });

    musicState.isPlaying = false;
    musicState.currentTrack = null;
    musicState.currentCategory = null;

    log("All music stopped");
}

// Helper function to fade in audio
function fadeInAudio(audioElement, targetVolume, duration) {
    if (!audioElement) return;

    const startVolume = 0;
    const volumeStep = targetVolume / (duration / 50); // 50ms intervals

    audioElement.volume = startVolume;

    const fadeInterval = setInterval(() => {
        let newVolume = audioElement.volume + volumeStep;

        if (newVolume >= targetVolume) {
            newVolume = targetVolume;
            clearInterval(fadeInterval);
        }

        audioElement.volume = newVolume;
    }, 50);

    return fadeInterval;
}

// Helper function to fade out audio
function fadeOutAudio(audioElement, duration) {
    return new Promise((resolve) => {
        if (!audioElement) {
            resolve();
            return;
        }

        const startVolume = audioElement.volume;
        const volumeStep = startVolume / (duration / 50); // 50ms intervals

        const fadeInterval = setInterval(() => {
            let newVolume = audioElement.volume - volumeStep;

            if (newVolume <= 0) {
                newVolume = 0;
                clearInterval(fadeInterval);
                resolve();
            }

            audioElement.volume = newVolume;
        }, 50);
    });
}

// Handle audio when switching game modes
function updateMusicForGameMode(isGuessMode) {
    if (isGuessMode) {
        // Play the guessing mode sound effect while keeping current music playing
        playGuessSFX();

        // Get the current music track
        const currentMusicTrack = musicState.currentTrack;
        if (!currentMusicTrack || !sounds[currentMusicTrack]) return;

        // Optionally reduce music volume during guessing
        if (sounds[currentMusicTrack] && sounds[currentMusicTrack].volume > 0.2) {
            // Temporarily lower music volume slightly
            fadeAudioTo(sounds[currentMusicTrack], 0.25, 400);
        }
    } else {
        // Restore music volume when exiting guess mode
        const currentMusicTrack = musicState.currentTrack;
        if (!currentMusicTrack || !sounds[currentMusicTrack]) return;

        fadeAudioTo(sounds[currentMusicTrack], GameState.musicVolume || 0.4, 600);

        // If music isn't playing, start it
        if (!musicState.isPlaying) {
            startDrawingMusic();
        }
    }
}

// Helper function to fade audio to a target volume
function fadeAudioTo(audioElement, targetVolume, duration) {
    if (!audioElement) return;

    const startVolume = audioElement.volume;
    const volumeDiff = targetVolume - startVolume;
    const volumeStep = volumeDiff / (duration / 50); // 50ms intervals

    const fadeInterval = setInterval(() => {
        let newVolume = audioElement.volume + volumeStep;

        if ((volumeStep > 0 && newVolume >= targetVolume) ||
            (volumeStep < 0 && newVolume <= targetVolume)) {
            newVolume = targetVolume;
            clearInterval(fadeInterval);
        }

        audioElement.volume = newVolume;
    }, 50);

    return fadeInterval;
}

// Play correct input sound (during guessing)
function playCorrect() {
    playSound('correct');
}

// Play incorrect sound
function playIncorrect() {
    playSound('incorrect');
}

// Play completion sound
function playCompletion() {
    // Stop any playing music first with quick fadeout
    stopAllMusic();

    // Play victory sound
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

    log("All audio preloaded");
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
    preloadAudio,
    startDrawingMusic,
    pauseDrawingMusic,
    playGuessSFX,
    stopAllMusic,
    updateMusicForGameMode,
    fadeAudioTo
};
