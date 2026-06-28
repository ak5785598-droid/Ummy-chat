const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
try { admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }); } catch(e) {}
const db = admin.firestore();

async function checkRoom() {
  const doc = await db.collection('chatRooms').doc('901piBzTQ0VzCtAvlyyobwvAaTs1').get();
  const data = doc.data();
  
  console.log('=== stats nested object ===');
  console.log(JSON.stringify(data.stats, null, 2));
  
  console.log('\n=== Flat stats.dailyGifts field ===');
  console.log(data['stats.dailyGifts']); // flat field
  
  console.log('\n=== stats.dailyGifts via nested ===');
  console.log(data.stats?.dailyGifts); // nested field
  
  process.exit(0);
}
checkRoom().catch(e => { console.error(e.message); process.exit(1); });
