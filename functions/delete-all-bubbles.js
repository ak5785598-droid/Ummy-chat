const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const BUBBLES = [
  'heart-bubble',
  'love-bubble',
  'evil-bubble',
  'candy-bubble',
  'taurus-2025',
  'cricket-2025',
  'neon-cyber',
  'royal-gold',
  'ice-crystal'
];

async function removeAllBubbles() {
  console.log("Removing all newly added premium bubbles from Firestore storeItems...");
  const batch = db.batch();

  BUBBLES.forEach(id => {
    const docRef = db.collection('storeItems').doc(id);
    batch.delete(docRef);
  });

  await batch.commit();
  console.log("Successfully deleted all 9 premium bubbles! Back to original state.");
}

removeAllBubbles().then(() => process.exit(0)).catch(e => {
  console.error("Error removing bubbles:", e);
  process.exit(1);
});
