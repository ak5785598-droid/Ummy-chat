const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app',
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
const DOWNLOADS = path.join('C:\\Users\\HP\\Downloads');

const FRAMES = [
  { file: 'frame cp king 2.png', docId: 'HUVIRfnRwycrxB9X7jBJ', name: 'Cp King 2' },
  { file: 'frame_cp_king_1.png', docId: 'HNUKkvssrnlkRvijjyxV', name: 'Cp King 1' },
  { file: 'frame_2026.png', docId: 'vzs9SZp5i7QE7irIjbnm', name: '2026' },
  { file: 'frame_coins_seller.png', docId: 'UpKSQW1LTJF9lqcTtnul', name: 'Coins Seller' },
  { file: 'frame_cp_queen.png', docId: '20dwD8ATlHi7SzM9XUjv', name: 'Cp Queen' },
  { file: 'frame_crown_wing.png', docId: 'ax6i4rOvLDl0prHh4AAc', name: 'Crown Wings' },
  { file: 'frame_customer_service.png', docId: 'jlp4ZAZOy1OiSQCz2t4i', name: 'Customer Service' },
  { file: 'frame_dragon_elite.png', docId: '2Y81SXkQ7eebTH69KVsv', name: 'Dragon Elite' },
  { file: 'frame_event_based_1.png', docId: 'VXGdbSjb01F8FbCfHgg1', name: 'Event Based 1' },
  { file: 'frame_event_based_2.png', docId: 'bbDuyhXcYcAiT7MkJEdv', name: 'Event Based 2' },
  { file: 'frame_event_based_3-.png', docId: 'jqOhty1JiKQU7TOCKtPo', name: 'Event Based 3' },
  { file: 'frame_immortal_glory.png', docId: 'IJ6vGEhSXfvg9AV9VpbJ', name: 'Immortal Glory' },
  { file: 'frame_lion_marcho.png', docId: 'lsGbEhqeJy6TzupO7oQL', name: 'Lion Marcho' },
  { file: 'frame_merchant.png', docId: 'VquXXGoywZ7c31TwNSYe', name: 'Merchant' },
  { file: 'frame_official_faxey.png', docId: '6UamDwsaCvpFHa6pwoop', name: 'Official Faxey' },
  { file: 'frame_official_history.png', docId: 'zgqswfzDL7I6bUG5vyBE', name: 'Official History' },
  { file: 'frame_official_khai.png', docId: 'TpNr0a5D02CGRUt7JBZG', name: 'Official Khai' },
  { file: 'frame_official_sri.png', docId: '9XMLZuMdS6SMBAcHbvYN', name: 'Official Sri' },
  { file: 'frame_princess_tiara.png', docId: 'H1RrNR7AyL3NrUi2j2ao', name: 'Princess Tiara' },
  { file: 'frame_winter_snow.png', docId: 'NGEodWAOqnblTrplUCx0', name: 'Winter Snow' },
  { file: 'frame official geography.gif', docId: 'gEvf2sliKiAZ3ajWW4nv', name: 'Official Geography' },
  { file: 'frame_event_captain.png', docId: 'DxEIlTzieNDhQxU8jccD', name: 'Event Captain' },
];

async function main() {
  let uploaded = 0;
  let failed = 0;

  for (const frame of FRAMES) {
    const filePath = path.join(DOWNLOADS, frame.file);
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${frame.file}`);
      failed++;
      continue;
    }

    const ext = path.extname(frame.file).toLowerCase();
    const storageName = frame.file.replace(/\s+/g, '_').replace('-', '_');
    const storagePath = `store/frames/display/${storageName}`;
    const contentType = ext === '.gif' ? 'image/gif' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';

    console.log(`\n📦 ${frame.name} (${frame.docId})`);
    console.log(`   ⬆️  Uploading: ${frame.file} → ${storagePath}`);

    try {
      await bucket.upload(filePath, {
        destination: storagePath,
        metadata: { contentType, cacheControl: 'public, max-age=31536000' },
      });

      const publicUrl = `https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/${encodeURIComponent(storagePath)}?alt=media`;

      await db.collection('storeItems').doc(frame.docId).update({ imageUrl: publicUrl });

      console.log(`   ✅ Uploaded + imageUrl updated!`);
      console.log(`   🔗 ${publicUrl}`);
      uploaded++;
    } catch (err) {
      console.log(`   ❌ Error: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n${'='.repeat(50)}`);
  console.log(`✅ Success: ${uploaded}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total: ${FRAMES.length}`);
}

main().catch(err => { console.error(err); process.exit(1); });
