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
}
