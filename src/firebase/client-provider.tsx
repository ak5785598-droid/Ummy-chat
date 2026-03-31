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
  // STRICT HYDRATION LOCK: Prevents Vercel static generation from crashing on missing Firebase env variables,
  // and completely eliminates React Error #310 hook mismatch by forcing a clean client-side mount.
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null; // Keep SSR clean
  }

  // Safe to initialize now that we are exclusively on the client
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
