const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listRooms() {
  console.log('--- ALL ROOMS IN DATABASE ---');
  const snap = await db.collection('rooms').limit(20).get();
  snap.docs.forEach(d => {
    console.log(`Room ID: ${d.id} | title: "${d.data().title}" | roomNumber: ${d.data().roomNumber} | ownerId: ${d.data().ownerId}`);
  });
}

listRooms();
