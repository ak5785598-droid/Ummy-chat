'use client';

import { firebaseConfig } from './config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { initializeFirestore, getFirestore, Firestore, persistentLocalCache, persistentSingleTabManager } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getDatabase, Database } from 'firebase/database';

/**
 * ABSOLUTE SINGLETON PATTERN - CORE INITIALIZATION.
 * This file is the "base" of the Firebase module to prevent circular dependencies.
 * It contains the actual service instances and the initialization logic.
 */
let appInstance: FirebaseApp | null = null;
let firestoreInstance: Firestore | null = null;
let authInstance: Auth | null = null;
let storageInstance: FirebaseStorage | null = null;
let databaseInstance: Database | null = null;

export function initializeFirebase() {
  if (typeof window === 'undefined') {
    // Basic initialization for SSR (Static Generation Phase)
    // We avoid complex configurations here to ensure the build server doesn't crash.
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
      storage: getStorage(app),
      database: getDatabase(app)
    };
  }

  // BROWSER / CLIENT SIDE: Absolute Singleton Persistence
  if (!appInstance) {
    appInstance = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }

  if (!firestoreInstance) {
    try {
      firestoreInstance = initializeFirestore(appInstance, {
        localCache: persistentLocalCache({
          tabManager: persistentSingleTabManager({ forceOwnership: true })
        }),
        experimentalAutoDetectLongPolling: true,
      });
      console.log('[Firebase Core] Firestore initialized with auto-long-polling');
    } catch (e) {
      console.warn('[Firebase Core] Long polling failed, using default:', e);
      firestoreInstance = getFirestore(appInstance);
    }
  }

  if (!authInstance) {
    authInstance = getAuth(appInstance);
  }

  if (!storageInstance) {
    storageInstance = getStorage(appInstance);
  }

  if (!databaseInstance) {
    databaseInstance = getDatabase(appInstance);
  }

  return {
    firebaseApp: appInstance,
    auth: authInstance,
    firestore: firestoreInstance,
    storage: storageInstance,
    database: databaseInstance
  };
}

export function getSdks() {
  return initializeFirebase();
}
