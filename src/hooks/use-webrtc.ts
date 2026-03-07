'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { 
  collection, 
  onSnapshot, 
  deleteDoc, 
  serverTimestamp,
  addDoc,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * PRODUCTION WEBRTC HOOK
 * Handles P2P Audio Mesh via Firestore Signaling.
 * Re-engineered for multi-track synchronization: supports simultaneous Mic and Music frequencies.
 */
export function useWebRTC(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, musicStream: MediaStream | null = null) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  // Track specific senders for music tracks to allow dynamic adding/removal
  const musicSenders = useRef<Map<string, RTCRtpSender[]>>(new Map());
  
  // Guard refs for Perfect Negotiation state management
  const makingOffer = useRef<Map<string, boolean>>(new Map());
  const ignoreOffer = useRef<Map<string, boolean>>(new Map());

  // Web Audio Context for Outbound Gain Boosting
  const audioContextRef = useRef<AudioContext | null>(null);

  const iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  // 1. Local Microphone Stream Management with Voice Boost
  useEffect(() => {
    if (!isInSeat || !user || !roomId || !firestore) {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        setLocalStream(null);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      return;
    }

    const startLocalStream = async () => {
      try {
        const rawStream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
            sampleRate: 48000,
          }, 
          video: false 
        });

        // VOICE BOOST PROTOCOL: High-fidelity outbound boost (250%)
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        const source = ctx.createMediaStreamSource(rawStream);
        const gainNode = ctx.createGain();
        gainNode.gain.value = 2.5; 
        
        const destination = ctx.createMediaStreamDestination();
        source.connect(gainNode);
        gainNode.connect(destination);
        
        const boostedStream = destination.stream;
        boostedStream.getAudioTracks().forEach(track => { track.enabled = !isMuted; });
        
        setLocalStream(boostedStream);
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast({ variant: 'destructive', title: 'Mic Access Required' });
        }
      }
    };

    startLocalStream();

    return () => {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [isInSeat, roomId, user?.uid]);

  // Sync mute state to local stream tracks
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // 2. Music Frequency Sync: Dynamically re-negotiate tracks for all active peers
  useEffect(() => {
    peerConnections.current.forEach((pc, peerId) => {
      // Clear previous music frequency tracks
      const existingSenders = musicSenders.current.get(peerId);
      if (existingSenders) {
        existingSenders.forEach(s => { try { pc.removeTrack(s); } catch(e) {} });
        musicSenders.current.delete(peerId);
      }

      // Synchronize new music tracks if active in current session
      if (musicStream && musicStream.getAudioTracks().length > 0) {
        const newSenders: RTCRtpSender[] = [];
        musicStream.getAudioTracks().forEach(track => {
          // Associated music with current local session for stability
          newSenders.push(pc.addTrack(track, localStream || musicStream));
        });
        musicSenders.current.set(peerId, newSenders);
      }
    });
  }, [musicStream, localStream]);

  // 3. P2P Mesh Handshake via Firestore Signaling
  useEffect(() => {
    if (!user || !roomId || !firestore) return;

    const participantsRef = collection(firestore, 'chatRooms', roomId, 'participants');
    
    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const peerId = change.doc.id;
        if (peerId === user.uid) return;

        const peerData = change.doc.data();
        const isPeerSpeaker = peerData.seatIndex > 0;
        
        if (isPeerSpeaker || isInSeat) {
          if (change.type === 'added' || (change.type === 'modified' && isPeerSpeaker)) {
            if (!peerConnections.current.has(peerId)) initiateConnection(peerId);
          }
        } else if (change.type === 'removed' || (change.type === 'modified' && !isPeerSpeaker && !isInSeat)) {
          closeConnection(peerId);
        }
      });
    });

    const signalingRef = collection(firestore, 'chatRooms', roomId, 'participants', user.uid, 'signaling');
    const unsubSignaling = onSnapshot(signalingRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const signal = change.doc.data();
          handleSignal(signal);
          deleteDoc(change.doc.ref).catch(() => {});
        }
      });
    });

    const initiateConnection = (peerId: string) => {
      const pc = new RTCPeerConnection(iceConfig);
      peerConnections.current.set(peerId, pc);

      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      }

      if (musicStream) {
        const senders: RTCRtpSender[] = [];
        musicStream.getTracks().forEach(track => {
          senders.push(pc.addTrack(track, localStream || musicStream));
        });
        musicSenders.current.set(peerId, senders);
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, { type: 'candidate', candidate: event.candidate.toJSON(), from: user.uid });
        }
      };

      pc.ontrack = (event) => {
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.set(peerId, event.streams[0]);
          return next;
        });
      };

      pc.onnegotiationneeded = async () => {
        try {
          makingOffer.current.set(peerId, true);
          await pc.setLocalDescription();
          sendSignal(peerId, { type: 'offer', sdp: pc.localDescription?.sdp, from: user.uid });
        } catch (err) {
          console.error(`[WebRTC] Negotiation Error (${peerId}):`, err);
        } finally {
          makingOffer.current.set(peerId, false);
        }
      };
    };

    const handleSignal = async (signal: any) => {
      const peerId = signal.from;
      let pc = peerConnections.current.get(peerId);

      if (!pc) {
        if (signal.type === 'offer') {
          initiateConnection(peerId);
          pc = peerConnections.current.get(peerId)!;
        } else return;
      }

      try {
        if (signal.type === 'offer') {
          const polite = user.uid > peerId;
          const offerCollision = signal.type === 'offer' && (makingOffer.current.get(peerId) || pc.signalingState !== 'stable');
          ignoreOffer.current.set(peerId, !polite && offerCollision);
          if (ignoreOffer.current.get(peerId)) return;

          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          await pc.setLocalDescription();
          sendSignal(peerId, { type: 'answer', sdp: pc.localDescription?.sdp, from: user.uid });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
        } else if (signal.type === 'candidate') {
          try {
            if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            if (!ignoreOffer.current.get(peerId)) throw err;
          }
        }
      } catch (err) {
        console.error(`[WebRTC] Signal Handshake Error:`, err);
      }
    };

    return () => {
      unsubscribe();
      unsubSignaling();
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, user?.uid, isInSeat, localStream, musicStream]); 

  const sendSignal = (toPeerId: string, payload: any) => {
    if (!firestore || !roomId) return;
    const ref = collection(firestore, 'chatRooms', roomId, 'participants', toPeerId, 'signaling');
    addDoc(ref, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
  };

  const closeConnection = (peerId: string) => {
    const pc = peerConnections.current.get(peerId);
    pc?.close();
    peerConnections.current.delete(peerId);
    setRemoteStreams(prev => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  };

  return { localStream, remoteStreams };
}
