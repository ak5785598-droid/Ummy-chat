const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/HP/Downloads/studio-7826224327-e0efc-firebase-adminsdk-fbsvc-e47b01b686.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function fixHeyUser() {
  console.log('🔍 Searching database for user "hey" or ID "88"...');
  
  const usersRef = db.collection('users');
  
  // Try to find user by username "hey" (case insensitive prefix match or exact check)
  const snap = await usersRef.where('username', '==', 'hey').get();
  
  if (snap.empty) {
    console.log('❌ User with username "hey" not found.');
    // Let's try searching taken_ids for 88
    const takenSnap = await db.collection('taken_ids').doc('88').get();
    if (takenSnap.exists) {
      const ownerUid = takenSnap.data().ownerUid;
      console.log(`💡 Found "88" in taken_ids. Owner UID is: ${ownerUid}`);
      const userDoc = await usersRef.doc(ownerUid).get();
      if (userDoc.exists) {
        await fixUser(userDoc.id, userDoc.data());
      }
    } else {
      console.log('❌ ID "88" not found in taken_ids collection either.');
    }
  } else {
    const doc = snap.docs[0];
    await fixUser(doc.id, doc.data());
  }
}

async function fixUser(uid, userData) {
  console.log(`\nFound User UID: ${uid}`);
  console.log(`Username: ${userData.username}`);
  console.log(`Current accountNumber in users: ${userData.accountNumber} (${typeof userData.accountNumber})`);
  
  // Let's see what is inside profile sub-document
  const profileRef = db.collection('users').doc(uid).collection('profile').doc(uid);
  const profileSnap = await profileRef.get();
  
  if (profileSnap.exists) {
    const pData = profileSnap.data();
    console.log(`Current accountNumber in profile sub-doc: ${pData.accountNumber}`);
    console.log(`activeIdBadge in profile: ${JSON.stringify(pData.activeIdBadge)}`);
    console.log(`originalAccountNumber in profile: ${pData.originalAccountNumber}`);
  }
  
  console.log('\n🔧 Fixing user document fields...');
  
  const originalId = userData.originalAccountNumber || userData.accountNumber || '123456';
  
  const batch = db.batch();
  
  // Update main user doc
  batch.update(db.collection('users').doc(uid), {
    accountNumber: '88',
    originalAccountNumber: String(originalId)
  });
  
  // Update profile sub doc
  if (profileSnap.exists) {
    batch.update(profileRef, {
      accountNumber: '88',
      originalAccountNumber: String(originalId)
    });
  }
  
  await batch.commit();
  console.log('✅ Successfully fixed "hey" (ID 88)! It will now show up in search immediately.');
  process.exit(0);
}

fixHeyUser().catch(err => {
  console.error(err);
  process.exit(1);
});
