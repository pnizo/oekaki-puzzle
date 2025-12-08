import type { Metadata } from "next";
import { DotGothic16, Roboto_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";



const dotGothic = DotGothic16({ weight: "400", subsets: ["latin"] });
const robotoMono = Roboto_Mono({ subsets: ["latin"], variable: "--font-roboto-mono" });

export const metadata: Metadata = {
  title: "おえかきパズル",
  description: "Create and solve pixel art puzzles",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${dotGothic.className} ${robotoMono.variable} bg-slate-50 min-h-screen text-slate-900`}>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
