const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findDeletedOrOldBubbles() {
  console.log("Checking Firestore for any trace of other bubbles, including deactivated items or logs...");
  
  // 1. Let's look for deleted items in adminLogs or collection history if exists
  const logsSnap = await db.collection('adminLogs').limit(100).get();
  console.log(`Analyzing ${logsSnap.size} admin logs for deletions...`);
  logsSnap.forEach(d => {
    const data = d.data();
    const str = JSON.stringify(data).toLowerCase();
    if (str.includes('bubble') || str.includes('delete') || str.includes('store')) {
      console.log(`Log ID: ${d.id} => Action: ${data.action || data.type}, Msg: ${data.message || ''}`);
    }
  });

  // 2. Let's search inside user profile owned items (backpack / inventory) to see if anyone still owns deleted bubbles
  console.log("\nSearching users' owned items for any bubbles not in active store...");
  const usersSnap = await db.collection('users').limit(150).get();
  const ownedBubbles = new Set();
  
  for (const userDoc of usersSnap.docs) {
    const backpackSnap = await db.collection('users').doc(userDoc.id).collection('backpack').get();
    backpackSnap.forEach(item => {
      const data = item.data();
      if (data.category === 'Bubble' || data.type === 'Bubble' || String(data.name).toLowerCase().includes('bubble')) {
        ownedBubbles.add(JSON.stringify({ id: item.id, name: data.name, category: data.category || data.type, url: data.url }));
      }
    });
  }

  if (ownedBubbles.size > 0) {
    console.log("Found owned bubbles in users' backpacks:");
    ownedBubbles.forEach(b => console.log(b));
  } else {
    console.log("No bubbles found in users' backpacks.");
  }
}

findDeletedOrOldBubbles().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
