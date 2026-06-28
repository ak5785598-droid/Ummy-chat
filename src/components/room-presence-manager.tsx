'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, addDocumentNonBlocking, setDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useScreenWakeLock } from '@/hooks/use-screen-wake-lock';
import { doc, serverTimestamp, collection, increment, writeBatch, getDocs, getDoc } from 'firebase/firestore';
import { getDatabase, ref as dbRef, onDisconnect, set, serverTimestamp as dbServerTimestamp } from 'firebase/database';
import { App } from '@capacitor/app';

/**
 * Maintains Firestore presence while a room is active.
 * Re-engineered for high-fidelity cleanup and IST (GMT+5:30) Periodic Reset logic.
 * Feature: Anti-Kick backgrounding resilience for seated users.
 */
  export function RoomPresenceManager() {
  const { activeRoom, minimizedRoom } = useRoomContext();
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  useScreenWakeLock(!!(activeRoom || minimizedRoom));
  
  const lastRoomId = useRef<string | null>(null);
  const hasJoinedRef = useRef<boolean>(false);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const cleanupInterval = useRef<NodeJS.Timeout | null>(null);
  const stayTimeRef = useRef<number>(0);
  const hasStayAwarded = useRef<boolean>(false);
  const presenceRef = useRef<any>(null);
  const appStateListener = useRef<any>(null);
  const appStateListenerPromise = useRef<Promise<any> | null>(null);

  const latestRoomRef = useRef({ activeRoomId: activeRoom?.id || null, minimizedRoomId: minimizedRoom?.id || null });
  latestRoomRef.current = {
    activeRoomId: activeRoom?.id || null,
    minimizedRoomId: minimizedRoom?.id || null
  };

  const userMetadata = useMemo(() => ({
   username: userProfile?.username,
   avatarUrl: userProfile?.avatarUrl,
   activeFrame: userProfile?.inventory?.activeFrame,
   activeFrameMediaUrl: userProfile?.inventory?.activeFrameMediaUrl,
   activeWave: userProfile?.inventory?.activeWave,
   activeBubble: userProfile?.inventory?.activeBubble,
   activeEntryMediaUrl: userProfile?.inventory?.activeEntryMediaUrl,
   activeIdBadge: userProfile?.inventory?.activeIdBadge,
   accountNumber: userProfile?.accountNumber
  }), [userProfile?.username, userProfile?.avatarUrl, userProfile?.inventory?.activeFrame, userProfile?.inventory?.activeFrameMediaUrl, userProfile?.inventory?.activeWave, userProfile?.inventory?.activeBubble, userProfile?.inventory?.activeEntryMediaUrl, userProfile?.inventory?.activeIdBadge, userProfile?.accountNumber]);

  // EFFECT 1: JOIN & CLEANUP & BACKGROUND RESILIENCE
  useEffect(() => {
   if (!firestore || !user) return;
   
   // Session logic: Keep alive if EITHER active OR minimized
   const sessionRoom = activeRoom || minimizedRoom;
   if (!sessionRoom?.id) return;

   const roomId = sessionRoom.id;
   const uid = user.uid;
   const isOwner = uid === sessionRoom.ownerId;
   const isMod = sessionRoom.moderatorIds?.includes(uid);
   const canCleanup = isOwner || isMod;

   const performJoin = async () => {
    const isNewRoom = lastRoomId.current !== roomId;
    if (!isNewRoom && hasJoinedRef.current) return;

    const roomDocRef = doc(firestore, 'chatRooms', roomId);
    const userRef = doc(firestore, 'users', uid);
    const profileRef = doc(firestore, 'users', uid, 'profile', uid);
    const participantRef = doc(firestore, 'chatRooms', roomId, 'participants', uid);

    try {
      const existingSnap = await getDoc(participantRef);
      const batch = writeBatch(firestore);
      
      if (isNewRoom) {
        lastRoomId.current = roomId;
        hasJoinedRef.current = true;

        // Send entrance message
        addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'messages'), {
         content: 'entered the room',
         senderId: uid,
         senderName: userMetadata.username || 'Tribe Member',
         senderAvatar: userMetadata.avatarUrl || null,
         mediaUrl: userMetadata.activeEntryMediaUrl || null,
         chatRoomId: roomId,
         timestamp: serverTimestamp(),
         type: 'entrance'
        });

        // Initialize participant if they don't exist
        if (!existingSnap.exists()) {
         batch.update(roomDocRef, { participantCount: increment(1), updatedAt: serverTimestamp() });
         batch.set(participantRef, {
          uid: uid,
          name: userMetadata.username || 'Guest',
          avatarUrl: userMetadata.avatarUrl || null,
          activeFrame: userMetadata.activeFrame || 'None',
          activeFrameMediaUrl: userMetadata.activeFrameMediaUrl || null,
          activeWave: userMetadata.activeWave || 'Default',
          activeBubble: userMetadata.activeBubble || 'None',
          activeIdBadge: userMetadata.activeIdBadge || null,
          joinedAt: serverTimestamp(),
          lastSeen: serverTimestamp(),
          isMuted: true,
          seatIndex: 0,
          accountNumber: userMetadata.accountNumber || null,
         }, { merge: true });
        } else {
          // Always sync accountNumber in case it changed since last join
          batch.update(participantRef, { lastSeen: serverTimestamp(), accountNumber: userMetadata.accountNumber || null });
        }

        batch.update(userRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });
        batch.update(profileRef, { currentRoomId: roomId, isOnline: true, updatedAt: serverTimestamp() });
        await batch.commit();
      }
    } catch (err) {
      console.error('[Presence] Join failed:', err);
    }

    // HEARTBEAT: Standardized at 15s for mobile data efficiency
    if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
     heartbeatInterval.current = setInterval(() => {
     setDocumentNonBlocking(participantRef, { lastSeen: serverTimestamp(), accountNumber: userMetadata.accountNumber || null }, { merge: true });
     
      // ⚡ QUEST TRACKING: Stay 15 Mins
      if (!hasStayAwarded.current) {
        stayTimeRef.current += 30;
        if (stayTimeRef.current >= 900) { // 15 minutes
          const questRef = doc(firestore, 'users', uid, 'quests', 'stay_15');
          updateDocumentNonBlocking(questRef, { current: increment(30) });
          hasStayAwarded.current = true;
        }
      }
     }, 30000);
    // CLEANUP: Periodic task to purge stale sessions and sync counter
    // Only run by Room Owner to prevent "race conditions" and clock-skew issues from multiple moderators
    if (!cleanupInterval.current && isOwner) {
      cleanupInterval.current = setInterval(async () => {
        const roomSnap = await getDoc(roomDocRef);
        if (!roomSnap.exists()) return;
        
        const roomData = roomSnap.data();
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        const istNow = new Date(utc + (3600000 * 5.5));
        
        const lastUpdated = roomData.updatedAt?.toDate() || new Date(0);
        const lastUtc = lastUpdated.getTime() + (lastUpdated.getTimezoneOffset() * 60000);
        const istLast = new Date(lastUtc + (3600000 * 5.5));

        const resetData: any = { updatedAt: serverTimestamp() };
        let needsReset = false;

        // 1. Periodic IST Resets (Daily/Weekly/Monthly)
        if (istLast.toDateString() !== istNow.toDateString()) {
          needsReset = true;
          resetData['stats.dailyGifts'] = 0;
          if (istNow.getDay() === 1) resetData['stats.weeklyGifts'] = 0;
        }
        if (istLast.getMonth() !== istNow.getMonth()) {
          needsReset = true;
          resetData['stats.monthlyGifts'] = 0;
        }

        if (needsReset) {
          updateDocumentNonBlocking(roomDocRef, resetData);
        }

                // 2. Clear Stale Participants (Ghost Removal)
        // CRITICAL FIX: Do NOT use Date.now() as it relies on the owner's local clock.
        // If the owner's clock is wrong, they will kick everyone.
        // We use the room's own updatedAt (Server Timestamp) as the reference.
        if (!roomData.updatedAt) return; 

        const serverRefTime = roomData.updatedAt.toMillis();
        const ghostThreshold = serverRefTime - 300000; // 5 Minutes threshold (More aggressive but safe)
        
        const snap = await getDocs(collection(firestore, 'chatRooms', roomId, 'participants'));
        const purgeBatch = writeBatch(firestore);
        let activeCount = 0;
        let purgeCount = 0;

        snap.docs.forEach(d => {
          const p = d.data();
          const lastSeen = p.lastSeen?.toMillis?.() || 0;
          
          // Only purge if they are truly behind the server reference time
          if (lastSeen > 0 && lastSeen < ghostThreshold) {
            // Never purge the owner themselves in this loop
            if (d.id !== uid) {
              purgeBatch.delete(d.ref);
              purgeCount++;
            } else {
              activeCount++;
            }
          } else {
            activeCount++;
          }
        });

        // Sync the participantCount if needed
        const currentStoredCount = roomData.participantCount || 0;
        if (purgeCount > 0 || currentStoredCount !== activeCount) {
          purgeBatch.update(roomDocRef, { 
            participantCount: activeCount, 
            updatedAt: serverTimestamp() 
          });
          purgeBatch.commit().catch(() => {});
        }
      }, 180000); // Every 180 seconds (3 minutes) to optimize Firestore read/write billing
    }

    };
 
    performJoin();

    // REALTIME DATABASE PRESENCE: Instant removal on disconnect
    if (user && roomId) {
      const db = getDatabase();
      const presencePath = `roomPresence/${roomId}/${user.uid}`;
      presenceRef.current = dbRef(db, presencePath);
      
      onDisconnect(presenceRef.current).remove();
      
      set(presenceRef.current, {
        uid: user.uid,
        name: userMetadata.username || 'Guest',
        avatarUrl: userMetadata.avatarUrl || null,
        joinedAt: dbServerTimestamp(),
        lastSeen: dbServerTimestamp(),
        isOnline: true
      });
      
      const listenerPromise = App.addListener('appStateChange', ({ isActive }) => {
        if (!isActive && presenceRef.current) {
          set(presenceRef.current, null);
        } else if (isActive && presenceRef.current) {
          set(presenceRef.current, {
            uid: user.uid,
            name: userMetadata.username || 'Guest',
            avatarUrl: userMetadata.avatarUrl || null,
            joinedAt: dbServerTimestamp(),
            lastSeen: dbServerTimestamp(),
            isOnline: true
          });
          onDisconnect(presenceRef.current).remove();
        }
      });
      appStateListenerPromise.current = listenerPromise;
      listenerPromise.then(listener => {
        appStateListener.current = listener;
      });
    }
 
    // Visibility Listener: Instant refresh upon returning to app
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && user?.uid && roomId) {
        const pRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
        setDocumentNonBlocking(pRef, { lastSeen: serverTimestamp() }, { merge: true });
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
 
        return () => {
     if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
     if (cleanupInterval.current) clearInterval(cleanupInterval.current);
     document.removeEventListener('visibilitychange', handleVisibility);
     
      if (appStateListener.current) {
        appStateListener.current.remove();
        appStateListener.current = null;
      } else if (appStateListenerPromise.current) {
        appStateListenerPromise.current.then(listener => listener?.remove());
        appStateListenerPromise.current = null;
      }
      if (presenceRef.current) {
       set(presenceRef.current, null);
       presenceRef.current = null;
     }
     
     // 🚀 GRACEFUL CLEANUP: 
     // We use a small timeout to prevent flickering during re-renders.
     // If the component re-mounts, the timeout is implicitly cleared or ignored.
     const currentSessionRoomId = latestRoomRef.current.activeRoomId || latestRoomRef.current.minimizedRoomId;
     
     if (hasJoinedRef.current && currentSessionRoomId !== roomId && firestore && user?.uid && roomId) {
       // Only delete if we are SURE the user has left this specific room
       setTimeout(() => {
         // Check again if user hasn't re-joined or minimized to this specific room
         const currentSessionRoomIdAfterTimeout = latestRoomRef.current.activeRoomId || latestRoomRef.current.minimizedRoomId;
         if (currentSessionRoomIdAfterTimeout !== roomId) {
            const pRef = doc(firestore, 'chatRooms', roomId, 'participants', user.uid);
            const rRef = doc(firestore, 'chatRooms', roomId);
            const uRef = doc(firestore, 'users', user.uid);
            const profRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
            
            deleteDocumentNonBlocking(pRef);
            updateDocumentNonBlocking(rRef, { participantCount: increment(-1), updatedAt: serverTimestamp() });
            updateDocumentNonBlocking(uRef, { currentRoomId: null, updatedAt: serverTimestamp() });
            updateDocumentNonBlocking(profRef, { currentRoomId: null, updatedAt: serverTimestamp() });
            hasJoinedRef.current = false;
            lastRoomId.current = null; // Reset lastRoomId to allow re-joining
         }
       }, 2000); 
     }

     cleanupInterval.current = null;
     heartbeatInterval.current = null;
    };
  }, [firestore, activeRoom?.id, minimizedRoom?.id, user?.uid]); 

  const lastSyncMetadata = useRef<string>('');

  // EFFECT 2: SEPARATE PROFILE METADATA SYNC (Guarded & Debounced)
  useEffect(() => {
    if (!firestore || !activeRoom?.id || !user || !hasJoinedRef.current || !userProfile) return;
    
    // Create a stable string representation for comparison (excluding lastSeen)
    const currentMetaString = JSON.stringify({
      n: userMetadata.username,
      a: userMetadata.avatarUrl,
      f: userMetadata.activeFrame,
      fm: userMetadata.activeFrameMediaUrl,
      w: userMetadata.activeWave,
      b: userMetadata.activeBubble,
      acc: userMetadata.accountNumber
    });

    // GUARD: Only sync if metadata actually changed to prevent 403/Quota issues
    if (currentMetaString === lastSyncMetadata.current) return;

    const syncMetadata = async () => {
      try {
        const participantRef = doc(firestore, 'chatRooms', activeRoom.id, 'participants', user.uid);
        await updateDocumentNonBlocking(participantRef, {
          name: userMetadata.username || 'Guest',
          avatarUrl: userMetadata.avatarUrl || null,
          activeFrame: userMetadata.activeFrame || 'None',
          activeFrameMediaUrl: userMetadata.activeFrameMediaUrl || null,
          activeWave: userMetadata.activeWave || 'Default',
          activeBubble: userMetadata.activeBubble || 'None',
          activeIdBadge: userMetadata.activeIdBadge || null,
          accountNumber: userMetadata.accountNumber || null,
          lastSeen: serverTimestamp(),
        });
        lastSyncMetadata.current = currentMetaString;
      } catch (err) {
        // Silent catch for transient permission issues during room entry
        console.warn('[Presence] Metadata sync suppressed (Transient):', err);
      }
    };

    // DEBOUNCE: Allow profile state to stabilize before hitting Firestore
    const timer = setTimeout(syncMetadata, 800);
    return () => clearTimeout(timer);
  }, [userMetadata, firestore, activeRoom?.id, user?.uid, userProfile]);

  return null;
}
