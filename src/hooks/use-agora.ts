'use client';

import { useEffect, useRef, useState } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

// Helper to reliably convert Firestore String UID to a Numeric UID for Agora compatibility
function hashUidToNumber(uid: string): number {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    const char = uid.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function useAgora(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, uid: string | undefined, musicStream: MediaStream | null = null) {
 const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
 const [localMusicTrack, setLocalMusicTrack] = useState<any>(null);
 const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
 const clientRef = useRef<IAgoraRTCClient | null>(null);
 const [isReady, setIsReady] = useState(false);

 useEffect(() => {
  if (!APP_ID || !roomId || !uid) return;

  const init = async () => {
   if (!clientRef.current) {
    // SWITCH TO RTC MODE: Standard for group calls, eliminates role-switching lag
    clientRef.current = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
   }

   const client = clientRef.current;
   const numericUid = hashUidToNumber(uid);

   // Handle remote users
   const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    try {
      await client.subscribe(user, mediaType);
      if (mediaType === 'audio') {
       console.warn('[Agora] Remote user published audio:', user.uid);
       user.audioTrack?.play();
       setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
      }
    } catch (err) {
      console.error('[Agora] Subscribe FAILED:', err);
    }
   };

   const handleUserUnpublished = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
   };

   const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
   };

   client.on('user-published', handleUserPublished);
   client.on('user-unpublished', handleUserUnpublished);
   client.on('user-left', handleUserLeft);

   try {
    console.warn('[Agora] Joining room:', roomId, 'as Numeric UID:', numericUid);
    // Use Numeric UID for 100% platform compatibility
    await client.join(APP_ID, roomId, null, numericUid);
    setIsReady(true);
    console.warn('[Agora] Join SUCCESS');
   } catch (error: any) {
    console.error('[Agora] Join FAILED:', error);
   }

   return () => {
    client.off('user-published', handleUserPublished);
    client.off('user-unpublished', handleUserUnpublished);
    client.off('user-left', handleUserLeft);
   };
  };

  const cleanupPromise = init();

  return () => {
   const cleanup = async () => {
    await cleanupPromise;
    if (clientRef.current) {
     if (localAudioTrack) {
       localAudioTrack.stop();
       localAudioTrack.close();
     }
     await clientRef.current.leave();
     clientRef.current.removeAllListeners();
     clientRef.current = null;
    }
   };
   cleanup();
  };
 }, [roomId, uid, localAudioTrack]);

 // Handle Publishing (Mic control based on Seat status)
 useEffect(() => {
  if (!clientRef.current || !isReady) return;

  const handlePublishing = async () => {
   const client = clientRef.current!;
   
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
      console.warn('[Agora] Mic PUBLISHED successfully');
     } catch (err) {
      console.error('[Agora] Mic Publish FAILED:', err);
     }
    }
   } else {
    if (localAudioTrack) {
     await client.unpublish(localAudioTrack);
     localAudioTrack.stop();
     localAudioTrack.close();
     setLocalAudioTrack(null);
     console.warn('[Agora] Mic UNPUBLISHED (Left Seat)');
    }
   }
  };

  handlePublishing();
 }, [isInSeat, isReady, localAudioTrack]);

 // Handle Music Publishing
 useEffect(() => {
  if (!clientRef.current || !isReady || !isInSeat) return;

  const handleMusic = async () => {
   if (musicStream) {
    if (!localMusicTrack) {
     const track = await AgoraRTC.createCustomAudioTrack({
      mediaStreamTrack: musicStream.getAudioTracks()[0]
     });
     setLocalMusicTrack(track);
     await clientRef.current?.publish(track);
     console.log('[Agora] Published local music track');
    }
   } else {
    if (localMusicTrack) {
     await clientRef.current?.unpublish(localMusicTrack);
     localMusicTrack.stop();
     localMusicTrack.close();
     setLocalMusicTrack(null);
    }
   }
  };
  handleMusic();
 }, [musicStream, isInSeat, isReady, localMusicTrack]);

 // Handle Muting
 useEffect(() => {
  if (localAudioTrack) {
   localAudioTrack.setMuted(isMuted);
   console.warn('[Agora] Local mute state:', isMuted);
  }
 }, [isMuted, localAudioTrack]);

 return { localAudioTrack, remoteUsers, client: clientRef.current };
}
