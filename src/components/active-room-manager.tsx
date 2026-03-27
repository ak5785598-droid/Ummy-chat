'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
import { useRoomContext } from './room-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useWebRTC } from '@/hooks/use-webrtc';
import { useVoiceActivity } from '@/hooks/use-voice-activity';
import { useVoiceActivityContext } from './voice-activity-provider';
import { collection, query, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { RoomParticipant } from '@/lib/types';

/**
 * Global Audio Component for Remote Streams
 */
function RemoteAudio({ stream, muted }: { stream: MediaStream, muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!stream) return;
    if (!contextRef.current) {
      contextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = contextRef.current;
    if (sourceRef.current) sourceRef.current.disconnect();
    
    sourceRef.current = ctx.createMediaStreamSource(stream);
    gainRef.current = ctx.createGain();
    sourceRef.current.connect(gainRef.current);
    gainRef.current.connect(ctx.destination);
    gainRef.current.gain.setValueAtTime(muted ? 0 : 1, ctx.currentTime);

    if (ctx.state === 'suspended') {
      const resume = () => ctx.resume().catch(() => {});
      window.addEventListener('click', resume, { once: true });
      window.addEventListener('touchstart', resume, { once: true });
    }

    if (audioRef.current) {
      audioRef.current.srcObject = stream;
      audioRef.current.muted = true;
      audioRef.current.play().catch(() => {});
    }

    return () => {
      if (sourceRef.current) sourceRef.current.disconnect();
      if (gainRef.current) gainRef.current.disconnect();
    };
  }, [stream, muted]);

  return <audio ref={audioRef} autoPlay playsInline className="hidden" />;
}

/**
 * PERSISTENT ROOM MANAGER
 * Exists at the Provider level to ensure WebRTC and Firestore stay active during minimization.
 */
export function ActiveRoomManager() {
  const { activeRoom, minimizedRoom, setActiveRoom, setMinimizedRoom } = useRoomContext();
  const { user } = useUser();
  const firestore = useFirestore();
  
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

  // WebRTC Hook - Always active as long as sessionRoom exists
  const { localStream, remoteStreams } = useWebRTC(roomId || '', isInSeat, isMuted);
  
  // Voice Activity Detection - Enhanced with intensity
  const audioContextRef = useRef<AudioContext | null>(null);
  if (!audioContextRef.current && typeof window !== 'undefined') {
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  const { isSpeaking, intensity } = useVoiceActivity(localStream, audioContextRef.current);
  
  // Share voice activity with context
  const { setVoiceActivity } = useVoiceActivityContext();
  useEffect(() => {
    setVoiceActivity(isSpeaking, intensity);
  }, [isSpeaking, intensity, setVoiceActivity]);

  // If a room is active but not minimized, and we have no minimizedRoom, we are in "Full View"
  // If we have a minimizedRoom but no activeRoom, we are in "Minimized View"
  
  if (!sessionRoom) return null;

  return (
    <>
      {Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <RemoteAudio key={`${roomId}-${peerId}`} stream={stream} muted={false} />
      ))}
    </>
  );
}
