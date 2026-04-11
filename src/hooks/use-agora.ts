'use client';

import { useEffect, useRef, useState } from 'react';
import type { IAgoraRTCClient, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { registerPlugin } from '@capacitor/core';
import { Capacitor } from '@capacitor/core';

// NATIVE BRIDGE DEFINITION
interface AudioRoutePlugin {
  forceEarbuds(): Promise<void>;
  resetAudio(): Promise<void>;
}
const AudioRoute = Capacitor.isNativePlatform() 
  ? (Capacitor as any).Plugins.AudioRoute 
  : null;

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

function hashUidToNumber(uid: string): number {
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 33) ^ uid.charCodeAt(i);
  }
  return (hash >>> 0);
}

export function useAgora(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, uid: string | undefined, musicStream: MediaStream | null = null, isSpeakerMuted: boolean = false) {
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [localMusicTrack, setLocalMusicTrack] = useState<any>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isPublishingRef = useRef(false);
  const isProcessingConnectionRef = useRef(false);
  const isMusicPublishingRef = useRef(false);

  // Helper to resume audio context (Standard Mobile Fix)
  const resumeAudioContext = async () => {
    if (typeof window !== 'undefined') {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        if (ctx.state === 'suspended') await ctx.resume();
      }
    }
  };

  // EFFECT 1: Connection & Mic Management
  useEffect(() => {
    if (!APP_ID || !roomId || !uid || !AgoraRTC) return;
    let isMounted = true;

    const init = async () => {
      if (isProcessingConnectionRef.current) return;
      isProcessingConnectionRef.current = true;

      try {
        if (clientRef.current) {
          const oldClient = clientRef.current;
          clientRef.current = null;
          try {
            oldClient.removeAllListeners();
            if (oldClient.connectionState !== 'DISCONNECTED') {
              await oldClient.leave();
            }
          } catch (e) {}
        }

        const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        clientRef.current = client;
        if (isMounted) setConnectionState('CONNECTING');

        client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
          try {
            await client.subscribe(user, mediaType);
            if (mediaType === 'audio') {
              await resumeAudioContext();
              if (!isSpeakerMuted) user.audioTrack?.play();
              if (isMounted) setRemoteUsers(prev => [...prev.filter(u => u.uid !== user.uid), user]);
            }
          } catch (e) {}
        });

        client.on('user-unpublished', (user: IAgoraRTCRemoteUser) => {
          if (isMounted) setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        client.on('connection-state-change', (curState: string) => {
          if (isMounted) {
            if (curState === 'CONNECTED') setConnectionState('CONNECTED');
            else if (curState === 'DISCONNECTED') setConnectionState('DISCONNECTED');
          }
        });

        const numericUid = hashUidToNumber(uid);
        await client.setClientRole('host');
        await client.join(APP_ID, roomId, null, numericUid);
        
        if (isMounted) {
            setConnectionState('CONNECTED');
            console.log('[Agora] Unified Engine Connected:', numericUid);
        }
      } catch (err) {
        console.error('[Agora] Unified Engine Failed:', err);
        if (isMounted) setConnectionState('DISCONNECTED');
      } finally {
        isProcessingConnectionRef.current = false;
      }
    };

    init();

    return () => {
      isMounted = false;
      const client = clientRef.current;
      if (client) {
        client.leave().then(() => {
          client.removeAllListeners();
          if (isMounted) setConnectionState('DISCONNECTED');
        }).catch(() => {});
      }
    };
  }, [roomId, uid]);

  // EFFECT: Handle Speaker Mute
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        if (isSpeakerMuted) user.audioTrack.stop();
        else user.audioTrack.play();
      }
    });
  }, [isSpeakerMuted, remoteUsers]);

  // EFFECT 2: Seat Mic Control
  useEffect(() => {
    const client = clientRef.current;
    if (!client || connectionState !== 'CONNECTED' || !AgoraRTC) return;

    const syncMic = async () => {
      if (isInSeat) {
        if (localAudioTrack || isPublishingRef.current) return;
        isPublishingRef.current = true;
        try {
          await resumeAudioContext();
          const track = await AgoraRTC.createMicrophoneAudioTrack({
            AEC: true, AGC: true, ANS: true, encoderConfig: 'music_standard' 
          });
          
          if (client.connectionState === 'CONNECTED') {
            await client.publish(track);
            setLocalAudioTrack(track);
            console.log('[Agora] Voice Published');

            if (AudioRoute) {
              setTimeout(() => {
                AudioRoute.forceEarbuds().catch(() => {});
              }, 1000);
            }
          } else {
            track.close();
          }
        } catch (e) {
          console.error('[Agora] Mic Permission Denied or Failed:', e);
        } finally {
          isPublishingRef.current = false;
        }
      } else {
        if (localAudioTrack) {
          try {
            await client.unpublish(localAudioTrack);
            localAudioTrack.stop();
            localAudioTrack.close();
            setLocalAudioTrack(null);
            console.log('[Agora] Voice Stopped');
            if (AudioRoute) AudioRoute.resetAudio().catch(() => {});
          } catch (e) {}
        }
      }
    };

    syncMic();
  }, [isInSeat, connectionState, localAudioTrack]);

  // EFFECT 3: Music Sync (Unified Client)
  useEffect(() => {
    const client = clientRef.current;
    if (!client || connectionState !== 'CONNECTED' || !AgoraRTC) return;

    const manageMusic = async () => {
      if (musicStream) {
        if (localMusicTrack || isMusicPublishingRef.current) return;
        isMusicPublishingRef.current = true;
        try {
          const mTrack = await AgoraRTC.createCustomAudioTrack({
            mediaStreamTrack: musicStream.getAudioTracks()[0]
          });
          
          if (client.connectionState === 'CONNECTED') {
            await client.publish(mTrack);
            setLocalMusicTrack(mTrack);
            console.log('[Agora] Music Published (Unified)');
          } else {
            mTrack.close();
          }
        } catch (e) {
          console.error('[Agora] Music Unified Error:', e);
        } finally {
          isMusicPublishingRef.current = false;
        }
      } else {
        if (localMusicTrack) {
          try {
            await client.unpublish(localMusicTrack);
            localMusicTrack.stop();
            localMusicTrack.close();
            setLocalMusicTrack(null);
            console.log('[Agora] Music Stopped');
          } catch (e) {}
        }
      }
    };

    manageMusic();
  }, [musicStream, connectionState, localMusicTrack]);

  // EFFECT 4: Mute Sync
  useEffect(() => {
    if (localAudioTrack) {
      localAudioTrack.setMuted(isMuted);
    }
  }, [isMuted, localAudioTrack]);

  return { localAudioTrack, remoteUsers, client: clientRef.current };
}
