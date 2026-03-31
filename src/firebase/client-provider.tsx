'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
 children: ReactNode;
}

/**
 * HIGH-STABILITY CLIENT PROVIDER.
 * Simplified for maximum React 18 compatibility.
 * 
 * Uses the Absolute Singleton Pattern from the index, ensuring no 
 * hook-order changes during the hydration Phase (#310).
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Directly retrieve stable singleton instances.
  // SSR isolation is now handled by the parent layout via next/dynamic.
  const { firebaseApp, auth, firestore, storage } = initializeFirebase();

  return (
   <FirebaseProvider
    firebaseApp={firebaseApp}
    auth={auth || {} as any}
    firestore={firestore || {} as any}
    storage={storage || {} as any}
   >
    {children}
   </FirebaseProvider>
  );
}
