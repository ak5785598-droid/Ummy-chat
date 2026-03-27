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
function RemoteAudio({ stream, audioContext, muted }: { stream: MediaStream, audioContext: AudioContext, muted: boolean }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!stream || !audioContext) return;
    
    try {
      if (sourceRef.current) {
        sourceRef.current.disconnect();
      }
      
      sourceRef.current = audioContext.createMediaStreamSource(stream);
      gainRef.current = audioContext.createGain();
      sourceRef.current.connect(gainRef.current);
      gainRef.current.connect(audioContext.destination);
      gainRef.current.gain.setValueAtTime(muted ? 0 : 1, audioContext.currentTime);

      if (audioRef.current) {
        audioRef.current.srcObject = stream;
        audioRef.current.muted = true; // Still keep muted to avoid echo but use Web Audio for output
        audioRef.current.play().catch(e => console.warn('[RemoteAudio] Play failed:', e));
      }
    } catch (err) {
      console.error('[RemoteAudio] Initialization Error:', err);
    }

    return () => {
      if (sourceRef.current) try { sourceRef.current.disconnect(); } catch (e) {}
      if (gainRef.current) try { gainRef.current.disconnect(); } catch (e) {}
    };
  }, [stream, audioContext, muted]);

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
  
  // SHARED AUDIO CONTEXT - Singleton-like management in manager
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isAudioContextReady, setIsAudioContextReady] = useState(false);

  useEffect(() => {
    // Initialize standard AudioContext
    if (typeof window !== 'undefined' && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 48000
      });
      setIsAudioContextReady(true);
    }

    const resumeContext = async () => {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume().catch(e => console.warn('[WebRTC] Context resume failed:', e));
        console.log('[WebRTC] AudioContext Resumed:', audioContextRef.current.state);
      }
    };

    // Global interaction listeners to wake up audio context
    window.addEventListener('click', resumeContext, { once: true });
    window.addEventListener('touchstart', resumeContext, { once: true });
    window.addEventListener('keydown', resumeContext, { once: true });

    return () => {
      window.removeEventListener('click', resumeContext);
      window.removeEventListener('touchstart', resumeContext);
      window.removeEventListener('keydown', resumeContext);
    };
  }, []);

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
  
  // Voice Activity Detection - Enhanced with intensity using Shared Context
  const { isSpeaking, intensity } = useVoiceActivity(localStream, audioContextRef.current);
  
  // Share voice activity with context
  const { setVoiceActivity } = useVoiceActivityContext();
  useEffect(() => {
    setVoiceActivity(isSpeaking, intensity);
  }, [isSpeaking, intensity, setVoiceActivity]);

  if (!sessionRoom) return null;

  return (
    <>
      {isAudioContextReady && audioContextRef.current && Array.from(remoteStreams.entries()).map(([peerId, stream]) => (
        <RemoteAudio 
          key={`${roomId}-${peerId}`} 
          stream={stream} 
          audioContext={audioContextRef.current!} 
          muted={false} 
        />
      ))}
    </>
  );
}
