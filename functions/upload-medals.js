const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});

const bucket = admin.storage().bucket();
const db = admin.firestore();
const FFMPEG = 'C:\\Users\\HP\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-8.1.2-full_build\\bin\\ffmpeg.exe';
const DOWNLOADS = 'C:\\Users\\HP\\Downloads';

const medals = [
  { name: 'Event Captain', file: 'event captain.png' },
  { name: 'Event Host', file: 'event host (2).png' },
  { name: 'Top Room 3', file: 'top room 3.png' },
  { name: 'Top Room 2', file: 'top room 2.png' },
  { name: 'Top Room 1', file: 'top room 1.png' },
  { name: 'Official 2', file: 'official 2.png' },
  { name: 'Top Family 3', file: 'top family 3.png' },
  { name: 'Top Family 2', file: 'top family 2.png' },
  { name: 'Top Family 1', file: 'top family 1.png' },
  { name: 'Official 1', file: 'official 1.png' },
  { name: 'Game King', file: 'game king.png' },
  { name: 'Top Receiver 3', file: 'top reciever 3.png' },
  { name: 'Top Receiver 2', file: 'top reciever 2.png' },
  { name: 'Top Receiver 1', file: 'top reciever 1.png' },
  { name: 'Top Sender 3', file: 'top sender 3.png' },
  { name: 'Top Sender 2', file: 'top sender 2.png' },
  { name: 'Top Sender 1', file: 'top sender 1.png' },
  { name: 'Merchant', file: 'merchant.png' },
  { name: 'Admin', file: 'admin.png' },
  { name: 'CS', file: 'cs.png' },
  { name: 'Coin Seller', file: 'coin seller.png' },
];

async function compressAndUpload(medal) {
  const srcPath = path.join(DOWNLOADS, medal.file);
  const compressedPath = path.join(DOWNLOADS, `compressed_${medal.file}`);

  if (!fs.existsSync(srcPath)) {
    console.log(`SKIP: ${medal.file} not found`);
    return;
  }

  // Compress with ffmpeg - reduce to 300px width, quality 60
  try {
    execSync(`"${FFMPEG}" -y -i "${srcPath}" -vf "scale=300:-1" -quality 60 "${compressedPath}"`, { stdio: 'pipe' });
  } catch (e) {
    console.log(`SKIP compress: ${medal.name}`);
    return;
  }

  const stat = fs.statSync(compressedPath);
  console.log(`${medal.name}: ${(stat.size / 1024).toFixed(0)}KB`);

  // Upload to Firebase Storage
  const storagePath = `medals/${medal.name.toLowerCase().replace(/\s+/g, '-')}.png`;
  await bucket.upload(compressedPath, {
    destination: storagePath,
    metadata: { contentType: 'image/png', cacheControl: 'public, max-age=86400' }
  });

  const [url] = await bucket.file(storagePath).getSignedUrl({ action: 'read', expires: '2030-01-01' });

  // Save to Firestore
  const docId = medal.name.toLowerCase().replace(/\s+/g, '-');
  await db.collection('medalsList').doc(docId).set({
    id: docId,
    name: medal.name,
    imageUrl: url,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
  });

  console.log(`DONE: ${medal.name} -> ${storagePath}`);

  // Cleanup compressed file
  fs.unlinkSync(compressedPath);
}

async function main() {
  for (const medal of medals) {
    await compressAndUpload(medal);
  }
  console.log('\nAll medals uploaded!');
}

main().catch(console.error);
