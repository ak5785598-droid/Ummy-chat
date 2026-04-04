'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo, DependencyList } from 'react';
import { onSnapshot } from 'firebase/firestore';
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
 isLoading: boolean;
 userError: Error | null;
}

export interface FirebaseContextState {
 areServicesAvailable: boolean;
 firebaseApp: FirebaseApp | null;
 firestore: Firestore | null;
 auth: Auth | null;
 storage: FirebaseStorage | null;
 user: User | null;
 isLoading: boolean;
 isHydrated: boolean;
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
  isLoading: true,
  isHydrated: false,
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
    isLoading: true,
    userError: null
  });

  // 1. HYDRATION LOCK (With Atomic Buffer to prevent redirect-pulse crashes)
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100); 
    return () => clearTimeout(timer);
  }, []);

  // 2. AUTH STATE LISTENER (Deferred until after buffer to prevent 310)
  useEffect(() => {
    if (!mounted || !auth) return;

    // Use a try-catch to satisfy strict SDK environments during cold-start
    try {
      const unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => setUserAuthState({ user: firebaseUser, isLoading: false, userError: null }),
        (err) => setUserAuthState({ user: null, isLoading: false, userError: err })
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn("[Firebase Provider] Auth Listener Deferred:", e);
    }
  }, [mounted, auth]);

  const contextValue = useMemo(() => ({
    // HACK: During SSR/Hydration, we report services as present to prevent children from skipping hooks.
    // However, we MUST stay as "Guest" (user = null) until after the first-pass hydration is confirmed.
    areServicesAvailable: !!(firebaseApp || typeof window === 'undefined'),
    firebaseApp: firebaseApp || null,
    firestore: firestore || null,
    auth: auth || null,
    storage: storage || null,
    // CRITICAL: Force user to null during hydration window
    user: mounted ? userAuthState.user : null,
    isLoading: mounted ? userAuthState.isLoading : true,
    isHydrated: mounted,
    userError: mounted ? userAuthState.userError : null
  }), [firebaseApp, firestore, auth, storage, userAuthState, mounted]);

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

// 3. SERVICE ACCESS HOOKS
export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useStorage = () => useFirebase().storage;
export const useUser = () => {
  const { user, isLoading, userError } = useFirebase();
  return { user, isLoading, userError };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}

// 4. FIRESTORE HOOKS
export function useCollection<T = any>(query: any) {
  const { isHydrated, firestore } = useFirebase();
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query || !isHydrated) {
      if (!isHydrated) setIsLoading(true);
      else setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(query, 
      (snapshot: any) => {
        const docs = snapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() })) as T[];
        setData(docs);
        setIsLoading(false);
        setError(null);
      },
      (err: any) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query, firestore, isHydrated]);

  return { data, isLoading: !isHydrated || isLoading, error };
}

export function useDoc<T = any>(docRef: any, options?: { suppressGlobalError?: boolean }) {
  const { isHydrated, firestore } = useFirebase();
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docRef || !isHydrated) {
      if (!isHydrated) setIsLoading(true);
      else setIsLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(docRef, 
      (snapshot: any) => {
        setData(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() }) as T : null);
        setIsLoading(false);
        setError(null);
      },
      (err: any) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [docRef, firestore, isHydrated]);

  return { data, isLoading: !isHydrated || isLoading, error };
}
