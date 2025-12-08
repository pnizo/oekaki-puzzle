import { ImageResponse } from 'next/og';
import { getPuzzle } from '@/lib/firestore';

export const runtime = 'nodejs';
export const alt = 'Picture Logic Puzzle';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const puzzleId = Array.isArray(id) ? id[0] : id;
  const puzzle = await getPuzzle(puzzleId);

  if (!puzzle) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 48,
            background: 'white',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Puzzle Not Found
        </div>
      ),
      { ...size }
    );
  }

  // Calculate cell size to fit the grid nicely
  const maxGridSize = 400;
  const cellSize = Math.floor(maxGridSize / Math.max(puzzle.width, puzzle.height));

  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        {/* Title */}
        <div style={{ fontSize: 48, fontWeight: 'bold', color: 'white' }}>
          {puzzle.title}
        </div>

        {/* Pixel Art Grid */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            border: '4px solid white',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          {Array.from({ length: puzzle.height }).map((_, row) => (
            <div key={row} style={{ display: 'flex' }}>
              {Array.from({ length: puzzle.width }).map((_, col) => {
                const idx = row * puzzle.width + col;
                const color = puzzle.originalImage[idx] || '#ffffff';
                return (
                  <div
                    key={col}
                    style={{
                      width: cellSize,
                      height: cellSize,
                      backgroundColor: color,
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {/* Size info */}
        <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.8)' }}>
          {puzzle.width} x {puzzle.height}
        </div>
      </div>
    ),
    { ...size }
  );
}

