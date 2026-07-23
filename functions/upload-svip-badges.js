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

(async () => {
  console.log('=== Uploading SVIP Badges ===\n');

  const updates = {};
  let uploaded = 0;

  for (let level = 1; level <= 17; level++) {
    // Handle different naming: "svip 1.png" vs "svip8.png"
    const possibleNames = [
      `svip ${level}.png`,
      `svip${level}.png`,
      `SVIP ${level}.png`,
      `SVIP${level}.png`,
    ];
    
    let localPath = null;
    for (const name of possibleNames) {
      const p = path.join(downloadsDir, name);
      if (fs.existsSync(p)) {
        localPath = p;
        break;
      }
    }

    if (!localPath) {
      console.log(`[SKIP] SVIP ${level} — file not found`);
      continue;
    }

    // Upload to Storage
    const storagePath = `settings/svip_badge_${level}.png`;
    const newFile = bucket.file(storagePath);
    await newFile.save(fs.readFileSync(localPath), {
      metadata: { contentType: 'image/png' }
    });
    await newFile.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;
    updates[`levels.${level}.badgeUrl`] = publicUrl;
    
    const sizeKB = Math.round(fs.statSync(localPath).size / 1024);
    console.log(`[OK] SVIP ${level} — ${sizeKB}KB — uploaded`);
    uploaded++;
  }

  // Update svipConfig in Firestore
  if (Object.keys(updates).length > 0) {
    await db.collection('settings').doc('svipConfig').update(updates);
    console.log(`\n[UPDATED] svipConfig — ${uploaded} badge URLs set`);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Uploaded: ${uploaded}`);
  console.log(`Missing: SVIP 18`);
  process.exit(0);
})();
