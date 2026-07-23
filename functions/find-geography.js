const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function findGeographyDetails() {
  console.log("Searching for GEOGRAPHY docs across all possibilities...");
  
  // 1. Check if a user document exists with ID '8740' or '874' or similar
  const docsToCheck = ['874', '8740', '874044', '840939'];
  for (const dId of docsToCheck) {
    const userDoc = await db.collection('users').doc(dId).get();
    if (userDoc.exists) {
      console.log(`Document users/${dId} EXISTS! =>`, JSON.stringify(userDoc.data(), null, 2));
      
      const subDoc = await db.collection('users').doc(dId).collection('profile').doc(dId).get();
      if (subDoc.exists) {
        console.log(`Sub-collection users/${dId}/profile/${dId} EXISTS! =>`, JSON.stringify(subDoc.data(), null, 2));
      }
    } else {
      console.log(`Document users/${dId} does not exist.`);
    }
  }

  // 2. Query any users having username containing "GEOGRAPHY"
  const snap = await db.collection('users').get();
  console.log(`Total users in DB: ${snap.size}`);
  snap.forEach(d => {
    const data = d.data();
    if (String(data.username).toUpperCase().includes("GEOGRAPHY")) {
      console.log(`User UID: ${d.id} =>`, JSON.stringify(data, null, 2));
    }
  });
}

findGeographyDetails().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
