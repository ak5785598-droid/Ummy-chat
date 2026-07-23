const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

// List of all premium chat bubbles matching the client-side configurations
const BUBBLES = [
  { id: 'heart-bubble', name: 'Heart Bubble', price: 9999, duration: 7 },
  { id: 'love-bubble', name: 'Love Bubble', price: 12999, duration: 7 },
  { id: 'evil-bubble', name: 'Evil Bubble', price: 14999, duration: 7 },
  { id: 'candy-bubble', name: 'Candy Bubble', price: 15999, duration: 7 },
  { id: 'taurus-2025', name: 'Taurus Bubble', price: 18999, duration: 7 },
  { id: 'cricket-2025', name: 'Cricket Bubble', price: 8999, duration: 7 },
  { id: 'neon-cyber', name: 'Neon Cyber Bubble', price: 24999, duration: 7 },
  { id: 'royal-gold', name: 'Royal Gold Bubble', price: 29999, duration: 7 },
  { id: 'ice-crystal', name: 'Ice Crystal Bubble', price: 19999, duration: 7 }
];

async function addAllBubblesToStore() {
  console.log("Adding all premium chat bubbles to Firestore storeItems...");
  const batch = db.batch();

  BUBBLES.forEach(bubble => {
    const docRef = db.collection('storeItems').doc(bubble.id);
    batch.set(docRef, {
      id: bubble.id,
      name: bubble.name,
      price: bubble.price,
      duration: bubble.duration,
      category: "Bubble",
      type: "Bubble",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      videoUrl: "",
      // Placeholder image URL
      url: "https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/store%2Fitem_1780348526582_1000130352.jpg?alt=media&token=db17bd2c-fc28-4c73-9ba9-84388dd948a3"
    }, { merge: true });
  });

  await batch.commit();
  console.log("Successfully added all 9 premium chat bubbles to storeItems! Users can now buy them.");
}

addAllBubblesToStore().then(() => process.exit(0)).catch(e => {
  console.error("Error adding bubbles:", e);
  process.exit(1);
});
