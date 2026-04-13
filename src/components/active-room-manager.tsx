'use client';

import { useEffect, useMemo, useRef } from 'react';
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
  const { activeRoom, minimizedRoom, musicStream, isSpeakerMuted } = useRoomContext();
  const { user } = useUser();
  const firestore = useFirestore();
  
  const sessionRoom = activeRoom || minimizedRoom;
  const roomId = sessionRoom?.id;

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return query(collection(firestore, 'chatRooms', roomId, 'participants'));
  }, [firestore, roomId]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const currentUserParticipant = useMemo(() => {
    if (!participants || !user?.uid) return null;
    return participants.find(p => p.uid === user.uid);
  }, [participants, user?.uid]);

  const isInSeat = !!currentUserParticipant && currentUserParticipant.seatIndex > 0;
  const isMuted = currentUserParticipant?.isMuted ?? true;

  // AGORA CORE - Professional Voice Engine (New System)
  const musicTrack = musicStream ? musicStream.getAudioTracks()[0] : null;
  const { client } = useAgora(roomId || '', isInSeat, isMuted, user?.uid, isSpeakerMuted);
  
    // Voice Activity Bridge (Agora -> UI Waves)
    const { setVolumes } = useVoiceActivityContext();

    const volumeEnabledForClient = useRef<any>(null);

    useEffect(() => {
        if (!client) return;

        // GUARD: Only enable volume indicator ONCE per client instance to prevent console warnings
        if (volumeEnabledForClient.current !== client) {
            client.enableAudioVolumeIndicator();
            volumeEnabledForClient.current = client;
        }
        
        const handleVolume = (volumes: { uid: string | number, level: number }[]) => {
            const currentVolumes: Record<string, number> = {};
            
            volumes.forEach(v => {
                // Scale intensity for visual effect (0-100)
                const intensity = Math.min(100, v.level * 1.5);
                if (intensity > 5) {
                    currentVolumes[v.uid.toString()] = intensity;
                }
            });

            // Update global speaking states for ALL users simultaneously
            setVolumes(currentVolumes);
        };

        client.on('volume-indicator', handleVolume);
        return () => {
            client.off('volume-indicator', handleVolume);
            // Optimization: Only clear volumes if the component is actually unmounting,
            // or if the client itself is changing. 
        };
    }, [client, setVolumes]);

  if (!sessionRoom) return null;

  return null; // Agora handles its own audio playback via track.play() in use-agora.ts
}
