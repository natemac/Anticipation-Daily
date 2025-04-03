# Anticipation Game Project - GitHub Pages Deployment

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
    - `state.js` - Game state management
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
- `README.md` - This documentation file

## Modular Code Architecture

The game now uses a modular architecture with ES modules to provide better organization and maintainability. Each module has a specific responsibility and communicates with other modules through clean interfaces.

### Core Modules

1. **Game.js (Main Entry Point)**
   - Coordinates all modules and initialization
   - Handles global events (resize, visibility changes)
   - Provides logging and utility functions

2. **State.js**
   - Centralizes game state management
   - Handles persistent settings (difficulty, audio preferences)
   - Provides methods for state manipulation

3. **Renderer.js**
   - Manages all canvas drawing operations
   - Handles scaling and coordinates
   - Supports high-DPI (Retina) displays

4. **Animation.js**
   - Controls drawing animation with smooth timing
   - Manages visual effects (confetti, pulses)
   - Provides consistent animation frame handling

5. **UI.js**
   - Creates and updates UI elements
   - Manages timers and visual feedback
   - Handles game mode transitions

6. **WordHandler.js**
   - Renders and updates word spaces
   - Processes letter and word validation
   - Handles word completion logic

7. **Audio.js**
   - Manages sound effects and settings
   - Provides error-resistant playback
   - Controls audio toggle functionality

8. **Input.js**
   - Processes keyboard and touch input
   - Creates virtual keyboard for mobile
   - Handles input validation and feedback

9. **GameLogic.js**
   - Controls game flow and mechanics
   - Manages game initialization and loading
   - Handles timing and scoring

### Benefits of Modular Architecture

- **Maintainability**: Each module has a clear responsibility, making the code easier to understand and modify
- **Testability**: Modules can be tested independently
- **Extensibility**: New features can be added to individual modules without affecting others
- **Collaboration**: Multiple developers can work on different modules simultaneously
- **Organization**: Clear separation of concerns makes the codebase more navigable

### Modifying the Code

When making changes to the game:

1. Identify which module is responsible for the feature you want to modify
2. Make changes to just that module rather than the entire codebase
3. Test your changes in isolation before integrating
4. Update exports/imports if you've added new functionality that needs to be accessible from other modules

## Deploying to GitHub Pages

Follow these steps to deploy the game on GitHub Pages:

1. **Create a GitHub repository**:
   - Sign in to your GitHub account
   - Click the "+" icon in the top right and select "New repository"
   - Name your repository (e.g., "anticipation-game")
   - Make it public
   - Click "Create repository"

2. **Upload your project files**:
   - Clone the repository to your local machine:
     ```
     git clone https://github.com/your-username/your-repo-name.git
     ```
   - Copy all project files into the cloned repository folder
   - Commit and push the files:
     ```
     git add .
     git commit -m "Initial commit"
     git push
     ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Click on "Settings"
   - Scroll down to the "GitHub Pages" section
   - Under "Source", select "main" branch and root folder (/)
   - Click "Save"

4. **Access your game**:
   - After a few minutes, your game will be available at:
     `https://your-username.github.io/your-repo-name/`
   - The builder will be at:
     `https://your-username.github.io/your-repo-name/anticipation-builder.html`

## Testing on GitHub Pages

- GitHub Pages uses a live web server, so JSON loading will work properly
- Make sure your links are relative paths (not absolute)
- If you make changes, push them to GitHub and wait a few minutes for the site to update

## Game Features

- Four categories to play (Travel, Food, Man-made, Leisure)
- Two difficulty levels (Easy shows dots and word spaces, Hard shows only drawing lines)
- Timer system with countdown animation
- Sharing capability for completed puzzles
- Responsive design for mobile and desktop
- JSON-based drawing data loading
- Letter-by-letter validation with immediate feedback
- Direct typing into character spaces (no dialog popup)
- Virtual keyboard support for mobile devices
- Consistent drawing scaling between builder and game

### Enhanced Game Features

- **Improved Visual Feedback**:
  - Satisfying animations for correct letter entry
  - Confetti celebration animation on successful completion
  - Enhanced visual effects for drawing lines (shadows and depth)
  - Pulsing animations for interactive elements
  - More informative wrong answer feedback

- **Sound Effects**:
  - Audio feedback for correct/incorrect letter entries
  - Completion sound for successful puzzles
  - Subtle UI interaction sounds
  - Audio toggle in settings

- **Hint System**:
  - Optional hint button that reveals the next letter
  - Limited hints to encourage skillful play
  - Visual highlighting for hint letters

- **Enhanced Mobile Experience**:
  - Improved virtual keyboard with better styling and layout
  - Smooth animations for keyboard appearance/disappearance
  - Better touch handling for mobile devices
  - Support for swipe gestures and multi-touch

- **Improved Game Logic**:
  - Smoother drawing animations with precise timing
  - Enhanced word validation with better space handling
  - Fixed canvas rendering for high-DPI displays
  - More reliable timer and scoring system

### Game Mechanics

- **Drawing Animation**: Watch as the drawing appears line by line
- **Guessing**: Type letters directly into the character spaces
- **Validation**: Each letter is checked immediately as you type
  - Correct letters appear in the spaces with a satisfying animation
  - Incorrect letters trigger visual feedback and reset the guess
- **Timing**: Complete each puzzle as quickly as possible for a better score
- **Hints**: Use limited hints to get unstuck on difficult puzzles
- **Celebration**: Enjoy a confetti animation upon successful completion

## Builder Features

- Sketch mode for planning drawings
- Record mode for creating the final animation sequence
- Preview mode to verify how drawings will look to players
- Export functionality to create JSON files
- Grid system with edge restrictions
- Touch-friendly interface for mobile devices
- Mouse controls for desktop users with keyboard shortcuts

### Building Process

1. Use Sketch mode to create the basic structure
2. Use Record mode to define the animation sequence
3. Preview your animation to see how it will look to players
4. Export your drawing as a JSON file that can be loaded by the game

## Recent Improvements

- **Modular Code Architecture**: Refactored into separate modules for better maintainability
- **Enhanced UI Elements**: Redesigned word spaces with 3D effects and better visual feedback
- **Audio Feedback System**: Added sound effects with toggle control in settings
- **Celebration Animations**: Added confetti animation for successful puzzle completion
- **Performance Improvements**: Optimized canvas rendering for smoother animations on all devices
- **Enhanced Mobile Support**: Redesigned virtual keyboard with better UX and touch handling
- **Hint System**: Added optional hints with visual highlighting for challenging puzzles
- **Fixed Canvas Rendering**: Drawings now display correctly without requiring window resizing
- **Improved Scaling**: Drawings maintain exact proportions between builder and game views

## Directory Structure for GitHub Pages

Ensure your GitHub repository maintains this structure:

```
your-repo-name/
├── index.html
├── anticipation-builder.html
├── css/
│   ├── common.css
│   ├── game.css
│   └── builder.css
├── js/
│   ├── common.js
│   ├── game-data.js
│   ├── menu.js
│   ├── builder.js
│   ├── touch-interface.js
│   ├── mouse-interface.js
│   ├── modules/
│   │   ├── state.js
│   │   ├── renderer.js
│   │   ├── animation.js
│   │   ├── audio.js
│   │   ├── ui.js
│   │   ├── wordHandler.js
│   │   ├── input.js
│   │   └── gameLogic.js
│   └── game.js
├── items/
│   └── *.json
├── sounds/
│   ├── correct.mp3
│   ├── incorrect.mp3
│   ├── completion.mp3
│   └── tick.mp3
└── README.md
```

You can update your game by pushing new versions to the same repository.

## Adding Sound Files

To enable the sound effects, add the following audio files to a `sounds` directory:

1. `correct.mp3` - A short, pleasant sound for correct letter entries
2. `incorrect.mp3` - A negative feedback sound for incorrect guesses
3. `completion.mp3` - A celebratory sound for completing a puzzle
4. `tick.mp3` - A subtle click sound for UI interactions

You can find suitable royalty-free sounds on websites like [Freesound](https://freesound.org/) or [Mixkit](https://mixkit.co/free-sound-effects/).

## Browser Compatibility Notes

This game uses ES modules, which are supported in all modern browsers. However, older browsers might not support this feature. The game has been tested in:

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS 13+)
- Chrome for Android (latest)
