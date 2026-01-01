'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// A record to hold the initialized SDKs to prevent re-initialization.
let firebaseServices: { firebaseApp: FirebaseApp; auth: Auth; firestore: Firestore, storage: FirebaseStorage } | null = null;

/**
 * Initializes Firebase services if they haven't been already.
 * This function handles both server-side and client-side execution environments
 * and ensures that `initializeApp` is called only once.
 *
 * @returns An object containing the initialized `firebaseApp`, `auth`, and `firestore` instances.
 */
export function initializeFirebase() {
  // Return the cached services if they already exist.
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

  const auth = getAuth(app);
  const firestore = getFirestore(app);
  const storage = getStorage(app);

  // Cache the initialized services.
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
