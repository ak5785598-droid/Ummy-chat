const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkUserDocs() {
  const uid = "901piBzTQ0VzCtAvlyyobwvAaTs1"; // Creator UID for Geography or target UID
  
  // Query by accountNumber "348084"
  const userQuery = await db.collection('users').where('accountNumber', '==', '348084').get();
  if (userQuery.empty) {
    console.log("No user found with accountNumber 348084");
    return;
  }
  
  const userDoc = userQuery.docs[0];
  const targetUid = userDoc.id;
  console.log(`Found user with UID: ${targetUid}`);

  const baseSnap = await db.collection('users').doc(targetUid).get();
  const subSnap = await db.collection('users').doc(targetUid).collection('profile').doc(targetUid).get();

  console.log("Base Document wallet:", JSON.stringify(baseSnap.data()?.wallet, null, 2));
  console.log("\nProfile Sub-collection wallet:", JSON.stringify(subSnap.data()?.wallet, null, 2));
}

checkUserDocs().then(() => process.exit(0)).catch(e => {
  console.error(e);
  process.exit(1);
});
