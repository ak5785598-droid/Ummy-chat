'use client';

import React, { type ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './core';

interface FirebaseClientProviderProps {
 children: ReactNode;
}

/**
 * HIGH-STABILITY CLIENT PROVIDER.
 * Simplified for maximum React 18 compatibility.
 * 
 * Uses the Absolute Singleton Pattern from the core module, ensuring no 
 * hook-order changes during the hydration Phase (#310).
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Directly retrieve stable singleton instances from the core initializer.
  const { firebaseApp, auth, firestore, storage } = initializeFirebase();

  return (
   <FirebaseProvider
    firebaseApp={firebaseApp}
    auth={auth || null}
    firestore={firestore || null}
    storage={storage || null}
   >
    {children}
   </FirebaseProvider>
  );
}
