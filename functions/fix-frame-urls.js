const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://studio-7826224327-e0efc.firebaseio.com',
});

const db = admin.firestore();

async function fixFrameUrls() {
  const eventFrames = ['event_rank1_frame', 'event_rank2_frame', 'event_rank3_frame', 'cp_king_frame', 'cp_queen_frame'];
  
  const usersSnap = await db.collection('users').get();
  let fixed = 0;

  for (const userDoc of usersSnap.docs) {
    const data = userDoc.data();
    const activeFrame = data?.inventory?.activeFrame;
    
    if (!activeFrame || !eventFrames.includes(activeFrame)) continue;
    
    const currentUrl = data?.inventory?.activeFrameMediaUrl;
    if (currentUrl === activeFrame) {
      console.log(`SKIP ${userDoc.id} - already correct`);
      continue;
    }
    
    console.log(`FIX ${userDoc.id}: activeFrame=${activeFrame}, url=${currentUrl} → ${activeFrame}`);
    
    const batch = db.batch();
    batch.update(userDoc.ref, { 'inventory.activeFrameMediaUrl': activeFrame });
    
    const profileRef = db.collection('users').doc(userDoc.id).collection('profile').doc(userDoc.id);
    batch.update(profileRef, { 'inventory.activeFrameMediaUrl': activeFrame });
    
    await batch.commit();
    fixed++;
    console.log(`  FIXED!`);
  }

  console.log(`\nDone! Fixed ${fixed} users.`);
  process.exit(0);
}

fixFrameUrls().catch(err => { console.error(err); process.exit(1); });
