"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getPuzzle, recordSolved, getUser, recordPlay } from '@/lib/firestore';
import PuzzleBoard from '@/components/PuzzleBoard';
import { Puzzle, User } from '@/types';

export default function SolvePage() {
  const { id } = useParams();
  const puzzleId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const router = useRouter();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);

  // Completion State
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");

  useEffect(() => {
    async function init() {
      if (!user || !puzzleId) return;

      try {

        const [pData] = await Promise.all([
          getPuzzle(puzzleId),
          getUser(user.uid),
          recordPlay(user.uid, puzzleId) // Record play on load
        ]);

        if (pData) {
          setPuzzle(pData);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user, puzzleId]);

  const handleComplete = async () => {
    if (!user || !puzzle) return;

    try {
      const isFirstSolve = await recordSolved(user.uid, puzzle.id);
      // Play count is incremented on unlock, clear count on recordSolved

      if (isFirstSolve) {
        setCompletionMessage(`クリアおめでとう！`);
      } else {
        setCompletionMessage(`(クリア済み)`);
      }

      setIsCompleted(true);
    } catch (e) {
      console.error("Error recording completion:", e);
    }
  };

  if (loading || !user) return <div className="text-center mt-10">読み込み中...</div>;
  if (!puzzle) return <div className="text-center mt-10">パズルが見つかりません。</div>;

  return (
    <div className="flex flex-col items-center py-8">
      <h1 className="text-2xl font-bold mb-4">{puzzle.title}</h1>

      <div className="relative">
        {/* Game Board */}
        <div className={isCompleted ? "pointer-events-none" : ""}>
          <PuzzleBoard
            width={puzzle.width}
            height={puzzle.height}
            solution={puzzle.data}
            onComplete={handleComplete}
          />
        </div>

        {/* Completion Modal */}
        {isCompleted && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full flex flex-col items-center animate-in fade-in zoom-in duration-300">
              <h2 className="text-2xl font-bold text-green-600 mb-4">パズルクリア!</h2>

              {/* Colored Grid Render */}
              <div
                className="grid gap-[1px] bg-gray-300 border border-gray-300 mb-6"
                style={{
                  gridTemplateColumns: `repeat(${puzzle.width}, 20px)`,
                }}
              >
                {puzzle.originalImage.map((color, i) => (
                  <div
                    key={i}
                    className="w-5 h-5"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              <p className="text-lg font-medium text-slate-700 mb-6">{completionMessage}</p>

              <button
                onClick={() => router.push('/list')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                一覧に戻る
              </button>

              <a
                href={`https://x.com/intent/tweet?text=${encodeURIComponent(`パズル「${puzzle.title}」を解きました！`)}&url=${encodeURIComponent(`${window.location.origin}/solve/${puzzle.id}`)}&hashtags=OekakiPuzzle`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition font-medium text-center flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                Xでシェアする
              </a>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}
