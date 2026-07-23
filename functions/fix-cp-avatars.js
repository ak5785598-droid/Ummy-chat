/**
 * Fix cpPairs avatar URLs from actual user profiles.
 * Run: node fix-cp-avatars.js
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app',
});

const db = admin.firestore();

async function fix() {
  const snap = await db.collection('cpPairs').get();
  console.log(`Found ${snap.docs.length} cpPairs documents\n`);

  let fixed = 0;
  for (const doc of snap.docs) {
    const cp = doc.data();
    const ids = cp.participantIds || [];
    if (ids.length !== 2) continue;

    const u1 = ids[0];
    const u2 = ids[1];

    // Read actual profiles
    const u1ProfileSnap = await db.collection('users').doc(u1).collection('profile').doc(u1).get();
    const u2ProfileSnap = await db.collection('users').doc(u2).collection('profile').doc(u2).get();

    const u1Data = u1ProfileSnap.exists ? u1ProfileSnap.data() : {};
    const u2Data = u2ProfileSnap.exists ? u2ProfileSnap.data() : {};

    const u1Avatar = u1Data.avatarUrl || '';
    const u1Name = u1Data.username || 'User 1';
    const u2Avatar = u2Data.avatarUrl || '';
    const u2Name = u2Data.username || 'User 2';

    const updates = {};

    // Always fix avatars from real profiles
    if (u1Avatar) updates.user1Avatar = u1Avatar;
    if (u2Avatar) updates.user2Avatar = u2Avatar;

    // Always fix names from real profiles
    if (u1Name) updates.user1Name = u1Name;
    if (u2Name) updates.user2Name = u2Name;

    // Fix type if missing
    if (!cp.type) updates.type = 'CP';

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      fixed++;
      console.log(`  Fixed ${doc.id}:`);
      console.log(`    User1: ${u1Name} (${u1Avatar ? 'avatar ✓' : 'no avatar'})`);
      console.log(`    User2: ${u2Name} (${u2Avatar ? 'avatar ✓' : 'no avatar'})`);
      console.log(`    Type: ${updates.type || cp.type}`);
    } else {
      console.log(`  ${doc.id}: already correct ✓`);
    }
  }

  console.log(`\nDone! Fixed ${fixed}/${snap.docs.length} documents.`);
  process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });
