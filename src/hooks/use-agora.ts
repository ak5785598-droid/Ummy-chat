'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { IAgoraRTCClient, IMicrophoneAudioTrack, IAgoraRTCRemoteUser } from 'agora-rtc-sdk-ng';
import { Capacitor } from '@capacitor/core';
import { CordovaAudioRoute } from '@/native/audio-route';

// NATIVE AUDIO ROUTE - For Capacitor/Cordova apps
const isNativePlatform = Capacitor.isNativePlatform();
const AudioRoute = isNativePlatform ? CordovaAudioRoute : null;

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

export function useAgora(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, uid: string | undefined, musicTrackArg: MediaStreamTrack | null = null, isSpeakerMuted: boolean = false) {
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [currentOutputDevice, setCurrentOutputDevice] = useState<string>('default');
  const [publishedMusicTrack, setPublishedMusicTrack] = useState<any>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isProcessingConnectionRef = useRef(false);

  // Set audio output device for all remote users
  const setAudioOutputDevice = useCallback(async (deviceId: string) => {
    try {
      // Agora doesn't have direct setSinkId on remote tracks
      // We need to use the Web Audio API on the <audio> elements Agora creates
      if (AgoraRTC && AgoraRTC.setAudioOutputDevice) {
        await AgoraRTC.setAudioOutputDevice(deviceId);
        setCurrentOutputDevice(deviceId);
        console.log('[Agora] Output device set to:', deviceId);
      } else {
        // Fallback: try to set on all existing audio elements
        const audioElements = document.querySelectorAll('audio');
        for (const audio of audioElements) {
          // @ts-ignore
          if (audio.setSinkId) {
            // @ts-ignore
            await audio.setSinkId(deviceId);
          }
        }
        setCurrentOutputDevice(deviceId);
      }
    } catch (e) {
      console.warn('[Agora] Failed to set audio output:', e);
    }
  }, []);

  // Toggle between speaker and earbuds
  const toggleAudioOutput = useCallback(async () => {
    // NATIVE: Try native plugin first
    if (AudioRoute?.isAvailable()) {
      try {
        if (currentOutputDevice === 'default') {
          await AudioRoute.forceEarbuds();
          setCurrentOutputDevice('earbuds');
          console.log('[Agora-Native] Routed to earbuds');
        } else {
          await AudioRoute.resetAudio();
          setCurrentOutputDevice('default');
          console.log('[Agora-Native] Routed to speaker');
        }
        return;
      } catch (e) {
        console.warn('[Agora-Native] Failed, falling back to web:', e);
      }
    }

    // WEB FALLBACK
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

      // Find earbud/headphone device
      const earbudDevice = audioOutputs.find(d => 
        d.label.toLowerCase().includes('bluetooth') || 
        d.label.toLowerCase().includes('airpods') ||
        d.label.toLowerCase().includes('buds') ||
        d.label.toLowerCase().includes('headphone') ||
        d.label.toLowerCase().includes('headset') ||
        d.label.toLowerCase().includes('earphone')
      );

      if (currentOutputDevice === 'default' && earbudDevice) {
        await setAudioOutputDevice(earbudDevice.deviceId);
      } else {
        await setAudioOutputDevice('default');
      }
    } catch (e) {
      console.warn('[Agora] Toggle output failed:', e);
    }
  }, [currentOutputDevice, setAudioOutputDevice]);

  // Force to earbuds if available
  const forceEarbudsOutput = useCallback(async () => {
    // NATIVE: Try native plugin first
    if (AudioRoute?.isAvailable()) {
      try {
        await AudioRoute.forceEarbuds();
        setCurrentOutputDevice('earbuds');
        console.log('[Agora-Native] Forced to earbuds');
        return true;
      } catch (e) {
        console.warn('[Agora-Native] Force earbuds failed:', e);
      }
    }

    // WEB FALLBACK
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return false;

    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');

      const earbudDevice = audioOutputs.find(d => 
        d.label.toLowerCase().includes('bluetooth') || 
        d.label.toLowerCase().includes('airpods') ||
        d.label.toLowerCase().includes('buds') ||
        d.label.toLowerCase().includes('headphone') ||
        d.label.toLowerCase().includes('headset') ||
        d.label.toLowerCase().includes('earphone')
      );

      if (earbudDevice && currentOutputDevice === 'default') {
        await setAudioOutputDevice(earbudDevice.deviceId);
        return true;
      }
      return false;
    } catch (e) {
      console.warn('[Agora] Force earbuds failed:', e);
      return false;
    }
  }, [currentOutputDevice, setAudioOutputDevice]);

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
        
        // Set Audio Profile to locked-in high quality
        // 'music_high_quality' tells the OS this is a Media session (like Spotify), not a Voice Call.
        // This stops the OS from automatically switching to the speaker when multiple people talk.
        // @ts-ignore
        client.setAudioProfile('music_high_quality', 'chatroom');
        
        clientRef.current = client;
        if (isMounted) setConnectionState('CONNECTING');

        client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
          try {
            await client.subscribe(user, mediaType);
            if (mediaType === 'audio') {
              user.audioTrack?.play();
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
        user.audioTrack.play();
      }
    });
    
    // Force earbuds when remote users change (prevent speaker switch)
    if (AudioRoute && remoteUsers.length > 0) {
      AudioRoute.forceEarbuds().catch(() => {});
    }
  }, [remoteUsers]);

  // EFFECT 3: Direct Microphone Management (Native Earbud Compatible)
  useEffect(() => {
    const client = clientRef.current;
    if (!client || connectionState !== 'CONNECTED' || !AgoraRTC) return;

    let micTrack: IMicrophoneAudioTrack | null = null;

    const manageMic = async () => {
      if (isInSeat) {
        try {
          console.log('[Agora] Creating Native Microphone Track...');
          micTrack = await AgoraRTC.createMicrophoneAudioTrack({
            AEC: true,
            ANS: true,
            AGC: true
          });
          
          if (micTrack) {
            await client.publish(micTrack);
            setLocalAudioTrack(micTrack);
          }
          console.log('[Agora] Vocal Track Published');

          // Force Speakerphone or Earbuds via routing AFTER mic is published
          // This ensures audio routing is maintained after mic access
          if (AudioRoute) {
            AudioRoute.forceEarbuds().catch(() => {});
            // Force again after a delay to ensure it sticks
            setTimeout(() => AudioRoute.forceEarbuds().catch(() => {}), 500);
          }

          // Handle initial mute state
          if (isMuted && micTrack) {
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

  // ROUTING PERSISTENCE (Frequent enforcement to prevent speaker switch)
  useEffect(() => {
    if (!AudioRoute || connectionState !== 'CONNECTED') return;
    // Lock to earbuds every 1s (more aggressive to fight OS hijacking)
    const interval = setInterval(() => { 
      AudioRoute.forceEarbuds().catch(() => {}); 
    }, 1000);
    return () => clearInterval(interval);
  }, [connectionState]);

  // EFFECT 5: Music Track Publishing (Broadcast music to other users)
  useEffect(() => {
    const client = clientRef.current;
    if (!client || connectionState !== 'CONNECTED' || !musicTrackArg || !AgoraRTC) {
      console.log('[Agora] Music Publish Skip - client:', !!client, 'connected:', connectionState, 'track:', !!musicTrackArg, 'agora:', !!AgoraRTC);
      return;
    }

    let customAudioTrack: any = null;

    const publishMusic = async () => {
      try {
        console.log('[Agora] Creating custom audio track from music stream...');
        // Create custom audio track from the music stream
        customAudioTrack = await AgoraRTC.createCustomAudioTrack({
          mediaStream: musicTrackArg
        });
        
        if (customAudioTrack) {
          console.log('[Agora] Publishing music track to Agora...');
          await client.publish(customAudioTrack);
          setPublishedMusicTrack(customAudioTrack);
          console.log('[Agora] Music Track Published Successfully - Other users can now hear music');
        } else {
          console.error('[Agora] Failed to create custom audio track');
        }
      } catch (e) {
        console.error('[Agora] Music Track Publish Failed:', e);
      }
    };

    publishMusic();

    return () => {
      if (customAudioTrack) {
        client.unpublish(customAudioTrack).catch(() => {});
        customAudioTrack.close();
        setPublishedMusicTrack(null);
        console.log('[Agora] Music Track Unpublished');
      }
    };
  }, [connectionState, musicTrackArg]);


  return { 
    localAudioTrack, 
    remoteUsers, 
    client: clientRef.current,
    setAudioOutputDevice,
    toggleAudioOutput,
    forceEarbudsOutput,
    currentOutputDevice,
    isSpeaker: currentOutputDevice === 'default'
  };
}
