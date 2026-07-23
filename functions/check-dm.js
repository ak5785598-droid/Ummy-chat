const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});

const db = admin.firestore();

async function main() {
  // Search for 'ary' in users collection (just username field of root docs)
  const usersSnap = await db.collection('users').select('username').get();
  const aryaIds = [];
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const u = (data.username || '').toLowerCase();
    if (u.includes('ary')) {
      aryaIds.push({ uid: doc.id, username: data.username });
      console.log(`Found arya user: UID=${doc.id}, username=${data.username}`);
    }
  }

  if (aryaIds.length === 0) {
    console.log('No arya users found in root docs. Checking profiles...');
    // Try broader search
    const allUsers = await db.collection('users').limit(50).get();
    for (const doc of allUsers.docs) {
      try {
        const profileSnap = await db.collection('users').doc(doc.id).collection('profile').doc(doc.id).get();
        if (profileSnap.exists) {
          const u = (profileSnap.data().username || '').toLowerCase();
          if (u.includes('ary')) {
            aryaIds.push({ uid: doc.id, username: profileSnap.data().username });
            console.log(`Found arya in profile: UID=${doc.id}, username=${profileSnap.data().username}`);
          }
        }
      } catch(e) {}
    }
  }

  if (aryaIds.length === 0) {
    console.log('NO arya users found at all!');
    process.exit(0);
  }

  // For each arya user, find chats involving them
  for (const arya of aryaIds) {
    console.log(`\n=== Checking chats for ${arya.username} (${arya.uid}) ===`);
    
    // Query chats where arya is participant
    const chatsSnap = await db.collection('privateChats')
      .where('participantIds', 'array-contains', arya.uid)
      .get();
    
    console.log(`Found ${chatsSnap.size} chats`);
    
    for (const chatDoc of chatsSnap.docs) {
      const chatData = chatDoc.data();
      const participants = chatData.participantIds || [];
      const otherUid = participants.find(id => id !== arya.uid);
      
      console.log(`\n--- Chat: ${chatDoc.id} ---`);
      console.log(`Other user: ${otherUid}`);
      console.log(`lastMessage: ${chatData.lastMessage || 'none'}`);
      console.log(`updatedAt: ${chatData.updatedAt?.toDate?.() || chatData.updatedAt}`);
      
      // Get ALL messages
      const msgsSnap = await db.collection('privateChats').doc(chatDoc.id).collection('messages')
        .orderBy('timestamp', 'asc')
        .get();
      
      console.log(`Messages count: ${msgsSnap.size}`);
      
      // Show last 20 messages
      const msgs = msgsSnap.docs;
      const start = Math.max(0, msgs.length - 20);
      console.log(`Showing last ${msgs.length - start} messages:`);
      
      for (let i = start; i < msgs.length; i++) {
        const msg = msgs[i].data();
        const ts = msg.timestamp?.toDate?.() || (msg.timestamp?.seconds ? new Date(msg.timestamp.seconds * 1000) : null);
        const timeStr = ts ? ts.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'NO-TS';
        console.log(`  [${timeStr}] sender=${msg.senderId?.slice(0,8)}... text="${(msg.text || '').slice(0,80)}" type=${msg.type || 'text'} deleted=${!!msg.deletedBySender}`);
      }
    }
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
