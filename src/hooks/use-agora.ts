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
  // GUARD: Only load Agora in secure contexts (HTTPS or Localhost)
  // This prevents the SDK from throwing WEB_SECURITY_RESTRICT errors 
  // when testing on local IP addresses from mobile devices.
  if (window.isSecureContext) {
    try {
      const agoraModule = require('agora-rtc-sdk-ng');
      AgoraRTC = agoraModule.default || agoraModule;
    } catch (err) {
      console.error('[Agora] SDK load FAILED:', err);
    }
  } else {
    console.warn('[Agora] SDK load SKIPPED: Insecure context detected (HTTP over IP). Use HTTPS or Localhost for calling features.');
  }
}

function hashUidToNumber(uid: string): number {
  let hash = 5381;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 33) ^ uid.charCodeAt(i);
  }
  return (hash >>> 0);
}

/**
 * Helper to find the best microphone (prioritize bluetooth/headsets)
 */
async function getBestMicrophoneId(): Promise<string | undefined> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) return undefined;
  
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const mics = devices.filter(d => d.kind === 'audioinput');
    
    // Look for bluetooth or headset mics
    const bluetoothMic = mics.find(d => 
      d.label.toLowerCase().includes('bluetooth') || 
      d.label.toLowerCase().includes('airpods') ||
      d.label.toLowerCase().includes('buds') ||
      d.label.toLowerCase().includes('headset') ||
      d.label.toLowerCase().includes('earphone') ||
      d.label.toLowerCase().includes('neckband')
    );
    
    if (bluetoothMic) {
      console.log('[Audio] 🎙️ Bluetooth mic detected:', bluetoothMic.label);
      return bluetoothMic.deviceId;
    }
    
    return undefined; // Default
  } catch (e) {
    console.warn('[Audio] Mic enumeration failed:', e);
    return undefined;
  }
}

export function useAgora(
  roomId: string | undefined, 
  isInSeat: boolean, 
  isMuted: boolean, 
  uid: string | undefined, 
  isSpeakerMuted: boolean = false,
  onVolumeChange?: (volumes: { uid: string; level: number }[]) => void
) {
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  const [currentOutputDevice, setCurrentOutputDevice] = useState<string>('default');

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isProcessingConnectionRef = useRef(false);
  const onVolumeChangeRef = useRef(onVolumeChange);

  // Keep ref in sync
  useEffect(() => {
    onVolumeChangeRef.current = onVolumeChange;
  }, [onVolumeChange]);

  // Set audio output device for all remote users
  const setAudioOutputDevice = useCallback(async (deviceId: string) => {
    try {
      if (AgoraRTC && AgoraRTC.setAudioOutputDevice) {
        await AgoraRTC.setAudioOutputDevice(deviceId);
        setCurrentOutputDevice(deviceId);
        console.log('[Agora] Output device set to:', deviceId);
      } else {
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

      const earbudDevice = audioOutputs.find(d => 
        d.label.toLowerCase().includes('bluetooth') || 
        d.label.toLowerCase().includes('airpods') ||
        d.label.toLowerCase().includes('buds') ||
        d.label.toLowerCase().includes('headphone') ||
        d.label.toLowerCase().includes('headset') ||
        d.label.toLowerCase().includes('earphone') ||
        d.label.toLowerCase().includes('neckband')
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

  // Force to earbuds output if available
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
        d.label.toLowerCase().includes('earphone') ||
        d.label.toLowerCase().includes('neckband')
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
        clientRef.current = client;
        if (isMounted) setConnectionState('CONNECTING');

        client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
          try {
            await client.subscribe(user, mediaType);
            if (mediaType === 'audio') {
              // --- BRUTE FORCE: Force earbuds BEFORE playing remote track to prevent leak ---
              if (AudioRoute) {
                AudioRoute.forceEarbuds().catch(() => {});
              }
              
              if (!isSpeakerMuted) {
                user.audioTrack?.play();
              } else {
                user.audioTrack?.stop();
              }
              
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
        
        // --- VOLUME DETECTION (Safe Ref Implementation) ---
        if (onVolumeChangeRef.current) {
          client.enableAudioVolumeIndicator(200); 
          client.on('volume-indicator', (volumes: { uid: string | number; level: number }[]) => {
            if (onVolumeChangeRef.current) {
              onVolumeChangeRef.current(volumes.map(v => ({ uid: v.uid.toString(), level: v.level })));
            }
          });
        }

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
        if (isSpeakerMuted) {
          user.audioTrack.stop();
        } else {
          user.audioTrack.play();
        }
      }
    });
    
    // Force earbuds when remote users change (prevent speaker switch)
    if (AudioRoute && remoteUsers.length > 0 && !isSpeakerMuted) {
      AudioRoute.forceEarbuds().catch(() => {});
    }
  }, [remoteUsers, isSpeakerMuted]);

  // EFFECT 3: Microphone Management (Native Earbud Compatible)
  useEffect(() => {
    const client = clientRef.current;
    if (!client || connectionState !== 'CONNECTED' || !AgoraRTC) return;

    let micTrack: IMicrophoneAudioTrack | null = null;

    const manageMic = async () => {
      if (isInSeat) {
        try {
          console.log('[Agora] Creating Native Microphone Track...');
          
          // --- MIC FIX: Explicitly find and use bluetooth mic ID ---
          const bluetoothMicId = await getBestMicrophoneId();
          
          micTrack = await AgoraRTC.createMicrophoneAudioTrack({
            microphoneId: bluetoothMicId, 
            AEC: true, // Enable Echo Cancellation
            ANS: true, // Enable Noise Suppression
            AGC: true, // Enable Automatic Gain Control (Boosts low volume)
            encoderConfig: 'music_standard' // Higher bitrate (48kHz, 50kbps) for crystal clear sound
          });

          // BOOST: Set local volume to 200% for maximum loudness
          if (micTrack) {
            await micTrack.setVolume(200);
            await client.publish(micTrack);
            setLocalAudioTrack(micTrack);
          }
          console.log('[Agora] Vocal Track Published: ', bluetoothMicId ? 'Bluetooth' : 'Default');

          // Force Speakerphone or Earbuds via routing AFTER mic is published
          if (AudioRoute) {
            AudioRoute.forceEarbuds().catch(() => {});
            // Force again after a delay to ensure it sticks
            setTimeout(() => AudioRoute.forceEarbuds().catch(() => {}), 500);
          }

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

  // ROUTING ON MOUNT (One-shot fix)
  useEffect(() => {
    if (!AudioRoute) return;
    AudioRoute.forceEarbuds().catch(() => {});
  }, []);

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
