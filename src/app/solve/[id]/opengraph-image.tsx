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

  return new ImageResponse(
    (
      <div
        style={{
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: 64, fontWeight: 'bold' }}>{puzzle.title}</div>
        <div style={{ fontSize: 32, marginTop: 20 }}>
          {puzzle.width} x {puzzle.height}
        </div>
      </div>
    ),
    { ...size }
  );
}

