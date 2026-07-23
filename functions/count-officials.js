const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/HP/Downloads/studio-7826224327-e0efc-firebase-adminsdk-fbsvc-e47b01b686.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function countOfficials() {
  console.log('🔍 Querying Firestore for users with Official tags...');
  
  const usersRef = db.collection('users');
  
  const officialSnap = await usersRef.where('tags', 'array-contains', 'Official').get();
  const officialCenterSnap = await usersRef.where('tags', 'array-contains', 'Official center').get();
  
  const officials = new Map();
  
  officialSnap.forEach(doc => {
    officials.set(doc.id, { username: doc.data().username, tags: doc.data().tags });
  });
  
  officialCenterSnap.forEach(doc => {
    officials.set(doc.id, { username: doc.data().username, tags: doc.data().tags });
  });

  console.log('\n========================================');
  console.log(`📋 Total Official Users Found: ${officials.size}`);
  console.log('========================================');
  
  let i = 1;
  officials.forEach((value, key) => {
    console.log(`${i}. Username: ${value.username || 'N/A'} (UID: ${key})`);
    console.log(`   Tags: ${JSON.stringify(value.tags)}`);
    i++;
  });
  
  process.exit(0);
}

countOfficials().catch(err => {
  console.error('Error fetching officials:', err);
  process.exit(1);
});
