const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkFollows() {
  const usersSnap = await db.collection('users').limit(10).get();
  console.log('--- USER FOLLOW COLLECTIONS DIAGNOSTICS ---');
  
  for (const doc of usersSnap.docs) {
    const uid = doc.id;
    const username = doc.data().username || 'N/A';
    
    // Check followers subcollection
    const followersSnap = await db.collection('users').doc(uid).collection('followers').get();
    // Check following subcollection
    const followingSnap = await db.collection('users').doc(uid).collection('following').get();
    
    if (!followersSnap.empty || !followingSnap.empty) {
      console.log(`User: ${username} (UID: ${uid})`);
      console.log(`  Followers count: ${followersSnap.size}`);
      if (!followersSnap.empty) {
        console.log('    First Follower Doc ID:', followersSnap.docs[0].id);
        console.log('    First Follower Data:', JSON.stringify(followersSnap.docs[0].data()));
      }
      console.log(`  Following count: ${followingSnap.size}`);
      if (!followingSnap.empty) {
        console.log('    First Following Doc ID:', followingSnap.docs[0].id);
        console.log('    First Following Data:', JSON.stringify(followingSnap.docs[0].data()));
      }
    }
  }
}

checkFollows();
