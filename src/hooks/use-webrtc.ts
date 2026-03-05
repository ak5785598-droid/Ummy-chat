
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
 * Re-engineered for high-fidelity synchronization using the Perfect Negotiation pattern.
 * - Prevents glare conditions and signaling state mismatches.
 * - Dynamic track addition when local stream becomes ready.
 * - Robust error handling for mobile browser frequencies.
 */
export function useWebRTC(roomId: string | undefined, isInSeat: boolean, isMuted: boolean) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  
  // Guard refs for Perfect Negotiation state management
  const makingOffer = useRef<Map<string, boolean>>(new Map());
  const ignoreOffer = useRef<Map<string, boolean>>(new Map());

  const iceConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ],
  };

  // 1. Local Stream Management
  useEffect(() => {
    if (!isInSeat || !user || !roomId || !firestore) {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
        setLocalStream(null);
      }
      return;
    }

    const startLocalStream = async () => {
      try {
        console.log('[WebRTC] Requesting Microphone Frequency...');
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }, 
          video: false 
        });
        
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });
        
        setLocalStream(stream);
        console.log('[WebRTC] Local Frequency Synchronized');
      } catch (err: any) {
        console.error('[WebRTC] Media Error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast({
            variant: 'destructive',
            title: 'Microphone Denied',
            description: 'Please enable microphone permissions to join the frequency.',
          });
        }
      }
    };

    startLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(t => t.stop());
      }
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

  // 2. Global Mesh & Signaling Handshake
  useEffect(() => {
    if (!user || !roomId || !firestore) return;

    const participantsRef = collection(firestore, 'chatRooms', roomId, 'participants');
    
    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const peerId = change.doc.id;
        if (peerId === user.uid) return;

        const peerData = change.doc.data();
        const isPeerSpeaker = peerData.seatIndex > 0;
        
        // Protocol: Connections are maintained if AT LEAST one side is a speaker (in seat)
        if (isPeerSpeaker || isInSeat) {
          if (change.type === 'added' || change.type === 'modified') {
            if (!peerConnections.current.has(peerId)) {
              initiateConnection(peerId);
            }
          }
        } else if (change.type === 'removed') {
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
      console.log(`[WebRTC] Initiating P2P Handshake: ${peerId}`);
      const pc = new RTCPeerConnection(iceConfig);
      peerConnections.current.set(peerId, pc);

      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal(peerId, { type: 'candidate', candidate: event.candidate.toJSON(), from: user.uid });
        }
      };

      pc.ontrack = (event) => {
        console.log(`[WebRTC] Received Remote Frequency: ${peerId}`);
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.set(peerId, event.streams[0]);
          return next;
        });
      };

      // Perfect Negotiation Pattern: handle negotiationneeded
      pc.onnegotiationneeded = async () => {
        try {
          makingOffer.current.set(peerId, true);
          await pc.setLocalDescription();
          sendSignal(peerId, { 
            type: 'offer', 
            sdp: pc.localDescription?.sdp, 
            from: user.uid 
          });
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

      // If PC doesn't exist, we only create it if we received an offer
      if (!pc) {
        if (signal.type === 'offer') {
          initiateConnection(peerId);
          pc = peerConnections.current.get(peerId)!;
        } else {
          return;
        }
      }

      try {
        if (signal.type === 'offer') {
          // Glare handling: deterministic conflict resolution (polite vs impolite)
          const polite = user.uid > peerId;
          const offerCollision = signal.type === 'offer' && 
            (makingOffer.current.get(peerId) || pc.signalingState !== 'stable');

          ignoreOffer.current.set(peerId, !polite && offerCollision);
          if (ignoreOffer.current.get(peerId)) {
            console.warn(`[WebRTC] Glare Conflict: Ignoring offer from ${peerId}`);
            return;
          }

          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          await pc.setLocalDescription();
          sendSignal(peerId, { 
            type: 'answer', 
            sdp: pc.localDescription?.sdp, 
            from: user.uid 
          });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
        } else if (signal.type === 'candidate') {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (err) {
            if (!ignoreOffer.current.get(peerId)) throw err;
          }
        }
      } catch (err) {
        console.error(`[WebRTC] Signaling Handshake Error (${peerId}):`, err);
      }
    };

    return () => {
      unsubscribe();
      unsubSignaling();
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      setRemoteStreams(new Map());
    };
  }, [roomId, user?.uid, isInSeat, localStream]); 

  // Late track sync for established connections
  useEffect(() => {
    if (!localStream) return;
    peerConnections.current.forEach((pc, peerId) => {
      const senders = pc.getSenders();
      localStream.getTracks().forEach(track => {
        const alreadyAdded = senders.find(s => s.track?.id === track.id);
        if (!alreadyAdded) pc.addTrack(track, localStream);
      });
    });
  }, [localStream]);

  const sendSignal = (toPeerId: string, payload: any) => {
    if (!firestore || !roomId) return;
    const ref = collection(firestore, 'chatRooms', roomId, 'participants', toPeerId, 'signaling');
    addDoc(ref, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
  };

  const closeConnection = (peerId: string) => {
    const pc = peerConnections.current.get(peerId);
    pc?.close();
    peerConnections.current.delete(peerId);
    makingOffer.current.delete(peerId);
    ignoreOffer.current.delete(peerId);
    setRemoteStreams(prev => {
      const next = new Map(prev);
      next.delete(peerId);
      return next;
    });
  };

  return { localStream, remoteStreams };
}
