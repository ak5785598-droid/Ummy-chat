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

/**
 * Detect if earbuds/headphones/bluetooth audio device is connected.
 * Works on Web (navigator.mediaDevices) and Native (AudioRoute plugin).
 */
async function detectEarbudsConnected(): Promise<boolean> {
  // NATIVE: Check via AudioRoute plugin
  if (AudioRoute?.isAvailable()) {
    try {
      const route = await AudioRoute.getCurrentRoute();
      const isEarbuds = route.toLowerCase().includes('headset') ||
        route.toLowerCase().includes('headphone') ||
        route.toLowerCase().includes('bluetooth') ||
        route.toLowerCase().includes('earpiece') ||
        route.toLowerCase().includes('wired');
      console.log('[Audio] Native route detected:', route, '→ earbuds:', isEarbuds);
      return isEarbuds;
    } catch (e) {
      console.warn('[Audio] Native route detection failed:', e);
    }
  }

  // WEB FALLBACK: Check via navigator.mediaDevices
  if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      const hasEarbuds = audioOutputs.some(d =>
        d.label.toLowerCase().includes('bluetooth') ||
        d.label.toLowerCase().includes('airpods') ||
        d.label.toLowerCase().includes('buds') ||
        d.label.toLowerCase().includes('headphone') ||
        d.label.toLowerCase().includes('headset') ||
        d.label.toLowerCase().includes('earphone') ||
        d.label.toLowerCase().includes('neckband')
      );
      console.log('[Audio] Web devices:', audioOutputs.map(d => d.label).join(', '), '→ earbuds:', hasEarbuds);
      return hasEarbuds;
    } catch (e) {
      console.warn('[Audio] Web device detection failed:', e);
    }
  }

  return false;
}

/**
 * Apply the correct audio routing based on connected devices.
 * Earbuds connected → route to earbuds
 * No earbuds → leave on speaker (default)
 */
async function applyCorrectAudioRoute(): Promise<void> {
  const hasEarbuds = await detectEarbudsConnected();

  if (hasEarbuds) {
    // NATIVE: Force earbuds
    if (AudioRoute?.isAvailable()) {
      try {
        await AudioRoute.forceEarbuds();
        console.log('[Audio] ✅ Routed to EARBUDS (native)');
        return;
      } catch (e) {
        console.warn('[Audio] Native force earbuds failed:', e);
      }
    }

    // WEB: Set sink ID to earbuds device
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const earbudDevice = devices.find(d =>
          d.kind === 'audiooutput' && (
            d.label.toLowerCase().includes('bluetooth') ||
            d.label.toLowerCase().includes('airpods') ||
            d.label.toLowerCase().includes('buds') ||
            d.label.toLowerCase().includes('headphone') ||
            d.label.toLowerCase().includes('headset') ||
            d.label.toLowerCase().includes('earphone') ||
            d.label.toLowerCase().includes('neckband')
          )
        );
        if (earbudDevice) {
          if (AgoraRTC?.setAudioOutputDevice) {
            await AgoraRTC.setAudioOutputDevice(earbudDevice.deviceId);
          } else {
            const audioElements = document.querySelectorAll('audio');
            for (const audio of audioElements) {
              // @ts-ignore
              if (audio.setSinkId) await audio.setSinkId(earbudDevice.deviceId);
            }
          }
          console.log('[Audio] ✅ Routed to EARBUDS (web):', earbudDevice.label);
        }
      } catch (e) {
        console.warn('[Audio] Web earbuds routing failed:', e);
      }
    }
  } else {
    console.log('[Audio] ✅ No earbuds detected → staying on SPEAKER');
    // If native, make sure we're on speaker (not earpiece)
    if (AudioRoute?.isAvailable()) {
      try {
        await AudioRoute.resetAudio();
      } catch (e) {}
    }
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
  const hasDetectedRouteRef = useRef(false);

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

        // ★ STEP 1: Detect and apply correct audio route BEFORE creating any audio
        console.log('[Audio] 🔍 Detecting audio devices before connection...');
        await applyCorrectAudioRoute();
        hasDetectedRouteRef.current = true;

        const client = AgoraRTC.createClient({ mode: 'live', codec: 'vp8' });
        clientRef.current = client;
        if (isMounted) setConnectionState('CONNECTING');

        client.on('user-published', async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
          try {
            await client.subscribe(user, mediaType);
            if (mediaType === 'audio') {
              // ★ STEP 2: Re-apply audio route BEFORE playing any remote track
              await applyCorrectAudioRoute();
              // NO DELAY for earbuds, play immediately to eliminate latency
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
        
        // --- VOLUME DETECTION: Enable real-time volume indicators ---
        client.enableAudioVolumeIndicator(200); 
        client.on('volume-indicator', (volumes: { uid: string | number; level: number }[]) => {
          if (onVolumeChange) {
            onVolumeChange(volumes.map(v => ({ uid: v.uid.toString(), level: v.level })));
          }
        });

        await client.join(APP_ID, roomId, null, numericUid);
        
        // ★ STEP 3: Re-apply route after join (joining can reset audio session)
        await applyCorrectAudioRoute();
        
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

  // EFFECT 2: Speaker Management - Play remote tracks and maintain routing
  useEffect(() => {
    remoteUsers.forEach(user => {
      if (user.audioTrack) {
        user.audioTrack.play();
      }
    });
    
    // Re-apply correct routing when remote users change
    if (remoteUsers.length > 0) {
      applyCorrectAudioRoute();
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
            AEC: false, // AUDIO MODE FIX: KILL AEC/NS TO PREVENT OS HIJACK
            ANS: false,
            AGC: false,
            encoderConfig: 'high_quality'
          });
          
          if (micTrack) {
            await client.publish(micTrack);
            setLocalAudioTrack(micTrack);
          }
          console.log('[Agora] Vocal Track Published');

          // ★ STEP 4: Re-apply routing AFTER mic creation (mic creation resets OS audio session)
          await applyCorrectAudioRoute();
          // Force again after delays to ensure it sticks (OS can be slow)
          setTimeout(() => applyCorrectAudioRoute(), 300);
          setTimeout(() => applyCorrectAudioRoute(), 800);

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

  // ROUTING PERSISTENCE: Smart detection-based (not blind forcing)
  useEffect(() => {
    if (!hasDetectedRouteRef.current) return;
    
    // Re-check and apply correct routing every 1.5 seconds (Faster recovery)
    const interval = setInterval(() => { 
      applyCorrectAudioRoute(); 
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);

  // Removed Effect 5: Music Track Publishing logic


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
