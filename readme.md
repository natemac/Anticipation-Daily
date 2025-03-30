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

## Builder Features

- Sketch mode for planning drawings
- Record mode for creating the final animation sequence
- Preview mode to verify how drawings will look to players
- Export functionality to create JSON files
- Grid system with edge restrictions

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
│   └── builder.js
├── items/
│   └── item1.json
└── README.md
```

You can later update your game by pushing new versions to the same repository.
