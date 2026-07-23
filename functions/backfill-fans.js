/**
 * Backfill fans count from followers collection.
 * Run: node backfill-fans.js
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function backfill() {
  const followersSnap = await db.collection('followers').get();
  console.log(`Found ${followersSnap.docs.length} follow relationships\n`);

  const fanCounts = {};
  for (const doc of followersSnap.docs) {
    const data = doc.data();
    const followingId = data.followingId;
    if (followingId) {
      fanCounts[followingId] = (fanCounts[followingId] || 0) + 1;
    }
  }

  console.log(`Found ${Object.keys(fanCounts).length} users with fans\n`);

  let updated = 0;
  for (const [uid, count] of Object.entries(fanCounts)) {
    try {
      await db.collection('users').doc(uid).collection('profile').doc(uid).update({
        'stats.fans': count,
      });
      updated++;
      console.log(`  ${uid}: fans = ${count}`);
    } catch (e) {
      console.log(`  Failed: ${uid} - ${e.message}`);
    }
  }

  console.log(`\nDone! Updated ${updated} profiles.`);
  process.exit(0);
}

backfill().catch(err => { console.error(err); process.exit(1); });
