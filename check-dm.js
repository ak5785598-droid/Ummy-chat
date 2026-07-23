const admin = require('firebase-admin');
const serviceAccount = require('./functions/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});

const db = admin.firestore();

async function main() {
  // Find all users with username containing 'ary' or 'Ary'
  const usersSnap = await db.collection('users').get();
  const aryaUsers = [];
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    // Check username in root doc
    if (data.username && data.username.toLowerCase().includes('ary')) {
      aryaUsers.push({ id: doc.id, username: data.username, source: 'root' });
    }
    // Check profile subcollection
    try {
      const profileSnap = await db.collection('users').doc(doc.id).collection('profile').doc(doc.id).get();
      if (profileSnap.exists) {
        const pData = profileSnap.data();
        if (pData.username && pData.username.toLowerCase().includes('ary')) {
          aryaUsers.push({ id: doc.id, username: pData.username, source: 'profile' });
        }
      }
    } catch(e) {}
  }
  
  // Deduplicate
  const unique = {};
  for (const u of aryaUsers) {
    if (!unique[u.id]) unique[u.id] = u;
  }
  
  console.log('=== ARYA USERS FOUND ===');
  for (const [uid, info] of Object.entries(unique)) {
    console.log(`UID: ${uid}, Username: ${info.username}, Source: ${info.source}`);
  }
  
  // Now find privateChats involving these users
  // We need the current user's UID too - check who is chatting with arya users
  const aryaIds = Object.keys(unique);
  
  // Get all privateChats
  const chatsSnap = await db.collection('privateChats').get();
  console.log(`\n=== TOTAL PRIVATE CHATS: ${chatsSnap.size} ===\n`);
  
  for (const chatDoc of chatsSnap.docs) {
    const chatData = chatDoc.data();
    const participants = chatData.participantIds || [];
    
    // Check if any arya user is in this chat
    const hasArya = aryaIds.some(id => participants.includes(id));
    if (!hasArya) continue;
    
    console.log(`\n--- Chat: ${chatDoc.id} ---`);
    console.log(`Participants: ${participants.join(' & ')}`);
    console.log(`Last message: ${chatData.lastMessage || 'none'}`);
    console.log(`updatedAt: ${chatData.updatedAt?.toDate?.() || chatData.updatedAt}`);
    
    // Get messages in this chat
    const msgsSnap = await db.collection('privateChats').doc(chatDoc.id).collection('messages')
      .orderBy('timestamp', 'asc')
      .get();
    
    console.log(`Messages count: ${msgsSnap.size}`);
    
    for (const msgDoc of msgsSnap.docs) {
      const msg = msgDoc.data();
      const ts = msg.timestamp?.toDate?.() || (msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000) : null);
      console.log(`  [${ts ? ts.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'NO-TS'}] sender=${msg.senderId?.slice(0,8)}... text="${(msg.text || '').slice(0,50)}" type=${msg.type || 'text'} deletedBySender=${msg.deletedBySender || false}`);
    }
  }
}

main().catch(console.error);
