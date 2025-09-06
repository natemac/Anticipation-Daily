# Anticipation Game Mode React Rebuild Guide

## Table of Contents
1. [Game Flow Overview](#game-flow-overview)
2. [Component Architecture](#component-architecture)
3. [State Management](#state-management) 
4. [Category Selection Flow](#category-selection-flow)
5. [Game Initialization](#game-initialization)
6. [Drawing System](#drawing-system)
7. [Difficulty Modes (Easy vs Hard)](#difficulty-modes)
8. [Letter Input & Word Handling](#letter-input--word-handling)
9. [Virtual Keyboard](#virtual-keyboard)
10. [Timer System](#timer-system)
11. [Hint System](#hint-system)
12. [Audio System](#audio-system)
13. [Victory & Completion](#victory--completion)
14. [Trophy & Achievements](#trophy--achievements)
15. [Mobile Optimizations](#mobile-optimizations)

## Game Flow Overview

The Anticipation game follows this general flow:

1. User selects a category from the main menu (yellow, green, blue, or red)
2. Game initializes and loads the appropriate JSON drawing data
3. User clicks "Begin" to start the drawing animation
4. Drawing appears line by line based on the sequence in the JSON
5. User can click "Guess" at any time to enter guess mode
6. In guess mode, user types letters to guess the word
7. Incorrect guesses return to drawing mode
8. Correct guess triggers victory celebration
9. Completion stamp with stats appears on the category
10. User returns to main menu to play other categories

This implementation will use React's component-based architecture and hooks for state management to recreate this flow while maintaining the game's mechanics and visual style.

## Component Architecture

For a React rebuild, we'll structure the application with these main components:

```
App
├── MenuScreen
│   ├── CategoryGrid
│   │   ├── CategorySquare (×4: yellow, green, blue, red)
│   │   │   └── CompletionOverlay (shown when completed)
│   ├── DifficultyToggle
│   ├── AudioToggle
│   └── BuilderButton
├── GameScreen
│   ├── GameHeader (showing category & timer)
│   ├── CanvasContainer
│   │   └── DrawingCanvas (renders the drawing)
│   ├── WordSpacesContainer
│   │   └── LetterSpace (individual spaces for word letters)
│   ├── GameControls
│   │   ├── BeginButton (changes to GuessButton)
│   │   ├── HintButton (only in easy mode)
│   │   └── BackButton
│   ├── VirtualKeyboard (for touch devices)
│   └── MessageDisplay (wrong/correct notifications)
└── ConfettiOverlay (victory animation)
```

## State Management

In React, we'll use a combination of useState, useEffect, and useReducer hooks to manage the game state. Alternatively, we could use a state management library like Redux or Zustand, but for this example, we'll focus on React's built-in hooks.

Here's how we'll structure our global state:

```javascript
// Example using useReducer for main game state
const initialState = {
  // Game state
  gameStarted: false,
  guessMode: false,
  currentColor: null,
  currentCategory: null,
  drawingData: null,
  difficulty: 'easy', // 'easy' or 'hard'
  
  // Drawing state
  drawingProgress: 0,
  animationId: null,
  pendingAnimationStart: false,
  
  // Timer state
  timerActive: false,
  elapsedTime: 0,
  elapsedTimeHundredths: 0,
  
  // Guess state
  currentInput: '',
  correctLetters: [],
  guessAttempts: 0,
  guessTimeRemaining: 10, // Configurable
  guessTimerActive: false,
  
  // Hint system
  hintsUsed: 0,
  hintButtonActive: false,
  hintButtonCooldown: false,
  hintCooldownRemaining: 0,
  
  // Audio state
  audioEnabled: true,
  musicVolume: 0.4,
  sfxVolume: 0.5,
  
  // Menu state
  completedCategories: {
    yellow: { completed: false, guesses: 0, time: 0, hardMode: false, earlyCompletion: false },
    green: { completed: false, guesses: 0, time: 0, hardMode: false, earlyCompletion: false },
    blue: { completed: false, guesses: 0, time: 0, hardMode: false, earlyCompletion: false },
    red: { completed: false, guesses: 0, time: 0, hardMode: false, earlyCompletion: false }
  }
};

// Create a configuration object for tunable parameters
const CONFIG = {
  // Animation settings
  PIXELS_PER_SECOND: 300,       // Animation speed in pixels per second
  MINIMUM_LINE_TIME: 100,       // Minimum time for short lines (milliseconds)
  
  // Gameplay settings
  GUESS_TIME_LIMIT: 10,         // Seconds for guessing
  HINT_COOLDOWN_TIME: 5,        // Cooldown time between hints
  HINTS_AVAILABLE: 0,           // Number of hints (0 = unlimited)
  
  // Visual settings
  DOT_RADIUS: 5,                // Size of dots on the grid
  
  // UI settings
  WRONG_MESSAGE_DURATION: 800,  // Duration to show wrong messages
  CELEBRATION_DURATION: 1500,   // Duration of celebration before returning to menu
  
  // Audio settings
  MUSIC_VOLUME: 0.4,            // Default music volume
  SFX_VOLUME: 0.5               // Default sound effects volume
};
```

## Category Selection Flow

When the user clicks on a category from the main menu, we need to load the category data and initialize the game.

```jsx
// CategorySquare.jsx component
const CategorySquare = ({ color, category, onClick, completedData }) => {
  const isCompleted = completedData?.completed || false;
  
  return (
    <div 
      className={`color-square ${color}`} 
      onClick={isCompleted ? null : onClick}
    >
      <h3>{category}</h3>
      {isCompleted && (
        <CompletionOverlay 
          completionData={completedData} 
        />
      )}
    </div>
  );
};

// Inside MenuScreen.jsx
const handleCategoryClick = (color, category) => {
  // Start game with this category
  dispatch({ 
    type: 'START_GAME', 
    payload: { color, category } 
  });
  // Show game screen
  setCurrentScreen('game');
  
  // Asynchronously load the drawing data
  fetchCategoryData(color);
};

const fetchCategoryData = async (color) => {
  try {
    // In React, we can use fetch to get the JSON files
    const response = await fetch(`/items/${color}.json`);
    if (!response.ok) {
      throw new Error(`Could not load ${color}.json`);
    }
    
    const itemData = await response.json();
    itemData.category = color;
    
    // Update state with the loaded data
    dispatch({ 
      type: 'SET_DRAWING_DATA', 
      payload: itemData 
    });
  } catch (error) {
    // Show error message
    setErrorMessage(`Failed to load game data: ${error.message}`);
    setCurrentScreen('menu');
  }
};
```

## Game Initialization

Once we have loaded the category data, we need to initialize the game components:

```jsx
// GameScreen.jsx
useEffect(() => {
  if (drawingData) {
    // Set up the canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Resize canvas to match container
    const container = canvas.parentElement;
    canvas.width = container.offsetWidth;
    canvas.height = container.offsetHeight;
    
    // Calculate scaling based on canvas size
    calculateScaling();
    
    // Clear the canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set up word spaces for the item name
    updateWordSpaces();
    
    // Update game header
    setHeaderCategory(drawingData.categoryName);
    
    // Set background color based on category
    document.body.style.backgroundColor = `var(--${currentColor}-color)`;
  }
}, [drawingData]);
```

## Drawing System

The drawing system is a critical part of the game. It uses Canvas API to draw the animation based on the JSON data.

```jsx
// In a custom hook or DrawingCanvas component
const DrawingCanvas = ({ drawingData, drawingProgress, difficulty }) => {
  const canvasRef = useRef(null);
  const [scaling, setScaling] = useState(null);
  
  // Calculate scaling to fit the canvas
  useEffect(() => {
    if (drawingData && canvasRef.current) {
      const canvas = canvasRef.current;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      // Use 90% of the canvas area
      const canvasPercentage = 0.9;
      const size = Math.min(displayWidth, displayHeight) * canvasPercentage;
      
      // Calculate scale for 560x560 drawing area
      const scale = size / 560;
      
      const offsetX = (displayWidth - size) / 2;
      const offsetY = (displayHeight - size) / 2;
      
      setScaling({
        scale,
        offsetX,
        offsetY
      });
    }
  }, [drawingData, canvasRef]);
  
  // Draw function to render current frame
  useEffect(() => {
    if (!drawingData || !scaling || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // In easy mode, draw dots first
    if (difficulty === 'easy') {
      drawDots(ctx, drawingData.dots, scaling);
    }
    
    // Draw lines based on current progress
    drawLines(ctx, drawingData.dots, drawingData.sequence, drawingProgress, scaling);
    
  }, [drawingData, drawingProgress, scaling, difficulty]);
  
  return <canvas ref={canvasRef} id="gameCanvas" />;
};

// Draw dots function
const drawDots = (ctx, dots, scaling) => {
  const DOT_RADIUS = 5; // From CONFIG
  
  dots.forEach((dot, index) => {
    // Apply scaling
    const x = (dot.x * scaling.scale) + scaling.offsetX;
    const y = (dot.y * scaling.scale) + scaling.offsetY;
    
    // Draw dot shadow
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, DOT_RADIUS + 1, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw dot
    ctx.fillStyle = '#333';
    ctx.beginPath();
    ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    
    // Draw index number
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '8px Arial';
    ctx.fillText(index.toString(), x, y);
  });
};

// Draw lines function
const drawLines = (ctx, dots, sequence, progress, scaling) => {
  // Draw line shadows for depth
  ctx.strokeStyle = 'rgba(0,0,0,0.2)';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  for (let i = 0; i < progress; i++) {
    if (i < sequence.length) {
      const line = sequence[i];
      const from = dots[line.from];
      const to = dots[line.to];
      
      // Apply scaling with offset for shadow
      const fromX = (from.x * scaling.scale) + scaling.offsetX + 1;
      const fromY = (from.y * scaling.scale) + scaling.offsetY + 1;
      const toX = (to.x * scaling.scale) + scaling.offsetX + 1;
      const toY = (to.y * scaling.scale) + scaling.offsetY + 1;
      
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    }
  }
  
  // Draw the actual lines
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  
  for (let i = 0; i < progress; i++) {
    if (i < sequence.length) {
      const line = sequence[i];
      const from = dots[line.from];
      const to = dots[line.to];
      
      // Apply scaling
      const fromX = (from.x * scaling.scale) + scaling.offsetX;
      const fromY = (from.y * scaling.scale) + scaling.offsetY;
      const toX = (to.x * scaling.scale) + scaling.offsetX;
      const toY = (to.y * scaling.scale) + scaling.offsetY;
      
      ctx.beginPath();
      ctx.moveTo(fromX, fromY);
      ctx.lineTo(toX, toY);
      ctx.stroke();
    }
  }
};
```

## Animation System

For the animation, we'll use a custom hook that uses `requestAnimationFrame` for smooth drawing:

```jsx
// Custom hook for animation
const useDrawingAnimation = (drawingData, difficulty, config) => {
  const [drawingProgress, setDrawingProgress] = useState(0);
  const animationRef = useRef(null);
  const lastFrameTimeRef = useRef(0);
  
  // Start animation function
  const startAnimation = useCallback(() => {
    if (!drawingData) return;
    
    const totalSequenceLength = drawingData.sequence.length;
    
    // Adjust speed based on difficulty
    const timePerLine = difficulty === 'hard' 
      ? config.MINIMUM_LINE_TIME * 0.7  // Faster in hard mode
      : config.MINIMUM_LINE_TIME;       // Normal in easy mode
    
    // Animation frame handler
    const animate = (timestamp) => {
      // Initialize timing on first frame
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }
      
      // Calculate time delta with more precision
      const deltaTime = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      
      // Prevent large time jumps
      const cappedDelta = Math.min(deltaTime, 100);
      
      // Use a ref for accumulated time to persist between renders
      accumulatedTimeRef.current += cappedDelta;
      
      // Update animation based on accumulated time
      if (accumulatedTimeRef.current >= timePerLine) {
        // Draw the next line when enough time has passed
        if (drawingProgress < totalSequenceLength) {
          setDrawingProgress(prev => prev + 1);
          // Play sound for each new line drawn
          playSound('tick');
          
          accumulatedTimeRef.current -= timePerLine;
        }
      }
      
      // Continue animation if not complete
      if (drawingProgress < totalSequenceLength && !guessMode) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    // Start animation loop
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    animationRef.current = requestAnimationFrame(animate);
  }, [drawingData, drawingProgress, difficulty, config]);
  
  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);
  
  return {
    drawingProgress,
    setDrawingProgress,
    startAnimation
  };
};
```

## Difficulty Modes

The game has two difficulty modes: Easy and Hard, which affect various aspects of gameplay.

```jsx
// DifficultyToggle component
const DifficultyToggle = ({ difficulty, onChange }) => {
  return (
    <div className="difficulty-container">
      <h3 className="difficulty-title">Difficulty Mode</h3>
      <div className="slider-container">
        <span 
          className="difficulty-label" 
          id="easyLabel"
          style={{ 
            opacity: difficulty === 'easy' ? 1 : 0.5,
            fontWeight: difficulty === 'easy' ? 'bold' : 'normal'
          }}
          onClick={() => onChange('easy')}
        >
          Easy
        </span>
        <label className="toggle-switch">
          <input 
            type="checkbox" 
            checked={difficulty === 'hard'}
            onChange={e => onChange(e.target.checked ? 'hard' : 'easy')}
          />
          <span className={`slider ${difficulty === 'hard' ? 'slider-active' : ''}`}></span>
        </label>
        <span 
          className="difficulty-label" 
          id="hardLabel"
          style={{ 
            opacity: difficulty === 'hard' ? 1 : 0.5,
            fontWeight: difficulty === 'hard' ? 'bold' : 'normal'
          }}
          onClick={() => onChange('hard')}
        >
          Hard
        </span>
      </div>
    </div>
  );
};

// Effects of difficulty modes:
// 1. In easy mode, grid dots are visible; in hard mode they're hidden
// 2. In hard mode, animation is 30% faster (adjusted timePerLine)
// 3. Hint button is only available in easy mode
// 4. Completion achievements track which mode was used
// 5. In hard mode, spaces appear as regular letter boxes
```

## Letter Input & Word Handling

For letter input and word handling, we need to manage the letter spaces and process user input:

```jsx
// WordSpaces component
const WordSpaces = ({ word, currentInput, correctLetters, guessMode, difficulty }) => {
  // Use a ref for the word spaces container
  const wordSpacesDivRef = useRef(null);
  
  // Determine which letters to show based on game mode
  const lettersToShow = guessMode ? currentInput : correctLetters.join('');
  
  // Create letter spaces array
  const letterSpaces = word.split('').map((letter, index) => {
    const isSpace = letter === ' ';
    const isEntered = index < lettersToShow.length;
    const enteredLetter = isEntered ? lettersToShow[index] : '';
    const isCurrent = guessMode && index === currentInput.length;
    
    return (
      <div 
        key={index}
        className={`letter-space ${isSpace ? 'space' : ''} ${isEntered ? 'entered' : ''} ${isCurrent ? 'current' : ''}`}
        style={{
          // Different styling for spaces in hard mode
          width: isSpace && difficulty !== 'hard' ? '15px' : '30px',
          backgroundColor: isEntered ? '#e8f5e9' : '#f5f5f5',
          transform: isEntered ? 'translateY(-2px)' : 'none',
          boxShadow: isEntered ? '0 3px 5px rgba(0,0,0,0.1)' : '0 1px 3px rgba(0,0,0,0.1)',
          // Special style for current letter
          ...(isCurrent && {
            backgroundColor: '#e3f2fd',
            boxShadow: '0 0 8px rgba(33, 150, 243, 0.5)'
          })
        }}
      >
        {!isSpace && (
          <>
            {isEntered && (
              <span className="letter">{enteredLetter}</span>
            )}
            <div 
              className="underline"
              style={{
                backgroundColor: isCurrent ? '#2196F3' : '#333',
                animation: isCurrent ? 'blink 1s infinite' : 'none'
              }}
            />
          </>
        )}
        
        {/* In hard mode, spaces look like regular letter boxes */}
        {isSpace && difficulty === 'hard' && (
          <div className="underline" />
        )}
      </div>
    );
  });
  
  return (
    <div 
      id="wordSpacesDiv" 
      ref={wordSpacesDivRef}
      className={`word-spaces-container ${guessMode ? 'guess-mode' : ''}`}
      onClick={guessMode ? handleWordSpacesClick : null}
    >
      <div className="letter-container">
        {letterSpaces}
      </div>
    </div>
  );
};

// Process letter input
const processLetter = (letter) => {
  if (!guessMode) return;
  
  const currentWord = drawingData.name;
  const letterIndex = currentInput.length;
  
  // Only process if we still have space for more letters
  if (letterIndex < currentWord.length) {
    const newLetter = letter.toUpperCase();
    
    // Skip if the current position is a space
    if (currentWord[letterIndex] === ' ') {
      setCurrentInput(prev => prev + ' ');
      
      // Play tick sound
      playSound('tick');
      
      // Continue with next letter
      processLetter(letter);
      return;
    }
    
    const correctLetter = currentWord[letterIndex].toUpperCase();
    
    // Check if this letter is correct at this position
    if (newLetter === correctLetter) {
      // Add the correct letter
      setCurrentInput(prev => prev + newLetter);
      
      // Play correct input sound
      playSound('correct');
      
      // Add satisfying visual feedback
      pulseElement(getLetterElement(letterIndex), 'green');
      
      // If we've completed the word successfully
      if (currentInput.length + 1 === currentWord.length) {
        handleWordCompletion();
      }
    } else {
      // Wrong letter - show feedback and exit guess mode
      setGuessAttempts(prev => prev + 1);
      
      // Store correct letters before showing error
      storeCorrectLetters();
      
      // Play incorrect sound
      playSound('incorrect');
      
      // Show wrong message
      setWrongMessage(`WRONG! It's not "${currentInput + newLetter}..."`);
      
      // Reset input and exit guess mode
      setTimeout(() => {
        setCurrentInput('');
        setGuessMode(false);
        
        // Restore correct letters after exiting guess mode
        setTimeout(() => {
          restoreCorrectLetters();
        }, 50);
      }, 800);
    }
  }
};
```

## Virtual Keyboard

For mobile devices, we'll implement a virtual keyboard component:

```jsx
// VirtualKeyboard component for touch devices
const VirtualKeyboard = ({ onKeyPress, guessMode, visible, currentColor }) => {
  // Only render when in guess mode and visible
  if (!guessMode || !visible) return null;
  
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
  ];
  
  // Handle key press
  const handleKeyPress = (key) => {
    if (key === '⌫') {
      // Backspace key
      onKeyPress('Backspace');
    } else {
      // Letter key
      onKeyPress(key);
    }
  };
  
  // Get color-specific class based on current category
  const colorClass = `${currentColor}-category`;
  
  return (
    <div id="virtual-keyboard-container" className={colorClass}>
      <div id="virtual-keyboard">
        <div>
          {/* Handle for keyboard */}
          <div></div>
          
          {/* Keyboard rows */}
          {keyboardRows.map((row, rowIndex) => (
            <div key={`row-${rowIndex}`}>
              {row.map(key => (
                <button
                  key={key}
                  onClick={() => handleKeyPress(key)}
                  style={{
                    // Special width for backspace key
                    ...(key === '⌫' && { flex: '1.5' })
                  }}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// In GameScreen component, detect device type
useEffect(() => {
  const isMobileDevice = () => {
    return (
      ('ontouchstart' in window) ||
      (navigator.maxTouchPoints > 0) ||
      (navigator.msMaxTouchPoints > 0) ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  };
  
  setIsMobile(isMobileDevice());
}, []);
```

## Timer System

We need to implement two timer systems: the elapsed time counter and the guess timer.

```jsx
// ElapsedTimer hook
const useElapsedTimer = (timerActive) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [elapsedTimeHundredths, setElapsedTimeHundredths] = useState(0);
  
  useEffect(() => {
    let timerInterval;
    
    if (timerActive) {
      timerInterval = setInterval(() => {
        setElapsedTimeHundredths(prev => {
          const newValue = prev + 1;
          if (newValue >= 100) {
            setElapsedTime(prevTime => prevTime + 1);
            return 0;
          }
          return newValue;
        });
      }, 10); // Update every 10ms for hundredths precision
    }
    
    // Clean up
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerActive]);
  
  // Format time for display
  const formattedTime = useMemo(() => {
    const seconds = String(elapsedTime).padStart(2, '0');
    const hundredths = String(elapsedTimeHundredths).padStart(2, '0');
    return `${seconds}:${hundredths}`;
  }, [elapsedTime, elapsedTimeHundredths]);
  
  return {
    elapsedTime,
    elapsedTimeHundredths,
    formattedTime
  };
};

// GuessTimer component for the guess time limit
const GuessTimer = ({ timerActive, timeLimit, onTimeUp }) => {
  const [timeRemaining, setTimeRemaining] = useState(timeLimit);
  const buttonTimerRef = useRef(null);
  
  useEffect(() => {
    let timerInterval;
    
    if (timerActive) {
      // Reset timer when activated
      setTimeRemaining(timeLimit);
      
      // Show timer overlay
      if (buttonTimerRef.current) {
        buttonTimerRef.current.classList.add('active');
      }
      
      // Start countdown
      timerInterval = setInterval(() => {
        setTimeRemaining(prev => {
          const newValue = prev - 0.1; // Decrease by 0.1s for smooth transition
          
          // Update width for visual progress
          if (buttonTimerRef.current) {
            const percentage = ((timeLimit - newValue) / timeLimit) * 100;
            buttonTimerRef.current.style.width = `${percentage}%`;
          }
          
          // Check for time up
          if (newValue <= 0) {
            if (onTimeUp) onTimeUp();
            clearInterval(timerInterval);
            return 0;
          }
          
          return newValue;
        });
      }, 100);
    } else {
      // Hide timer overlay when inactive
      if (buttonTimerRef.current) {
        buttonTimerRef.current.classList.remove('active');
        buttonTimerRef.current.style.width = '0%';
      }
    }
    
    // Clean up
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerActive, timeLimit, onTimeUp]);
  
  return (
    <div 
      id="buttonTimer" 
      ref={buttonTimerRef}
      className={timerActive ? 'active' : ''}
      style={{
        width: '0%',
        backgroundColor: '#cccccc'
      }}
    ></div>
  );
};
```

## Hint System

The hint system is available only in easy mode and provides assistance with a cooldown period:

```jsx
// HintButton component
const HintButton = ({ 
  active, 
  onUseHint, 
  cooldown, 
  cooldownRemaining,
  hintsUsed,
  hintsAvailable
}) => {
  // Only show in easy mode
  if (difficulty !== 'easy') return null;
  
  // Calculate remaining hints text
  const hintsText = useMemo(() => {
    if (cooldown) {
      return `Wait ${Math.ceil(cooldownRemaining)}s`;
    }
    
    if (hintsAvailable > 0) {
      const hintsLeft = Math.max(0, hintsAvailable - hintsUsed);
      return hintsLeft > 0 ? `Hint? (${hintsLeft})` : 'No hints left';
    }
    
    return 'Hint?';
  }, [cooldown, cooldownRemaining, hintsAvailable, hintsUsed]);
  
  // Determine if button should be disabled
  const isDisabled = cooldown || (hintsAvailable > 0 && hintsUsed >= hintsAvailable) || !active;
  
  return (
    <button
      id="hintButton"
      className="hint-button"
      disabled={isDisabled}
      onClick={onUseHint}
      style={{
        opacity: isDisabled ? 0.5 : 1,
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        animation: active && !cooldown && !isDisabled ? 'pulse 0.5s' : 'none'
      }}
    >
      {hintsText}
    </button>
  );
};

// Hint functionality
const useHint = () => {
  if (!gameStarted || !hintButtonActive) return;
  
  // Check if hints are available
  if (hintsAvailable > 0 && hintsUsed >= hintsAvailable) {
    showWrongMessage("No hints left!");
    return;
  }
  
  // Get current word
  const currentWord = drawingData.name;
  
  // Start cooldown period
  startHintCooldown();
  
  // Get the next missing letter index
  let nextMissingIndex = -1;
  if (guessMode) {
    // If in guess mode, use current input length
    nextMissingIndex = currentInput.length;
  } else {
    // If not in guess mode, find the next empty spot
    nextMissingIndex = correctLetters.length;
  }
  
  // Make sure we're within word bounds
  if (nextMissingIndex >= 0 && nextMissingIndex < currentWord.length) {
    // If this position is a space, skip to next letter
    if (currentWord[nextMissingIndex] === ' ') {
      if (guessMode) {
        setCurrentInput(prev => prev + ' ');
      } else {
        addCorrectLetter(' ');
      }
      
      // Try again for next letter
      useHint();
      return;
    }
    
    // Add the next correct letter
    const nextLetter = currentWord[nextMissingIndex].toUpperCase();
    
    if (guessMode) {
      // Add to current input if in guess mode
      setCurrentInput(prev => prev + nextLetter);
      
      // Check if we've completed the word with this hint
      if (currentInput.length + 1 === currentWord.length) {
        handleWordCompletion();
      }
    } else {
      // Add to correct letters if not in guess mode
      addCorrectLetter(nextLetter);
    }
    
    // Highlight the letter as a hint
    highlightHintLetter(nextMissingIndex);
  }
  
  // Update hint count
  setHintsUsed(prev => prev + 1);
  
  // Play sound
  playSound('tick');
};

// Start hint cooldown
const startHintCooldown = () => {
  setHintButtonActive(false);
  setHintButtonCooldown(true);
  setHintCooldownRemaining(CONFIG.HINT_COOLDOWN_TIME);
};

// Update hint cooldown (called from timer hook)
const updateHintCooldown = () => {
  if (!hintButtonCooldown) return;
  
  // Only update when game is active and not in guess mode
  if (gameStarted && !guessMode) {
    setHintCooldownRemaining(prev => {
      const newValue = prev - 0.01; // Decrease by 0.01s
      
      if (newValue <= 0) {
        // Cooldown finished
        setHintButtonCooldown(false);
        
        // Re-enable button if we have hints left and in easy mode
        if ((hintsAvailable === 0 || hintsUsed < hintsAvailable) && 
            difficulty === 'easy' && gameStarted) {
          setHintButtonActive(true);
        }
        
        return 0;
      }
      
      return newValue;
    });
  }
};
```

## Audio System

The audio system includes background music for each category and sound effects:

```jsx
// AudioContext hook for better browser compatibility
const useAudioSystem = () => {
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [musicVolume, setMusicVolume] = useState(0.4);
  const [sfxVolume, setSfxVolume] = useState(0.5);
  
  // Refs to store audio elements
  const soundsRef = useRef({
    // Sound effects
    correct: null,
    incorrect: null,
    completion: null, 
    tick: null,
    guess: null,
    
    // Category music
    yellowMusic: null,
    greenMusic: null,
    blueMusic: null,
    redMusic: null
  });
  
  // Ref to track music state
  const musicStateRef = useRef({
    currentTrack: null,
    currentCategory: null,
    musicPositions: {
      yellow: 0,
      green: 0,
      blue: 0,
      red: 0
    },
    isPlaying: false
  });
  
  // Initialize audio
  useEffect(() => {
    // Create and configure sound effects
    soundsRef.current.correct = new Audio('/sounds/correct.mp3');
    soundsRef.current.incorrect = new Audio('/sounds/incorrect.mp3');
    soundsRef.current.completion = new Audio('/sounds/completion.mp3');
    soundsRef.current.tick = new Audio('/sounds/tick.mp3');
    soundsRef.current.guess = new Audio('/sounds/guess.mp3');
    
    // Create and configure background music
    soundsRef.current.yellowMusic = new Audio('/sounds/yellow-music.mp3');
    soundsRef.current.greenMusic = new Audio('/sounds/green-music.mp3');
    soundsRef.current.blueMusic = new Audio('/sounds/blue-music.mp3');
    soundsRef.current.redMusic = new Audio('/sounds/red-music.mp3');
    
    // Configure all sounds
    Object.values(soundsRef.current).forEach(sound => {
      if (sound) {
        sound.load(); // Start preloading
        sound.muted = !audioEnabled;
      }
    });
    
    // Configure music tracks to loop
    soundsRef.current.yellowMusic.loop = true;
    soundsRef.current.greenMusic.loop = true;
    soundsRef.current.blueMusic.loop = true;
    soundsRef.current.redMusic.loop = true;
    
    // Set volume levels
    setAllVolumes();
    
    // Clean up on unmount
    return () => {
      Object.values(soundsRef.current).forEach(sound => {
        if (sound) {
          sound.pause();
          sound.src = '';
        }
      });
    };
  }, []);
  
  // Update mute state when audioEnabled changes
  useEffect(() => {
    Object.values(soundsRef.current).forEach(sound => {
      if (sound) {
        sound.muted = !audioEnabled;
      }
    });
    
    // If audio was enabled and music should be playing, resume it
    if (audioEnabled && musicStateRef.current.isPlaying && 
        musicStateRef.current.currentTrack) {
      const track = soundsRef.current[musicStateRef.current.currentTrack];
      if (track) {
        track.play().catch(err => {
          // Handle autoplay restrictions
          console.log("Auto-play restricted:", err.message);
        });
      }
    } else if (!audioEnabled && musicStateRef.current.currentTrack) {
      // If audio was disabled, pause any playing music
      const track = soundsRef.current[musicStateRef.current.currentTrack];
      if (track) {
        track.pause();
      }
    }
  }, [audioEnabled]);
  
  // Set all volume levels
  const setAllVolumes = useCallback(() => {
    // Set music volumes
    soundsRef.current.yellowMusic.volume = musicVolume;
    soundsRef.current.greenMusic.volume = musicVolume;
    soundsRef.current.blueMusic.volume = musicVolume;
    soundsRef.current.redMusic.volume = musicVolume;
    
    // Set SFX volumes
    soundsRef.current.correct.volume = sfxVolume;
    soundsRef.current.incorrect.volume = sfxVolume;
    soundsRef.current.completion.volume = sfxVolume;
    soundsRef.current.tick.volume = sfxVolume * 0.6; // Tick is a bit quieter
    soundsRef.current.guess.volume = sfxVolume;
  }, [musicVolume, sfxVolume]);
  
  // Update volumes when they change
  useEffect(() => {
    setAllVolumes();
  }, [musicVolume, sfxVolume, setAllVolumes]);
  
  // Play a sound
  const playSound = useCallback((soundName) => {
    const sound = soundsRef.current[soundName];
    
    if (!sound || !audioEnabled) return;
    
    // Reset to beginning
    sound.currentTime = 0;
    
    // Play with error handling
    sound.play().catch(err => {
      console.log("Error playing sound:", err.message);
    });
  }, [audioEnabled]);
  
  // Start playing category music
  const startCategoryMusic = useCallback((category) => {
    if (!audioEnabled) return;
    
    const categoryColor = category || currentColor || 'yellow';
    
    // Store current category
    musicStateRef.current.currentCategory = categoryColor;
    
    // Get the right music track
    const musicTrackName = `${categoryColor}Music`;
    musicStateRef.current.currentTrack = musicTrackName;
    musicStateRef.current.isPlaying = true;
    
    // Pause any other music first
    Object.entries(soundsRef.current).forEach(([key, sound]) => {
      if (key.includes('Music') && key !== musicTrackName && sound) {
        // Store current time before pausing
        if (sound.currentTime > 0 && !sound.paused) {
          const category = key.replace('Music', '');
          musicStateRef.current.musicPositions[category] = sound.currentTime;
        }
        sound.pause();
      }
    });
    
    const music = soundsRef.current[musicTrackName];
    if (!music) return;
    
    // Resume from stored position if we have one
    if (musicStateRef.current.musicPositions[categoryColor] > 0) {
      music.currentTime = musicStateRef.current.musicPositions[categoryColor];
    }
    
    // Fade in
    music.volume = 0;
    music.play().catch(err => {
      console.log(`Error playing ${categoryColor} music:`, err.message);
    });
    
    // Use a timeout to gradually increase volume
    let volume = 0;
    const fadeInterval = setInterval(() => {
      volume += 0.05;
      if (volume >= musicVolume) {
        music.volume = musicVolume;
        clearInterval(fadeInterval);
      } else {
        music.volume = volume;
      }
    }, 50);
  }, [audioEnabled, currentColor, musicVolume]);
  
  // Stop all music
  const stopAllMusic = useCallback(() => {
    // Fade out and stop any playing music
    Object.entries(soundsRef.current).forEach(([key, sound]) => {
      if (key.includes('Music') && sound) {
        // Create a fade out effect
        let volume = sound.volume;
        const fadeInterval = setInterval(() => {
          volume -= 0.05;
          if (volume <= 0) {
            sound.volume = 0;
            sound.pause();
            sound.currentTime = 0;
            clearInterval(fadeInterval);
          } else {
            sound.volume = volume;
          }
        }, 30);
        
        // Reset stored position
        if (key.includes('Music')) {
          const category = key.replace('Music', '');
          if (musicStateRef.current.musicPositions[category] !== undefined) {
            musicStateRef.current.musicPositions[category] = 0;
          }
        }
      }
    });
    
    musicStateRef.current.isPlaying = false;
    musicStateRef.current.currentTrack = null;
    musicStateRef.current.currentCategory = null;
  }, []);
  
  return {
    audioEnabled,
    setAudioEnabled,
    musicVolume,
    setMusicVolume,
    sfxVolume, 
    setSfxVolume,
    playSound,
    startCategoryMusic,
    stopAllMusic
  };
};
```

## Victory & Completion

When the user correctly guesses the word, we need to show a victory celebration and update the completion data:

```jsx
// ConfettiOverlay component for victory celebration
const ConfettiOverlay = ({ active, onAnimationComplete }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const animationRef = useRef(null);
  
  // Initialize confetti particles
  useEffect(() => {
    if (active && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      // Size canvas to match parent
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
      
      // Create particles
      particlesRef.current = [];
      for (let i = 0; i < 150; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: -20 - Math.random() * 100,
          size: 5 + Math.random() * 10,
          color: getRandomConfettiColor(),
          speed: 1 + Math.random() * 3,
          angle: Math.random() * Math.PI * 2,
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 2
        });
      }
      
      // Start animation
      animateConfetti();
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [active]);
  
  // Get random confetti color
  const getRandomConfettiColor = () => {
    const colors = [
      '#f44336', '#e91e63', '#9c27b0', '#673ab7',
      '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
      '#009688', '#4CAF50', '#8bc34a', '#cddc39',
      '#ffeb3b', '#ffc107', '#ff9800', '#ff5722'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  // Animate confetti
  const animateConfetti = () => {
    if (!canvasRef.current || !active) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    let stillActive = false;
    
    particlesRef.current.forEach(particle => {
      // Update position
      particle.y += particle.speed;
      particle.x += Math.sin(particle.angle) * 0.5;
      particle.rotation += particle.rotationSpeed;
      
      // Check if particle is still on screen
      if (particle.y < canvas.height + 20) {
        stillActive = true;
        
        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation * Math.PI / 180);
        
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2,
                    particle.size, particle.size);
        
        ctx.restore();
      }
    });
    
    // Continue animation if particles are still visible
    if (stillActive) {
      animationRef.current = requestAnimationFrame(animateConfetti);
    } else if (onAnimationComplete) {
      onAnimationComplete();
    }
  };
  
  if (!active) return null;
  
  return (
    <canvas
      ref={canvasRef}
      className="confetti-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 100
      }}
    />
  );
};

// Handle word completion
const handleWordCompletion = () => {
  // Stop the guess timer
  setGuessTimerActive(false);
  
  // Success feedback
  if (wordSpacesDivRef.current) {
    wordSpacesDivRef.current.style.boxShadow = '0 0 12px rgba(76, 175, 80, 0.8)';
    wordSpacesDivRef.current.style.transform = 'scale(1.05)';
  }
  
  // Play completion sound
  playSound('completion');
  
  // Start confetti animation
  setShowConfetti(true);
  
  // Delay game end to show celebration
  setTimeout(() => {
    endGame(true);
  }, CONFIG.CELEBRATION_DURATION);
};

// End game and update completion status
const endGame = (success) => {
  if (success) {
    const time = elapsedTime + (elapsedTimeHundredths / 100);
    
    // Determine if completed on hard mode
    const isHardMode = difficulty === 'hard';
    
    // Determine if completed early (before drawing was fully revealed)
    const totalSequenceLength = drawingData.sequence.length;
    const isEarlyCompletion = drawingProgress < totalSequenceLength;
    
    // Increment guess attempts for the first attempt
    const finalGuessAttempts = guessAttempts + 1;
    
    // Update completion data
    updateCompletionData(currentColor, time, finalGuessAttempts, isHardMode, isEarlyCompletion);
  }
  
  // Reset game state
  setGameStarted(false);
  setTimerActive(false);
  setGuessMode(false);
  setCorrectLetters([]);
  
  // Stop timers and animations
  stopGuessTimer();
  
  // Return to menu after delay
  setTimeout(() => {
    navigate('/');
  }, success ? 2000 : 500);
};
```

## Trophy & Achievements

The completion system includes special achievements for skilled play:

```jsx
// CompletionOverlay component for category squares
const CompletionOverlay = ({ completionData }) => {
  const { time, guesses, hardMode, earlyCompletion } = completionData;
  
  // Determine which stamp class to use
  let stampClass = 'completion-stamp-default';
  
  if (hardMode && earlyCompletion) {
    stampClass = 'completion-stamp-early-hard';
  } else if (hardMode) {
    stampClass = 'completion-stamp-hard';
  } else if (earlyCompletion) {
    stampClass = 'completion-stamp-early';
  }
  
  // Check if it's a first-guess completion
  const isFirstGuess = guesses === 1;
  
  return (
    <div className="result-overlay visible">
      <div className={`completion-stamp ${stampClass}`}>
        <div className="stamp-text">
          COMPLETED
          {hardMode && <span className="hard-badge">HARD</span>}
        </div>
      </div>
      <div className="completion-stats">
        <p className="stat-line">Time: {time.toFixed(2)}s</p>
        {isFirstGuess ?
          <p className="stat-line stat-achievement">Got it in one ☝️</p> :
          <p className="stat-line">Guesses: {guesses}</p>}
        {earlyCompletion && 
          <p className="stat-line stat-achievement">Early completion! ⚡</p>}
        {hardMode && 
          <p className="stat-line stat-achievement">Hard mode! 🏆</p>}
      </div>
    </div>
  );
};

// Update completion data in the application state
const updateCompletionData = (color, time, guesses, isHardMode, isEarlyCompletion) => {
  // Create new completion data
  const completionData = {
    completed: true,
    time,
    guesses,
    hardMode: isHardMode,
    earlyCompletion: isEarlyCompletion
  };
  
  // Update app state
  setCompletedCategories(prev => ({
    ...prev,
    [color]: completionData
  }));
  
  // Possibly save to localStorage for persistence
  const savedCompletions = JSON.parse(localStorage.getItem('completedCategories') || '{}');
  savedCompletions[color] = completionData;
  localStorage.setItem('completedCategories', JSON.stringify(savedCompletions));
};
```

## Mobile Optimizations

Mobile devices require special handling for touch events and screen adjustments:

```jsx
// Hook to handle mobile-specific optimizations
const useMobileOptimizations = (isMobile) => {
  useEffect(() => {
    if (isMobile) {
      // Prevent scrolling on the entire document
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.body.style.touchAction = 'none';
      
      // Prevent default touch behavior
      const preventDefaultTouchMove = (e) => {
        e.preventDefault();
      };
      
      document.addEventListener('touchmove', preventDefaultTouchMove, { passive: false });
      
      // Prevent double-tap to zoom
      let lastTap = 0;
      const preventDoubleTapZoom = (e) => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;
        
        if (lastTap && (now - lastTap) < DOUBLE_TAP_DELAY) {
          e.preventDefault();
        }
        
        lastTap = now;
      };
      
      document.addEventListener('touchend', preventDoubleTapZoom, { passive: false });
      
      // Clean up
      return () => {
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
        document.body.style.touchAction = '';
        
        document.removeEventListener('touchmove', preventDefaultTouchMove);
        document.removeEventListener('touchend', preventDoubleTapZoom);
      };
    }
  }, [isMobile]);
  
  // Adjust layout for virtual keyboard
  const adjustLayoutForKeyboard = (showKeyboard) => {
    if (!isMobile) return;
    
    const canvasContainer = document.querySelector('.canvas-container');
    const wordSpacesDiv = document.getElementById('wordSpacesDiv');
    const gameScreen = document.querySelector('.game-screen');
    const backButton = document.getElementById('backButton');
    
    if (!canvasContainer || !gameScreen) return;
    
    if (showKeyboard) {
      // Add keyboard-visible class
      gameScreen.classList.add('keyboard-visible');
      
      // Resize canvas
      canvasContainer.style.transition = 'all 0.3s ease';
      canvasContainer.style.width = '80%';
      canvasContainer.style.margin = '5px auto';
      canvasContainer.style.transform = 'scale(0.9)';
      
      // Adjust word spaces
      if (wordSpacesDiv) {
        wordSpacesDiv.style.margin = '5px auto';
        wordSpacesDiv.style.transition = 'all 0.3s ease';
        wordSpacesDiv.style.boxShadow = '0 0 8px rgba(76, 175, 80, 0.6)';
      }
      
      // Hide back button to save space
      if (backButton) {
        backButton.style.display = 'none';
      }
    } else {
      // Remove keyboard-visible class
      gameScreen.classList.remove('keyboard-visible');
      
      // Restore canvas size
      canvasContainer.style.width = '100%';
      canvasContainer.style.margin = '0 0 15px 0';
      canvasContainer.style.transform = 'scale(1)';
      
      // Restore word spaces
      if (wordSpacesDiv) {
        wordSpacesDiv.style.margin = '15px 0';
        wordSpacesDiv.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
      }
      
      // Show back button again
      if (backButton) {
        backButton.style.display = 'block';
      }
    }
  };
  
  return {
    adjustLayoutForKeyboard
  };
};

// Use the optimization hooks in GameScreen
const GameScreen = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  // Detect if on mobile device
  useEffect(() => {
    const checkMobile = () => {
      return (
        ('ontouchstart' in window) ||
        (navigator.maxTouchPoints > 0) ||
        (navigator.msMaxTouchPoints > 0) ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    
    setIsMobile(checkMobile());
  }, []);
  
  const { adjustLayoutForKeyboard } = useMobileOptimizations(isMobile);
  
  // When entering guess mode, adjust layout for keyboard
  useEffect(() => {
    if (guessMode) {
      adjustLayoutForKeyboard(true);
    } else {
      adjustLayoutForKeyboard(false);
    }
  }, [guessMode, adjustLayoutForKeyboard]);
  
  // Rest of component...
};
```

This guide provides a comprehensive overview of rebuilding the Anticipation game in React, covering all the major systems from the original JavaScript implementation. Each section includes React component examples and explanations of how the various game mechanics work together.

To implement the complete game, you would need to combine all these components with proper routing, styling, and state management. The exact implementation might vary based on your preferred React patterns and additional libraries.
