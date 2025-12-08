import { useState, useEffect } from 'react';
import { calculateHints } from '@/utils/hintUtils';

interface PuzzleBoardProps {
  width: number;
  height: number;
  solution: number[];
  onComplete: () => void;
}

export default function PuzzleBoard({ width, height, solution, onComplete }: PuzzleBoardProps) {
  // 0: Empty, 1: Filled, 2: Marked (X)
  const [grid, setGrid] = useState<number[]>(Array(width * height).fill(0));
  const [hints, setHints] = useState<{ rowHints: number[][], colHints: number[][] } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<number>(0); // 1: Fill, 2: Mark, 0: Erase

  // Touch state
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isLongPress, setIsLongPress] = useState(false);

  useEffect(() => {
    setHints(calculateHints(solution, width, height));
  }, [solution, width, height]);

  const checkCompletion = (currentGrid: number[]) => {
    // Check if all filled cells match solution (ignore marks)
    for (let i = 0; i < currentGrid.length; i++) {
      const cell = currentGrid[i] === 1 ? 1 : 0;
      if (cell !== solution[i]) return false;
    }
    return true;
  };

  const handleMouseDown = (index: number, e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);

    let type = 1; // Default fill

    if (e.button === 2) { // Right click
      type = 2; // Mark
      // Toggle logic for right click (Mark <-> Empty)
      if (grid[index] === 2) type = 0;
    } else {
      // Left click toggle logic: Empty -> Fill -> Mark -> Empty
      // But wait, user requested: "Left click toggle: Mark -> X Mark -> Clear"
      // Assuming "Mark" means Fill (Black), "X Mark" means X (Red), "Clear" means Empty.
      // Current state:
      // 0 (Empty) -> 1 (Fill)
      // 1 (Fill) -> 2 (Mark)
      // 2 (Mark) -> 0 (Empty)

      const current = grid[index];
      if (current === 0) type = 1;
      else if (current === 1) type = 2;
      else if (current === 2) type = 0;
    }

    setDragType(type);
    updateCell(index, type);
  };

  const handleMouseEnter = (index: number) => {
    if (isDragging) {
      updateCell(index, dragType);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Touch Handlers
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    // Prevent default to stop scrolling/zooming while playing
    // e.preventDefault(); // Note: might block scrolling entirely on the grid, which is usually desired for game grids

    setIsDragging(true);
    setIsLongPress(false);

    // Start long press timer
    const timer = setTimeout(() => {
      setIsLongPress(true);
      // Long press action: Toggle X (Mark)
      // If empty or filled -> X
      // If X -> Empty
      const current = grid[index];
      const type = current === 2 ? 0 : 2;
      setDragType(type);
      updateCell(index, type);

      // Provide haptic feedback if available
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500); // 500ms for long press

    setLongPressTimer(timer);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    // If dragging, find element under finger
    if (isDragging && !isLongPress) { // Don't drag paint if long pressing
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      if (element && element.hasAttribute('data-index')) {
        const index = parseInt(element.getAttribute('data-index')!);
        updateCell(index, dragType);
      }
    }
  };

  const handleTouchEnd = (index: number, e: React.TouchEvent) => {
    e.preventDefault(); // Prevent mouse events

    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // If not long press, treat as click (Toggle)
    if (!isLongPress && isDragging) {
      // Toggle logic: Empty -> Fill -> Mark -> Empty
      const current = grid[index];
      let type = 0;
      if (current === 0) type = 1;
      else if (current === 1) type = 2;
      else if (current === 2) type = 0;

      // If we haven't already painted (dragType might be set from start?)
      // Actually for touch, we usually want to set dragType on start.
      // But here we are doing tap.
      updateCell(index, type);
    }

    setIsDragging(false);
    setIsLongPress(false);
  };

  const updateCell = (index: number, type: number) => {
    if (grid[index] === type) return;

    const newGrid = [...grid];
    newGrid[index] = type;
    setGrid(newGrid);

    if (checkCompletion(newGrid)) {
      onComplete();
    }
  };

  if (!hints) return <div>Loading hints...</div>;

  return (
    <div
      className="flex flex-col items-center select-none"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex">
        {/* Top-left corner (empty) */}
        <div className="w-24 h-24 border-b-2 border-r-2 border-slate-400"></div>

        {/* Column Hints */}
        <div className="flex border-b-2 border-slate-400">
          {hints.colHints.map((col, i) => (
            <div key={i} className="w-8 flex flex-col justify-end items-center pb-1 bg-slate-50 border-r border-slate-200 text-xs font-mono">
              {col.length > 0 ? col.map((num, j) => <div key={j}>{num}</div>) : <div>0</div>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex">
        {/* Row Hints */}
        <div className="flex flex-col w-24 border-r-2 border-slate-400">
          {hints.rowHints.map((row, i) => (
            <div key={i} className="h-8 flex justify-end items-center pr-2 bg-slate-50 border-b border-slate-200 text-xs font-mono gap-1">
              {row.length > 0 ? row.map((num, j) => <span key={j}>{num}</span>) : <span>0</span>}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div
          className="grid bg-white border-b-2 border-r-2 border-slate-400 touch-none" // touch-none to prevent scrolling
          style={{
            gridTemplateColumns: `repeat(${width}, 2rem)`,
          }}
          onTouchMove={handleTouchMove} // Attach to container for drag
        >
          {grid.map((cell, i) => (
            <div
              key={i}
              data-index={i}
              className={`h-8 w-8 border-r border-b border-slate-200 flex items-center justify-center cursor-pointer hover:bg-slate-100
                        ${(i % width + 1) % 5 === 0 && (i + 1) % width !== 0 ? 'border-r-slate-400' : ''}
                        ${Math.floor(i / width) % 5 === 4 && Math.floor(i / width) !== height - 1 ? 'border-b-slate-400' : ''}
                    `}
              onMouseDown={(e) => handleMouseDown(i, e)}
              onMouseEnter={() => handleMouseEnter(i)}
              onTouchStart={(e) => handleTouchStart(i, e)}
              onTouchEnd={(e) => handleTouchEnd(i, e)}
              style={{
                backgroundColor: cell === 1 ? '#333' : 'transparent'
              }}
            >
              {cell === 2 && <span className="text-red-500 text-lg">×</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-500 text-center">
        <p>左クリック / タップ: 塗りつぶし → X → 空白</p>
        <p>右クリック / 長押し: X</p>
      </div>
    </div>
  );
}
