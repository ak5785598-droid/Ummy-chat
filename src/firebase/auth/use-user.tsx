'use client';
  
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, Auth } from 'firebase/auth';
import { useAuth } from '../provider';

export interface UserHookResult {
 user: User | null;
 isLoading: boolean;
 error: Error | null;
}

/**
 * React hook to subscribe to Firebase user authentication state.
 *
 * @returns {UserHookResult} Object with user, isLoading, and error state.
 */
export function useUser(): UserHookResult {
 const auth = useAuth();
 const [user, setUser] = useState<User | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [error, setError] = useState<Error | null>(null);

 useEffect(() => {
  if (!auth) {
   setIsLoading(false);
   // Optional: Set an error if auth service is not available
   // setError(new Error("Firebase Auth service not available."));
   return;
  }

  const unsubscribe = onAuthStateChanged(
   auth,
   (firebaseUser) => {
    setUser(firebaseUser);
    setIsLoading(false);
   },
   (authError) => {
    console.error("useUser auth error:", authError);
    setError(authError);
    setIsLoading(false);
   }
  );

  // Cleanup subscription on unmount
  return () => unsubscribe();
 }, [auth]); // Re-run effect if the auth instance changes

 return { user, isLoading, error };
}
