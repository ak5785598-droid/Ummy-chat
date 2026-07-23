const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://studio-7826224327-e0efc.firebaseio.com',
});

const db = admin.firestore();

async function checkFrames() {
  const usersSnap = await db.collection('users').get();
  
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const activeFrame = data?.inventory?.activeFrame;
    const activeFrameUrl = data?.inventory?.activeFrameMediaUrl;
    
    if (activeFrame && activeFrame !== 'None' && activeFrame !== '') {
      console.log(`${userDoc.id}: activeFrame=${activeFrame}, activeFrameMediaUrl=${activeFrameUrl || 'NULL'}`);
    }
  }
  
  process.exit(0);
}

checkFrames().catch(err => { console.error(err); process.exit(1); });
