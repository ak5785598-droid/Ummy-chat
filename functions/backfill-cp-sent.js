/**
 * Backfill user1Sent/user2Sent for existing cpPairs.
 * Run: node backfill-cp-sent.js
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app',
});

const db = admin.firestore();

async function backfill() {
  const snap = await db.collection('cpPairs').get();
  console.log(`Found ${snap.docs.length} cpPairs documents`);

  let updated = 0;
  for (const doc of snap.docs) {
    const data = doc.data();
    const updates = {};

    if (data.user1Sent === undefined) updates.user1Sent = 0;
    if (data.user2Sent === undefined) updates.user2Sent = 0;

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      updated++;
      console.log(`  Updated ${doc.id}: ${JSON.stringify(updates)}`);
    }
  }

  console.log(`\nDone! Updated ${updated}/${snap.docs.length} documents.`);
  process.exit(0);
}

backfill().catch(err => { console.error(err); process.exit(1); });
