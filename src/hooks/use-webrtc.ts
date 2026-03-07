
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
 */
export function useWebRTC(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, musicStream: MediaStream | null = null) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  
  // Persistent refs to survive component re-renders and track changes
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const senders = useRef<Map<string, Map<string, RTCRtpSender>>>(new Map()); // peerId -> trackId -> sender
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

  // 1. LOCAL STREAM SYNC: Handle Mic Hardware Initialization
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
        console.log('[WebRTC] Initializing local voice frequency...');
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
        gainNode.gain.value = 2.0; // Moderate boost for tribal clarity
        
        const destination = ctx.createMediaStreamDestination();
        source.connect(gainNode);
        gainNode.connect(destination);
        
        const boostedStream = destination.stream;
        setLocalStream(boostedStream);
      } catch (err: any) {
        console.error('[WebRTC] Local Stream Error:', err);
        toast({ variant: 'destructive', title: 'Mic Sync Failed' });
      }
    };

    startLocalStream();

    return () => {
      if (localStream) localStream.getTracks().forEach(t => t.stop());
    };
  }, [isInSeat, user?.uid, roomId]);

  // 2. MUTE SYNC: Control track state locally
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  // 3. TRACK MANAGEMENT: Dynamically update peer connections without dropping signaling
  useEffect(() => {
    const updateTracks = async () => {
      for (const [peerId, pc] of peerConnections.current.entries()) {
        const peerSenders = senders.current.get(peerId) || new Map();
        
        // Handle Local Mic Track
        const audioTrack = localStream?.getAudioTracks()[0];
        if (audioTrack) {
          if (peerSenders.has('mic')) {
            const sender = peerSenders.get('mic');
            if (sender?.track !== audioTrack) sender?.replaceTrack(audioTrack);
          } else {
            const sender = pc.addTrack(audioTrack, localStream!);
            peerSenders.set('mic', sender);
          }
        } else {
          // User left seat, remove mic sender
          const sender = peerSenders.get('mic');
          if (sender) {
            try { pc.removeTrack(sender); } catch (e) {}
            peerSenders.delete('mic');
          }
        }

        // Handle Music Stream Track
        const musicTrack = musicStream?.getAudioTracks()[0];
        if (musicTrack) {
          if (peerSenders.has('music')) {
            const sender = peerSenders.get('music');
            if (sender?.track !== musicTrack) sender?.replaceTrack(musicTrack);
          } else {
            const sender = pc.addTrack(musicTrack, musicStream!);
            peerSenders.set('music', sender);
          }
        } else {
          const sender = peerSenders.get('music');
          if (sender) {
            try { pc.removeTrack(sender); } catch (e) {}
            peerSenders.delete('music');
          }
        }

        senders.current.set(peerId, peerSenders);
      }
    };

    updateTracks();
  }, [localStream, musicStream]);

  // 4. SIGNALING & PEER MANAGEMENT: Long-lived subscription
  useEffect(() => {
    if (!user || !roomId || !firestore) return;

    console.log(`[WebRTC] Establishing long-lived tribal signal for room: ${roomId}`);

    const initiateConnection = (peerId: string) => {
      if (peerConnections.current.has(peerId)) return;

      const pc = new RTCPeerConnection(iceConfig);
      peerConnections.current.set(peerId, pc);

      // Initial tracks
      const peerSenders = new Map();
      const micTrack = localStream?.getAudioTracks()[0];
      if (micTrack) peerSenders.set('mic', pc.addTrack(micTrack, localStream!));
      const musTrack = musicStream?.getAudioTracks()[0];
      if (musTrack) peerSenders.set('music', pc.addTrack(musTrack, musicStream!));
      senders.current.set(peerId, peerSenders);

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, { type: 'candidate', candidate: event.candidate.toJSON(), from: user.uid });
        }
      };

      pc.ontrack = (event) => {
        console.log(`[WebRTC] Received remote frequency from: ${peerId}`);
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.set(peerId, event.streams[0]);
          return next;
        });
      };

      pc.oniceconnectionstatechange = () => {
        console.log(`[WebRTC] ICE State with ${peerId}: ${pc.iceConnectionState}`);
        if (pc.iceConnectionState === 'failed') pc.restartIce();
        if (pc.iceConnectionState === 'disconnected') {
          // Wait for auto-recovery or prune in next sync
        }
      };

      pc.onnegotiationneeded = async () => {
        try {
          makingOffer.current.set(peerId, true);
          await pc.setLocalDescription();
          sendSignal(peerId, { type: 'offer', sdp: pc.localDescription?.sdp, from: user.uid });
        } catch (err) {
          console.error(`[WebRTC] Negotiation Failed (${peerId}):`, err);
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
          const offerCollision = (makingOffer.current.get(peerId) || pc.signalingState !== 'stable');
          ignoreOffer.current.set(peerId, !polite && offerCollision);
          
          if (ignoreOffer.current.get(peerId)) return;

          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          await pc.setLocalDescription();
          sendSignal(peerId, { type: 'answer', sdp: pc.localDescription?.sdp, from: user.uid });
        } else if (signal.type === 'answer') {
          if (pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
          }
        } else if (signal.type === 'candidate') {
          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
            }
          } catch (err) {
            if (!ignoreOffer.current.get(peerId)) throw err;
          }
        }
      } catch (err) {
        console.error(`[WebRTC] Signal Handshake Error (${peerId}):`, err);
      }
    };

    const closeConnection = (peerId: string) => {
      const pc = peerConnections.current.get(peerId);
      if (pc) {
        pc.close();
        peerConnections.current.delete(peerId);
        senders.current.delete(peerId);
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.delete(peerId);
          return next;
        });
      }
    };

    const participantsRef = collection(firestore, 'chatRooms', roomId, 'participants');
    const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const peerId = change.doc.id;
        if (peerId === user.uid) return;

        const peerData = change.doc.data();
        const isPeerSpeaker = (peerData.seatIndex || 0) > 0;
        
        if (isPeerSpeaker || isInSeat) {
          if (change.type === 'added' || (change.type === 'modified' && isPeerSpeaker)) {
            initiateConnection(peerId);
          }
        } else if (change.type === 'removed') {
          closeConnection(peerId);
        }
      });
    });

    const signalingRef = collection(firestore, 'chatRooms', roomId, 'participants', user.uid, 'signaling');
    const unsubSignaling = onSnapshot(signalingRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const signal = change.doc.data();
          handleSignal(signal);
          deleteDoc(change.doc.ref).catch(() => {});
        }
      });
    });

    return () => {
      console.log(`[WebRTC] Purging tribal signals for room: ${roomId}`);
      unsubParticipants();
      unsubSignaling();
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      senders.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, user?.uid, isInSeat]); // NO localStream dependency ensures stability

  const sendSignal = (toPeerId: string, payload: any) => {
    if (!firestore || !roomId) return;
    const ref = collection(firestore, 'chatRooms', roomId, 'participants', toPeerId, 'signaling');
    addDoc(ref, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
  };

  return { localStream, remoteStreams };
}
