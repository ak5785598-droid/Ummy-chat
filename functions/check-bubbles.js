const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://studio-7826224327-e0efc.firebaseio.com',
});

const db = admin.firestore();

async function checkBubbles() {
  const usersSnap = await db.collection('users').get();
  
  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const activeBubble = data?.inventory?.activeBubble;
    const activeBubbleMediaUrl = data?.inventory?.activeBubbleMediaUrl;
    
    if (activeBubble && activeBubble !== 'None' && activeBubble !== '') {
      console.log(`${userDoc.id}: activeBubble=${activeBubble}, activeBubbleMediaUrl=${activeBubbleMediaUrl || 'NULL'}`);
    }
  }
  
  process.exit(0);
}

checkBubbles().catch(err => { console.error(err); process.exit(1); });
