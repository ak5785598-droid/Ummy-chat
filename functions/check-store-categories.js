const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkStoreCategories() {
  console.log('--- STORE ITEMS CATEGORIES ---');
  const snap = await db.collection('storeItems').limit(50).get();
  const categories = new Set();
  
  snap.docs.forEach(doc => {
    const data = doc.data();
    categories.add(data.category);
    console.log(`Item ID: ${doc.id} | Name: "${data.name}" | Category: "${data.category}"`);
  });
  
  console.log('Unique Categories in database:', Array.from(categories));
}

checkStoreCategories();
