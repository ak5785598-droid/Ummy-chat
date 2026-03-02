
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
 * Re-engineered for high-fidelity synchronization:
 * - Deterministic offering to prevent glare.
 * - Dynamic track addition when local stream becomes ready.
 * - Automatic reconnection on identity sync changes.
 */
export function useWebRTC(roomId: string | undefined, isInSeat: boolean, isMuted: boolean) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  
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
        console.log('[WebRTC] Requesting Microphone...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });
        setLocalStream(stream);
        console.log('[WebRTC] Local Stream Synchronized');
      } catch (err: any) {
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast({
            variant: 'destructive',
            title: 'Microphone Denied',
            description: 'Enable permissions to speak in the frequency.',
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
  // DEPENDENCY: localStream is critical. If we get a stream, we MUST re-initiate connections.
  useEffect(() => {
    if (!user || !roomId || !firestore) return;

    const participantsRef = collection(firestore, 'chatRooms', roomId, 'participants');
    
    // Listen for other participants to connect
    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const peerId = change.doc.id;
        if (peerId === user.uid) return;

        const peerData = change.doc.data();
        const isPeerSpeaker = peerData.seatIndex > 0;
        
        // Protocol: Connections are made if AT LEAST one side is a speaker
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

    // Signaling Listener for incoming handshakes (Offer/Answer/ICE)
    const signalingRef = collection(firestore, 'chatRooms', roomId, 'participants', user.uid, 'signaling');
    const unsubSignaling = onSnapshot(signalingRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const signal = change.doc.data();
          handleSignal(signal);
          // Delete signal after processing to keep the queue clean
          deleteDoc(change.doc.ref).catch(() => {});
        }
      });
    });

    const initiateConnection = async (peerId: string) => {
      console.log(`[WebRTC] Initiating P2P with: ${peerId}`);
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
        console.log(`[WebRTC] Received Remote Track from: ${peerId}`);
        setRemoteStreams(prev => {
          const next = new Map(prev);
          next.set(peerId, event.streams[0]);
          return next;
        });
      };

      // Glare protection: Deterministic offerer selection
      if (user.uid < peerId) {
        try {
          const offer = await pc.createOffer({ offerToReceiveAudio: true });
          await pc.setLocalDescription(offer);
          sendSignal(peerId, { type: 'offer', sdp: offer.sdp, from: user.uid });
        } catch (e) {
          console.error('[WebRTC] Offer failed:', e);
        }
      }
    };

    const handleSignal = async (signal: any) => {
      const peerId = signal.from;
      let pc = peerConnections.current.get(peerId);

      if (!pc) {
        pc = new RTCPeerConnection(iceConfig);
        peerConnections.current.set(peerId, pc);
        if (localStream) {
          localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
        }
        pc.onicecandidate = (event) => {
          if (event.candidate) sendSignal(peerId, { type: 'candidate', candidate: event.candidate.toJSON(), from: user.uid });
        };
        pc.ontrack = (event) => {
          setRemoteStreams(prev => {
            const next = new Map(prev);
            next.set(peerId, event.streams[0]);
            return next;
          });
        };
      }

      try {
        if (signal.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal(peerId, { type: 'answer', sdp: answer.sdp, from: user.uid });
        } else if (signal.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
        } else if (signal.type === 'candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (e) {
        console.error('[WebRTC] Signaling Error:', e);
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
