const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(sa),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

(async () => {
  // List all files in gifts/ folder
  const [files] = await bucket.getFiles({ prefix: 'gifts/' });
  const transparentFiles = files.filter(f => f.name.includes('removebg'));
  console.log('Transparent files found:', transparentFiles.length);

  // Build map: giftId → transparent URL
  const transMap = {};
  for (const file of transparentFiles) {
    const match = file.name.match(/thumb_\d+_(\d+)-removebg/);
    if (match) {
      const giftId = match[1];
      const [url] = await file.getSignedUrl({ action: 'read', expires: '2030-01-01' });
      transMap[giftId] = url;
    }
  }
  console.log('Mapped gift IDs:', Object.keys(transMap).length);

  // Update Firestore gifts
  const giftsSnap = await db.collection('gifts').get();
  let updated = 0;
  for (const doc of giftsSnap.docs) {
    const d = doc.data();
    const url = d.imageUrl || '';
    const thumbMatch = url.match(/thumb_(\d+)\.png/);
    if (thumbMatch) {
      const giftId = thumbMatch[1];
      if (transMap[giftId]) {
        await db.collection('gifts').doc(doc.id).update({ imageUrl: transMap[giftId] });
        console.log('Updated:', d.name, '→', transMap[giftId].substring(0, 60));
        updated++;
      }
    }
  }
  console.log('\nDone! Updated:', updated, 'gifts');
})();
