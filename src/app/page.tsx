import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-12 text-center">
      <div className="space-y-4">
        <h1 className="text-5xl font-extrabold text-slate-800 tracking-tight">
          Welcome to <span className="text-blue-600">おえかきパズル</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto">
          Draw colorful pixel art, convert it into logic puzzles, and challenge others to solve them!
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6">
        <Link
          href="/create"
          className="px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          Create Puzzle
        </Link>
        <Link
          href="/list"
          className="px-8 py-4 bg-emerald-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-emerald-700 hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          Solve Puzzles
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left max-w-4xl">
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-2 text-slate-800">🎨 Draw</h3>
          <p className="text-slate-600">Create pixel art on grids from 4x4 to 20x20.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-2 text-slate-800">🧩 Convert</h3>
          <p className="text-slate-600">Your art is automatically converted into a logic puzzle.</p>
        </div>
        <div className="p-6 bg-white rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-xl font-bold mb-2 text-slate-800">🏆 Compete</h3>
          <p className="text-slate-600">Earn points by creating and solving popular puzzles.</p>
        </div>
      </div>
    </div>
  );
}
