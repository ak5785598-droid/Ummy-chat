const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkRoom100Owner() {
  console.log('--- ROOM OWNER SEARCH ---');
  let roomsSnap = await db.collection('rooms').where('roomNumber', '==', 100).limit(1).get();
  if (roomsSnap.empty) {
    roomsSnap = await db.collection('rooms').where('roomNumber', '==', '100').limit(1).get();
  }
  
  if (roomsSnap.empty) {
    // Fallback: search by title "Ummy help"
    roomsSnap = await db.collection('rooms').where('title', '==', 'Ummy help').limit(1).get();
  }

  if (roomsSnap.empty) {
    console.log('Room 100 / Ummy help not found!');
    return;
  }
  
  const roomData = roomsSnap.docs[0].data();
  const ownerUid = roomData.ownerId;
  console.log('Room Owner UID:', ownerUid);
  console.log('Room Data:', JSON.stringify(roomData));
  
  const userSnap = await db.collection('users').doc(ownerUid).get();
  if (userSnap.exists()) {
    console.log('Owner User Info:', JSON.stringify(userSnap.data()));
  }

  // Check followers
  const followersSnap = await db.collection('users').doc(ownerUid).collection('followers').get();
  console.log(`Followers Count: ${followersSnap.size}`);
  followersSnap.docs.forEach(d => {
    console.log(`  Follower Doc ID: ${d.id} -> Data:`, JSON.stringify(d.data()));
  });

  // Check following
  const followingSnap = await db.collection('users').doc(ownerUid).collection('following').get();
  console.log(`Following Count: ${followingSnap.size}`);
  followingSnap.docs.forEach(d => {
    console.log(`  Following Doc ID: ${d.id} -> Data:`, JSON.stringify(d.data()));
  });
}

checkRoom100Owner();
