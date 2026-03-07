'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * PRODUCTION FIREBASE INITIALIZATION
 * Re-engineered to simplify service retrieval and ensure absolute storage bucket stability.
 * Utilizes the default bucket from the app config for maximum reliability.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  console.log(`[Firebase Init] Initializing services for project: ${firebaseConfig.projectId}`);
  
  // CRITICAL: Switched to Force Long Polling for extreme network resilience.
  // This resolves the "Could not reach Cloud Firestore backend" timeout errors by ensuring
  // consistent connectivity in proxy or cloud-based development environments.
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    }),
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
