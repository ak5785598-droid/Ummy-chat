'use client';

import { useEffect, useRef, useState } from 'react';
import type { IAgoraRTCClient, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Capacitor } from '@capacitor/core';

// NATIVE BRIDGE DEFINITION (Keep for potential routing tweaks)
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

export function useAgora(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, uid: string | undefined, musicTrack: MediaStreamTrack | null = null, isSpeakerMuted: boolean = false) {
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isProcessingConnectionRef = useRef(false);

  // EFFECT 1: Connection Management
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
            console.log('[Agora] Engine Connected:', numericUid);
        }
      } catch (err) {
        console.error('[Agora] Engine Failed:', err);
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

  // EFFECT 2: Speaker Management
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        if (isSpeakerMuted) user.audioTrack.stop();
        else user.audioTrack.play();
      }
    });
  }, [isSpeakerMuted, remoteUsers]);

  // EFFECT 3: Direct Microphone Management (Native Earbud Compatible)
  useEffect(() => {
    const client = clientRef.current;
    if (!client || connectionState !== 'CONNECTED' || !AgoraRTC) return;

    let micTrack: IMicrophoneAudioTrack | null = null;

    const manageMic = async () => {
      if (isInSeat) {
        try {
          // Force Speakerphone or Earbuds via routing if needed
          if (AudioRoute) {
            AudioRoute.forceEarbuds().catch(() => {});
          }

          console.log('[Agora] Creating Native Microphone Track...');
          micTrack = await AgoraRTC.createMicrophoneAudioTrack({
            AEC: true,
            ANS: true,
            AGC: true
          });
          
          await client.publish(micTrack);
          setLocalAudioTrack(micTrack);
          console.log('[Agora] Vocal Track Published');

          // Handle initial mute state
          if (isMuted) {
            await micTrack.setEnabled(false);
          }
        } catch (e) {
          console.error('[Agora] Mic Capture Failed:', e);
        }
      } else {
        if (localAudioTrack) {
          try {
            await client.unpublish(localAudioTrack);
            localAudioTrack.close();
            setLocalAudioTrack(null);
            console.log('[Agora] Mic Released');
          } catch(e) {}
        }
      }
    };

    manageMic();

    return () => {
      if (micTrack) {
        client.unpublish(micTrack).catch(() => {});
        micTrack.close();
      }
    };
  }, [isInSeat, connectionState]);

  // EFFECT 4: Handle Local Mute Toggle
  useEffect(() => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!isMuted).catch(() => {});
      console.log(`[Agora] Mic ${isMuted ? 'MUTED' : 'UNMUTED'} via setEnabled`);
    }
  }, [isMuted, localAudioTrack]);

  // ROUTING PERSISTENCE (Optional backup)
  useEffect(() => {
    if (!AudioRoute || connectionState !== 'CONNECTED' || !localAudioTrack) return;
    const interval = setInterval(() => { AudioRoute.forceEarbuds().catch(() => {}); }, 10000);
    return () => clearInterval(interval);
  }, [connectionState, !!localAudioTrack]);

  return { localAudioTrack, remoteUsers, client: clientRef.current };
}
