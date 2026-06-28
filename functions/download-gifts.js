const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app',
});

const bucket = admin.storage().bucket();

async function downloadGiftImages() {
  console.log('🔍 Listing all gift images...');

  const [files] = await bucket.getFiles({ prefix: 'gifts/' });
  const imageFiles = files.filter(f => {
    const name = f.name.toLowerCase();
    return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.gif') || name.endsWith('.webp');
  });

  const downloadDir = path.join(__dirname, '..', 'assets', 'images', 'gifts');
  if (!fs.existsSync(downloadDir)) {
    fs.mkdirSync(downloadDir, { recursive: true });
  }

  // Check what's already downloaded
  const existing = new Set(fs.readdirSync(downloadDir));
  const toDownload = imageFiles.filter(f => !existing.has(f.name.replace('gifts/', '')));

  console.log(`📥 Total images: ${imageFiles.length} | Already downloaded: ${imageFiles.length - toDownload.length} | New: ${toDownload.length}\n`);

  for (const file of toDownload) {
    const fileName = file.name.replace('gifts/', '');
    const destPath = path.join(downloadDir, fileName);
    const size = (file.metadata.size / 1024).toFixed(1);
    process.stdout.write(`  ⬇️  ${fileName} (${size} KB)... `);

    try {
      await file.download({ destination: destPath });
      console.log('✅');
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  // Also re-download all MP4 animation files
  const mp4Files = files.filter(f => f.name.toLowerCase().endsWith('.mp4'));
  const animDir = path.join(downloadDir, 'animations');
  if (!fs.existsSync(animDir)) {
    fs.mkdirSync(animDir, { recursive: true });
  }
  const existingAnim = new Set(fs.readdirSync(animDir));
  const toDownloadAnim = mp4Files.filter(f => !existingAnim.has(f.name.replace('gifts/', '')));

  console.log(`\n🎬 Total animations: ${mp4Files.length} | Already downloaded: ${mp4Files.length - toDownloadAnim.length} | New: ${toDownloadAnim.length}\n`);

  for (const file of toDownloadAnim) {
    const fileName = file.name.replace('gifts/', '');
    const destPath = path.join(animDir, fileName);
    const size = (file.metadata.size / 1024 / 1024).toFixed(1);
    process.stdout.write(`  ⬇️  ${fileName} (${size} MB)... `);

    try {
      await file.download({ destination: destPath });
      console.log('✅');
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  const totalImages = fs.readdirSync(downloadDir).filter(f => /\.(png|jpg|jpeg|gif|webp)$/i.test(f)).length;
  const totalAnims = fs.readdirSync(animDir).filter(f => f.endsWith('.mp4')).length;
  console.log(`\n🎉 Done!`);
  console.log(`   Images: ${downloadDir} (${totalImages} files)`);
  console.log(`   Animations: ${animDir} (${totalAnims} files)`);

  process.exit(0);
}

downloadGiftImages().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
