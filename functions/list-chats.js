const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'studio-7826224327-e0efc.firebasestorage.app'
});

const db = admin.firestore();

async function main() {
  // List ALL privateChats with their participants
  const chatsSnap = await db.collection('privateChats').get();
  console.log(`Total private chats: ${chatsSnap.size}\n`);
  
  for (const chatDoc of chatsSnap.docs) {
    const data = chatDoc.data();
    const participants = data.participantIds || [];
    
    // Get usernames for each participant
    const participantNames = [];
    for (const pid of participants) {
      try {
        const userDoc = await db.collection('users').doc(pid).get();
        const username = userDoc.data()?.username || 'unknown';
        participantNames.push(`${username}(${pid.slice(0,6)})`);
      } catch(e) {
        participantNames.push(`unknown(${pid.slice(0,6)})`);
      }
    }
    
    // Get message count
    const msgsSnap = await db.collection('privateChats').doc(chatDoc.id).collection('messages').count().get();
    const msgCount = msgsSnap.data().count;
    
    const lastMsgTime = data.updatedAt?.toDate?.() || null;
    const timeStr = lastMsgTime ? lastMsgTime.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : 'no time';
    
    console.log(`Chat ${chatDoc.id}: ${participantNames.join(' & ')} | msgs=${msgCount} | lastUpdate=${timeStr} | lastMsg="${(data.lastMessage || '').slice(0,50)}"`);
  }
  
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
