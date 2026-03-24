'use client';

import { useEffect, useRef, useState } from 'react';
import AgoraRTC, { IAgoraRTCClient, IMicrophoneAudioTrack, IRemoteAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';

type ConnectionStatus = 'connected' | 'disconnected' | 'connecting' | 'failed';

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID;

export function useAgora(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, uid: string | undefined, musicStream: MediaStream | null = null) {
 const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
 const [localMusicTrack, setLocalMusicTrack] = useState<any>(null);
 const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
 const [connectionStates, setConnectionStates] = useState<Map<string, ConnectionStatus>>(new Map());
 const clientRef = useRef<IAgoraRTCClient | null>(null);
 const [isReady, setIsReady] = useState(false);

 useEffect(() => {
  if (!APP_ID || !roomId || !uid) return;

  const init = async () => {
   if (!clientRef.current) {
    clientRef.current = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
   }

   const client = clientRef.current;

   // Handle remote users
   client.on('user-published', async (user, mediaType) => {
    await client.subscribe(user, mediaType);
    if (mediaType === 'audio') {
     user.audioTrack?.play();
     setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
     setConnectionStates(prev => new Map(prev).set(user.uid as string, 'connected'));
    }
   });

   client.on('user-unpublished', (user) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    setConnectionStates(prev => new Map(prev).set(user.uid as string, 'disconnected'));
   });

   client.on('user-left', (user) => {
    setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
    setConnectionStates(prev => {
     const next = new Map(prev);
     next.delete(user.uid as string);
     return next;
    });
   });

   try {
    // Join channel
    await client.join(APP_ID, roomId, null, uid);
    setIsReady(true);
    console.log('[Agora] Joined room:', roomId);
   } catch (error) {
    console.error('[Agora] Join failed:', error);
   }
  };

  init();

  return () => {
   const cleanup = async () => {
    if (clientRef.current) {
     await clientRef.current.leave();
     clientRef.current.removeAllListeners();
    }
   };
   cleanup();
  };
 }, [roomId, uid]);

 // Handle Publishing (Broadcaster vs Audience)
 useEffect(() => {
  if (!clientRef.current || !isReady) return;

  const handleRole = async () => {
   const client = clientRef.current!;
   
   if (isInSeat) {
    await client.setClientRole('host');
    if (!localAudioTrack) {
     const track = await AgoraRTC.createMicrophoneAudioTrack({
      AEC: true,
      AGC: true,
      ANS: true,
      encoderConfig: 'high_quality_stereo'
     });
     setLocalAudioTrack(track);
     await client.publish(track);
     console.log('[Agora] Published local mic');
    }
   } else {
    if (localAudioTrack) {
     await client.unpublish(localAudioTrack);
     localAudioTrack.stop();
     localAudioTrack.close();
     setLocalAudioTrack(null);
    }
    await client.setClientRole('audience');
    console.log('[Agora] Switched to audience');
   }
  };

  handleRole();
 }, [isInSeat, isReady]);

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
 }, [musicStream, isInSeat, isReady]);

 // Handle Muting
 useEffect(() => {
  if (localAudioTrack) {
   localAudioTrack.setMuted(isMuted);
   console.log('[Agora] Local mute state:', isMuted);
  }
 }, [isMuted, localAudioTrack]);

 return { localAudioTrack, remoteUsers, connectionStates, client: clientRef.current };
}
