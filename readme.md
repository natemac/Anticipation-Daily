# Daily Anticipation Game Project - Previous Project

This project recreates the classic Nintendo game "Anticipation" as a modern web application, consisting of two main components:

1. **Anticipation Game** (`index.html`) - A daily puzzle game similar to Wordle
2. **Anticipation Builder** (`builder.html`) - A tool for creating custom puzzles

## Project Structure

The project consists of the following files:

- `index.html` - The main game players interact with
- `builder.html` - The tool for creating custom puzzles
- `css/`
  - `common.css` - Shared styles between game and builder
  - `game-core.css` - Core layout and structure styles for the game
  - `game-ui.css` - Interface elements and controls for the game
  - `builder.css` - Styles specific to the builder tool
- `js/`
  - `common.js` - Shared functionality between game and builder
  - `menu.js` - Menu and settings functionality
  - `builder.js` - Main entry point for the builder
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
  - `modulesBuilder/` - Modular builder functionality
    - `builderState.js` - Builder state management
    - `builderRenderer.js` - Builder canvas rendering
    - `builderGrid.js` - Grid and point operations
    - `builderUI.js` - Builder interface management
    - `builderInput.js` - Touch and mouse input handling
    - `builderRecording.js` - Animation recording and playback
    - `builderExport.js` - Data validation and export
  - `game.js` - Main entry point that coordinates all game modules
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

## Core Features

### Game Mechanics

#### Animation System
- Line-by-line drawing animation using Canvas
- Point-to-point animation with consistent speed
- Animation timing based on difficulty level
- Progress tracking for resuming animations

#### Guessing System
- Letter-by-letter validation
- Partial word recognition
- Visual feedback for correct/incorrect guesses
- Time-based scoring

#### Game Progression
- Four daily categories (yellow, green, blue, red)
- Persistent completion status
- Score tracking (time and guesses)
- Difficulty modes (easy/hard)

### User Interface

#### Main Menu
- Color grid with four category squares
- Difficulty toggle (easy/hard)
- Audio toggle
- Share results button
- Builder access button

#### Game Screen
- Canvas for drawing animation
- Timer display
- Begin/Guess button
- Input field for guesses
- Word spaces display
- Back button

#### Builder Interface
- Grid-based drawing system
- Mode controls (Sketch, Edit, Record, Preview)
- Name and category inputs
- Export and share functionality
- Preview modal

### Audio System
- Category-specific background music
- Sound effects for interactions
- Volume controls
- Persistence of audio settings

## Modular Architecture

The project uses a modular ES modules architecture for better organization and maintainability:

### Game Modules

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

### Builder Modules

1. **builderState.js**
   - Maintains builder state and configuration
   - Stores grid, sketch, and recording data
   - Handles touch state and mode management
   - Tracks drawing data and animation sequence

2. **builderRenderer.js**
   - Handles canvas drawing for the builder
   - Renders grid, dots, and lines
   - Manages preview and animation rendering
   - Provides visual feedback for user interactions

3. **builderGrid.js**
   - Manages grid operations and calculations
   - Handles finding and creating points
   - Manages line connections between points
   - Provides point deletion functionality

4. **builderUI.js**
   - Manages builder interface
   - Handles mode transitions
   - Controls button states and visibility
   - Provides device-specific UI optimizations

5. **builderInput.js**
   - Unifies touch and mouse input handling
   - Provides different behaviors based on device type
   - Implements mouse-specific features for desktop
   - Manages touch-specific features for mobile

6. **builderRecording.js**
   - Handles animation recording
   - Manages preview playback
   - Controls recording state
   - Provides animation timing and rendering

7. **builderExport.js**
   - Validates drawing data
   - Formats data for export
   - Handles file generation and download
   - Manages data import functionality

## Recent Enhancements and Fixes

### Improved CSS Organization
- **Split CSS Structure**: Separated game styles into two files for better organization
  - `game-core.css`: Core layout and structure styles
  - `game-ui.css`: Interface elements and interactive controls
- **Enhanced Maintainability**: Better separation of concerns for easier updates
- **Improved Performance**: Faster loading of critical layout styles

### Enhanced Mobile UI
- **Improved Touch Controls**: Modified difficulty and sound controls to remain side-by-side on all devices
- **iOS Compatibility**: Added specific fixes for iPhone/Safari to prevent control stacking
- **Better Category Display**: Enlarged category names and removed descriptive subtexts for cleaner UI
- **Responsive Scaling**: Added more breakpoints for consistent display across device sizes

### Improved Game Header System
- **Dynamic Game Header**: Added a new header that replaces the title during gameplay
- **Category Display**: Shows the current category name in the header when playing
- **Integrated Timer**: Relocated the timer to the header for a cleaner interface
- **Smooth Transitions**: Properly toggles between title and header when switching screens
- **Responsive Design**: Header adjusts properly on different screen sizes

### Builder Improvements
- **Modular Architecture**: Refactored builder.js into a modular system with separate responsibilities
- **Improved Touch Interface**: Fixed button visibility and behavior in different modes
- **Enhanced Mouse Interface**: Added clear instructions for mouse users
- **Better Visual Feedback**: Fixed immediate feedback for actions like setting/canceling points
- **Device Detection**: Automatically optimizes UI for touch vs mouse interfaces
- **Navigation Enhancement**: Added "Back to Game" button for easy return to the main game
- **Bug Fixes**:
  - Fixed preview line not disappearing when canceling
  - Fixed point deletion in Edit mode
  - Fixed button state inconsistencies in Record mode
  - Fixed button labels when switching between modes

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

## Configuration Options

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
