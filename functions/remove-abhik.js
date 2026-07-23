const admin = require('firebase-admin');
const serviceAccount = require('C:/Users/HP/Downloads/studio-7826224327-e0efc-firebase-adminsdk-fbsvc-e47b01b686.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const targetUid = 'XcEUwkKp1KSZ66Qns6tIgpmzOQA3';

async function removeUser() {
  console.log(`🔍 Checking user ${targetUid} ("Abhik")...`);
  
  const userRef = db.collection('users').doc(targetUid);
  const snap = await userRef.get();
  
  if (!snap.exists) {
    console.log('❌ User not found in database.');
    process.exit(0);
  }
  
  const data = snap.data();
  console.log(`Found User: ${data.username || 'N/A'}`);
  console.log(`Current Tags: ${JSON.stringify(data.tags)}`);
  
  console.log('🔄 Deleting user record from Firestore "users" collection...');
  await userRef.delete();
  
  // Also check if there is a profile sub-collection or sub-document
  console.log('🔄 Checking sub-collections/profiles...');
  const subProfileRef = db.collection('users').doc(targetUid).collection('profile').doc(targetUid);
  const subSnap = await subProfileRef.get();
  if (subSnap.exists) {
    console.log('🔄 Deleting profile sub-document...');
    await subProfileRef.delete();
  }
  
  // Try to delete from Firebase Auth
  try {
    console.log('🔄 Deleting user from Firebase Auth...');
    await admin.auth().deleteUser(targetUid);
    console.log('✅ Successfully deleted user from Firebase Auth.');
  } catch (err) {
    console.log('⚠️ Could not delete from Firebase Auth (it might have been deleted already or needs configuration):', err.message);
  }
  
  console.log('========================================');
  console.log('🎉 Successfully removed Abhik from the App!');
  console.log('========================================');
  process.exit(0);
}

removeUser().catch(err => {
  console.error('Error removing user:', err);
  process.exit(1);
});
