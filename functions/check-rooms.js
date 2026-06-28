/**
 * Check room stats in Firestore
 * Run: node functions/check-rooms.js
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

try {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch(e) {}

const db = admin.firestore();

async function checkRooms() {
  console.log('🔍 Checking chatRooms with dailyGifts > 0...\n');

  // Check rooms with any gifts
  const snap = await db.collection('chatRooms')
    .orderBy('stats.dailyGifts', 'desc')
    .limit(10)
    .get();

  if (snap.empty) {
    console.log('❌ NO rooms found with stats.dailyGifts field!\n');
    console.log('Checking all rooms stats structure...\n');

    // Check first 5 rooms
    const allRooms = await db.collection('chatRooms').limit(5).get();
    allRooms.forEach(doc => {
      const data = doc.data();
      console.log(`Room: ${doc.id}`);
      console.log(`  title: ${data.title}`);
      console.log(`  stats: ${JSON.stringify(data.stats)}`);
      console.log('');
    });
  } else {
    console.log(`✅ Found ${snap.size} rooms with stats:\n`);
    snap.forEach(doc => {
      const data = doc.data();
      console.log(`Room: ${data.title || doc.id}`);
      console.log(`  dailyGifts:   ${data.stats?.dailyGifts}`);
      console.log(`  weeklyGifts:  ${data.stats?.weeklyGifts}`);
      console.log(`  monthlyGifts: ${data.stats?.monthlyGifts}`);
      console.log('');
    });
  }

  // Also check total rooms count
  const total = await db.collection('chatRooms').count().get();
  console.log(`📊 Total chatRooms: ${total.data().count}`);

  process.exit(0);
}

checkRooms().catch(e => { console.error(e.message); process.exit(1); });
