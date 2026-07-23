const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function removeBubbleFromStore() {
  console.log("Removing 'royal-gold-bubble' from Firestore storeItems...");
  await db.collection('storeItems').doc('royal-gold-bubble').delete();
  console.log("Successfully deleted 'royal-gold-bubble' from storeItems. Back to original state!");
}

removeBubbleFromStore().then(() => process.exit(0)).catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
