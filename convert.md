# Anticipation Daily - React Conversion Guide

This document provides a comprehensive overview of the current Anticipation Daily web application and guidance for converting it to a React-based architecture.

## Current Application Overview

Anticipation Daily is a web-based puzzle game inspired by Nintendo's classic "Anticipation" game, with a daily puzzle mechanic similar to Wordle. It features animated line drawings that players must guess while the drawing is being created.

### Main Components

1. **Main Game** (`index.html`)
   - A daily puzzle game with four color-coded categories
   - Features animated drawings with guessing mechanics
   - Tracks completion and scores

2. **Builder Tool** (`builder.html`)
   - Tool for creating custom puzzles
   - Allows recording drawing animations
   - Exports and shares custom drawings

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

## Current Architecture

### State Management

The application uses a modular architecture with these key state components:

1. **GameState** (`state.js`)
   - Central state object with game configuration and status
   - Tracks current game, animation state, timers, user input
   - Manages audio settings and visual effects
   - Uses localStorage for persistence

2. **MenuState** (`menu.js`)
   - Tracks completion status of puzzles
   - Manages UI state for the main menu
   - Handles category data loading

### Module Structure

1. **State Module** (`state.js`)
   - Configuration object with tunable parameters
   - GameState object with game status
   - State initialization and persistence

2. **Renderer Module** (`renderer.js`)
   - Canvas drawing operations
   - High-DPI display support
   - Line and dot rendering
   - Animation frame rendering

3. **Animation Module** (`animation.js`)
   - Drawing animation control
   - Line-by-line and point-to-point animation
   - Visual effects (confetti, pulses)
   - Animation timing management

4. **Audio Module** (`audio.js`)
   - Sound and music playback
   - Volume control
   - Audio state persistence
   - Category-specific tracks

5. **UI Module** (`ui.js`)
   - User interface elements
   - Screen transitions
   - Timer displays
   - Feedback messages

6. **WordHandler Module** (`wordHandler.js`)
   - Word display and spaces
   - Letter validation
   - Correct letter tracking
   - Word completion handling

7. **Input Module** (`input.js`)
   - Keyboard and touch input
   - Virtual keyboard for mobile
   - Input validation
   - Event handling

8. **GameLogic Module** (`gameLogic.js`)
   - Game flow control
   - Category data loading
   - Game initialization
   - Scoring system

9. **Menu Module** (`menu.js`)
   - Main menu functionality
   - Category loading
   - Settings management
   - Results sharing

### Data Structure

#### Drawing Data Format
```json
{
  "name": "EXAMPLE",
  "categoryName": "Objects",
  "dots": [
    {"x": 100, "y": 200},
    {"x": 300, "y": 200},
    {"x": 400, "y": 150}
  ],
  "sequence": [
    {"from": 0, "to": 1},
    {"from": 1, "to": 2},
    {"from": 2, "to": 0}
  ]
}
```

#### Game State Structure
```javascript
{
  // Game configuration
  CONFIG: {
    PIXELS_PER_SECOND: 300,
    MINIMUM_LINE_TIME: 100,
    // ...other settings
  },
  
  // Game settings
  difficulty: 'easy',
  audioEnabled: true,
  musicVolume: 0.4,
  sfxVolume: 0.5,
  
  // Current game
  currentColor: null,
  currentCategory: null,
  drawingData: null,
  
  // Animation state
  drawingProgress: 0,
  lastFrameTime: 0,
  animationId: null,
  
  // Game state
  guessMode: false,
  gameStarted: false,
  currentInput: '',
  correctLetters: [],
  guessAttempts: 0,
  
  // Timer state
  elapsedTime: 0,
  timerActive: false,
  
  // Other properties...
}
```

## Planned New Features

These features should be implemented in the React version:

1. **Daily Content Rotation**
   - New puzzles at midnight Pacific Time
   - Server-side or client-side refresh mechanism
   - Automated category updates
   - Random puzzle selection from pool

2. **Dynamic Audio System**
   - Random music selection from a pool
   - Preloading and caching strategies
   - Extended music library
   - Adaptive audio based on gameplay

3. **User Session and Progress Tracking**
   - Cookie-based user identification
   - Progress persistence across sessions
   - Statistics and gameplay history
   - Achievement tracking
   - User preferences storage

4. **Social Features**
   - Generate sharable images with scores
   - Social media integration
   - Leaderboards
   - Friend challenges
   - Daily score comparisons

5. **Custom Puzzle Creation and Sharing**
   - Generate unique links for custom puzzles
   - Preview mechanisms for shared puzzles
   - Public puzzle gallery
   - Rating system for user-created content
   - Featured puzzle showcase

6. **Drawing Tool Enhancements**
   - Improved drawing interface
   - Additional drawing tools
   - Template system
   - Collaborative drawing features
   - Drawing tutorials

7. **User Submissions System**
   - Submit puzzles for approval
   - Moderation system for submissions
   - Community voting on submissions
   - Creator profiles and statistics
   - Featured creator program

8. **Progressive Web App Features**
   - Offline play capability
   - Push notifications for daily puzzles
   - Home screen installation
   - Background updates
   - Cross-device synchronization

## React Conversion Strategy

### Component Structure

#### App Component Structure
```
App
├── Routes
│   ├── HomePage
│   ├── GamePage
│   ├── BuilderPage
│   └── SharedPuzzlePage
├── Contexts
│   ├── GameContext
│   └── AudioContext
└── Hooks
    ├── useCanvas
    ├── useAnimation
    ├── useAudio
    └── useLocalStorage
```

#### Key Components

1. **HomePage**
   - ColorGrid
     - ColorSquare (x4)
   - ControlPanel
     - ToggleSwitch (Difficulty)
     - ToggleSwitch (Audio)
   - ShareButton
   - BuilderLink

2. **GamePage**
   - GameHeader
     - CategoryDisplay
     - TimerDisplay
   - GameCanvas
   - GameControls
     - BeginButton
     - GuessInput
     - WordSpaces
   - BackButton

3. **BuilderPage**
   - ModeControls
   - BuilderCanvas
   - FormControls
   - ExportModal
   - PreviewModal

4. **SharedComponents**
   - OrientationWarning
   - Modal
   - Button
   - Toggle
   - Canvas

### State Management

#### Context Structure

1. **GameContext**
```javascript
const GameProvider = ({ children }) => {
  // Core game state
  const [gameState, dispatch] = useReducer(gameReducer, initialGameState);
  
  // Game actions
  const startGame = (color, category) => {
    // Implementation
  };
  
  const makeGuess = (letter) => {
    // Implementation
  };
  
  // Other actions...
  
  return (
    <GameContext.Provider value={{ gameState, startGame, makeGuess, ... }}>
      {children}
    </GameContext.Provider>
  );
};
```

2. **AudioContext**
```javascript
const AudioProvider = ({ children }) => {
  // Audio state
  const [audioState, setAudioState] = useState({
    enabled: true,
    musicVolume: 0.4,
    sfxVolume: 0.5,
    currentTrack: null
  });
  
  // Audio refs
  const musicRef = useRef(null);
  const sfxRefs = useRef({});
  
  // Audio methods
  const playMusic = (track) => {
    // Implementation
  };
  
  const playSound = (sound) => {
    // Implementation
  };
  
  // Other methods...
  
  return (
    <AudioContext.Provider value={{ audioState, playMusic, playSound, ... }}>
      {children}
    </AudioContext.Provider>
  );
};
```

### Canvas Implementation

The Canvas component is central to the game experience and requires careful implementation:

```jsx
const GameCanvas = () => {
  const canvasRef = useRef(null);
  const { gameState } = useContext(GameContext);
  const { drawingData, drawingProgress, difficulty } = gameState;
  
  // Canvas animation hook
  const { startAnimation, stopAnimation } = useAnimation(canvasRef, drawingData);
  
  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', {
      alpha: false,
      desynchronized: true
    });
    
    // Setup high-DPI canvas
    const setupCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      ctx.scale(dpr, dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    };
    
    setupCanvas();
    window.addEventListener('resize', setupCanvas);
    
    return () => {
      window.removeEventListener('resize', setupCanvas);
      stopAnimation();
    };
  }, []);
  
  // Render based on progress
  useEffect(() => {
    if (!drawingData) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw dots in easy mode
    if (difficulty === 'easy') {
      drawDots(ctx, drawingData.dots);
    }
    
    // Draw lines based on progress
    drawLines(ctx, drawingData, drawingProgress);
  }, [drawingData, drawingProgress, difficulty]);
  
  return <canvas ref={canvasRef} className="game-canvas" />;
};
```

### Animation Hook Implementation

A crucial part of the game is the animation system. Here's how to create a React hook for this:

```jsx
const useAnimation = (canvasRef, drawingData) => {
  const animationIdRef = useRef(null);
  const lastTimeRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const { difficulty, config } = useContext(GameContext);
  
  const startAnimation = useCallback(() => {
    if (!drawingData || !canvasRef.current) return;
    
    const sequence = drawingData.sequence;
    const totalLines = sequence.length;
    let currentLine = 0;
    let lineProgress = 0;
    
    // Calculate animation speed based on difficulty
    const pixelsPerSecond = difficulty === 'hard' 
      ? config.PIXELS_PER_SECOND * 1.3 
      : config.PIXELS_PER_SECOND;
    
    const animate = (timestamp) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
        animationIdRef.current = requestAnimationFrame(animate);
        return;
      }
      
      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;
      
      // Update line progress based on time
      // Implementation details here...
      
      // Update overall progress
      setProgress(currentLine / totalLines);
      
      // Continue animation if not complete
      if (currentLine < totalLines) {
        animationIdRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationIdRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [drawingData, difficulty, config]);
  
  const stopAnimation = useCallback(() => {
    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
      animationIdRef.current = null;
    }
  }, []);
  
  return { progress, startAnimation, stopAnimation };
};
```

### Daily Refresh Implementation

For handling the daily puzzle refresh:

```jsx
const useDailyPuzzles = () => {
  const [puzzles, setPuzzles] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPuzzles = async () => {
      try {
        setLoading(true);
        
        // Check if we already have today's puzzles
        const today = new Date().toISOString().split('T')[0];
        const storedDate = localStorage.getItem('puzzleDate');
        
        if (storedDate === today) {
          // Use cached puzzles
          const storedPuzzles = JSON.parse(localStorage.getItem('dailyPuzzles'));
          if (storedPuzzles) {
            setPuzzles(storedPuzzles);
            setLoading(false);
            return;
          }
        }
        
        // Fetch new puzzles
        const colors = ['yellow', 'green', 'blue', 'red'];
        const newPuzzles = {};
        
        for (const color of colors) {
          const response = await fetch(`items/${color}.json`);
          if (!response.ok) throw new Error(`Failed to load ${color} puzzle`);
          newPuzzles[color] = await response.json();
        }
        
        // Store new puzzles
        localStorage.setItem('puzzleDate', today);
        localStorage.setItem('dailyPuzzles', JSON.stringify(newPuzzles));
        
        setPuzzles(newPuzzles);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPuzzles();
  }, []);
  
  return { puzzles, loading, error };
};
```

### Example Game Page Implementation

Here's how the GamePage component might look:

```jsx
const GamePage = () => {
  const { gameState, startGame, makeGuess, exitGame } = useContext(GameContext);
  const { audioState, playMusic, playSound } = useContext(AudioContext);
  const { currentColor, currentCategory, guessMode, gameStarted } = gameState;
  
  // Get URL parameters if any
  const { color, category } = useParams();
  
  // Initialize game if color and category are provided
  useEffect(() => {
    if (color && category && !gameStarted) {
      startGame(color, category);
    }
  }, [color, category, gameStarted, startGame]);
  
  const handleBeginClick = () => {
    if (!gameStarted) {
      // Start the game
      startDrawing();
      playSound('tick');
    } else if (!guessMode) {
      // Enter guess mode
      enterGuessMode();
      playSound('guess');
    }
  };
  
  const handleBackClick = () => {
    exitGame();
    playSound('tick');
  };
  
  return (
    <div className="game-page">
      <GameHeader 
        category={currentCategory} 
        isVisible={gameStarted} 
      />
      
      <div className="game-content">
        <GameCanvas />
        
        <GameControls
          guessMode={guessMode}
          gameStarted={gameStarted}
          onBeginClick={handleBeginClick}
          onGuessSubmit={makeGuess}
        />
        
        <WordSpaces />
        
        <BackButton onClick={handleBackClick} />
      </div>
    </div>
  );
};
```

## Implementation Roadmap

### Phase 1: Project Setup (1-2 days)
1. Create React project with Vite or Create React App
2. Set up routing with React Router
3. Implement basic component structure
4. Create context providers for state

### Phase 2: Core Game Components (3-5 days)
1. Create homepage with color grid
2. Implement canvas component
3. Build game screen with controls
4. Add word guessing mechanics

### Phase 3: Animation and Rendering (3-4 days)
1. Implement canvas drawing system
2. Create animation hooks
3. Add drawing data loading
4. Build word space rendering

### Phase 4: Game Logic and State (2-3 days)
1. Implement game flow
2. Add scoring system
3. Create difficulty modes
4. Build progress tracking

### Phase 5: Audio System (1-2 days)
1. Create audio context
2. Implement music playback
3. Add sound effects
4. Build volume controls

### Phase 6: Builder Tool (4-5 days)
1. Create builder canvas
2. Implement grid system
3. Add recording functionality
4. Build export and sharing

### Phase 7: New Features (3-5 days)
1. Implement daily refresh
2. Add user tracking
3. Create social sharing
4. Build submission system

## Technical Considerations

### Performance Optimization
- Use React.memo for presentational components
- Implement useCallback for event handlers
- Optimize canvas operations
- Use Web Audio API for better audio performance

### Mobile Optimization
- Implement touch controls
- Support device orientation changes
- Optimize virtual keyboard interactions
- Ensure responsive design

### Accessibility
- Add keyboard navigation
- Include ARIA attributes
- Provide alternative text descriptions
- Ensure color contrast standards

### Testing Strategy
- Component tests with React Testing Library
- Canvas rendering tests
- Game logic unit tests
- End-to-end tests with Cypress

## File Organization

```
src/
├── assets/
│   ├── sounds/
│   └── images/
├── components/
│   ├── game/
│   │   ├── GameCanvas.jsx
│   │   ├── GameControls.jsx
│   │   ├── GuessInput.jsx
│   │   ├── TimerDisplay.jsx
│   │   └── WordSpaces.jsx
│   ├── menu/
│   │   ├── ColorGrid.jsx
│   │   ├── ColorSquare.jsx
│   │   ├── ControlPanel.jsx
│   │   └── ShareButton.jsx
│   ├── builder/
│   │   ├── BuilderCanvas.jsx
│   │   ├── ModeControls.jsx
│   │   ├── ExportModal.jsx
│   │   └── PreviewModal.jsx
│   └── common/
│       ├── Button.jsx
│       ├── Toggle.jsx
│       ├── Modal.jsx
│       └── OrientationWarning.jsx
├── contexts/
│   ├── GameContext.jsx
│   └── AudioContext.jsx
├── hooks/
│   ├── useCanvas.js
│   ├── useAnimation.js
│   ├── useAudio.js
│   ├── useGameState.js
│   ├── useTimer.js
│   └── useLocalStorage.js
├── pages/
│   ├── HomePage.jsx
│   ├── GamePage.jsx
│   ├── BuilderPage.jsx
│   └── SharedPuzzlePage.jsx
├── utils/
│   ├── canvas.js
│   ├── animation.js
│   ├── wordHandling.js
│   ├── scoring.js
│   └── sharing.js
├── services/
│   ├── puzzleService.js
│   ├── userService.js
│   └── shareService.js
├── App.jsx
├── main.jsx
└── index.css
```

## Getting Started

To begin the conversion process:

1. **Set up a new React project**
   ```bash
   npm create vite@latest anticipation-daily-react -- --template react
   cd anticipation-daily-react
   npm install
   ```

2. **Install necessary dependencies**
   ```bash
   npm install react-router-dom
   npm install styled-components # or your preferred styling solution
   ```

3. **Copy assets**
   - Copy the sounds directory
   - Copy the items directory with JSON files

4. **Create the basic file structure**
   - Set up the component directories
   - Create context files
   - Set up the routing system

5. **Begin with core components**
   - Start with the HomePage and simple UI components
   - Implement the GameCanvas component
   - Build the state management system

By following this methodical approach, you can convert your vanilla JS application to a well-structured React application that's ready for the new features you plan to implement.
