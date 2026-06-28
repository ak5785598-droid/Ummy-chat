/**
 * Get Firestore index creation URLs
 * Run: node functions/get-index-urls.js
 * These URLs will auto-create the required composite indexes
 */
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
try { admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }); } catch(e) {}
const db = admin.firestore();

const PROJECT_ID = 'studio-7826224327-e0efc';

// These are the exact queries used by the leaderboard in the app
const queries = [
  { collection: 'chatRooms', field: 'stats.dailyGifts',   label: 'Room Daily' },
  { collection: 'chatRooms', field: 'stats.weeklyGifts',  label: 'Room Weekly' },
  { collection: 'chatRooms', field: 'stats.monthlyGifts', label: 'Room Monthly' },
  { collection: 'users',     field: 'wallet.dailySpent',         label: 'User Daily Rich' },
  { collection: 'users',     field: 'wallet.weeklySpent',        label: 'User Weekly Rich' },
  { collection: 'users',     field: 'wallet.monthlySpent',       label: 'User Monthly Rich' },
  { collection: 'users',     field: 'stats.dailyGiftsReceived',  label: 'User Daily Charm' },
  { collection: 'users',     field: 'stats.weeklyGiftsReceived', label: 'User Weekly Charm' },
  { collection: 'users',     field: 'stats.monthlyGiftsReceived',label: 'User Monthly Charm' },
];

async function testAndGetUrls() {
  console.log('Testing queries and generating index creation URLs...\n');
  
  for (const q of queries) {
    try {
      const snap = await db.collection(q.collection)
        .where(q.field, '>', 0)
        .orderBy(q.field, 'desc')
        .limit(1)
        .get();
      console.log(`✅ ${q.label}: OK (${snap.size} results)`);
    } catch (e) {
      console.log(`❌ ${q.label}: NEEDS INDEX`);
      const url = e.message?.match(/https:\/\/[^\s\n]+/)?.[0];
      if (url) {
        console.log(`   → Create index: ${url}`);
      } else {
        // Generate manual console URL
        const encodedField = encodeURIComponent(q.field);
        console.log(`   → Go to: https://console.firebase.google.com/project/${PROJECT_ID}/firestore/indexes`);
        console.log(`   → Create composite index on collection "${q.collection}", field "${q.field}" DESC`);
      }
    }
    console.log('');
  }
  
  process.exit(0);
}

testAndGetUrls().catch(e => { console.error(e); process.exit(1); });
