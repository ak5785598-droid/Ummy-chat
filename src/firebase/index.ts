'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// A record to hold the initialized SDKs to prevent re-initialization.
let firebaseServices: { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore, storage: FirebaseStorage } | null = null;

/**
 * Initializes Firebase services with high-fidelity connectivity protocols.
 * Uses experimentalForceLongPolling to ensure stability on mobile networks.
 */
export function initializeFirebase() {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

  const auth = getAuth(app);
  
  // High-Fidelity Connectivity fix for restricted environments (Mobile/Android stability)
  const firestore = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });
  
  const storage = getStorage(app);

  firebaseServices = {
    firebaseApp: app,
    auth,
    firestore,
    storage,
  };

  return firebaseServices;
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
