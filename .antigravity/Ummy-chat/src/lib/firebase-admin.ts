import * as admin from 'firebase-admin';

const projectId = "studio-7826224327-e0efc";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: projectId,
    // When running on Vercel/Server, it will use environment credentials automatically
    // or you can provide a service account via FIREBASE_SERVICE_ACCOUNT_KEY env var
  });
}

const adminDb = admin.firestore();
const adminAuth = admin.auth();

export { adminDb, adminAuth, admin };
