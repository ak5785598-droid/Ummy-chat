import { NextResponse } from 'next/server';
import { adminDb, admin } from '@/lib/firebase-admin';

// Vercel Cron Secret authentication (optional but recommended)
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: Request) {
  try {
    // Auth check
    const authHeader = request.headers.get('Authorization');
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    // Manual IST offset for GMT+5:30
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const ist = new Date(utc + (3600000 * 5.5));
    
    const isMonday = ist.getDay() === 1;
    const isFirstOfMonth = ist.getDate() === 1;

    const usersToReset = new Set<string>();

    // 1. Gather all users who have daily values to reset
    const dailyQueries = [
      adminDb.collection('users').where('wallet.dailySpent', '>', 0).get(),
      adminDb.collection('users').where('stats.dailyGiftsReceived', '>', 0).get(),
      adminDb.collection('users').where('stats.dailyGameWins', '>', 0).get(),
      adminDb.collection('users').where('stats.dailyFans', '>', 0).get(),
    ];

    // Weekly queries (Monday check)
    if (isMonday) {
      dailyQueries.push(
        adminDb.collection('users').where('wallet.weeklySpent', '>', 0).get(),
        adminDb.collection('users').where('stats.weeklyGiftsReceived', '>', 0).get(),
        adminDb.collection('users').where('stats.weeklyGameWins', '>', 0).get()
      );
    }

    // Monthly queries (1st of month check)
    if (isFirstOfMonth) {
      dailyQueries.push(
        adminDb.collection('users').where('wallet.monthlySpent', '>', 0).get(),
        adminDb.collection('users').where('stats.monthlyGiftsReceived', '>', 0).get(),
        adminDb.collection('users').where('stats.monthlyGameWins', '>', 0).get()
      );
    }

    const snaps = await Promise.all(dailyQueries);
    snaps.forEach(snap => {
      snap.docs.forEach(doc => {
        usersToReset.add(doc.id);
      });
    });

    // 2. Gather rooms with daily values
    const roomsToReset = new Set<string>();
    const roomsSnap = await adminDb.collection('chatRooms').where('stats.dailyGifts', '>', 0).get();
    roomsSnap.docs.forEach(doc => {
      roomsToReset.add(doc.id);
    });

    // 3. Prepare Batch updates
    const batches: admin.firestore.WriteBatch[] = [];
    let currentBatch = adminDb.batch();
    let operationCount = 0;

    const commitBatchIfNeeded = () => {
      if (operationCount >= 450) {
        batches.push(currentBatch);
        currentBatch = adminDb.batch();
        operationCount = 0;
      }
    };

    // Construct update payload for Users
    const userUpdatePayload: any = {
      'wallet.dailySpent': 0,
      'stats.dailyGiftsReceived': 0,
      'stats.dailyGifts': 0,
      'stats.dailyGameWins': 0,
      'stats.dailyFans': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (isMonday) {
      userUpdatePayload['wallet.weeklySpent'] = 0;
      userUpdatePayload['stats.weeklyGiftsReceived'] = 0;
      userUpdatePayload['stats.weeklyGameWins'] = 0;
    }

    if (isFirstOfMonth) {
      userUpdatePayload['wallet.monthlySpent'] = 0;
      userUpdatePayload['stats.monthlyGiftsReceived'] = 0;
      userUpdatePayload['stats.monthlyGameWins'] = 0;
    }

    // Add user document updates to batch
    for (const userId of usersToReset) {
      const userRef = adminDb.collection('users').doc(userId);
      const profileRef = userRef.collection('profile').doc(userId);

      currentBatch.update(userRef, userUpdatePayload);
      operationCount++;
      commitBatchIfNeeded();

      currentBatch.update(profileRef, userUpdatePayload);
      operationCount++;
      commitBatchIfNeeded();
    }

    // Add room document updates to batch
    const roomUpdatePayload = {
      'stats.dailyGifts': 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    for (const roomId of roomsToReset) {
      const roomRef = adminDb.collection('chatRooms').doc(roomId);
      currentBatch.update(roomRef, roomUpdatePayload);
      operationCount++;
      commitBatchIfNeeded();
    }

    // Add final batch if it has operations
    if (operationCount > 0) {
      batches.push(currentBatch);
    }

    // Commit all batches in parallel
    await Promise.all(batches.map(b => b.commit()));

    return NextResponse.json({
      success: true,
      message: `Leaderboard daily reset complete. Reset ${usersToReset.size} users and ${roomsToReset.size} rooms.`,
      resets: {
        users: usersToReset.size,
        rooms: roomsToReset.size,
        isMonday,
        isFirstOfMonth
      }
    });

  } catch (error: any) {
    console.error('Leaderboard Cron Reset Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
