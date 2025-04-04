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
  - `game-data.js` - Default game data and drawings
  - `menu.js` - Menu and settings functionality
  - `builder.js` - Builder-specific logic and interactions
  - `touch-interface.js` - Touch input handling for the builder
  - `mouse-interface.js` - Mouse input handling for the builder
  - `modules/` - Core game functionality divided into modules
    - `state.js` - Game state management and configuration
    - `renderer.js` - Canvas rendering and drawing
    - `animation.js` - Animation and visual effects
    - `audio.js` - Sound management
    - `ui.js` - User interface elements
    - `wordHandler.js` - Word display and validation
    - `input.js` - Keyboard and touch handling
    - `gameLogic.js` - Game mechanics and flow
  - `game.js` - Main entry point that coordinates all modules
- `items/` - Directory containing JSON files with custom drawing data
- `sounds/` - Directory containing audio files for game feedback
  - `correct.mp3` - Sound for correct letter entry
  - `incorrect.mp3` - Sound for incorrect guesses
  - `completion.mp3` - Sound for successful puzzle completion
  - `tick.mp3` - Subtle sound for UI interactions

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

4. **UI.js**
   - Creates and updates UI elements
   - Manages timers and visual feedback
   - Handles game mode transitions
   - Controls hint button behavior and cooldowns

5. **WordHandler.js**
   - Renders and updates word spaces
   - Processes letter and word validation
   - Handles word completion logic
   - Manages correct letter tracking

6. **Input.js**
   - Processes keyboard and touch input
   - Creates virtual keyboard for mobile
   - Handles input validation and feedback

7. **GameLogic.js**
   - Controls game flow and mechanics
   - Manages game initialization and loading
   - Handles timing and scoring

## Game Features

- Four categories to play (Travel, Food, Man-made, Leisure)
- Two difficulty levels (Easy shows dots and word spaces, Hard shows only drawing lines)
- Timer system with countdown animation
- Sharing capability for completed puzzles
- Responsive design for mobile and desktop
- Letter-by-letter validation with immediate feedback
- Virtual keyboard support for mobile devices
- Consistent drawing scaling between builder and game

## Recent Enhancements and Fixes

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

    // Debug settings
    DEBUG_MODE: false             // Enable debug logging and features
};
```

You can adjust these parameters to fine-tune the game's behavior.

## Adding Sound Files

To enable the sound effects, add the following audio files to a `sounds` directory:

1. `correct.mp3` - A short, pleasant sound for correct letter entries
2. `incorrect.mp3` - A negative feedback sound for incorrect guesses
3. `completion.mp3` - A celebratory sound for completing a puzzle
4. `tick.mp3` - A subtle click sound for UI interactions

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

## Anticipation Builder

The builder tool allows you to create custom drawings that can be loaded into the game:

- Sketch mode for planning drawings
- Record mode for creating the final animation sequence
- Preview mode to verify how drawings will look to players
- Export functionality to create JSON files
- Grid system with edge restrictions

### Building Process

1. Use Sketch mode to create the basic structure
2. Use Record mode to define the animation sequence
3. Preview your animation to see how it will look to players
4. Export your drawing as a JSON file that can be loaded by the game

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

## Credits

This project is inspired by the classic Nintendo game "Anticipation" released in 1988.
