const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addBubbleToStore() {
  console.log("Adding a new Premium Chat Bubble to Firestore storeItems...");

  const newBubble = {
    id: "royal-gold-bubble",
    name: "Royal Gold Bubble",
    price: 15000,
    duration: 7,
    category: "Bubble",
    type: "Bubble",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    videoUrl: "",
    // We can use a premium golden image or let it fallback to the client-side CSS/SVG decoration
    url: "https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/store%2Fframes%2Fdisplay%2Fframe_dragon_elite.png?alt=media" // Placeholder store card image
  };

  await db.collection('storeItems').doc(newBubble.id).set(newBubble);
  console.log("Successfully added 'Royal Gold Bubble' to storeItems collection!");
}

addBubbleToStore().then(() => process.exit(0)).catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
