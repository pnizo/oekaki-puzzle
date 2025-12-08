import { ImageResponse } from 'next/og';
import { getPuzzle } from '@/lib/firestore';

export const runtime = 'nodejs'; // Use Node.js runtime to support Firebase Admin/Client SDK better if needed

export const alt = 'Picture Logic Puzzle';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Handle array id if it happens (though in params it's usually string)
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
      {
        ...size,
      }
    );
  }

  // Calculate cell size to fit within a reasonable area (e.g., 500x500 max)
  const maxDim = 500;
  const cellSize = Math.floor(maxDim / Math.max(puzzle.width, puzzle.height));

  return new ImageResponse(
    (
      <div
        style={{
          background: '#f8fafc', // slate-50
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            fontWeight: 'bold',
            color: '#0f172a', // slate-900
            marginBottom: 40,
          }}
        >
          {puzzle.title}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            width: puzzle.width * cellSize,
            height: puzzle.height * cellSize,
            position: 'relative',
          }}
        >
          {puzzle.originalImage.map((color, i) => (
            <div
              key={i}
              style={{
                width: cellSize,
                height: cellSize,
                backgroundColor: color,
                position: 'absolute',
                left: (i % puzzle.width) * cellSize,
                top: Math.floor(i / puzzle.width) * cellSize,
              }}
            />
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 40,
            fontSize: 30,
            color: '#64748b', // slate-500
          }}
        >
          Start playing on Picture Logic!
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
