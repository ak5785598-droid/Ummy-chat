const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const ITEMS = [
  { id: 'heart-bubble', name: 'Heart Bubble', price: 9999, duration: 7 },
  { id: 'love-bubble', name: 'Love Bubble', price: 12999, duration: 7 }
];

async function addStoreBubbles() {
  console.log("Adding Heart Bubble and Love Bubble to Firestore storeItems without image URLs...");
  const batch = db.batch();

  ITEMS.forEach(item => {
    const docRef = db.collection('storeItems').doc(item.id);
    batch.set(docRef, {
      id: item.id,
      name: item.name,
      price: item.price,
      duration: item.duration,
      category: "Bubble",
      type: "Bubble",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      videoUrl: "",
      url: "" // Empty url so it bypasses standard Image renderer and renders dynamic CSS/Gradient box
    }, { merge: true });
  });

  await batch.commit();
  console.log("Successfully added bubbles! Check store now.");
}

addStoreBubbles().then(() => process.exit(0)).catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
