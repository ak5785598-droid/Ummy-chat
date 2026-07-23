const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(sa) });
}
const db = admin.firestore();

function isValid(id) {
  if (!id) return false;
  const s = String(id).trim();
  return /^\d{6}$/.test(s) || s === '0000';
}

(async () => {
  console.log('=== Fixing Remaining Invalid IDs ===\n');

  const usersSnap = await db.collection('users').get();
  const usedIds = new Set();
  let fixed = 0;

  for (const userDoc of usersSnap.docs) {
    const acc = userDoc.data().accountNumber;
    if (isValid(acc)) usedIds.add(String(acc));
  }

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const userData = userDoc.data();
    const rootAccNum = userData.accountNumber;

    if (isValid(rootAccNum)) continue;

    let newId;
    for (let i = 0; i < 50; i++) {
      const tempId = String(Math.floor(100000 + Math.random() * 900000));
      if (!usedIds.has(tempId)) {
        newId = tempId;
        usedIds.add(tempId);
        break;
      }
    }
    if (!newId) {
      newId = String(Math.floor(100000 + Math.random() * 900000));
      usedIds.add(newId);
    }

    // Update root + assigned_ids
    const batch = db.batch();
    batch.update(db.collection('users').doc(uid), {
      accountNumber: newId,
      accountNumberLocked: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    batch.set(db.collection('assigned_ids').doc(newId), { uid, assignedAt: admin.firestore.FieldValue.serverTimestamp() });
    await batch.commit();

    // Update profile subcollection if exists
    try {
      const profileRef = db.collection('users').doc(uid).collection('profile').doc(uid);
      const profileSnap = await profileRef.get();
      if (profileSnap.exists) {
        await profileRef.update({ accountNumber: newId, accountNumberLocked: true });
      }
    } catch (e) {}

    console.log(`[FIXED] ${userData.username || uid} — old: ${rootAccNum} -> new: ${newId}`);
    fixed++;
  }

  console.log(`\n=== DONE ===`);
  console.log(`Users fixed: ${fixed}`);
  process.exit(0);
})();
