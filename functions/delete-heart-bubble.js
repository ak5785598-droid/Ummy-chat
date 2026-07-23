const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function removeHeartBubble() {
  console.log("Deleting 'heart-bubble' from Firestore storeItems...");
  await db.collection('storeItems').doc('heart-bubble').delete();
  console.log("Successfully deleted 'heart-bubble'!");
}

removeHeartBubble().then(() => process.exit(0)).catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
