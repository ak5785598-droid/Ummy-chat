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

export function useAgora(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, uid: string | undefined, musicTrack: MediaStreamTrack | null = null, isSpeakerMuted: boolean = false) {
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [connectionState, setConnectionState] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED'>('DISCONNECTED');
  
  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const isProcessingConnectionRef = useRef(false);

  // NUCLEAR SYNC: Virtual Mixer State
  const audioCtxRef = useRef<AudioContext | null>(null);
  const mixerDestRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const musicNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const unifiedTrackRef = useRef<any>(null);
  const monitorGainRef = useRef<GainNode | null>(null);
  
  // DUCKING ENGINE & MIXER SOURCES
  const musicGainRef = useRef<GainNode | null>(null);
  const musicSourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const currentMusicTrackIdRef = useRef<string | null>(null);

  // Helper to resume audio context (Standard Mobile Fix)
  const resumeAudioContext = async () => {
    if (typeof window !== 'undefined') {
      if (!audioCtxRef.current) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          // Optimized for Telephony (16kHz or 48kHz depending on device link)
          audioCtxRef.current = new AudioContextClass({ latencyHint: 'interactive' });
          mixerDestRef.current = audioCtxRef.current!.createMediaStreamDestination();
          
          // MONITOR SINK: Bridges the mix back to the host's actual output (Earbuds)
          monitorGainRef.current = audioCtxRef.current!.createGain();
          monitorGainRef.current.connect(audioCtxRef.current!.destination);

          // DUCKING SINK: Controls music volume independently
          musicGainRef.current = audioCtxRef.current!.createGain();
          musicGainRef.current.connect(mixerDestRef.current!);
          musicGainRef.current.connect(monitorGainRef.current!);

          // MIC ANALYZER: For Ducking & Waves
          analyzerRef.current = audioCtxRef.current!.createAnalyser();
          analyzerRef.current.fftSize = 256;
        }
      }
      if (audioCtxRef.current?.state === 'suspended') {
        try {
          await audioCtxRef.current.resume();
        } catch (e) {
          console.warn('[Agora] AudioContext resume failed (No user gesture?):', e);
        }
      }
    }
  };

  // EFFECT: Ducking Animation Loop
  useEffect(() => {
    let animationFrame: number;
    const processDucking = () => {
      if (analyzerRef.current && musicGainRef.current && isInSeat && !isMuted) {
        const dataArray = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;

        // DYNAMIC DUCKING: Smoothly lower music if speaking
        const targetGain = average > 15 ? 0.3 : 1.0; 
        const currentGain = musicGainRef.current.gain.value;
        musicGainRef.current.gain.setTargetAtTime(targetGain, audioCtxRef.current!.currentTime, 0.1);
      } else if (musicGainRef.current) {
        musicGainRef.current.gain.setTargetAtTime(1.0, audioCtxRef.current!.currentTime, 0.2);
      }
      animationFrame = requestAnimationFrame(processDucking);
    };
    processDucking();
    return () => cancelAnimationFrame(animationFrame);
  }, [isInSeat, isMuted]);

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
            console.log('[Agora] Professional Engine Connected:', numericUid);
        }
      } catch (err) {
        console.error('[Agora] Professional Engine Failed:', err);
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

    if (monitorGainRef.current) {
      monitorGainRef.current.gain.setTargetAtTime(isSpeakerMuted ? 0 : 1.0, audioCtxRef.current!.currentTime, 0.1);
    }
  }, [isSpeakerMuted, remoteUsers]);

  // EFFECT 2: Integrated Professional Mixer (No-Leak Edition)
  useEffect(() => {
    const client = clientRef.current;
    if (!client || connectionState !== 'CONNECTED' || !AgoraRTC) return;

    const syncMixer = async () => {
      await resumeAudioContext();
      if (!audioCtxRef.current || !mixerDestRef.current || !monitorGainRef.current || !musicGainRef.current) return;

      // A. Manage Microphone Input
      if (isInSeat) {
        // NATIVE PERMISSION SYNC: Explicitly request microphone if on Android/iOS
        if (Capacitor.isNativePlatform()) {
          try {
             // Capacitor standard permission check for Microphone
             const check = await (Capacitor as any).Plugins.Permissions.query({ name: 'microphone' });
             if (check.state !== 'granted') {
               console.log('[Mixer] Requesting Native Microphone Permission...');
               await (Capacitor as any).Plugins.Permissions.request({ name: 'microphone' });
             }
          } catch (e) {
            console.warn('[Mixer] Native permission bridge failed, falling back to browser call:', e);
          }
        }

        if (!micNodeRef.current) {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
              audio: { 
                echoCancellation: true, 
                noiseSuppression: true,
                autoGainControl: true
              } 
            });
            micNodeRef.current = audioCtxRef.current.createMediaStreamSource(stream);
            
            // Create MIC GAIN for clean muting if it doesn't exist
            if (!micGainRef.current) {
              micGainRef.current = audioCtxRef.current.createGain();
            }
            
            // Connect mic -> gain -> mixerDest AND mic -> analyzer
            micNodeRef.current.connect(micGainRef.current);
            micGainRef.current.connect(mixerDestRef.current);
            micNodeRef.current.connect(analyzerRef.current!);
            
            setLocalAudioTrack(stream.getAudioTracks()[0] as any); 
            console.log('[Mixer] Microphone Node Connected and Live');
          } catch (e) {
            console.error('[Mixer] Mic Fail:', e);
          }
        }

        // Apply Local Mute State to Source Gain
        if (micGainRef.current) {
          const targetValue = isMuted ? 0 : 1;
          if (micGainRef.current.gain.value !== targetValue) {
            micGainRef.current.gain.setTargetAtTime(targetValue, audioCtxRef.current.currentTime, 0.05);
            console.log(`[Mixer] Local Mic ${isMuted ? 'MUTED' : 'UNMUTED'} via Gain Node`);
          }
        }
      } else {
        if (micNodeRef.current) {
          micNodeRef.current.disconnect();
          micNodeRef.current = null;
          setLocalAudioTrack(null);
          console.log('[Mixer] Microphone Disconnected (Left Seat)');
        }
      }

      // B. Inject Music into Mixer (THE FIX FOR SYNC)
      if (musicTrack) {
        if (currentMusicTrackIdRef.current !== musicTrack.id) {
            console.log('[Mixer] New Music Track Detected, Injecting into Mixer...');
            
            // Cleanup old music source if it exists
            if (musicSourceNodeRef.current) {
                try { musicSourceNodeRef.current.disconnect(); } catch(e){}
            }

            const musicStream = new MediaStream([musicTrack]);
            musicSourceNodeRef.current = audioCtxRef.current.createMediaStreamSource(musicStream);
            
            // Connect music -> ducking gain -> mixerDest
            musicSourceNodeRef.current.connect(musicGainRef.current);
            currentMusicTrackIdRef.current = musicTrack.id;
            console.log('[Mixer] Music Track Successfully Injected into Local Mixer');
        }
      } else {
          if (musicSourceNodeRef.current) {
              musicSourceNodeRef.current.disconnect();
              musicSourceNodeRef.current = null;
              currentMusicTrackIdRef.current = null;
              console.log('[Mixer] Music Stopped, Disconnecting Source');
          }
      }

      // C. Unified Publication Track (ALWAYS USE MIXER OUTPUT)
      if (!unifiedTrackRef.current && mixerDestRef.current) {
        try {
          // THE CRITICAL FIX: We create the Agora track from the MIXER outcome
          const mixerTrack = mixerDestRef.current.stream.getAudioTracks()[0];
          if (mixerTrack) {
              const track = await AgoraRTC.createCustomAudioTrack({
                mediaStreamTrack: mixerTrack
              });
              await client.publish(track);
              unifiedTrackRef.current = track;
              console.log('[Mixer] CRITICAL: Unified Agora Stream Published (Mixer Mode)');
          }
        } catch (e) {
          console.error('[Mixer] Failed to publish unified track:', e);
        }
      }
    };

    syncMixer();
  }, [isInSeat, isMuted, !!musicTrack, musicTrack?.id, connectionState]);

  // EFFECT 4: Routing Persistence
  useEffect(() => {
    if (!AudioRoute || connectionState !== 'CONNECTED' || !unifiedTrackRef.current) return;
    const interval = setInterval(() => { AudioRoute.forceEarbuds().catch(() => {}); }, 4500);
    return () => clearInterval(interval);
  }, [connectionState, !!unifiedTrackRef.current]);

  return { localAudioTrack, remoteUsers, client: clientRef.current };
}
