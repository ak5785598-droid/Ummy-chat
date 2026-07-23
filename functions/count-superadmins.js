const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/HP/Downloads/studio-7826224327-e0efc-firebase-adminsdk-fbsvc-e47b01b686.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function countSuperAdmins() {
  console.log('🔍 Querying Firestore for users with Super Admin tags...');
  
  const usersRef = db.collection('users');
  
  // Fetch users whose tags array contains 'Super Admin'
  const snap = await usersRef.where('tags', 'array-contains', 'Super Admin').get();
  
  console.log('\n========================================');
  console.log(`📋 Total Super Admin Users Found: ${snap.size}`);
  console.log('========================================');
  
  let i = 1;
  snap.forEach(doc => {
    const data = doc.data();
    console.log(`${i}. Username: ${data.username || 'N/A'} (UID: ${doc.id})`);
    console.log(`   Tags: ${JSON.stringify(data.tags)}`);
    console.log(`   Account Number: ${data.accountNumber || 'N/A'}`);
    i++;
  });
  
  process.exit(0);
}

countSuperAdmins().catch(err => {
  console.error('Error fetching Super Admins:', err);
  process.exit(1);
});
