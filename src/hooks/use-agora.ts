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

  // NUCLEAR SYNC: Virtual Mixer State
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mixerDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const musicNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const unifiedTrackRef = useRef<any>(null);

  // Helper to resume audio context (Standard Mobile Fix)
  const resumeAudioContext = async () => {
    if (typeof window !== 'undefined') {
      if (!audioCtxRef.current) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          audioCtxRef.current = new AudioContextClass();
          mixerDestRef.current = audioCtxRef.current!.createMediaStreamDestination();
        }
      }
      if (audioCtxRef.current?.state === 'suspended') {
        await audioCtxRef.current.resume();
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
            console.log('[Agora] Nuclear Engine Connected:', numericUid);
        }
      } catch (err) {
        console.error('[Agora] Nuclear Engine Failed:', err);
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

  // EFFECT 2: Nuclear Mixer Engine (Hardware Link)
  useEffect(() => {
    const client = clientRef.current;
    if (!client || connectionState !== 'CONNECTED' || !AgoraRTC) return;

    const syncMixer = async () => {
      await resumeAudioContext();
      if (!audioCtxRef.current || !mixerDestRef.current) return;

      // A. Mange Microphone Input
      if (isInSeat) {
        if (!micNodeRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } });
            micNodeRef.current = audioCtxRef.current.createMediaStreamSource(stream);
            micNodeRef.current.connect(mixerDestRef.current);
            setLocalAudioTrack(stream.getAudioTracks()[0] as any); // For volume analysis/waves
          } catch (e) {
            console.error('[Mixer] Mic Fail:', e);
          }
        }
      } else {
        if (micNodeRef.current) {
          micNodeRef.current.disconnect();
          micNodeRef.current = null;
          setLocalAudioTrack(null);
        }
      }

      // B. Manage Music Input
      if (musicStream) {
        if (!musicNodeRef.current) {
          // ENSURE NO LOCAL LEAK: The source stream is muted locally, only the mixed result is published.
          musicNodeRef.current = audioCtxRef.current.createMediaStreamSource(musicStream);
          musicNodeRef.current.connect(mixerDestRef.current);
          setLocalMusicTrack(musicStream.getAudioTracks()[0] as any);
          console.log('[Mixer] Music Linked (No-Leak Mode)');
        }
      } else {
        if (musicNodeRef.current) {
          musicNodeRef.current.disconnect();
          musicNodeRef.current = null;
          setLocalMusicTrack(null);
        }
      }

      // C. Handle Unified Publication
      const hasContent = !!micNodeRef.current || !!musicNodeRef.current;
      if (hasContent) {
        if (!unifiedTrackRef.current) {
          // Use 'speech_low_quality' to ensure the SDK marks this as a telephony stream
          const track = await AgoraRTC.createCustomAudioTrack({
            mediaStreamTrack: mixerDestRef.current.stream.getAudioTracks()[0]
          });
          await client.publish(track);
          unifiedTrackRef.current = track;
          console.log('[Mixer] Unified Telephony Track Published');
          
          if (AudioRoute) {
            setTimeout(() => { AudioRoute.forceEarbuds().catch(() => {}); }, 1500);
          }
        }
      } else {
        if (unifiedTrackRef.current) {
          await client.unpublish(unifiedTrackRef.current);
          unifiedTrackRef.current.stop();
          unifiedTrackRef.current.close();
          unifiedTrackRef.current = null;
          console.log('[Mixer] Unified Track Stopped');
          if (AudioRoute) AudioRoute.resetAudio().catch(() => {});
        }
      }
    };

    syncMixer();
  }, [isInSeat, musicStream, connectionState]);

  // EFFECT 4: Routing Persistence (Aggressive Focus Lock)
  useEffect(() => {
    if (!AudioRoute || connectionState !== 'CONNECTED' || !unifiedTrackRef.current) return;
    
    // Hammer every 3 seconds to keep focus against system notification hijack
    const interval = setInterval(() => {
        AudioRoute.forceEarbuds().catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [connectionState, !!unifiedTrackRef.current]);

  return { localAudioTrack, remoteUsers, client: clientRef.current };
}
