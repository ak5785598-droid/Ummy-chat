'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Global instance variable to ensure Firestore is only initialized once with the correct settings.
 */
let firestoreInstance: Firestore | null = null;

/**
 * PRODUCTION FIREBASE INITIALIZATION
 * Re-engineered to simplify service retrieval and ensure absolute storage bucket stability.
 * Utilizes the default bucket from the app config for maximum reliability.
 */
export function initializeFirebase() {
 let app: FirebaseApp;
 if (!getApps().length) {
  app = initializeApp(firebaseConfig);
 } else {
  app = getApp();
 }

 return getSdks(app);
}

export function getSdks(firebaseApp: FirebaseApp) {
 console.log(`[Firebase Init] Synchronizing services for project: ${firebaseConfig.projectId}`);
 
 if (!firestoreInstance) {
  try {
   // CRITICAL: Switched to Force Long Polling for extreme network resilience.
   // This resolves the "Could not reach Cloud Firestore backend" timeout errors by ensuring
   // consistent connectivity in proxy or cloud-based development environments.
   // experimentalAutoDetectLongPolling is added for additional fallback capability.
   firestoreInstance = initializeFirestore(firebaseApp, {
    experimentalForceLongPolling: true,
    experimentalAutoDetectLongPolling: true,
   });
   console.log('[Firebase Init] Firestore synchronized with Long-Polling protocol.');
  } catch (error) {
   console.warn('[Firebase Init] Firestore already established, retrieving existing instance.');
   firestoreInstance = getFirestore(firebaseApp);
  }
 }

 return {
  firebaseApp,
  auth: getAuth(firebaseApp),
  firestore: firestoreInstance,
  // Using the default bucket from the initialized app is the most stable protocol.
  storage: getStorage(firebaseApp)
 };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
