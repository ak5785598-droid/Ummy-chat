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

const giftIds = [
  '1000121522','1000121500','1000119403','1000119398','1000118798','1000118665',
  '1000116138','1000111706','1000118212','1000121497','1000119356','1000118707',
  '1000121499','1000123246','1000123373','1000123375','1000126638','1000126635',
  '1000123333','1000126598','1000126643','1000126780','1000126808','1000131785',
  '1000131804','1000131803','1000131832','1000131839','1000131840','1000131842',
  '1000131844','1000131856','1000131858','1000131857','1000131860','1000134077',
  '1000134076','1000134078','1000134079','1000119419','1000123208','1000119324',
  '1000119384','1000123245','1000123322','1000123258','1000121492','1000121487',
  '1000119446','1000119415','1000119416','1000119401','1000119335','1000119330',
  '1000123179','1000121494','1000120187','1000120188','1000121496'
];

function findLocalFile(giftId) {
  const files = fs.readdirSync(downloadsDir);
  const match = files.find(f => f.includes(giftId));
  if (!match) return null;
  return path.join(downloadsDir, match);
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.gif') return 'image/gif';
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  return 'image/png';
}

(async () => {
  console.log('=== Starting Bulk Gift Upload ===\n');

  // Get all gifts from Firestore
  const giftsSnap = await db.collection('gifts').get();
  const allGifts = [];
  giftsSnap.forEach(doc => {
    allGifts.push({ docId: doc.id, ...doc.data() });
  });

  let uploaded = 0;
  let skipped = 0;
  let errors = [];

  for (const giftId of giftIds) {
    try {
      // Find local file
      const localPath = findLocalFile(giftId);
      if (!localPath) {
        console.log(`[SKIP] ${giftId} — no local file found`);
        skipped++;
        continue;
      }

      // Find gift in Firestore by matching ID in imageUrl
      const gift = allGifts.find(g => {
        const url = g.imageUrl || '';
        return url.includes(giftId);
      });

      if (!gift) {
        console.log(`[SKIP] ${giftId} — no Firestore gift found`);
        skipped++;
        continue;
      }

      // 1. Delete old file from Storage
      const oldUrl = gift.imageUrl || '';
      const oldStoragePath = oldUrl.split('/o/')[1]?.split('?')[0]?.replace(/%2F/g, '/') || '';
      if (oldStoragePath) {
        try {
          await bucket.file(oldStoragePath).delete();
        } catch (e) {}
      }

      // 2. Upload new file
      const ext = path.extname(localPath).replace('.', '') || 'png';
      const storagePath = `gifts/thumb_${giftId}.${ext}`;
      const contentType = getContentType(localPath);
      const newFile = bucket.file(storagePath);
      await newFile.save(fs.readFileSync(localPath), {
        metadata: { contentType }
      });
      await newFile.makePublic();

      const newUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      // 3. Update Firestore
      await db.collection('gifts').doc(gift.docId).update({
        imageUrl: newUrl
      });

      console.log(`[OK] ${giftId} (${gift.name || 'unnamed'}) — uploaded + URL updated`);
      uploaded++;
    } catch (err) {
      console.log(`[ERROR] ${giftId} — ${err.message}`);
      errors.push(giftId);
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Errors: ${errors.length}`);
  if (errors.length > 0) console.log(`Failed IDs:`, errors);

  process.exit(0);
})();
