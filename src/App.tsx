import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Coffee, 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  RotateCcw,
  Trophy,
  Zap
} from 'lucide-react';

// --- Constants ---
const GRID_SIZE = 20;
const INITIAL_SNAKE = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];
const INITIAL_DIRECTION = { x: 0, y: -1 };

type Point = { x: number; y: number };
type Difficulty = 'Lento' | 'Medio' | 'Alto';

const SPEEDS: Record<Difficulty, number> = {
  'Lento': 150,
  'Medio': 100,
  'Alto': 60,
};

export default function App() {
  // --- State ---
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const [nextDirection, setNextDirection] = useState<Point>(INITIAL_DIRECTION);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [status, setStatus] = useState<'MENU' | 'PLAYING' | 'GAME_OVER'>('MENU');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medio');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastUpdateTimeRef = useRef<number>(0);

  // --- Helpers ---
  const getRandomPoint = useCallback((): Point => {
    return {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    setNextDirection(INITIAL_DIRECTION);
    setScore(0);
    setFood(getRandomPoint());
    setStatus('PLAYING');
  };

  const moveSnake = useCallback(() => {
    setSnake((prevSnake) => {
      const head = prevSnake[0];
      const newHead = {
        x: head.x + nextDirection.x,
        y: head.y + nextDirection.y,
      };

      // Check collisions
      if (
        newHead.x < 0 || 
        newHead.x >= GRID_SIZE || 
        newHead.y < 0 || 
        newHead.y >= GRID_SIZE ||
        prevSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)
      ) {
        setStatus('GAME_OVER');
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      // Check food
      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 1);
        setFood(getRandomPoint());
      } else {
        newSnake.pop();
      }

      setDirection(nextDirection);
      return newSnake;
    });
  }, [nextDirection, food, getRandomPoint]);

  // --- Game Loop ---
  useEffect(() => {
    if (status !== 'PLAYING') return;

    const loop = (time: number) => {
      const deltaTime = time - lastUpdateTimeRef.current;
      if (deltaTime > SPEEDS[difficulty]) {
        moveSnake();
        lastUpdateTimeRef.current = time;
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [status, difficulty, moveSnake]);

  // --- Input Handling ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction.y === 0) setNextDirection({ x: 0, y: -1 });
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction.y === 0) setNextDirection({ x: 0, y: 1 });
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction.x === 0) setNextDirection({ x: -1, y: 0 });
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction.x === 0) setNextDirection({ x: 1, y: 0 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [direction]);

  // --- Rendering ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cellSize = canvas.width / GRID_SIZE;

    // Clear background
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid (subtle)
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // Draw food (Coffee Cup)
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#fff';
    
    const fx = food.x * cellSize + cellSize / 2;
    const fy = food.y * cellSize + cellSize / 2;
    const r = cellSize / 4;
    
    // Cup body
    ctx.beginPath();
    ctx.roundRect(fx - r, fy - r, r * 2, r * 2.2, 2);
    ctx.fill();
    
    // Handle
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(fx + r, fy, r / 1.5, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();

    // Steam
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(fx + i * 3, fy - r - 2);
      ctx.lineTo(fx + i * 3 + Math.sin(Date.now() / 200 + i) * 2, fy - r - 8);
      ctx.stroke();
    }
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw snake
    snake.forEach((segment, index) => {
      const isHead = index === 0;
      ctx.fillStyle = isHead ? '#00f2ff' : '#00a8b3';
      
      if (isHead) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00f2ff';
      }

      const padding = 2;
      ctx.fillRect(
        segment.x * cellSize + padding,
        segment.y * cellSize + padding,
        cellSize - padding * 2,
        cellSize - padding * 2
      );
      
      ctx.shadowBlur = 0;
    });

  }, [snake, food]);

  // Update High Score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
    }
  }, [score, highScore]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-deep-black">
      {/* Header / Score */}
      <div className="w-full max-w-md flex justify-between items-center mb-6 px-4">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Score</span>
          <span className="text-3xl font-black text-neon-blue text-glow-blue">{score}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs uppercase tracking-widest text-zinc-500 font-bold">Best</span>
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-500" />
            <span className="text-2xl font-bold text-white">{highScore}</span>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-neon-blue opacity-20 blur group-hover:opacity-30 transition duration-1000"></div>
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="relative bg-black border border-zinc-800 rounded-lg shadow-2xl max-w-full aspect-square"
          style={{ width: 'min(90vw, 400px)', height: 'min(90vw, 400px)' }}
        />

        {/* Overlays */}
        {status === 'MENU' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 rounded-lg backdrop-blur-sm">
            <h1 className="text-5xl font-black mb-2 text-neon-blue text-glow-blue tracking-tighter italic">SNAKE</h1>
            <p className="text-zinc-400 mb-8 text-sm uppercase tracking-widest">Coffee Edition</p>
            
            <div className="flex flex-col gap-4 w-full max-w-[200px]">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase text-zinc-500 font-bold text-center">Select Difficulty</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['Lento', 'Medio', 'Alto'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`py-2 text-[10px] font-bold rounded border transition-all ${
                        difficulty === d 
                        ? 'bg-neon-blue text-black border-neon-blue' 
                        : 'bg-transparent text-zinc-400 border-zinc-800 hover:border-zinc-500'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                onClick={resetGame}
                className="mt-4 py-4 bg-white text-black font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform"
              >
                <Play size={20} fill="currentColor" />
                Start Game
              </button>
            </div>
          </div>
        )}

        {status === 'GAME_OVER' && (
          <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center p-8 rounded-lg backdrop-blur-sm">
            <h2 className="text-4xl font-black mb-2 text-red-500 tracking-tighter">GAME OVER</h2>
            <div className="flex items-center gap-2 mb-8">
              <span className="text-zinc-400 text-sm">Final Score:</span>
              <span className="text-2xl font-bold text-white">{score}</span>
            </div>
            
            <button
              onClick={resetGame}
              className="py-4 px-8 bg-neon-blue text-black font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-transform"
            >
              <RotateCcw size={20} />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile Controls */}
      <div className="mt-8 grid grid-cols-3 gap-2 md:hidden">
        <div />
        <button 
          className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center active:bg-neon-blue active:text-black transition-colors border border-zinc-800"
          onPointerDown={() => direction.y === 0 && setNextDirection({ x: 0, y: -1 })}
        >
          <ChevronUp size={32} />
        </button>
        <div />
        
        <button 
          className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center active:bg-neon-blue active:text-black transition-colors border border-zinc-800"
          onPointerDown={() => direction.x === 0 && setNextDirection({ x: -1, y: 0 })}
        >
          <ChevronLeft size={32} />
        </button>
        <button 
          className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center active:bg-neon-blue active:text-black transition-colors border border-zinc-800"
          onPointerDown={() => direction.y === 0 && setNextDirection({ x: 0, y: 1 })}
        >
          <ChevronDown size={32} />
        </button>
        <button 
          className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center active:bg-neon-blue active:text-black transition-colors border border-zinc-800"
          onPointerDown={() => direction.x === 0 && setNextDirection({ x: 1, y: 0 })}
        >
          <ChevronRight size={32} />
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-auto pt-8 text-center">
        <div className="flex items-center justify-center gap-4 text-zinc-500 text-[10px] uppercase tracking-[0.2em] font-bold">
          <div className="flex items-center gap-1">
            <Zap size={12} className="text-neon-blue" />
            <span>Speed: {difficulty}</span>
          </div>
          <div className="flex items-center gap-1">
            <Coffee size={12} className="text-white" />
            <span>Collect Coffee</span>
          </div>
        </div>
        <p className="mt-4 text-zinc-700 text-[9px] uppercase tracking-widest">
          Use Arrows or WASD to control
        </p>
      </div>
    </div>
  );
}
