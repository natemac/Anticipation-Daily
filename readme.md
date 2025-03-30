# Anticipation Game Project

This project recreates the classic Nintendo game "Anticipation" as a modern web application, consisting of two main components:

1. **Anticipation Game** - A daily puzzle game similar to Wordle
2. **Anticipation Builder** - A tool for creating custom puzzles

## Project Structure

This project includes three main files:

1. `index.html` - The main game players interact with
2. `anticipation-builder.html` - The tool for creating custom puzzles
3. `items/` - Directory containing the custom drawing JSON files

## Running the Project Locally

**IMPORTANT**: Due to browser security restrictions (CORS), you need to run this project through a local web server instead of opening the files directly.

### Option 1: Using Python

If you have Python installed:

```bash
cd "path/to/Anticipation Daily Game"
python -m http.server
```

Then visit http://localhost:8000 in your browser

### Option 2: Using Node.js

If you have Node.js installed:

```bash
cd "path/to/Anticipation Daily Game"
npx http-server
```

Then visit http://localhost:8080 in your browser

### Option 3: Using VS Code

Install the "Live Server" extension in VS Code, right-click your HTML file, and select "Open with Live Server"

### Option 4: Using a Static File Server

You can also use applications like:
- XAMPP (Windows/Mac/Linux)
- MAMP (Mac/Windows)
- Web Server for Chrome (browser extension)

## Anticipation Game (`index.html`)

### Overview

The Anticipation Game is a drawing-guessing game where players watch as a picture is drawn line by line and try to guess what it represents before time runs out.

### Features

- Four color categories (Household/Yellow, Food/Green, Animals/Blue, Misc/Red)
- Two difficulty levels (Easy/Hard)
- Daily puzzles that can be shared with friends
- Mobile and desktop compatibility
- **NEW**: Support for loading custom drawings from JSON files

### How to Play

1. Select a color category to begin
2. Choose difficulty level (Easy shows dots and word spaces, Hard does not)
3. Watch as the drawing appears line by line
4. Guess what's being drawn before time runs out
5. Complete all four categories to share your results

### JSON Loading

The game now supports loading custom drawings from JSON files:

1. Place your `.json` files in the `items` directory
2. Make sure the file is named `item1.json`
3. The game will automatically load this file when you click any category
4. If the file is found, it will use that data instead of the built-in drawings

## Anticipation Builder (`anticipation-builder.html`)

### Overview

The Anticipation Builder allows creators to make custom puzzles for the game with an intuitive grid-based drawing system.

### IMPORTANT: Completely Separate Drawing Systems

The builder intentionally uses two completely separate drawing systems:

1. **Sketch System**: For planning your drawing (not included in the final game)
   - Has its own dots, lines, and selection
   - Purely for reference/planning
   - Appears dimmed during recording

2. **Recording System**: The actual game content that players see
   - Completely separate dots, lines, and sequence
   - Only this data is exported to the game
   - Green lines indicate what has been recorded

There is NO data sharing between these systems - they function as separate layers.

### Four Distinct Modes

1. **Sketch Mode**: Create a reference drawing
   - Draw points and connect them with lines
   - This is just a visual reference that won't be exported

2. **Edit Mode**: Remove unwanted elements from the sketch
   - Click on dots to delete them and connected lines
   - Only affects the sketch, not recording

3. **Record Mode**: Create the actual drawing sequence
   - Reference sketch visible but dimmed in background
   - Everything you draw here is stored separately
   - Green lines show what's been recorded
   - Click "Stop" to stop recording

4. **Preview Mode**: See how your drawing will animate
   - Shows all dots from the beginning
   - Smoothly animates lines being drawn one by one
   - Exactly matches what players will see in the game

### Technical Implementation Notes

- **Grid System**: 16×16 grid with no points on outer edges
- **Edge Restriction**: Drawing not allowed on grid edges (visually indicated)
- **Point Creation**: Points can only be placed at grid intersections
- **Line Creation**: Each line connects exactly two points
- **Recording System**: 
  - Start recording with the Record button
  - Stop recording with the Stop button
  - Record button always clears previous recording data
- **Data Exporting**: 
  - Only exports dots that are connected by lines in the recording
  - Sequence determines the order in which lines are drawn
  - Exports as JSON file named after your drawing

### Recent Updates

1. **Fixed Recording Toggle**:
   - Fixed bug where stopping a recording would immediately start a new one
   - Recording now properly stops and starts with clear visual indicators

2. **Enhanced Preview Animation**:
   - All dots now visible from the beginning of preview
   - Smooth line animation between points
   - More accurate representation of in-game experience

3. **Grid Improvements**:
   - Added additional grid row/column
   - Implemented edge restriction (can't draw on outer edges)
   - Simplified grid appearance with consistent styling

4. **Streamlined Interface**:
   - Removed unnecessary UI elements
   - Simplified text fields and labels

5. **Direct File Export**:
   - Export button now creates downloadable JSON file
   - File is named based on the drawing name
   - Format ready to be loaded directly into the game

### Data Format

The export format for puzzles is:

```json
{
  "name": "ITEM_NAME",
  "category": "yellow|green|blue|red",
  "dots": [
    {"x": 100, "y": 150},
    {"x": 200, "y": 250},
    ...
  ],
  "sequence": [
    {"from": 0, "to": 1},
    {"from": 1, "to": 2},
    ...
  ]
}
```

## Basic Workflow

1. Create your drawing in the Builder
2. Export it as a JSON file
3. Place the JSON file in the `items` directory
4. Rename it to `item1.json` (temporary - future versions will support multiple files)
5. Run the project using a local web server
6. Open the game and test your drawing

## Future Enhancements

- Scheduled daily puzzle rotation at 12:00am Pacific time
- Support for multiple JSON files for different categories
- Improved file management and selection
- Server-side integration for shared puzzles

## Deployment

Both applications can be deployed using:
- GitHub Pages (free)
- Netlify Drop (free)
- Vercel (free tier)
- Any static web hosting

## Known Issues

- When starting a new recording, previous recording is cleared
- JSON loading requires file to be named `item1.json` currently
- Changing difficulty during gameplay may cause inconsistencies

## Workflow Recommendations

1. Use Sketch mode to plan your drawing
2. Use Edit mode to remove unwanted elements
3. Use Record mode to create the final animation sequence
4. Use Preview mode to verify how it will look to players
5. Export the data for use in the game

Remember that the Sketch and Record systems are completely separate by design. The final game will only show what was drawn in Recording mode.
