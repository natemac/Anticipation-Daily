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
  - `game.js` - Game-specific logic and interactions
  - `builder.js` - Builder-specific logic and interactions
  - `touch-interface.js` - Touch input handling for the builder
  - `mouse-interface.js` - Mouse input handling for the builder
- `items/` - Directory containing JSON files with custom drawing data
- `README.md` - This documentation file

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

### Game Mechanics

- **Drawing Animation**: Watch as the drawing appears line by line
- **Guessing**: Type letters directly into the character spaces
- **Validation**: Each letter is checked immediately as you type
  - Correct letters appear in the spaces
  - Incorrect letters trigger a red flash and reset the guess mode
- **Timing**: Complete each puzzle as quickly as possible for a better score

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

- **Fixed Canvas Rendering**: Drawings now display correctly without requiring window resizing or device rotation
- **Improved Scaling**: Drawings maintain exact proportions between builder and game views
- **Enhanced User Interface**: Character spaces now appear in a clean white box between the drawing and guess button
- **Better Feedback**: Visual cues for correct/incorrect guesses
- **Mobile Optimizations**: Virtual keyboard and improved touch handling

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
│   ├── game.js
│   ├── builder.js
│   ├── touch-interface.js
│   └── mouse-interface.js
├── items/
│   └── *.json
└── README.md
```

You can update your game by pushing new versions to the same repository.
