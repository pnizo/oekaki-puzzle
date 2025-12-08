import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
  runTransaction,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  startAfter,
  QueryConstraint
} from "firebase/firestore";
import { User, Puzzle } from "@/types";

// User Operations
export async function getUser(uid: string): Promise<User | null> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data() as User;
  }
  return null;
}

export async function createUser(uid: string): Promise<void> {
  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) {
    await setDoc(docRef, {
      uid,
      points: 0, // Initial points
      unlockedPuzzles: [],
      createdAt: serverTimestamp(),
    });
  }
}

export async function addPoints(uid: string, amount: number): Promise<void> {
  const docRef = doc(db, "users", uid);
  await updateDoc(docRef, {
    points: increment(amount),
  });
}

export async function consumePoints(uid: string, amount: number): Promise<boolean> {
  const docRef = doc(db, "users", uid);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(docRef);
      if (!userDoc.exists()) {
        throw new Error("User does not exist!");
      }

      const currentPoints = userDoc.data().points;
      if (currentPoints < amount) {
        throw new Error("Insufficient points!");
      }

      transaction.update(docRef, { points: currentPoints - amount });
    });
    return true;
  } catch (e) {
    console.error("Transaction failed: ", e);
    return false;
  }
}

export async function unlockPuzzle(uid: string, puzzleId: string, cost: number): Promise<boolean> {
  const userRef = doc(db, "users", uid);

  try {
    await runTransaction(db, async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists()) throw new Error("User does not exist!");

      const userData = userDoc.data() as User;
      if (userData.unlockedPuzzles?.includes(puzzleId)) {
        return; // Already unlocked
      }

      if (userData.points < cost) {
        throw new Error("Insufficient points!");
      }

      transaction.update(userRef, {
        points: userData.points - cost,
        unlockedPuzzles: [...(userData.unlockedPuzzles || []), puzzleId]
      });

      // Increment playCount (Unique Players Started)
      const puzzleRef = doc(db, "puzzles", puzzleId);
      transaction.update(puzzleRef, {
        playCount: increment(1)
      });
    });
    return true;
  } catch (e) {
    console.error("Unlock failed: ", e);
    return false;
  }
}

// Puzzle Operations
export async function createPuzzle(puzzleData: Omit<Puzzle, "id" | "createdAt" | "playCount" | "clearCount">): Promise<string> {
  const puzzlesRef = collection(db, "puzzles");
  const docRef = await addDoc(puzzlesRef, {
    ...puzzleData,
    playCount: 0,
    clearCount: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPuzzles(
  limitCount: number = 20,
  sortBy: 'playCount' | 'createdAt' = 'playCount',
  lastDoc: any = null,
  searchQuery: string = ""
): Promise<{ puzzles: Puzzle[], lastVisible: any }> {
  const puzzlesRef = collection(db, "puzzles");
  const constraints: QueryConstraint[] = [];

  if (searchQuery) {
    // Prefix search on title
    // Note: This requires an index on 'title'
    constraints.push(orderBy("title"));
    constraints.push(where("title", ">=", searchQuery));
    constraints.push(where("title", "<=", searchQuery + "\uf8ff"));
  } else {
    constraints.push(orderBy(sortBy, "desc"));
  }

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  constraints.push(limit(limitCount));

  const q = query(puzzlesRef, ...constraints);
  const querySnapshot = await getDocs(q);

  const puzzles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Puzzle));
  const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

  return { puzzles, lastVisible };
}

export async function getPuzzle(id: string): Promise<Puzzle | null> {
  const docRef = doc(db, "puzzles", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Puzzle;
  }
  return null;
}



// Solved Records
export async function recordSolved(uid: string, puzzleId: string): Promise<boolean> {
  const solvedRef = collection(db, "solved_records");
  const q = query(solvedRef, where("uid", "==", uid), where("puzzleId", "==", puzzleId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    await addDoc(solvedRef, {
      uid,
      puzzleId,
      completedAt: serverTimestamp(),
    });

    // Increment clearCount
    const puzzleRef = doc(db, "puzzles", puzzleId);
    await updateDoc(puzzleRef, {
      clearCount: increment(1)
    });

    return true; // First time solved
  }
  return false; // Already solved
}


export async function getSolvedPuzzles(uid: string): Promise<string[]> {
  const solvedRef = collection(db, "solved_records");
  const q = query(solvedRef, where("uid", "==", uid));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data().puzzleId);
}

export async function getNgWords(): Promise<string[]> {
  try {
    const docRef = doc(db, "settings", "general");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data().ngWords || [];
    }
    return [];
  } catch (e) {
    console.error("Error fetching NG words:", e);
    return [];
  }
}
