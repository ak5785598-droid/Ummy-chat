const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
admin.initializeApp({ credential: admin.credential.cert(sa), storageBucket: 'studio-7826224327-e0efc.firebasestorage.app' });
const db = admin.firestore();

(async () => {
  const giftsSnap = await db.collection('gifts').get();
  const giftUrls = {};
  giftsSnap.forEach(doc => {
    const d = doc.data();
    if (d.imageUrl) giftUrls[doc.id] = d.imageUrl;
  });
  console.log('Gifts found:', Object.keys(giftUrls).length);

  const usersSnap = await db.collection('users').get();
  let updated = 0;
  
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const profileSnap = await db.collection('users').doc(uid).collection('profile').doc(uid).get();
    if (!profileSnap.exists) continue;
    const profile = profileSnap.data();
    if (!profile.stats || !profile.stats.giftDetails) continue;

    const updates = {};
    let needsUpdate = false;
    for (const [key, val] of Object.entries(profile.stats.giftDetails)) {
      if (key.endsWith('_imageUrl') && val) {
        const giftId = key.replace('_imageUrl', '');
        if (giftUrls[giftId] && giftUrls[giftId] !== val) {
          updates['stats.giftDetails.' + key] = giftUrls[giftId];
          needsUpdate = true;
        }
      }
    }

    if (needsUpdate) {
      await db.collection('users').doc(uid).collection('profile').doc(uid).update(updates);
      console.log('Updated:', profile.username || uid, Object.keys(updates).length, 'images');
      updated++;
    }
  }
  console.log('Done! Updated:', updated, 'users');
})();
