const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});

const db = admin.firestore();

async function main() {
  const aryaUid = '6Lsdq4Ep00ecFNumACFWXMgo66T2';
  
  // 1. Check root user doc
  console.log('=== ROOT USER DOC ===');
  const userDoc = await db.collection('users').doc(aryaUid).get();
  if (userDoc.exists) {
    const data = userDoc.data();
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('ROOT DOC MISSING!');
  }
  
  // 2. Check profile subcollection
  console.log('\n=== PROFILE SUBCOLLECTION ===');
  const profileDoc = await db.collection('users').doc(aryaUid).collection('profile').doc(aryaUid).get();
  if (profileDoc.exists) {
    const data = profileDoc.data();
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log('PROFILE DOC MISSING!');
  }
  
  // 3. Check ALL subcollections under Arya's user doc
  console.log('\n=== ALL SUBCOLLECTIONS ===');
  const subCols = await db.collection('users').doc(aryaUid).listCollections();
  for (const col of subCols) {
    const docs = await col.get();
    console.log(`  ${col.id}: ${docs.size} docs`);
    for (const d of docs.docs) {
      console.log(`    ${d.id}: ${JSON.stringify(d.data()).slice(0, 200)}`);
    }
  }
  
  // 4. Find ALL chats involving Arya
  console.log('\n=== ALL CHATS WITH ARYA ===');
  const chatsSnap = await db.collection('privateChats')
    .where('participantIds', 'array-contains', aryaUid)
    .get();
  
  console.log(`Total chats: ${chatsSnap.size}`);
  
  for (const chatDoc of chatsSnap.docs) {
    const chatData = chatDoc.data();
    const participants = chatData.participantIds || [];
    const otherUid = participants.find(id => id !== aryaUid);
    
    // Get other user's name
    const otherUser = await db.collection('users').doc(otherUid).get();
    const otherName = otherUser.data()?.username || 'unknown';
    
    // Count messages
    const msgsSnap = await db.collection('privateChats').doc(chatDoc.id).collection('messages')
      .orderBy('timestamp', 'asc')
      .get();
    
    console.log(`\nChat: ${chatDoc.id}`);
    console.log(`  Other: ${otherName} (${otherUid})`);
    console.log(`  Messages: ${msgsSnap.size}`);
    console.log(`  lastMessage: ${chatData.lastMessage || 'none'}`);
    
    // Show ALL messages
    for (const doc of msgsSnap.docs) {
      const msg = doc.data();
      const ts = msg.timestamp?.toDate?.() || (msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000) : null);
      const timeStr = ts ? ts.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'NO-TS';
      const senderName = msg.senderId === aryaUid ? 'ARYA' : otherName;
      console.log(`    [${timeStr}] ${senderName}: "${(msg.text || '').slice(0,60)}" deleted=${!!msg.deletedBySender}`);
    }
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
