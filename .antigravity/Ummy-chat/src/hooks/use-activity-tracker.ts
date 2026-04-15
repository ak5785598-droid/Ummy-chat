'use client';

import { useEffect, useRef } from 'react';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, increment, serverTimestamp } from 'firebase/firestore';

/**
 * Wafa/Hala Style Activity Heartbeat Engine.
 * Periodically rewards User and Room EXP for engagement.
 */
export function useActivityTracker(roomId: string | null, userId: string | null) {
  const firestore = useFirestore();
  const lastHeartbeat = useRef<number>(Date.now());

  useEffect(() => {
    if (!firestore || !roomId || !userId) return;

    // Heartbeat every 5 minutes (300,000ms)
    // Points logic: 
    // User +5 Activity EXP (Max 120 per day)
    // Room +5 Popularity EXP 
    const HEARTBEAT_INTERVAL = 300000;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastHeartbeat.current;

      if (elapsed >= HEARTBEAT_INTERVAL) {
        console.log(`[Activity Engine] 5m Heartbeat Triggered. Syncing EXP for User:${userId} and Room:${roomId}`);
        
        // 1. Update User Profile EXP
        const userProfileRef = doc(firestore, 'users', userId, 'profile', userId);
        updateDocumentNonBlocking(userProfileRef, {
          activityPoints: increment(5),
          updatedAt: serverTimestamp()
        });

        // 2. Update Room Profile EXP
        const roomRef = doc(firestore, 'chatRooms', roomId);
        updateDocumentNonBlocking(roomRef, {
          levelPoints: increment(5),
          updatedAt: serverTimestamp()
        });

        lastHeartbeat.current = now;
      }
    }, 30000); // Check every 30s to be precise

    return () => clearInterval(interval);
  }, [firestore, roomId, userId]);

  return null;
}
