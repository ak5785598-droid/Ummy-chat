import { NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';

export async function GET() {
  try {
    const usersSnapshot = await adminDb.collection('users').get();
    
    let resetCount = 0;
    
    const batchArray: admin.firestore.WriteBatch[] = [];
    batchArray.push(adminDb.batch());
    let operationCounter = 0;
    let batchIndex = 0;

    for (const doc of usersSnapshot.docs) {
      const userRef = adminDb.collection('users').doc(doc.id);
      const profileRef = userRef.collection('profile').doc(doc.id);
      
      // Update wallet inside users document
      batchArray[batchIndex].update(userRef, {
        'wallet.coins': 0,
        'wallet.totalSpent': 0,
        'wallet.totalExp': 0
      });
      operationCounter++;
      
      if (operationCounter === 490) {
        batchArray.push(adminDb.batch());
        batchIndex++;
        operationCounter = 0;
      }
      
      // Update wallet inside profile subcollection
      batchArray[batchIndex].update(profileRef, {
        'wallet.coins': 0,
        'wallet.totalSpent': 0,
        'wallet.totalExp': 0
      });
      operationCounter++;
      
      if (operationCounter === 490) {
        batchArray.push(adminDb.batch());
        batchIndex++;
        operationCounter = 0;
      }
      
      resetCount++;
    }
    
    for (const batch of batchArray) {
      await batch.commit();
    }
    
    return NextResponse.json({ success: true, message: `Successfully reset ${resetCount} users' wallets and EXP to 0.` });
  } catch (error: any) {
    console.error('Reset Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
