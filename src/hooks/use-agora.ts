'use client';

import { useEffect, useRef, useState } from 'react';
import type { IAgoraRTCClient, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

// Dynamic import of Agora to prevent SSR window errors
let AgoraRTC: any = null;
if (typeof window !== 'undefined') {
  try {
    const agoraModule = require('agora-rtc-sdk-ng');
    AgoraRTC = agoraModule.default || agoraModule;
  } catch (err) {
    console.error('[Agora] SDK load FAILED:', err);
  }
}

// Helper to reliably convert Firestore String UID to a Numeric UID (UInt32) for Agora compatibility
function hashUidToNumber(uid: string): number {
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 33) ^ uid.charCodeAt(i);
  }
  return (hash >>> 0); // Convert to unsigned 32-bit integer
}

export function useAgora(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, uid: string | undefined, musicStream: MediaStream | null = null) {
 const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
 const [localMusicTrack, setLocalMusicTrack] = useState<any>(null);
 const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
 const clientRef = useRef<IAgoraRTCClient | null>(null);
 const musicClientRef = useRef<IAgoraRTCClient | null>(null);
 const [isReady, setIsReady] = useState(false);
 const [isMusicReady, setIsMusicReady] = useState(false);

 // EFFECT 1: Primary Connection Lifecycle (MIC)
 useEffect(() => {
  if (!APP_ID || !roomId || !uid || !AgoraRTC) return;
  let isMounted = true;

  const init = async () => {
   if (!clientRef.current) {
    clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
   }

   const client = clientRef.current;
   if (!client) return;
   const numericUid = hashUidToNumber(uid);

   const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    try {
      await client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
       console.warn('[Agora] Remote audio published:', user.uid);
       if (typeof window !== 'undefined') {
         const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
         if (AudioContext) {
           const ctx = new AudioContext();
           if (ctx.state === 'suspended') await ctx.resume();
         }
       }
       user.audioTrack?.play();
       if (isMounted) {
         setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
       }
      }
    } catch (err) {
      console.error('[Agora] Remote Subscribe FAILED:', err);
    }
   };

   const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
    if (isMounted) setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
   };

   const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    if (isMounted) setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
   };

   client.on('user-published', handleUserPublished);
   client.on('user-unpublished', handleUserUnpublished);
   client.on('user-left', handleUserLeft);

   try {
    console.warn('[Agora] Primary Join:', roomId, 'UID:', numericUid);
    await client.join(APP_ID, roomId, null, numericUid);
    if (isMounted) setIsReady(true);
    console.warn('[Agora] Primary Join SUCCESS');
   } catch (error: any) {
    if (error.code === 'ALREADY_IN_USE') {
      if (isMounted) setIsReady(true);
    } else {
      console.error('[Agora] Primary Join FAILED:', error);
    }
   }
  };

  init();

  return () => {
   isMounted = false;
   if (clientRef.current) {
    clientRef.current.leave();
    clientRef.current.removeAllListeners();
    setIsReady(false);
    setRemoteUsers([]);
   }
  };
 }, [roomId, uid]);

 // EFFECT 2: Mic Track (PUBLISH / UNPUBLISH)
 useEffect(() => {
  if (!clientRef.current || !isReady || !AgoraRTC) return;
  const client = clientRef.current;

  const handleMic = async () => {
   if (isInSeat) {
    if (!localAudioTrack) {
     try {
      const track = await AgoraRTC.createMicrophoneAudioTrack({
       AEC: true,
       AGC: true,
       ANS: true,
       encoderConfig: 'high_quality_stereo'
      });
      setLocalAudioTrack(track);
      await client.publish(track);
      console.warn('[Agora] Mic PUBLISHED');
     } catch (err) {
      console.error('[Agora] Mic PUBLISH FAILED:', err);
     }
    }
   } else {
    if (localAudioTrack) {
     await client.unpublish(localAudioTrack);
     localAudioTrack.stop();
     localAudioTrack.close();
     setLocalAudioTrack(null);
     console.warn('[Agora] Mic CLOSED');
    }
   }
  };

  handleMic();
 }, [isInSeat, isReady, localAudioTrack]);

 // EFFECT 3: Dual-Stream Music Track (Separate Phantom Client)
 useEffect(() => {
  if (!APP_ID || !roomId || !uid || !AgoraRTC || !isInSeat) return;

  const handleMusic = async () => {
   if (musicStream) {
    // 1. Initialize Music Client if not exists
    if (!musicClientRef.current) {
      console.warn('[Agora-Music] Initializing Music Bot...');
      const musicClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      musicClientRef.current = musicClient;
      const musicUid = hashUidToNumber(uid) + 10000000; // Use high-offset UID for music bot
      
      try {
        await musicClient.join(APP_ID, roomId, null, musicUid);
        setIsMusicReady(true);
        console.warn('[Agora-Music] Bot Joined Room');
      } catch (err) {
        console.error('[Agora-Music] Bot Join FAILED:', err);
        return;
      }
    }

    // 2. Create and Publish Track
    if (musicClientRef.current && isMusicReady && !localMusicTrack) {
      const musicClient = musicClientRef.current;
      try {
        const track = await AgoraRTC.createCustomAudioTrack({
          mediaStreamTrack: musicStream.getAudioTracks()[0]
        });
        setLocalMusicTrack(track);
        await musicClient.publish(track);
        console.warn('[Agora-Music] High-Fidelity Music PUBLISHED');
      } catch (err) {
        console.error('[Agora-Music] Publish FAILED:', err);
      }
    }
   } else {
    // 3. Cleanup Music Bot
    if (localMusicTrack) {
      if (musicClientRef.current && isMusicReady) {
        await musicClientRef.current.unpublish(localMusicTrack);
      }
      localMusicTrack.stop();
      localMusicTrack.close();
      setLocalMusicTrack(null);
      console.warn('[Agora-Music] Track Closed');
    }
    if (musicClientRef.current) {
      await musicClientRef.current.leave();
      musicClientRef.current.removeAllListeners();
      musicClientRef.current = null;
      setIsMusicReady(false);
      console.warn('[Agora-Music] Bot Departed Room');
    }
   }
  };

  handleMusic();

  return () => {
    if (localMusicTrack) {
      localMusicTrack.stop();
      localMusicTrack.close();
    }
    if (musicClientRef.current) {
      musicClientRef.current.leave();
      musicClientRef.current = null;
    }
  };
 }, [musicStream, isInSeat, roomId, uid, isMusicReady, localMusicTrack]);

 // EFFECT 4: Mute Control
 useEffect(() => {
  if (localAudioTrack) {
   localAudioTrack.setMuted(isMuted);
   console.warn('[Agora] Mic Mute State:', isMuted);
  }
 }, [isMuted, localAudioTrack]);

 return { localAudioTrack, remoteUsers, client: clientRef.current };
}
