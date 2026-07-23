const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkBubbleItems() {
  console.log("Checking for items with category = Bubble or ChatBubble in storeItems...");
  const snap = await db.collection('storeItems').where('category', 'in', ['Bubble', 'ChatBubble', 'bubble', 'chatBubble']).get();
  
  if (snap.empty) {
    console.log("No items found with category 'Bubble' or 'ChatBubble'.");
    
    // Let's print unique categories in storeItems
    const allItems = await db.collection('storeItems').select('category').get();
    const categories = new Set();
    allItems.forEach(d => {
      if (d.data().category) categories.add(d.data().category);
    });
    console.log("Available categories in storeItems:", Array.from(categories));
  } else {
    console.log(`Found ${snap.size} bubble items:`);
    snap.forEach(d => {
      console.log(`ID: ${d.id} =>`, JSON.stringify(d.data(), null, 2));
    });
  }
}

checkBubbleItems().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
