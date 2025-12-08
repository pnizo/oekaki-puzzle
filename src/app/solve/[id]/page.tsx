"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { getPuzzle, unlockPuzzle, recordSolved, addPoints, getUser } from '@/lib/firestore';
import PuzzleBoard from '@/components/PuzzleBoard';
import { Puzzle, User } from '@/types';

export default function SolvePage() {
  const { id } = useParams();
  const puzzleId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const router = useRouter();

  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);

  // Completion State
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionMessage, setCompletionMessage] = useState("");

  useEffect(() => {
    async function init() {
      if (!user || !puzzleId) return;

      try {
        const [pData, uData] = await Promise.all([
          getPuzzle(puzzleId),
          getUser(user.uid)
        ]);

        if (pData) {
          setPuzzle(pData);
          if (uData) {
            setUserData(uData);
            if (uData.unlockedPuzzles?.includes(puzzleId)) {
              setIsUnlocked(true);
            }
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user, puzzleId]);

  const handleUnlock = async () => {
    if (!user || !puzzle || !userData) return;
    const cost = puzzle.width * puzzle.height; // Cost = Area

    if (userData.points < cost) {
      alert(`Not enough points! Need ${cost}, have ${userData.points}.`);
      return;
    }

    if (!confirm(`${cost} ポイントでロックを解除しますか？`)) return;

    setUnlocking(true);
    try {
      const success = await unlockPuzzle(user.uid, puzzle.id, cost);
      if (success) {
        setIsUnlocked(true);
        // Update local user data points
        setUserData({ ...userData, points: userData.points - cost, unlockedPuzzles: [...userData.unlockedPuzzles, puzzle.id] });
      } else {
        alert("ロック解除に失敗しました。");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUnlocking(false);
    }
  };

  const handleComplete = async () => {
    if (!user || !puzzle) return;

    try {
      const isFirstSolve = await recordSolved(user.uid, puzzle.id);
      // Play count is incremented on unlock, clear count on recordSolved

      if (isFirstSolve) {
        const reward = puzzle.width * puzzle.height;
        await addPoints(user.uid, reward);
        setCompletionMessage(`${reward} ポイントを獲得しました！`);
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

      {!isUnlocked ? (
        <div className="bg-white p-8 rounded-xl shadow-md text-center max-w-md">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-xl font-bold mb-2">ロック中</h2>
          <p className="text-slate-600 mb-6">
            この {puzzle.width}x{puzzle.height} パズルのロックを解除
          </p>
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm text-slate-500">必要ポイント</p>
            <p className="text-2xl font-bold text-blue-600">{puzzle.width * puzzle.height} ポイント</p>
          </div>
          <button
            onClick={handleUnlock}
            disabled={unlocking}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {unlocking ? "解除中..." : "ロック解除してあそぶ"}
          </button>
        </div>
      ) : (
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
              </div>
            </div>
          )}
        </div>
      )
      }
    </div >
  );
}
