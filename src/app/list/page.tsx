"use client";

import { useState, useEffect } from 'react';
import { getPuzzles, getSolvedPuzzles, getUser } from '@/lib/firestore';
import { useAuth } from '@/hooks/useAuth';
import PuzzleCard from '@/components/PuzzleCard';
import { Puzzle, User } from '@/types';

export default function ListPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [puzzles, setPuzzles] = useState<Puzzle[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Filter & Pagination State
  const [sortBy, setSortBy] = useState<'playCount' | 'createdAt'>('playCount');
  const [searchQuery, setSearchQuery] = useState("");
  const [lastDocs, setLastDocs] = useState<any[]>([]); // Stack of cursors for pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  // Fetch Puzzles
  const fetchPuzzles = async (isNext: boolean = false) => {
    setLoading(true);
    try {
      const lastDoc = isNext ? lastDocs[lastDocs.length - 1] : (page > 1 ? lastDocs[page - 2] : null);

      const { puzzles: newPuzzles, lastVisible } = await getPuzzles(20, sortBy, lastDoc, searchQuery);

      setPuzzles(newPuzzles);
      setHasMore(newPuzzles.length === 20);

      if (isNext && lastVisible) {
        setLastDocs(prev => [...prev, lastVisible]);
      } else if (!isNext && page > 1) {
        setLastDocs(prev => prev.slice(0, prev.length - 1));
      }
    } catch (e) {
      console.error("Failed to fetch puzzles", e);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load & User Data
  useEffect(() => {
    async function init() {
      if (user) {
        const [solvedData, uData] = await Promise.all([
          getSolvedPuzzles(user.uid),
          getUser(user.uid)
        ]);
        setSolvedIds(new Set(solvedData));
        if (uData) setUserData(uData);
      }
      // Initial fetch
      fetchPuzzles();
    }
    init();
  }, [user]);

  // Refetch when filters change
  useEffect(() => {
    setPage(1);
    setLastDocs([]);
    fetchPuzzles();
  }, [sortBy, searchQuery]);

  const handleNext = () => {
    setPage(p => p + 1);
    fetchPuzzles(true);
  };

  const handlePrev = () => {
    setPage(p => Math.max(1, p - 1));
    fetchPuzzles(false);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-slate-800">パズル一覧</h1>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-600">並び順:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'playCount' | 'createdAt')}
            className="border rounded px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!!searchQuery}
          >
            <option value="playCount">人気順</option>
            <option value="createdAt">新着順</option>
          </select>
          {searchQuery && <span className="text-xs text-orange-500 ml-2">(関連度順)</span>}
        </div>

        <div className="w-full md:w-auto">
          <input
            type="text"
            placeholder="タイトルで検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 border rounded px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-500">Loading...</div>
      ) : puzzles.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          No puzzles found.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
            {puzzles.map((puzzle) => (
              <PuzzleCard
                key={puzzle.id}
                puzzle={puzzle}
                isSolved={solvedIds.has(puzzle.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4">
            <button
              onClick={handlePrev}
              disabled={page === 1}
              className="px-4 py-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              まえ
            </button>
            <span className="text-slate-600 font-medium">ページ {page}</span>
            <button
              onClick={handleNext}
              disabled={!hasMore}
              className="px-4 py-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              つぎ
            </button>
          </div>
        </>
      )}
    </div>
  );
}
