const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});

const db = admin.firestore();

const TAG_TO_MEDAL = {
  'Official': 'official-1',
  'Admin': 'admin',
  'Super Admin': 'admin',
  'Seller': 'coin-seller',
  'Seller center': 'coin-seller',
  'Coin Seller': 'coin-seller',
  'CS': 'cs',
  'Customer Service': 'cs',
  'CS Leader': 'cs',
};

async function seedMedals() {
  const usersSnap = await db.collection('users').get();
  let updated = 0;
  let skipped = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const profileSnap = await db.collection('users').doc(uid).collection('profile').doc(uid).get();
    
    if (!profileSnap.exists) {
      skipped++;
      continue;
    }

    const profile = profileSnap.data();
    const tags = profile.tags || [];
    const currentMedals = profile.medals || [];
    const newMedals = [];

    for (const tag of tags) {
      const medalId = TAG_TO_MEDAL[tag];
      if (medalId && !currentMedals.includes(medalId)) {
        newMedals.push(medalId);
      }
    }

    if (newMedals.length > 0) {
      await db.collection('users').doc(uid).collection('profile').doc(uid).update({
        medals: admin.firestore.FieldValue.arrayUnion(...newMedals),
      });
      console.log(`${profile.username || uid}: +${newMedals.join(', ')}`);
      updated++;
    } else {
      skipped++;
    }
  }

  console.log(`\nDone! Updated: ${updated}, Skipped: ${skipped}`);
}

seedMedals().catch(console.error);
