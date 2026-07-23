const admin = require('firebase-admin');
const sa = require('./serviceAccountKey.json');
const fs = require('fs');
const path = require('path');

admin.initializeApp({
  credential: admin.credential.cert(sa),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});
const bucket = admin.storage().bucket();
const db = admin.firestore();

const downloadsDir = 'C:\\Users\\HP\\Downloads';

// 24 gifts with names, prices, categories
const newGifts = [
  // HOT (10)
  { id: '1000121522', name: 'Phoenix Flame', price: 500000, category: 'Hot' },
  { id: '1000121500', name: 'Neon Spark', price: 350000, category: 'Hot' },
  { id: '1000119403', name: 'Storm Blade', price: 200000, category: 'Hot' },
  { id: '1000118798', name: 'Thunder Strike', price: 150000, category: 'Hot' },
  { id: '1000118665', name: 'Fire Dance', price: 300000, category: 'Hot' },
  { id: '1000116138', name: 'Diamond Ring', price: 800000, category: 'Hot' },
  { id: '1000111706', name: 'Golden Crown', price: 600000, category: 'Hot' },
  { id: '1000118212', name: 'Rocket Star', price: 400000, category: 'Hot' },
  { id: '1000121497', name: 'Crystal Ball', price: 250000, category: 'Hot' },
  { id: '1000119356', name: 'Power Fist', price: 180000, category: 'Hot' },
  // LUXURY (6 - expensive)
  { id: '1000118707', name: 'Royal Throne', price: 8000000, category: 'Luxury' },
  { id: '1000121499', name: 'Empire Castle', price: 7500000, category: 'Luxury' },
  { id: '1000123246', name: 'Dragon Pearl', price: 6000000, category: 'Luxury' },
  { id: '1000123375', name: 'Celestial Moon', price: 5500000, category: 'Luxury' },
  { id: '1000119384', name: 'Enchanted Rose', price: 9000000, category: 'Luxury' },
  { id: '1000121492', name: 'Golden Peacock', price: 4500000, category: 'Luxury' },
  // EVENT (3)
  { id: '1000121487', name: 'Party Balloon', price: 120000, category: 'Event' },
  { id: '1000119446', name: 'Festival Light', price: 130000, category: 'Event' },
  { id: '1000119330', name: 'Celebration Cake', price: 110000, category: 'Event' },
  // LUCKY (5)
  { id: '1000123179', name: 'Lucky Clover', price: 900000, category: 'Lucky' },
  { id: '1000121494', name: 'Magic Wand', price: 700000, category: 'Lucky' },
  { id: '1000120187', name: 'Treasure Chest', price: 450000, category: 'Lucky' },
  { id: '1000120188', name: 'Mystic Orb', price: 350000, category: 'Lucky' },
  { id: '1000121496', name: 'Shadow Blade', price: 550000, category: 'Lucky' },
];

function findLocalFile(giftId) {
  const files = fs.readdirSync(downloadsDir);
  const match = files.find(f => f.includes(giftId) && !f.includes('anim_'));
  if (!match) return null;
  return path.join(downloadsDir, match);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.gif') return 'image/gif';
  if (ext === '.png') return 'image/png';
  return 'image/jpeg';
}

(async () => {
  console.log('=== Creating 24 New Gift Entries + Uploading Transparent Images ===\n');

  let created = 0;
  let errors = [];

  for (const gift of newGifts) {
    try {
      const localPath = findLocalFile(gift.id);
      if (!localPath) {
        console.log(`[SKIP] ${gift.id} (${gift.name}) — no local file`);
        continue;
      }

      // 1. Delete old file from Storage
      const [allFiles] = await bucket.getFiles({ prefix: 'gifts/' });
      const oldFiles = allFiles.filter(f => f.name.includes(gift.id) && !f.name.includes('anim_'));
      for (const oldFile of oldFiles) {
        try { await oldFile.delete(); } catch (e) {}
      }

      // 2. Upload new transparent file
      const ext = path.extname(localPath).replace('.', '') || 'png';
      const storagePath = `gifts/thumb_${gift.id}.${ext}`;
      const contentType = getContentType(localPath);
      const newFile = bucket.file(storagePath);
      await newFile.save(fs.readFileSync(localPath), { metadata: { contentType } });
      await newFile.makePublic();
      const imageUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      // 3. Create Firestore document
      const docRef = db.collection('gifts').doc();
      await docRef.set({
        id: gift.id,
        name: gift.name,
        price: gift.price,
        category: gift.category,
        imageUrl: imageUrl,
        animationId: 'video_based',
        tier: gift.price >= 5000000 ? 'legendary' : gift.price >= 1000000 ? 'epic' : 'normal',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`[OK] ${gift.id} (${gift.name}) — doc: ${docRef.id}, uploaded + created`);
      created++;
    } catch (err) {
      console.log(`[ERROR] ${gift.id} — ${err.message}`);
      errors.push(gift.id);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Created: ${created}`);
  console.log(`Errors: ${errors.length}`);
  process.exit(0);
})();
