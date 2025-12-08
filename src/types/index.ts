import { Timestamp } from "firebase/firestore";

export interface User {
  uid: string;
  points: number;
  unlockedPuzzles: string[];
  createdAt: Timestamp;
}

export interface Puzzle {
  id: string;
  creatorUid: string;
  title: string;
  width: number;
  height: number;
  data: number[]; // Flattened array: 1 = Black, 0 = White
  originalImage: string[]; // Flattened array of hex colors
  playCount: number;
  clearCount: number;
  createdAt: Timestamp;
}

export interface SolvedRecord {
  uid: string;
  puzzleId: string;
  completedAt: Timestamp;
}
