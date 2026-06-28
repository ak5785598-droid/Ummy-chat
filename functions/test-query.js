/**
 * Test the exact leaderboard query used in the app
 * Run: node functions/test-query.js
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

try {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
} catch(e) {}

const db = admin.firestore();

async function testQuery() {
  console.log('🔍 Testing EXACT leaderboard queries used in app...\n');

  // === ROOMS - daily ===
  console.log('--- chatRooms: stats.dailyGifts > 0 orderBy desc ---');
  try {
    const snap = await db.collection('chatRooms')
      .where('stats.dailyGifts', '>', 0)
      .orderBy('stats.dailyGifts', 'desc')
      .limit(10)
      .get();
    
    console.log(`✅ Query SUCCESS — ${snap.size} rooms found`);
    snap.forEach(doc => {
      const d = doc.data();
      console.log(`  ${d.title || doc.id}: dailyGifts=${d.stats?.dailyGifts}`);
    });
  } catch (e) {
    console.log(`❌ Query FAILED: ${e.message}`);
    if (e.message.includes('index')) {
      console.log('  → Need to create index at this URL:');
      console.log('  ' + (e.message.match(/https:\/\/[^\s]+/)?.[0] || 'check Firebase console'));
    }
  }

  console.log('');

  // === USERS - daily ===
  console.log('--- users: wallet.dailySpent > 0 orderBy desc ---');
  try {
    const snap = await db.collection('users')
      .where('wallet.dailySpent', '>', 0)
      .orderBy('wallet.dailySpent', 'desc')
      .limit(5)
      .get();
    
    console.log(`✅ Query SUCCESS — ${snap.size} users found`);
    snap.forEach(doc => {
      const d = doc.data();
      console.log(`  ${d.username || doc.id}: dailySpent=${d.wallet?.dailySpent}`);
    });
  } catch (e) {
    console.log(`❌ Query FAILED: ${e.message}`);
    if (e.message.includes('index')) {
      console.log('  → Index URL: ' + (e.message.match(/https:\/\/[^\s]+/)?.[0] || 'check Firebase console'));
    }
  }

  console.log('');

  // === ROOMS - weekly ===
  console.log('--- chatRooms: stats.weeklyGifts > 0 orderBy desc ---');
  try {
    const snap = await db.collection('chatRooms')
      .where('stats.weeklyGifts', '>', 0)
      .orderBy('stats.weeklyGifts', 'desc')
      .limit(5)
      .get();
    
    console.log(`✅ Query SUCCESS — ${snap.size} rooms found`);
    snap.forEach(doc => {
      const d = doc.data();
      console.log(`  ${d.title || doc.id}: weeklyGifts=${d.stats?.weeklyGifts}`);
    });
  } catch (e) {
    console.log(`❌ Query FAILED: ${e.message}`);
    if (e.message.includes('index')) {
      console.log('  → Index URL: ' + (e.message.match(/https:\/\/[^\s]+/)?.[0] || 'check Firebase console'));
    }
  }

  process.exit(0);
}

testQuery().catch(e => { console.error(e.message); process.exit(1); });
