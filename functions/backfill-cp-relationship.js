/**
 * Backfill profile.relationship from cpPairs for users missing it.
 * Run: node backfill-cp-relationship.js
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
  console.log(`Found ${snap.docs.length} cpPairs documents\n`);

  let updated = 0;
  for (const doc of snap.docs) {
    const cp = doc.data();
    const ids = cp.participantIds || [];
    if (ids.length !== 2) continue;

    const u1 = ids[0];
    const u2 = ids[1];

    // Check if both users have relationship set
    const u1Snap = await db.collection('users').doc(u1).collection('profile').doc(u1).get();
    const u2Snap = await db.collection('users').doc(u2).collection('profile').doc(u2).get();

    const u1Rel = u1Snap.exists ? (u1Snap.data().relationship || null) : null;
    const u2Rel = u2Snap.exists ? (u2Snap.data().relationship || null) : null;

    const u1PartnerData = {
      uid: u2,
      name: cp.user2Name || 'Partner',
      avatarUrl: cp.user2Avatar || '',
      startDate: cp.createdAt ? cp.createdAt.toDate().toISOString() : new Date().toISOString(),
    };

    const u2PartnerData = {
      uid: u1,
      name: cp.user1Name || 'Partner',
      avatarUrl: cp.user1Avatar || '',
      startDate: cp.createdAt ? cp.createdAt.toDate().toISOString() : new Date().toISOString(),
    };

    // Fix user 1
    if (!u1Rel || u1Rel.type === 'None' || !u1Rel.partnerUid) {
      await db.collection('users').doc(u1).collection('profile').doc(u1).update({
        relationship: { type: cp.type || 'CP', ...u1PartnerData }
      });
      console.log(`  Fixed ${u1} → partner: ${cp.user2Name || u2}`);
      updated++;
    } else {
      console.log(`  ${u1} already has relationship ✓`);
    }

    // Fix user 2
    if (!u2Rel || u2Rel.type === 'None' || !u2Rel.partnerUid) {
      await db.collection('users').doc(u2).collection('profile').doc(u2).update({
        relationship: { type: cp.type || 'CP', ...u2PartnerData }
      });
      console.log(`  Fixed ${u2} → partner: ${cp.user1Name || u1}`);
      updated++;
    } else {
      console.log(`  ${u2} already has relationship ✓`);
    }
  }

  console.log(`\nDone! Updated ${updated} profiles.`);
  process.exit(0);
}

backfill().catch(err => { console.error(err); process.exit(1); });
