'use client';

import { useEffect, useMemo } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useAgora } from '@/hooks/use-agora';
import { useVoiceActivityContext } from './voice-activity-provider';
import { collection, query } from 'firebase/firestore';
import { RoomParticipant } from '@/lib/types';

// Helper to reliably convert Firestore String UID to a Numeric UID (UInt32)
// Matches the implementation in use-agora.ts for consistent volume detection
const hashUidToNumber = (uid: string): number => {
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 33) ^ uid.charCodeAt(i);
  }
  return (hash >>> 0);
};

/**
 * PERSISTENT ROOM MANAGER
 * Exists at the Provider level to ensure Agora and Firestore stay active during minimization.
 */
export function ActiveRoomManager() {
  const { activeRoom, minimizedRoom } = useRoomContext();
  const { user } = useUser();
  const firestore = useFirestore();
  
  console.log('[ActiveRoomManager] State:', { 
    hasActiveRoom: !!activeRoom, 
    hasMinimizedRoom: !!minimizedRoom,
    hasUser: !!user,
    userUid: user?.uid 
  });
  
  // The "Session Room" is either the one the user is physically in, or the one minimized in background
  const sessionRoom = activeRoom || minimizedRoom;
  const roomId = sessionRoom?.id;

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return query(collection(firestore, 'chatRooms', roomId, 'participants'));
  }, [firestore, roomId]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const currentUserParticipant = useMemo(() => 
    participants?.find(p => p.uid === user?.uid), 
  [participants, user?.uid]);

  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;
  const isMuted = currentUserParticipant?.isMuted ?? true;

  console.log('[ActiveRoomManager] Participant status:', { 
    isInSeat, 
    isMuted, 
    seatIndex: currentUserParticipant?.seatIndex,
    hasParticipant: !!currentUserParticipant 
  });

  // AGORA CORE - Professional Voice Engine (New System)
  const { client } = useAgora(roomId || '', isInSeat, isMuted, user?.uid);
  
  // Voice Activity Bridge (Agora -> UI Waves)
  const { setVoiceActivity } = useVoiceActivityContext();

  useEffect(() => {
    if (!client || !user?.uid) return;

    const numericUid = hashUidToNumber(user.uid);

    // Enable Agora volume monitoring
    client.enableAudioVolumeIndicator();
    
    const handleVolume = (volumes: { uid: string | number, level: number }[]) => {
      // Find local user volume (can be 0 or the numeric hash)
      const local = volumes.find(v => v.uid === numericUid || v.uid === 0);
      if (local) {
        const isSpeaking = local.level > 5;
        const scaledIntensity = Math.min(100, local.level * 1.5);
        setVoiceActivity(isSpeaking, scaledIntensity);
      }
    };

    client.on('volume-indicator', handleVolume);
    return () => {
      client.off('volume-indicator', handleVolume);
    };
  }, [client, user?.uid, setVoiceActivity]);

  if (!sessionRoom) return null;

  return null; // Agora handles its own audio playback via track.play() in use-agora.ts
}
