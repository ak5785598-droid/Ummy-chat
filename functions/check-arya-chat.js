const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});

const db = admin.firestore();

async function main() {
  const chatId = '1uFLakhhXTYJCUMwhpFLWSLHlDx1_6Lsdq4Ep00ecFNumACFWXMgo66T2';
  
  // Get ALL messages
  const msgsSnap = await db.collection('privateChats').doc(chatId).collection('messages')
    .orderBy('timestamp', 'asc')
    .get();
  
  console.log(`Total messages: ${msgsSnap.size}\n`);
  
  for (const doc of msgsSnap.docs) {
    const msg = doc.data();
    const ts = msg.timestamp?.toDate?.() || (msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000) : null);
    const timeStr = ts ? ts.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'NO-TS';
    
    console.log(`ID: ${doc.id}`);
    console.log(`  Time: ${timeStr}`);
    console.log(`  Sender: ${msg.senderId}`);
    console.log(`  Text: "${msg.text || ''}"`);
    console.log(`  Type: ${msg.type || 'text'}`);
    console.log(`  deletedBySender: ${msg.deletedBySender || false}`);
    console.log(`  imageUrl: ${msg.imageUrl || 'null'}`);
    console.log(`  audioUrl: ${msg.audioUrl || 'null'}`);
    console.log('');
  }

  // Also check both user profiles to know who is who
  const p1 = await db.collection('users').doc('1uFLakhhXTYJCUMwhpFLWSLHlDx1').get();
  const p2 = await db.collection('users').doc('6Lsdq4Ep00ecFNumACFWXMgo66T2').get();
  
  console.log('\n=== USER PROFILES ===');
  console.log('1uFLak:', p1.data()?.username, '| uid:', '1uFLakhhXTYJCUMwhpFLWSLHlDx1');
  console.log('6Lsdq4:', p2.data()?.username, '| uid:', '6Lsdq4Ep00ecFNumACFWXMgo66T2');
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
