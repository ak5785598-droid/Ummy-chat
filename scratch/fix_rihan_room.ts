import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  "projectId": "studio-7826224327-e0efc",
  "appId": "1:373109833688:web:3d2b2206498d18610bfcad",
  "apiKey": "AIzaSyBo-PRXO7y9tpcz7-g0BW0ToW22z7I-HvA",
  "authDomain": "studio-7826224327-e0efc.firebaseapp.com",
  "storageBucket": "studio-7826224327-e0efc.firebasestorage.app",
  "measurementId": "G-9HHSZ3FJBQ",
  "messagingSenderId": "373109833688"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function findRihanAndUpdate() {
  try {
    // 1. Find User by Name
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', 'RIHAN'));
    const snap = await getDocs(q);
    
    if (snap.empty) {
      console.log('User RIHAN not found.');
      return;
    }

    const rihanUid = snap.docs[0].id;
    console.log('Found RIHAN with UID:', rihanUid);

    // 2. Determine new Room ID
    // We want 116 (based on 115 being last)
    const nextId = 116;
    console.log('Targeting ID:', nextId);

    // 3. Update Rihan's Room
    const roomRef = doc(db, 'chatRooms', rihanUid);
    await updateDoc(roomRef, { roomNumber: nextId.toString() });
    console.log(`Updated room ${rihanUid} to number ${nextId}`);

    // 4. Update Global Counter
    const counterRef = doc(db, 'appConfig', 'counters');
    await updateDoc(counterRef, { lastRoomId: nextId });
    console.log('Updated global counter lastRoomId to:', nextId);
    
    process.exit(0);
  } catch (err) {
    console.error('FIX FAILED:', err);
    process.exit(1);
  }
}

findRihanAndUpdate();
