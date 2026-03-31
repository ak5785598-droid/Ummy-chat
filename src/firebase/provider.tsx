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

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

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

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => setUserAuthState({ user: firebaseUser, isUserLoading: false, userError: null }),
      (err) => setUserAuthState({ user: null, isUserLoading: false, userError: err })
    );

    return () => unsubscribe();
  }, [mounted, auth]);

  const contextValue = useMemo(() => ({
    areServicesAvailable: !!(firebaseApp && firestore && auth && storage),
    firebaseApp,
    firestore,
    auth,
    storage,
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
export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);
  if (!context || !context.firebaseApp || !context.firestore || !context.auth || !context.storage) {
    throw new Error('useFirebase must be used within a fully initialized FirebaseProvider.');
  }
  return context as FirebaseServicesAndUser;
};

export const useAuth = () => useFirebase().auth;
export const useFirestore = () => useFirebase().firestore;
export const useStorage = () => useFirebase().storage;
export const useUser = () => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  return useMemo(factory, deps);
}
