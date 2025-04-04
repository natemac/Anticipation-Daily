# Daily Anticipation Game Project

This project recreates the classic Nintendo game "Anticipation" as a modern web application, consisting of two main components:

1. **Anticipation Game** (`index.html`) - A daily puzzle game similar to Wordle
2. **Anticipation Builder** (`anticipation-builder.html`) - A tool for creating custom puzzles

## Project Structure

The project consists of the following files:

- `index.html` - The main game players interact with
- `anticipation-builder.html` - The tool for creating custom puzzles
- `css/`
  - `common.css` - Shared styles between game and builder
  - `game.css` - Styles specific to the main game
  - `builder.css` - Styles specific to the builder tool
- `js/`
  - `common.js` - Shared functionality between game and builder
  - `menu.js` - Menu and settings functionality
  - `builder.js` - Builder-specific logic and interactions
  - `touch-interface.js` - Touch input handling for the builder
  - `mouse-interface.js` - Mouse input handling for the builder
  - `modules/` - Core game functionality divided into modules
    - `state.js` - Game state management and configuration
    - `renderer.js` - Canvas rendering and drawing
    - `animation.js` - Animation and visual effects
    - `audio.js` - Sound and music management
    - `ui.js` - User interface elements
    - `wordHandler.js` - Word display and validation
    - `input.js` - Keyboard and touch handling
    - `gameLogic.js` - Game mechanics and flow
    - `volume-controls.js` - Audio volume management
  - `game.js` - Main entry point that coordinates all modules
- `items/` - Directory containing JSON files with custom drawing data
- `sounds/` - Directory containing audio files for game feedback
  - Category-specific background music:
    - `yellow-music.mp3` - Background music for Yellow category
    - `green-music.mp3` - Background music for Green category
    - `blue-music.mp3` - Background music for Blue category
    - `red-music.mp3` - Background music for Red category
  - Sound effects:
    - `correct.mp3` - Sound for correct letter entry
    - `incorrect.mp3` - Sound for incorrect guesses
    - `completion.mp3` - Sound for successful puzzle completion
    - `tick.mp3` - Subtle sound for UI interactions
    - `guess.mp3` - Sound effect when entering guess mode

## Modular Code Architecture

The game uses a modular architecture with ES modules to provide better organization and maintainability. Each module has a specific responsibility and communicates with other modules through clean interfaces.

### Core Modules

1. **State.js (Centralized State and Configuration)**
   - Manages global game state and persistent settings
   - Centralized CONFIG object for all tunable parameters
   - Game difficulty settings and audio preferences
   - Hint system state and cooldown timers

2. **Renderer.js**
   - Manages all canvas drawing operations
   - Handles scaling and coordinates
   - Supports high-DPI (Retina) displays
   - Draws dots and animated lines

3. **Animation.js**
   - Controls drawing animation with two approaches:
     - Line-by-line animation
     - Point-to-point with consistent pixel speed
   - Manages visual effects like confetti and pulses
   - Provides smooth animation timing

4. **Audio.js**
   - Manages all game sounds and music
   - Category-specific background music
   - Sound effects for game interactions
   - Smooth transitions with fade effects
   - Remembers playback positions for each category
   - Adjusts volume during different game phases

5. **UI.js**
   - Creates and updates UI elements
   - Manages timers and visual feedback
   - Handles game mode transitions
   - Controls hint button behavior and cooldowns

6. **WordHandler.js**
   - Renders and updates word spaces
   - Processes letter and word validation
   - Handles word completion logic
   - Manages correct letter tracking

7. **Input.js**
   - Processes keyboard and touch input
   - Creates virtual keyboard for mobile
   - Handles input validation and feedback

8. **GameLogic.js**
   - Controls game flow and mechanics
   - Manages game initialization and loading
   - Handles timing and scoring

9. **Volume-Controls.js**
   - Provides UI for audio settings
   - Separate controls for music and sound effects
   - Persists volume settings across sessions
   - Real-time audio level adjustment

## Game Features

- Four categories with dynamic names loaded from JSON files
- Two difficulty levels (Easy shows dots and word spaces, Hard shows only drawing lines)
- Timer system with countdown animation
- Sharing capability for completed puzzles
- Responsive design for mobile and desktop
- Letter-by-letter validation with immediate feedback
- Virtual keyboard support for mobile devices
- Consistent drawing scaling between builder and game
- Custom audio for each category with adaptive volume

## Dynamic Category System

The game now features a dynamic category system:

- Category colors (yellow, green, blue, red) are determined by JSON filenames
- Category names are defined within each JSON file's `categoryName` property
- The game title dynamically updates to show the current category during gameplay
- Users can create custom puzzles with their own category names using the builder

### JSON Structure

The JSON format has been simplified to:

```json
{
  "name": "ITEM_NAME",
  "categoryName": "Category Display Name",
  "dots": [
    { "x": 210, "y": 105 },
    { "x": 350, "y": 105 }
  ],
  "sequence": [
    { "from": 0, "to": 1 }
  ]
}
```

## Audio System

The game features a comprehensive audio system designed to enhance the gameplay experience:

### Background Music
- Each category has its own unique background music that matches the theme:
  - **Yellow**: Ambient music with a journey feel
  - **Green**: Playful, appetizing soundtrack
  - **Blue**: Modern, technological soundscape
  - **Red**: Relaxed, fun atmosphere music
- Music continues playing throughout the gameplay but lowers volume during guessing
- The system remembers playback position per category when switching between them

### Sound Effects
- **Correct Input**: Plays when the player enters a correct letter
- **Incorrect Input**: Plays when the player makes a wrong guess
- **Completion**: Celebratory sound when successfully completing a puzzle
- **UI Tick**: Subtle feedback for UI interactions
- **Guess Mode**: Special sound effect when entering guessing mode

### Volume Controls
- Separate sliders for music and sound effects
- Settings are saved to localStorage for persistence
- Test sound button to check audio levels
- Real-time volume adjustments

## Recent Enhancements and Fixes

### Dynamic Category System
- **Custom category names** set in the builder or JSON files
- **Automatic color assignment** based on JSON filename (yellow.json, green.json, etc.)
- **Dynamic title updates** showing the current category during gameplay
- **Simplified JSON format** with cleaner structure

### Audio Improvements
- **Category-specific music system** that provides unique audio for each puzzle type
- **Seamless audio transitions** with fade-in/fade-out effects when switching modes
- **Persistence of playback position** when returning to previously played categories
- **Volume adjustment system** with separate controls for music and sound effects
- **Mobile-friendly audio** with optimized loading and playback

### Enhanced Completion Stamps System
- **Differentiated completion stamps** based on how the player solved the puzzle:
  - **Standard Completion (Red)**: Basic completion stamp
  - **Hard Mode Completion (Gold)**: Gold stamp with "HARD" badge for completing in hard mode
  - **Early Completion (Green)**: Green glowing stamp for completing before drawing is finished
  - **First-Try Completion**: Special "Got it in one ☝️" achievement

### Achievement System
- **Achievement badges** for special accomplishments:
  - **Hard mode! 🏆**: For completing puzzles in hard mode
  - **Early completion! ⚡**: For guessing before the drawing animation finishes
  - **Got it in one ☝️**: For guessing correctly on the first attempt
- Enhanced sharing functionality with achievement badges included in shared results

### Bug Fixes
- Fixed animation triggering on wrong category tiles
- Corrected guess counter to properly count attempts (starting from 1)
- Fixed hard mode character box display issues
- Prevented previous game's answer from showing in new categories
- Improved state reset between games for cleaner transitions

### UI Improvements
- Consistent character entry box experience in both easy and hard modes
- Better visual distinction between modes:
  - **Easy Mode**: Shows word structure with visible spaces
  - **Hard Mode**: Displays all characters as boxes, hiding word structure
- More satisfying completion animations and visual effects
- Enhanced result display with clear achievement badges

### Configuration Options

The game includes various configuration options in the `CONFIG` object in `state.js`:

```javascript
const CONFIG = {
    // Animation settings
    PIXELS_PER_SECOND: 300,       // Animation speed in pixels per second
    MINIMUM_LINE_TIME: 100,       // Minimum time for short lines (milliseconds)
    ANIMATION_LINE_BY_LINE: true, // Animate lines individually from point to point

    // Visual settings
    DOT_RADIUS: 5,                // Size of dots on the grid

    // Gameplay settings
    GUESS_TIME_LIMIT: 10,         // Seconds for guessing
    HIDE_INITIAL_MESSAGES: true,  // Hide any messages at game start

    // Hint system
    HINT_COOLDOWN_TIME: 5,        // Cooldown time in seconds between hints
    HINTS_AVAILABLE: 0,           // Number of hints available per game (0 = unlimited)

    // UI settings
    WRONG_MESSAGE_DURATION: 800,  // Duration to show wrong messages (milliseconds)
    CELEBRATION_DURATION: 1500,   // Duration of celebration before returning to menu

    // Audio settings
    MUSIC_ENABLED: true,          // Enable background music
    SOUND_EFFECTS_ENABLED: true,  // Enable sound effects
    MUSIC_VOLUME: 0.4,            // Default volume for background music (0-1)
    SFX_VOLUME: 0.5,              // Default volume for sound effects (0-1)
    FADE_DURATION: 500,           // Default duration for audio fades (milliseconds)

    // Debug settings
    DEBUG_MODE: false             // Enable debug logging and features
};
```

You can adjust these parameters to fine-tune the game's behavior.

## Adding Sound Files

To enable the sound effects and music, add the following audio files to a `sounds` directory:

1. **Category Music**:
   - `yellow-music.mp3` - Background music for the Yellow category
   - `green-music.mp3` - Background music for the Green category
   - `blue-music.mp3` - Background music for the Blue category
   - `red-music.mp3` - Background music for the Red category

2. **Sound Effects**:
   - `correct.mp3` - A short, pleasant sound for correct letter entries
   - `incorrect.mp3` - A negative feedback sound for incorrect guesses
   - `completion.mp3` - A celebratory sound for completing a puzzle
   - `tick.mp3` - A subtle click sound for UI interactions
   - `guess.mp3` - A sound effect for entering guessing mode

## Game Mechanics

- **Drawing Animation**: Watch as the drawing appears line by line with consistent speed
- **Guessing**: Type letters directly into the character spaces
- **Validation**: Each letter is checked immediately as you type
  - Correct letters appear in the spaces with a satisfying animation
  - Incorrect letters trigger visual feedback and reset the guess
- **Timing**: Complete each puzzle as quickly as possible for a better score
- **Hints**: Use limited or unlimited hints to get unstuck on difficult puzzles
- **Celebration**: Enjoy a confetti animation upon successful completion
- **Achievements**: Earn special stamps and badges for skilled play
- **Audio Feedback**: Immersive audio experience enhances gameplay

## Anticipation Builder

The builder tool allows you to create custom drawings that can be loaded into the game:

- Sketch mode for planning drawings
- Record mode for creating the final animation sequence
- Preview mode to verify how drawings will look to players
- Export functionality to create JSON files with custom category names
- Grid system with edge restrictions

### Building Process

1. Use Sketch mode to create the basic structure
2. Use Record mode to define the animation sequence
3. Preview your animation to see how it will look to players
4. Enter a name and category name for your drawing
5. Export your drawing as a JSON file that can be loaded by the game

## Browser Compatibility

This game uses ES modules, which are supported in all modern browsers. The game has been tested in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS 13+)
- Chrome for Android (latest)

## Future Improvements

Potential future enhancements could include:

- Server backend for storing custom drawings
- Daily puzzle rotation system
- User accounts and progress tracking
- Additional categories and themes
- Multiplayer mode for collaborative drawing/guessing
- Achievement system
- More customization options
- Additional music tracks and sound effects

## Credits

This project is inspired by the classic Nintendo game "Anticipation" released in 1988.
