
'use client';

import { useEffect, useRef, useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  deleteDoc, 
  serverTimestamp,
  addDoc
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

/**
 * PRODUCTION WEBRTC HOOK
 * Handles P2P Audio Mesh via Firestore Signaling.
 * Synchronized with tribal security protocols.
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
    ],
  };

  useEffect(() => {
    if (!isInSeat || !user || !roomId || !firestore) {
      // Cleanup if leaving seat
      localStream?.getTracks().forEach(t => t.stop());
      setLocalStream(null);
      peerConnections.current.forEach(pc => pc.close());
      peerConnections.current.clear();
      setRemoteStreams(new Map());
      return;
    }

    const startLocalStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        // Apply initial mute state
        stream.getAudioTracks().forEach(track => {
          track.enabled = !isMuted;
        });
        setLocalStream(stream);
      } catch (err: any) {
        // Handle permission denial gracefully without crashing the app
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          toast({
            variant: 'destructive',
            title: 'Microphone Access Denied',
            description: 'Please enable microphone permissions in your browser settings to speak in the frequency.',
          });
        }
      }
    };

    startLocalStream();

    // Listen for other participants to connect to
    const participantsRef = collection(firestore, 'chatRooms', roomId, 'participants');
    const unsubscribe = onSnapshot(participantsRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        const peerId = change.doc.id;
        if (peerId === user.uid) return;

        if (change.type === 'added' || change.type === 'modified') {
          const peerData = change.doc.data();
          if (peerData.seatIndex > 0 && !peerConnections.current.has(peerId)) {
            // Create connection to this peer
            initiateConnection(peerId);
          }
        } else if (change.type === 'removed') {
          closeConnection(peerId);
        }
      });
    });

    // Signaling Listener
    const signalingRef = collection(firestore, 'chatRooms', roomId, 'participants', user.uid, 'signaling');
    const unsubSignaling = onSnapshot(signalingRef, (snapshot) => {
      snapshot.docChanges().forEach(async (change) => {
        if (change.type === 'added') {
          const signal = change.doc.data();
          handleSignal(change.doc.id, signal);
          await deleteDoc(change.doc.ref); // Consume signal
        }
      });
    });

    return () => {
      unsubscribe();
      unsubSignaling();
    };
  }, [isInSeat, roomId, user?.uid]);

  // Sync mute state to local stream
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isMuted;
      });
    }
  }, [isMuted, localStream]);

  const initiateConnection = async (peerId: string) => {
    if (!localStream || !user || !roomId || !firestore) return;

    const pc = new RTCPeerConnection(iceConfig);
    peerConnections.current.set(peerId, pc);

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

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

    // If we are the "Offerer" (arbitrary logic: smaller UID offers)
    if (user.uid < peerId) {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal(peerId, { type: 'offer', sdp: offer.sdp, from: user.uid });
    }
  };

  const handleSignal = async (signalId: string, signal: any) => {
    if (!user || !localStream) return;
    const peerId = signal.from;
    let pc = peerConnections.current.get(peerId);

    if (!pc) {
      pc = new RTCPeerConnection(iceConfig);
      peerConnections.current.set(peerId, pc);
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
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
  };

  const sendSignal = (toPeerId: string, payload: any) => {
    if (!firestore || !roomId) return;
    const ref = collection(firestore, 'chatRooms', roomId, 'participants', toPeerId, 'signaling');
    addDoc(ref, { ...payload, timestamp: serverTimestamp() });
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
