import { useState, useEffect } from 'react';
import { onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { createUser } from '@/lib/firestore';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        // Ensure user doc exists in Firestore
        try {
          await createUser(u.uid);
        } catch (e) {
          console.error("Error creating user doc:", e);
        }
      } else {
        // Auto sign-in anonymously if not signed in
        try {
          await signInAnonymously(auth);
        } catch (e) {
          console.error("Error signing in anonymously:", e);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
