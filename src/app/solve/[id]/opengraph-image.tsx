import { ImageResponse } from 'next/og';
import { getPuzzle } from '@/lib/firestore';

export const runtime = 'nodejs';
export const alt = 'Picture Logic Puzzle';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const containerStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'white',
};

function createImageResponse(content: React.ReactElement) {
  return new ImageResponse(content, size);
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const puzzleId = Array.isArray(id) ? id[0] : id;
  const puzzle = await getPuzzle(puzzleId);

  if (!puzzle) {
    return createImageResponse(
      <div style={{ ...containerStyle, fontSize: 48 }}>Puzzle Not Found</div>
    );
  }

  return createImageResponse(
    <div style={{ ...containerStyle, flexDirection: 'column' }}>
      <div style={{ fontSize: 64, fontWeight: 'bold' }}>{puzzle.title}</div>
      <div style={{ fontSize: 32, marginTop: 20 }}>
        {puzzle.width} x {puzzle.height}
      </div>
    </div>
  );
}
