/**
 * Upload 18 SVIP level frames to Firebase Storage + update svipConfig + backfill user svipPrivileges.
 * Run: node upload-svip-level-frames.js
 */
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

const BUCKET_BASE = 'https://firebasestorage.googleapis.com/v0/b/studio-7826224327-e0efc.firebasestorage.app/o/';

function getFrameUrl(storageName) {
  return `${BUCKET_BASE}${encodeURIComponent(storageName)}?alt=media`;
}

async function uploadFrames() {
  console.log('🚀 Uploading 18 SVIP level frames to Firebase Storage...\n');

  const frameUrls = {};

  for (let lvl = 1; lvl <= 18; lvl++) {
    const fileName = `SVIP${lvl}.png`;
    const filePath = path.join(DOWNLOADS, fileName);

    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${fileName}`);
      continue;
    }

    const storagePath = `svip-privileges/frame/svip_level_${lvl}_frame.png`;

    try {
      await bucket.upload(filePath, {
        destination: storagePath,
        metadata: { contentType: 'image/png', cacheControl: 'public, max-age=31536000' },
      });

      const url = getFrameUrl(storagePath);
      frameUrls[lvl] = url;
      console.log(`✅ SVIP ${lvl} frame uploaded → ${storagePath}`);
    } catch (err) {
      console.log(`❌ SVIP ${lvl} upload failed: ${err.message}`);
    }
  }

  return frameUrls;
}

async function updateSvipConfig(frameUrls) {
  console.log('\n📝 Updating Firestore svipConfig with per-level frameUrl...\n');

  const docRef = db.doc('settings/svipConfig');
  const snap = await docRef.get();
  const existing = snap.exists ? snap.data() : {};
  const levels = existing.levels || {};

  const levelUpdates = {};
  for (let lvl = 1; lvl <= 18; lvl++) {
    if (frameUrls[lvl]) {
      levelUpdates[`levels.${lvl}.frameUrl`] = frameUrls[lvl];
    }
  }

  await docRef.set(levelUpdates, { merge: true });
  console.log(`✅ svipConfig updated with ${Object.keys(frameUrls).length} frame URLs`);
}

async function backfillUsers(frameUrls) {
  console.log('\n👥 Backfilling svipPrivileges.frameUrl for existing SVIP users...\n');

  const usersSnapshot = await db.collection('users').get();
  let updated = 0;

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const svip = userData.svip || 0;
    if (svip <= 0) continue;

    const frameUrl = frameUrls[svip];
    if (!frameUrl) continue;

    const userId = userDoc.id;

    // Update root doc
    await userDoc.ref.update({ 'svipPrivileges.frameUrl': frameUrl });

    // Update profile subcollection
    const profileRef = db.doc(`users/${userId}/profile/${userId}`);
    const profileSnap = await profileRef.get();
    if (profileSnap.exists) {
      await profileRef.update({ 'svipPrivileges.frameUrl': frameUrl });
    }

    console.log(`✅ ${userId}: SVIP ${svip} → frameUrl updated`);
    updated++;
  }

  console.log(`\n📊 Backfill done! Updated: ${updated} users`);
}

async function main() {
  const frameUrls = await uploadFrames();

  if (Object.keys(frameUrls).length === 0) {
    console.log('❌ No frames uploaded. Aborting.');
    return;
  }

  await updateSvipConfig(frameUrls);
  await backfillUsers(frameUrls);

  console.log('\n🎉 All done! 18 unique SVIP frames uploaded and assigned.');
}

main().catch(err => { console.error(err); process.exit(1); });
