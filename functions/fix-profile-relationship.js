/**
 * Fix profile.relationship.partnerAvatar/partnerName from actual user profiles.
 * Run: node fix-profile-relationship.js
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
    const u1Snap = await db.collection('users').doc(u1).collection('profile').doc(u1).get();
    const u2Snap = await db.collection('users').doc(u2).collection('profile').doc(u2).get();

    const u1Data = u1Snap.exists ? u1Snap.data() : {};
    const u2Data = u2Snap.exists ? u2Snap.data() : {};

    const u1Avatar = u1Data.avatarUrl || '';
    const u1Name = u1Data.username || 'User 1';
    const u2Avatar = u2Data.avatarUrl || '';
    const u2Name = u2Data.username || 'User 2';

    const cpType = cp.type || 'CP';

    // Update User1's profile.relationship with User2's data
    const u1Rel = {
      type: cpType,
      partnerUid: u2,
      partnerName: u2Name,
      partnerAvatar: u2Avatar,
      level: cp.level || 1,
      startDate: cp.startDate || '',
    };

    // Update User2's profile.relationship with User1's data
    const u2Rel = {
      type: cpType,
      partnerUid: u1,
      partnerName: u1Name,
      partnerAvatar: u1Avatar,
      level: cp.level || 1,
      startDate: cp.startDate || '',
    };

    try {
      // Update both users' profile.relationship
      await db.collection('users').doc(u1).collection('profile').doc(u1).update({
        relationship: u1Rel,
      });
      console.log(`  ✓ ${u1Name} (${u1}) → partnerAvatar: ${u2Avatar ? 'set' : 'EMPTY'}`);
      fixed++;
    } catch (e) {
      console.log(`  ✗ Failed to update ${u1Name}: ${e.message}`);
    }

    try {
      await db.collection('users').doc(u2).collection('profile').doc(u2).update({
        relationship: u2Rel,
      });
      console.log(`  ✓ ${u2Name} (${u2}) → partnerAvatar: ${u1Avatar ? 'set' : 'EMPTY'}`);
      fixed++;
    } catch (e) {
      console.log(`  ✗ Failed to update ${u2Name}: ${e.message}`);
    }
  }

  console.log(`\nDone! Updated ${fixed} profile documents.`);
  process.exit(0);
}

fix().catch(err => { console.error(err); process.exit(1); });
