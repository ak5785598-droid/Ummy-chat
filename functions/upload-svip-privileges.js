/**
 * Upload SVIP privilege assets to Firebase Storage.
 * Run: node upload-svip-privileges.js
 */
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app',
});

const bucket = admin.storage().bucket();

const THEMES = ['owl', 'wolf', 'scorpion', 'lion', 'tiger', 'dragon'];
const ASSET_TYPES = ['frame', 'bubble', 'entrance', 'wave'];
const LOCAL_DIR = path.join(__dirname, '..', 'ummy-native', 'assets', 'images', 'themes');

async function uploadFile(localPath, remotePath) {
  if (!fs.existsSync(localPath)) {
    console.log(`  ⚠️  SKIP (not found): ${localPath}`);
    return null;
  }
  const [url] = await bucket.upload(localPath, {
    destination: remotePath,
    metadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000',
    },
  });
  // Get public URL via CDN proxy
  const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(remotePath)}?alt=media`;
  console.log(`  ✅ Uploaded: ${remotePath}`);
  return publicUrl;
}

async function main() {
  console.log('🚀 Uploading SVIP privilege assets to Firebase Storage...\n');

  const assetMap = {};

  for (const theme of THEMES) {
    assetMap[theme] = {};
    for (const assetType of ASSET_TYPES) {
      const fileName = `svip_${theme}_${assetType}.png`;
      const localPath = path.join(LOCAL_DIR, fileName);
      const remotePath = `svip-privileges/${assetType}/${fileName}`;

      const url = await uploadFile(localPath, remotePath);
      assetMap[theme][assetType] = url;
    }
  }

  // Also upload backdrop images
  console.log('\n📦 Uploading backdrop images...');
  const backdropMap = {};
  for (const theme of THEMES) {
    const fileName = `dangerous_${theme}_bg.png`;
    const localPath = path.join(LOCAL_DIR, fileName);
    const remotePath = `svip-privileges/backdrop/${fileName}`;

    const url = await uploadFile(localPath, remotePath);
    backdropMap[theme] = url;
  }

  // Save asset map to JSON for Cloud Function
  const outputData = {
    themes: assetMap,
    backdrops: backdropMap,
    uploadedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, 'svip-asset-map.json');
  fs.writeFileSync(outputPath, JSON.stringify(outputData, null, 2));
  console.log(`\n📄 Asset map saved to: ${outputPath}`);
  console.log('\n✅ Done! Update Cloud Function with these URLs.');
}

main().catch(console.error);
