import { NextResponse } from 'next/server';
import { db } from '@/firebase/admin-config';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET() {
  try {
    // 1. Find User RIHAN
    const usersSnap = await db.collection('users').where('username', '==', 'RIHAN').limit(1).get();
    
    if (usersSnap.empty) {
      return NextResponse.json({ error: 'RIHAN not found' }, { status: 404 });
    }

    const rihanUid = usersSnap.docs[0].id;
    console.log('Found RIHAN UID:', rihanUid);

    // 2. Determine next 3-digit ID
    const roomsSnap = await db.collection('chatRooms').get();
    let maxId = 115; // Starting from 115 as seen in screenshot
    
    roomsSnap.forEach(doc => {
      const roomNum = parseInt(doc.data().roomNumber);
      if (!isNaN(roomNum) && roomNum < 1000 && roomNum > maxId) {
        maxId = roomNum;
      }
    });

    const nextId = maxId + 1;
    const nextIdStr = nextId.toString();

    // 3. Perform Updates
    const batch = db.batch();
    
    // Update Rihan's room
    batch.update(db.collection('chatRooms').doc(rihanUid), {
      roomNumber: nextIdStr,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Update global counter
    batch.update(db.collection('appConfig').doc('counters'), {
      lastRoomId: nextId
    });

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      rihanId: rihanUid, 
      newRoomNumber: nextIdStr,
      prevCounterResetTo: nextId
    });
  } catch (error: any) {
    console.error('Fix ID Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
