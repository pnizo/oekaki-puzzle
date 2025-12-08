"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GridEditor from '@/components/GridEditor';
import { useAuth } from '@/hooks/useAuth';
import { isTitleValid } from '@/utils/validation';
import { getNgWords, createPuzzle, addPoints } from '@/lib/firestore';

export default function CreatePage() {
  const { user } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [size, setSize] = useState(4);
  const [puzzleData, setPuzzleData] = useState<{ colors: string[], data: number[] } | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ngWords, setNgWords] = useState<string[]>([]);

  useEffect(() => {
    getNgWords().then(setNgWords);
  }, []);

  const handleGridSave = (colors: string[], data: number[]) => {
    setPuzzleData({ colors, data });
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!user || !puzzleData) return;

    setError(null);
    const titleCheck = isTitleValid(title, ngWords);
    if (!titleCheck.valid) {
      setError(titleCheck.error || "Invalid title");
      return;
    }

    setIsSubmitting(true);
    try {
      // Create puzzle
      await createPuzzle({
        creatorUid: user.uid,
        title: title,
        width: size,
        height: size,
        data: puzzleData.data,
        originalImage: puzzleData.colors,
      });

      // Award points (Area size)
      const points = size * size;
      await addPoints(user.uid, points);

      alert(`パズル完成！`);
      router.push('/list');
    } catch (e) {
      console.error(e);
      setError("パズル作成に失敗…… もう一度試してね");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return <div className="text-center mt-10">Loading user...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <h1 className="text-3xl font-bold mb-8 text-center text-slate-800">お絵かきする</h1>

      {/* Progress Steps */}
      <div className="flex justify-center mb-8 text-sm font-medium text-slate-500">
        <span className={step >= 1 ? "text-blue-600" : ""}>1. サイズを選ぶ</span>
        <span className="mx-2">→</span>
        <span className={step >= 2 ? "text-blue-600" : ""}>2. つくる</span>
        <span className="mx-2">→</span>
        <span className={step >= 3 ? "text-blue-600" : ""}>3. あげる</span>
      </div>

      {step === 1 && (
        <div className="flex flex-col items-center space-y-6">
          <label className="text-lg font-medium">サイズ: {size}x{size}</label>
          <input
            type="range"
            min="4"
            max="10"
            value={size}
            onChange={(e) => setSize(parseInt(e.target.value))}
            className="w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <button
            onClick={() => setStep(2)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            つくる
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col items-center">
          <button onClick={() => setStep(1)} className="self-start mb-4 text-sm text-gray-500 hover:text-gray-700">← サイズを選ぶ</button>
          <GridEditor key={size} width={size} height={size} onSave={handleGridSave} />
        </div>
      )}

      {step === 3 && puzzleData && (
        <div className="flex flex-col items-center space-y-6 max-w-md mx-auto">
          <button onClick={() => setStep(2)} className="self-start mb-4 text-sm text-gray-500 hover:text-gray-700">← つくる</button>

          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="タイトルを入力してね"
              maxLength={20}
            />
            <p className="text-xs text-gray-500 mt-1">20文字以下だよ</p>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          {/* <div className="bg-blue-50 p-4 rounded-lg w-full text-center">
            <p className="text-blue-800 font-medium">もらえる: {size * size} ポイント</p>
          </div> */}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {isSubmitting ? "つくる中..." : "パズルをあげる"}
          </button>
        </div>
      )}
    </div>
  );
}
