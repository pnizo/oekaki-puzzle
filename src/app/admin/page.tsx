"use client";

import { useState, useEffect } from 'react';

export default function AdminPage() {
  const [token, setToken] = useState("");
  const [ngWords, setNgWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [puzzles, setPuzzles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'ng-words' | 'puzzles'>('ng-words');

  // Puzzle Pagination & Search State
  const [searchInput, setSearchInput] = useState("");
  const [activeSearchQuery, setActiveSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [lastIds, setLastIds] = useState<string[]>([]); // Stack of lastIds for previous pages
  const [hasMore, setHasMore] = useState(true);

  const fetchNgWords = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ng-words', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNgWords(data.ngWords || []);
        setIsAuthenticated(true);
        setMessage("");
        // Also fetch puzzles if authenticated
        fetchPuzzles(authToken, "", null);
      } else {
        setMessage("Authentication failed or error fetching data.");
        setIsAuthenticated(false);
      }
    } catch (e) {
      console.error(e);
      setMessage("Error fetching data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchPuzzles = async (authToken: string, search: string, lastId: string | null) => {
    try {
      const params = new URLSearchParams();
      params.append('limit', '20');
      if (search) params.append('search', search);
      if (lastId) params.append('lastId', lastId);

      const res = await fetch(`/api/admin/puzzles?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPuzzles(data.puzzles || []);

        // Update pagination state
        if (data.puzzles.length < 20) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }

        // If we have a lastId in response, it's the cursor for the NEXT page
        // But we store the cursor for the CURRENT page in the stack to go back?
        // Actually, standard cursor pagination:
        // Page 1: lastId=null. Returns lastId_1.
        // Page 2: lastId=lastId_1. Returns lastId_2.
        // To go back from Page 2 to Page 1, we just need to reload with lastId=null.
        // So `lastIds` stack should store the cursor used to fetch the current page?
        // Let's simplify: `lastIds` stores the cursors for [Page 1, Page 2, ...].
        // Page 1 cursor is null.
        // When moving to Page 2, we push `data.lastId` (from Page 1 response) to stack? 
        // No, `data.lastId` is the cursor for the NEXT page.
      }
    } catch (e) {
      console.error("Error fetching puzzles:", e);
    }
  };

  const handleSearch = () => {
    setPage(1);
    setLastIds([]);
    setActiveSearchQuery(searchInput);
    fetchPuzzles(token, searchInput, null);
  };

  const handleNextPage = async () => {
    if (puzzles.length === 0) return;
    const lastVisibleId = puzzles[puzzles.length - 1].id;

    // Fetch next page
    const params = new URLSearchParams();
    params.append('limit', '20');
    if (activeSearchQuery) params.append('search', activeSearchQuery);
    params.append('lastId', lastVisibleId);

    try {
      const res = await fetch(`/api/admin/puzzles?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.puzzles.length > 0) {
          setLastIds([...lastIds, lastVisibleId]); // Save current end as cursor for back tracking? No, wait.
          // To go back to Page 1, we need null.
          // To go back to Page 2, we need Page 1's last ID.
          // So we push the ID we just used to fetch THIS new page? No.
          // We are currently on Page 1. We click Next. We use `lastVisibleId` to fetch Page 2.
          // If successful, we advance state.
          setPuzzles(data.puzzles);
          setPage(page + 1);
          setHasMore(data.puzzles.length === 20);
        } else {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrevPage = async () => {
    if (page <= 1) return;

    // The cursor for the previous page is at index (page - 2) in lastIds?
    // Page 1: lastIds = [] (cursor null)
    // Page 2: lastIds = [id1] (cursor id1)
    // Page 3: lastIds = [id1, id2] (cursor id2)
    // To go from 3 to 2: use id1 (index 0). page is 3. index = 3 - 3 = 0?
    // To go from 2 to 1: use null. page is 2. index = 2 - 3 = -1?

    // Let's fix the stack logic.
    // When going Next: push the ID used to fetch the *next* page?
    // Actually, simpler:
    // `lastIds` stores the cursor used to fetch *each page*.
    // Page 1: cursor null. Stack: [null]
    // Page 2: cursor id1. Stack: [null, id1]
    // Page 3: cursor id2. Stack: [null, id1, id2]

    // Current page is `page`.
    // To go Prev (to page-1), we use `lastIds[page - 2]`.

    const newLastIds = [...lastIds];
    newLastIds.pop(); // Remove current page's cursor? No.
    // If we are on Page 2, stack is [null, id1].
    // We want to go to Page 1. We need cursor `null`.
    // We pop `id1`. Stack becomes [null]. We use `null`.

    const prevCursor = newLastIds[newLastIds.length - 1] || null; // This logic is tricky with just pop.

    // Let's just re-fetch using the cursor for the previous page.
    // If we are on Page 2, we want to fetch Page 1.
    // We need to know what cursor fetched Page 1. It was null.
    // If we are on Page 3, we want to fetch Page 2.
    // We need to know what cursor fetched Page 2. It was id1.

    // So `lastIds` should store the END ID of each page?
    // Page 1 ends at id1.
    // Page 2 ends at id2.
    // To fetch Page 2, we used id1.
    // To fetch Page 3, we used id2.

    // Let's try this:
    // `cursors` array.
    // Page 1 loaded. `cursors[0]` = null.
    // Click Next. Use `puzzles[last].id`.
    // Page 2 loaded. `cursors[1]` = `puzzles[last].id` (of page 1).

    const cursorToUse = page > 2 ? lastIds[page - 3] : null;
    // Wait, if page is 2. We want page 1. Cursor is null.
    // lastIds has [id1].

    // Let's restart logic.
    // We are on Page `page`.
    // `lastIds` contains the cursors used to fetch Page 2, Page 3, etc.
    // Page 1: lastIds = [].
    // Click Next: fetch with `id1`. Success. Page=2. lastIds=[id1].
    // Click Next: fetch with `id2`. Success. Page=3. lastIds=[id1, id2].

    // Click Prev (from 3):
    // We want Page 2. Cursor for Page 2 is `id1`.
    // `id1` is at `lastIds[0]`. `lastIds.length` is 2.
    // We want `lastIds[lastIds.length - 2]`.

    // Click Prev (from 2):
    // We want Page 1. Cursor is null.
    // `lastIds` is [id1].
    // We want null.

    let cursor = null;
    if (page > 2) {
      cursor = lastIds[lastIds.length - 2];
    }

    // Fetch
    const params = new URLSearchParams();
    params.append('limit', '20');
    if (activeSearchQuery) params.append('search', activeSearchQuery);
    if (cursor) params.append('lastId', cursor);

    try {
      const res = await fetch(`/api/admin/puzzles?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPuzzles(data.puzzles);
        setPage(page - 1);
        setHasMore(true);
        setLastIds(lastIds.slice(0, -1)); // Remove the last cursor
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to handle Next properly updating stack
  const handleNext = async () => {
    if (puzzles.length === 0) return;
    const cursor = puzzles[puzzles.length - 1].id;

    const params = new URLSearchParams();
    params.append('limit', '20');
    if (activeSearchQuery) params.append('search', activeSearchQuery);
    params.append('lastId', cursor);

    try {
      const res = await fetch(`/api/admin/puzzles?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.puzzles.length > 0) {
          setPuzzles(data.puzzles);
          setPage(page + 1);
          setLastIds([...lastIds, cursor]);
          setHasMore(data.puzzles.length === 20);
        } else {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogin = () => {
    if (token) {
      fetchNgWords(token);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/ng-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ngWords })
      });

      if (res.ok) {
        setMessage("Saved successfully!");
      } else {
        setMessage("Failed to save.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Error saving data.");
    } finally {
      setLoading(false);
    }
  };

  const deletePuzzle = async (id: string) => {
    if (!confirm("Are you sure you want to delete this puzzle?")) return;
    if (!token) return;

    try {
      const res = await fetch(`/api/admin/puzzles?id=${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setPuzzles(puzzles.filter(p => p.id !== id));
        setMessage("Puzzle deleted successfully.");
      } else {
        setMessage("Failed to delete puzzle.");
      }
    } catch (e) {
      console.error(e);
      setMessage("Error deleting puzzle.");
    }
  };

  const addWord = () => {
    if (newWord && !ngWords.includes(newWord)) {
      setNgWords([...ngWords, newWord]);
      setNewWord("");
    }
  };

  const removeWord = (word: string) => {
    setNgWords(ngWords.filter(w => w !== word));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-sm">
      <h1 className="text-3xl font-bold mb-8 text-slate-800">Admin Panel</h1>

      {!isAuthenticated ? (
        <div className="flex flex-col space-y-4 max-w-md mx-auto">
          <label className="font-medium">Admin Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="border p-2 rounded"
            placeholder="Enter Admin Token"
          />
          <button
            onClick={handleLogin}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Login"}
          </button>
          {message && <p className="text-red-500">{message}</p>}
        </div>
      ) : (
        <div className="flex flex-col space-y-6">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'ng-words' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('ng-words')}
            >
              NG Words
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'puzzles' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
              onClick={() => setActiveTab('puzzles')}
            >
              Puzzles
            </button>
          </div>

          {activeTab === 'ng-words' && (
            <div>
              <h2 className="text-xl font-bold mb-4">NG Words Management</h2>
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={newWord}
                  onChange={(e) => setNewWord(e.target.value)}
                  className="border p-2 rounded flex-grow"
                  placeholder="Add new NG word"
                />
                <button
                  onClick={addWord}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Add
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-6">
                {ngWords.map((word) => (
                  <span key={word} className="bg-red-100 text-red-800 px-3 py-1 rounded-full flex items-center">
                    {word}
                    <button
                      onClick={() => removeWord(word)}
                      className="ml-2 text-red-600 hover:text-red-800 font-bold"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="border-t pt-6">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'puzzles' && (
            <div>
              <h2 className="text-xl font-bold mb-4">Puzzle Management</h2>

              {/* Search */}
              <div className="flex space-x-2 mb-4">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="border p-2 rounded flex-grow"
                  placeholder="Search by title (case-sensitive)..."
                />
                <button
                  onClick={handleSearch}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Search
                </button>
              </div>

              <div className="overflow-x-auto mb-4">
                <table className="min-w-full bg-white border">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="py-2 px-4 border-b">Title</th>
                      <th className="py-2 px-4 border-b">Size</th>
                      <th className="py-2 px-4 border-b">Played</th>
                      <th className="py-2 px-4 border-b">Cleared</th>
                      <th className="py-2 px-4 border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {puzzles.map((puzzle) => (
                      <tr key={puzzle.id} className="hover:bg-slate-50">
                        <td className="py-2 px-4 border-b">{puzzle.title}</td>
                        <td className="py-2 px-4 border-b">{puzzle.width}x{puzzle.height}</td>
                        <td className="py-2 px-4 border-b">{puzzle.playCount || 0}</td>
                        <td className="py-2 px-4 border-b">{puzzle.clearCount || 0}</td>
                        <td className="py-2 px-4 border-b">
                          <button
                            onClick={() => deletePuzzle(puzzle.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {puzzles.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-500">No puzzles found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center">
                <button
                  onClick={handlePrevPage}
                  disabled={page === 1}
                  className="px-4 py-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-slate-600">Page {page}</span>
                <button
                  onClick={handleNext}
                  disabled={!hasMore}
                  className="px-4 py-2 border rounded hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {message && <p className={`mt-2 text-center ${message.includes("Success") || message.includes("success") ? "text-green-600" : "text-red-500"}`}>{message}</p>}
        </div>
      )}
    </div>
  );
}
