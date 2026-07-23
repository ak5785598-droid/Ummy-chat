const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app',
});

async function uploadFrame() {
  const bucket = admin.storage().bucket();
  const firestore = admin.firestore();

  const localImage = 'C:\\Users\\HP\\Downloads\\1000162525-removebg-preview.png';
  const fileName = `store/frame_${Date.now()}.png`;
  const remoteFile = bucket.file(fileName);

  console.log('Uploading image to Firebase Storage...');
  await bucket.upload(localImage, {
    destination: fileName,
    metadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000',
    },
  });

  console.log('Making file public...');
  await remoteFile.makePublic();

  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
  console.log('Image URL:', publicUrl);

  const itemRef = firestore.collection('storeItems').doc();
  const itemData = {
    id: itemRef.id,
    name: 'Royal Gold Frame',
    url: publicUrl,
    videoUrl: '',
    price: 500000,
    duration: 30,
    category: 'Frame',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  console.log('Creating Firestore document...');
  await itemRef.set(itemData);
  console.log('Done! Document ID:', itemRef.id);
  console.log('Frame added successfully!');

  process.exit(0);
}

uploadFrame().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
