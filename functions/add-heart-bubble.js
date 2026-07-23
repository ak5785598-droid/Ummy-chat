const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function addHeartBubble() {
  console.log("Adding 'Heart Bubble' (heart-bubble) to Firestore storeItems...");

  const bubbleData = {
    id: "heart-bubble",
    name: "Heart Bubble",
    price: 19999, // buyable with coins
    duration: 7, // 7 days validity
    category: "Bubble",
    type: "Bubble",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    videoUrl: "",
    url: "https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/store%2Fitem_1780348526582_1000130352.jpg?alt=media&token=db17bd2c-fc28-4c73-9ba9-84388dd948a3" // valid bubble icon placeholder
  };

  await db.collection('storeItems').doc('heart-bubble').set(bubbleData);
  console.log("Successfully added 'Heart Bubble' to storeItems collection! It is now buyable.");
}

addHeartBubble().then(() => process.exit(0)).catch(e => {
  console.error("Error:", e);
  process.exit(1);
});
