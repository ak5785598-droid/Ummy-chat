'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser, useFirestore } from '@/firebase';
import { 
  collection, 
  onSnapshot, 
  deleteDoc, 
  serverTimestamp,
  addDoc,
  DocumentData,
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * PRODUCTION WEBRTC HOOK
 * Re-engineered for absolute stability and high-fidelity social voice sync.
 * Fixed: 'InvalidAccessError' due to m-line order mismatch during renegotiation.
 */
export function useWebRTC(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, musicStream: MediaStream | null = null) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const makingOffer = useRef<Map<string, boolean>>(new Map());
  const ignoreOffer = useRef<Map<string, boolean>>(new Map());
  const audioContextRef = useRef<AudioContext | null>(null);

  const iceConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
    iceCandidatePoolSize: 10,
  };

  useEffect(() => {
    if (!isInSeat || !user || !roomId) {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        setLocalStream(null);
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
          }, 
          video: false 
        });

        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') await ctx.resume();

        const source = ctx.createMediaStreamSource(rawStream);
        const gainNode = ctx.createGain();
        gainNode.gain.value = 2.0; 
        
        const destination = ctx.createMediaStreamDestination();
        source.connect(gainNode);
        gainNode.connect(destination);
        
        setLocalStream(destination.stream);
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast({ 
            variant: 'destructive', 
            title: 'Mic Access Denied', 
            description: 'Please enable microphone permissions in your browser to speak.' 
          });
        }
      }
    };

    startLocalStream();

    return () => {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [isInSeat, user?.uid, roomId]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // STABLE TRACK SYNC EFFECT
  useEffect(() => {
    const updateTracks = async () => {
      for (const [peerId, pc] of peerConnections.current.entries()) {
        const transceivers = pc.getTransceivers();
        // Ensure we have at least 2 audio transceivers (Mic and Music)
        // If they don't exist yet, negotiation will handle it via onnegotiationneeded
        const micSender = transceivers[0]?.sender;
        const musicSender = transceivers[1]?.sender;

        const micTrack = localStream?.getAudioTracks()[0] || null;
        const musicTrack = musicStream?.getAudioTracks()[0] || null;

        if (micSender && micSender.track !== micTrack) {
          try { await micSender.replaceTrack(micTrack); } catch (e) {}
        }
        if (musicSender && musicSender.track !== musicTrack) {
          try { await musicSender.replaceTrack(musicTrack); } catch (e) {}
        }
      }
    };
    updateTracks();
  }, [localStream, musicStream]);

  useEffect(() => {
    if (!user || !roomId || !firestore) return;

    const initiateConnection = (peerId: string) => {
      if (peerConnections.current.has(peerId)) return;
      
      const pc = new RTCPeerConnection(iceConfig);
      peerConnections.current.set(peerId, pc);

      // CRITICAL: Pre-allocate transceivers in a fixed order to prevent m-line mismatch
      // Index 0: Voice Microphone
      // Index 1: Background Music
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      pc.addTransceiver('audio', { direction: 'sendrecv' });

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, { type: 'candidate', candidate: event.candidate.toJSON(), from: user.uid });
        }
      };

      pc.ontrack = (event) => {
        // Associate the track with the peer's unique stream
        if (event.streams && event.streams[0]) {
          setRemoteStreams(prev => {
            const next = new Map(prev);
            next.set(peerId, event.streams[0]);
            return next;
          });
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          makingOffer.current.set(peerId, true);
          await pc.setLocalDescription();
          sendSignal(peerId, { type: 'offer', sdp: pc.localDescription?.sdp, from: user.uid });
        } catch (err) {
          console.error(`[WebRTC] Negotiation Failed:`, err);
        } finally {
          makingOffer.current.set(peerId, false);
        }
      };

      // Apply initial tracks if available
      const micTrack = localStream?.getAudioTracks()[0];
      const musTrack = musicStream?.getAudioTracks()[0];
      const transceivers = pc.getTransceivers();
      if (micTrack) transceivers[0].sender.replaceTrack(micTrack);
      if (musTrack) transceivers[1].sender.replaceTrack(musTrack);
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
          const offerCollision = (makingOffer.current.get(peerId) || pc.signalingState !== 'stable');
          ignoreOffer.current.set(peerId, !polite && offerCollision);
          if (ignoreOffer.current.set(peerId)) return;
          
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          await pc.setLocalDescription();
          sendSignal(peerId, { type: 'answer', sdp: pc.localDescription?.sdp, from: user.uid });
        } else if (signal.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
          }
        } else if (signal.type === 'candidate') {
          try {
            if (pc.remoteDescription) await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            if (!ignoreOffer.current.get(peerId)) throw err;
          }
        }
      } catch (err) {
        console.error(`[WebRTC] Signal Error:`, err);
      }
    };

    const participantsRef = collection(firestore, 'chatRooms', roomId, 'participants');
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const peerId = change.doc.id;
        if (peerId === user.uid) return;
        const isPeerSpeaker = (change.doc.data().seatIndex || 0) > 0;
        if (isPeerSpeaker || isInSeat) {
          if (change.type === 'added' || (change.type === 'modified' && isPeerSpeaker)) initiateConnection(peerId);
        }
      });
    });

    const signalingRef = collection(firestore, 'chatRooms', roomId, 'participants', user.uid, 'signaling');
    const unsubSignaling = onSnapshot(signalingRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          handleSignal(change.doc.data());
          deleteDoc(change.doc.ref).catch(() => {});
        }
      });
    });

    return () => {
      unsubParticipants();
      unsubSignaling();
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, user?.uid, isInSeat]);

  const sendSignal = (toPeerId: string, payload: any) => {
    if (!firestore || !roomId) return;
    const ref = collection(firestore, 'chatRooms', roomId, 'participants', toPeerId, 'signaling');
    addDoc(ref, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
  };

  return { localStream, remoteStreams };
}
