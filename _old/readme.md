# Anticipation Game Project

This project recreates the classic Nintendo game "Anticipation" as a modern web application, consisting of two main components:

1. **Anticipation Game** - A daily puzzle game similar to Wordle
2. **Anticipation Builder** - A tool for creating custom puzzles

## Project Structure

This project includes two HTML files:

1. `anticipation-game.html` - The main game players interact with
2. `anticipation-builder.html` - The tool for creating custom puzzles

Both files are standalone web applications that run in any modern browser without requiring a server.

## Anticipation Game (`anticipation-game.html`)

### Overview

The Anticipation Game is a drawing-guessing game where players watch as a picture is drawn line by line and try to guess what it represents before time runs out.

### Features

- Four color categories (Household/Yellow, Food/Green, Animals/Blue, Misc/Red)
- Two difficulty levels (Easy/Hard)
- Daily puzzles that can be shared with friends
- Mobile and desktop compatibility

### How to Play

1. Select a color category to begin
2. Choose difficulty level (Easy shows dots and word spaces, Hard does not)
3. Watch as the drawing appears line by line
4. Guess what's being drawn before time runs out
5. Complete all four categories to share your results

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
   - Only shows dots and lines created during recording
   - Animates the sequence with 0.5-second intervals
   - Exactly matches what players will see in the game

### Technical Implementation Notes

- **Grid System**: All drawings use a 15×15 grid with points at intersections
- **Point Creation**: Points can only be placed at grid intersections
- **Line Creation**: Each line connects exactly two points
- **Recording System**: 
  - Start recording with the Record button
  - Stop recording with the Stop button
  - Record button always clears previous recording
- **Data Exporting**: 
  - Only exports dots that are connected by lines in the recording
  - Sequence determines the order in which lines are drawn

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

## Deployment

Both applications can be deployed using:
- GitHub Pages (free)
- Netlify Drop (free)
- Vercel (free tier)
- Any static web hosting

## Known Issues

- When clicking Record, previous recordings are always cleared
- Record button toggle between Record/Stop needs careful handling
- Certain browser events can interfere with the recording state

## Workflow Recommendations

1. Use Sketch mode to plan your drawing
2. Use Edit mode to remove unwanted elements
3. Use Record mode to create the final animation sequence
4. Use Preview mode to verify how it will look to players
5. Export the data for use in the game

Remember that the Sketch and Record systems are completely separate by design. The final game will only show what was drawn in Recording mode.
