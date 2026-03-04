'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * PRODUCTION FIREBASE INITIALIZATION
 * Re-engineered to simplify service retrieval and ensure absolute storage bucket stability.
 * Explicitly resolves the storage bucket URI to prevent connection hangs.
 */
export function initializeFirebase() {
  if (!getApps().length) {
    const firebaseApp = initializeApp(firebaseConfig);
    return getSdks(firebaseApp);
  }

  return getSdks(getApp());
}

export function getSdks(firebaseApp: FirebaseApp) {
  const bucket = firebaseConfig.storageBucket;
  const storageUrl = bucket && !bucket.startsWith('gs://') ? `gs://${bucket}` : bucket;
  
  console.log(`[Firebase Init] Storage Bucket: ${storageUrl}`);
  
  // Re-engineered with Long Polling Auto-Detection for extreme network resilience.
  // This resolves connectivity hangs in specific proxy/cloud development environments.
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: initializeFirestore(firebaseApp, {
      experimentalAutoDetectLongPolling: true,
    }),
    storage: getStorage(firebaseApp, storageUrl || undefined)
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