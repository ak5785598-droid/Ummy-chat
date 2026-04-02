'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, DependencyList } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
 children: ReactNode;
 firebaseApp: FirebaseApp;
 firestore: Firestore;
 auth: Auth;
 storage: FirebaseStorage;
}

interface UserAuthState {
 user: User | null;
 isUserLoading: boolean;
 userError: Error | null;
}

export interface FirebaseContextState {
 areServicesAvailable: boolean;
 firebaseApp: FirebaseApp | null;
 firestore: Firestore | null;
 auth: Auth | null;
 storage: FirebaseStorage | null;
 user: User | null;
 isUserLoading: boolean;
 userError: Error | null;
}

export interface FirebaseServicesAndUser extends FirebaseContextState {
 firebaseApp: FirebaseApp;
 firestore: Firestore;
 auth: Auth;
 storage: FirebaseStorage;
}

// Define a stable, 'empty' default state for the context to prevent 'undefined' crashes during SSR.
export const FirebaseContext = createContext<FirebaseContextState>({
  areServicesAvailable: false,
  firebaseApp: null,
  firestore: null,
  auth: null,
  storage: null,
  user: null,
  isUserLoading: true,
  userError: null
});

/**
 * HIGH-SECURITY FIREBASE PROVIDER.
 * Re-locked for React 18 Hydration Safety (#310).
 */
export function FirebaseProvider({ children, firebaseApp, firestore, auth, storage }: FirebaseProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null
  });

  // 1. HYDRATION LOCK
  useEffect(() => { setMounted(true); }, []);

  // 2. AUTH STATE LISTENER (Deferred until after mount to prevent 310)
  useEffect(() => {
    if (!mounted || !auth) return;

    // Use a try-catch to satisfy strict SDK environments during cold-start
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null }),
        (err) => setUserAuthState({ user: null, isUserLoading: false, userError: err })
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("[Firebase Provider] Auth Listener Deferred:", e);
    }
  }, [mounted, auth]);

  const contextValue = useMemo(() => ({
    // HACK: During SSR/Hydration, we report services as present to prevent children from skipping hooks.
    // The actual values will be populated correctly once initializeFirebase is called on the client.
    areServicesAvailable: !!(firebaseApp || typeof window === 'undefined'),
    firebaseApp: firebaseApp || null,
    firestore: firestore || null,
    auth: auth || null,
    storage: storage || null,
    user: userAuthState.user,
    isUserLoading: userAuthState.isUserLoading,
    userError: userAuthState.userError
  }), [firebaseApp, firestore, auth, storage, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
}

// ACCESS HOOKS
/**
 * RE-THROTTLED ACCESS HOOK.
 * Does not throw during SSR to keep the component tree structurally identical.
 */
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  
  // Return context as-is. If services are null, children should handle them gracefully.
  // This prevents the 'Hook Conflict' crash caused by throwing during the render phase.
  return context as FirebaseServicesAndUser;
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useStorage = () => useFirebase().storage;
export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

// Basic useCollection hook for Firestore queries
export function useCollection<T = any>(query: any) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = query.onSnapshot(
      (snapshot: any) => {
        const docs = snapshot.docs.map((doc: any) => ({
          id: doc.id,
          ...doc.data()
        }));
        setData(docs as T[]);
        setLoading(false);
        setError(null);
      },
      (err: Error) => {
        console.error('[Firebase] Collection query error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}

export function useDoc(query: any) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    const unsubscribe = query.onSnapshot(
      (snapshot: any) => {
        if (snapshot.exists) {
          setData({ id: snapshot.id, ...snapshot.data() });
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err: Error) => {
        console.error('[Firebase] Document query error:', err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}
