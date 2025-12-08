"use client";

import Link from 'next/link';
export default function Navbar() {
  return (
    <nav className="bg-slate-800 text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold tracking-tight hover:text-blue-400 transition-colors">
          おえかきパズル
        </Link>
        <div className="flex items-center space-x-6 font-medium">
          <Link href="/create" className="hover:text-blue-400 transition-colors">
            つくる
          </Link>
          <Link href="/list" className="hover:text-blue-400 transition-colors">
            あそぶ
          </Link>
        </div>
      </div>
    </nav>
  );
}
