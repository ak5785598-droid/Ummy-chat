const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(sa),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});

const db = admin.firestore();

function isValid(id) {
  if (!id) return false;
  const s = String(id).trim();
  return /^\d{6}$/.test(s) || s === '0000';
}

(async () => {
  console.log('=== Starting Account Number Sync ===\n');

  // Step 1: Collect all users with their best accountNumber
  const usersSnap = await db.collection('users').get();
  console.log(`Total users found: ${usersSnap.size}\n`);

  let fixed = 0;
  let alreadyOk = 0;
  let noValidId = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();
    const rootAccNum = userData.accountNumber;

    // Get profile subcollection
    const profileSnap = await db.collection('users').doc(uid).collection('profile').doc(uid).get();
    const profileData = profileSnap.exists ? profileSnap.data() : null;
    const profileAccNum = profileData?.accountNumber;

    // Determine best valid ID
    let bestId = null;
    if (isValid(rootAccNum) && isValid(profileAccNum)) {
      // Both valid — pick root (authoritative)
      bestId = rootAccNum;
    } else if (isValid(rootAccNum)) {
      bestId = rootAccNum;
    } else if (isValid(profileAccNum)) {
      bestId = profileAccNum;
    }

    if (!bestId) {
      console.log(`[SKIP] ${uid} (${userData.username || 'unknown'}) — no valid 6-digit ID (root: ${rootAccNum}, profile: ${profileAccNum})`);
      noValidId++;
      continue;
    }

    const rootMatch = rootAccNum === bestId;
    const profileMatch = profileAccNum === bestId;

    if (rootMatch && profileMatch) {
      alreadyOk++;
      continue;
    }

    // Fix root user doc
    const batch = db.batch();
    if (!rootMatch) {
      const userRef = db.collection('users').doc(uid);
      batch.update(userRef, { accountNumber: bestId, accountNumberLocked: true });
    }
    if (!profileMatch && profileSnap.exists) {
      const profileRef = db.collection('users').doc(uid).collection('profile').doc(uid);
      batch.update(profileRef, { accountNumber: bestId, accountNumberLocked: true });
    }
    await batch.commit();

    console.log(`[FIXED] ${uid} (${userData.username || 'unknown'}) — root: ${rootAccNum} -> ${bestId}, profile: ${profileAccNum} -> ${bestId}`);
    fixed++;
  }

  // Step 2: Sync to room participants
  console.log('\n=== Syncing to Room Participants ===\n');
  const roomsSnap = await db.collection('chatRooms').get();
  console.log(`Total rooms: ${roomsSnap.size}\n`);

  let roomFixed = 0;

  for (const roomDoc of roomsSnap.docs) {
    const roomId = roomDoc.id;
    const participantsSnap = await db.collection('chatRooms').doc(roomId).collection('participants').get();

    if (participantsSnap.empty) continue;

    const batch = db.batch();
    let batchCount = 0;

    for (const pDoc of participantsSnap.docs) {
      const pData = pDoc.data();
      if (!pData.uid) continue;

      // Get the correct accountNumber from root user doc
      const userSnap = await db.collection('users').doc(pData.uid).get();
      if (!userSnap.exists) continue;

      const correctAccNum = userSnap.data().accountNumber;
      if (!isValid(correctAccNum)) continue;

      if (pData.accountNumber !== correctAccNum) {
        batch.update(pDoc.ref, { accountNumber: correctAccNum });
        batchCount++;
        roomFixed++;
      }
    }

    if (batchCount > 0) {
      await batch.commit();
      console.log(`[ROOM] ${roomId} — synced ${batchCount} participants`);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Users already OK: ${alreadyOk}`);
  console.log(`Users fixed: ${fixed}`);
  console.log(`Users skipped (no valid ID): ${noValidId}`);
  console.log(`Room participants synced: ${roomFixed}`);
})();
