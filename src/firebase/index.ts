'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Global instance variables to ensure Firebase services are only initialized once.
 */
let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;

/**
 * PRODUCTION FIREBASE INITIALIZATION
 * Re-engineered to simplify service retrieval and ensure absolute stability.
 */
export function initializeFirebase() {
  if (!appInstance) {
    if (!getApps().length) {
      appInstance = initializeApp(firebaseConfig);
    } else {
      appInstance = getApp();
    }
  }

  if (!firestoreInstance) {
    try {
      // Initialize with Force Long Polling for resilience in proxy/slow networks.
      firestoreInstance = initializeFirestore(appInstance, {
        experimentalForceLongPolling: true,
        experimentalAutoDetectLongPolling: true,
      });
      console.log(`[Firebase Init] Firestore Initialized (Project: ${firebaseConfig.projectId})`);
    } catch (error) {
      // This catches 'already-initialized' errors gracefully from the SDK level.
      firestoreInstance = getFirestore(appInstance);
    }
  }

  return {
    firebaseApp: appInstance,
    auth: getAuth(appInstance),
    firestore: firestoreInstance,
    storage: getStorage(appInstance)
  };
}

/**
 * Deprecated: Kept for backward compatibility but calls initializeFirebase.
 */
export function getSdks(firebaseApp: FirebaseApp) {
  return initializeFirebase();
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
