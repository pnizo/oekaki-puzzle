import { Puzzle } from "@/types";
import Link from "next/link";

interface PuzzleCardProps {
  puzzle: Puzzle;
  isSolved: boolean;
}

export default function PuzzleCard({ puzzle, isSolved }: PuzzleCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square w-full bg-slate-100 flex items-center justify-center relative">
        {isSolved ? (
          <div
            className="grid w-full h-full"
            style={{
              gridTemplateColumns: `repeat(${puzzle.width}, 1fr)`,
              gridTemplateRows: `repeat(${puzzle.height}, 1fr)`
            }}
          >
            {puzzle.originalImage.map((color, i) => (
              <div key={i} style={{ backgroundColor: color }} />
            ))}
          </div>
        ) : (
          <div className="text-slate-400 flex flex-col items-center">
            <span className="text-4xl mb-2">🔒</span>
            <span className="text-sm font-medium">Locked</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <h3 className="font-bold text-lg text-slate-800 truncate" title={puzzle.title}>
          {puzzle.title}
        </h3>
        <div className="flex justify-between items-center mt-2 text-sm text-slate-500">
          <span>{puzzle.width}x{puzzle.height}</span>
          <div className="flex gap-2 text-xs">
            <span>あそんだ: {puzzle.playCount || 0}人</span>
            <span>クリア: {puzzle.clearCount || 0}人</span>
          </div>
        </div>

        <Link
          href={`/solve/${puzzle.id}`}
          className="block mt-4 text-center py-2 rounded-lg transition-colors bg-blue-600 text-white hover:bg-blue-700"
        >
          あそぶ
        </Link>
      </div>
    </div>
  );
}
