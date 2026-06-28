/**
 * Manual Leaderboard Reset Script
 * Run: node functions/manual-reset.js
 * Resets dailySpent, weeklySpent, monthlySpent for ALL users right now
 */

const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Try loading service account, fallback to application default
let app;
try {
  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
} catch (e) {
  app = admin.initializeApp();
}

const db = admin.firestore();

async function resetAll() {
  console.log('🔄 Starting FULL reset (daily + weekly + monthly)...\n');

  const usersSnapshot = await db.collection('users').get();
  const total = usersSnapshot.docs.length;
  console.log(`👥 Found ${total} users to reset\n`);

  let count = 0;
  let batch = db.batch();

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const rootRef = userDoc.ref;
    const profRef = db.doc(`users/${uid}/profile/${uid}`);

    const resetFields = {
      'wallet.dailySpent':          0,
      'wallet.weeklySpent':         0,
      'wallet.monthlySpent':        0,
      'stats.dailyGiftsReceived':   0,
      'stats.weeklyGiftsReceived':  0,
      'stats.monthlyGiftsReceived': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.update(rootRef, resetFields);
    batch.update(profRef, resetFields);
    count++;

    // 2 ops per user → flush every 250
    if (count % 250 === 0) {
      await batch.commit();
      batch = db.batch();
      console.log(`  ✅ Reset ${count}/${total} users...`);
    }
  }
  if (count % 250 !== 0) await batch.commit();

  console.log(`\n✅ Users reset: ${count}`);

  // Reset rooms
  const roomsSnapshot = await db.collection('chatRooms').get();
  let roomBatch = db.batch();
  let roomCount = 0;

  for (const doc of roomsSnapshot.docs) {
    roomBatch.update(doc.ref, {
      'stats.dailyGifts':   0,
      'stats.weeklyGifts':  0,
      'stats.monthlyGifts': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    roomCount++;
    if (roomCount % 500 === 0) {
      await roomBatch.commit();
      roomBatch = db.batch();
    }
  }
  if (roomCount % 500 !== 0) await roomBatch.commit();

  console.log(`✅ Rooms reset: ${roomCount}`);
  console.log('\n🎉 FULL RESET COMPLETE! Leaderboard is now fresh.\n');

  process.exit(0);
}

resetAll().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
