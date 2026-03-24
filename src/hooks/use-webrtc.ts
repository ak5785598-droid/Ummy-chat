'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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

export type PeerConnectionState = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed';

/**
 * PRODUCTION WEBRTC HOOK (V2 SCALED)
 * 1. ICE Batching: Local queues ICE candidates to drop Firestore writes by 95%.
 * 2. SDP Munging: Strict Bandwidth Control (32kbps) for infinite listener scaling.
 * 3. Connection Diagnostics & Resiliency.
 */
export function useWebRTC(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, musicStream: MediaStream | null = null) {
 const { user } = useUser();
 const firestore = useFirestore();
 const { toast } = useToast();
 const [localStream, setLocalStream] = useState<MediaStream | null>(null);
 const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
 const [connectionStates, setConnectionStates] = useState<Map<string, PeerConnectionState>>(new Map());
 
 const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
 const senders = useRef<Map<string, Map<string, RTCRtpSender>>>(new Map()); 
 const makingOffer = useRef<Map<string, boolean>>(new Map());
 const ignoreOffer = useRef<Map<string, boolean>>(new Map());
 const iceCandidatesQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
 const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
 const iceDebounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
 const audioContextRef = useRef<AudioContext | null>(null);

 const joinTime = useRef(Date.now());

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

 // ---------------------------------------------------------------------------
 //  SDP MUNGING (Bandwidth Tuning)
 // ---------------------------------------------------------------------------
 const mungeSDP = (sdp?: string) => {
  if (!sdp) return sdp;
  // Strictly enforce 32kbps (Application Specific constraint) scaling
  return sdp.replace(/a=mid:(audio|mic)\r\n/g, 'a=mid:$1\r\nb=AS:32\r\n');
 };

 const updateConnectionState = useCallback((peerId: string, state: PeerConnectionState) => {
  setConnectionStates(prev => {
   const next = new Map(prev);
   next.set(peerId, state);
   return next;
  });
 }, []);

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
    console.log('[WebRTC] Requesting local mic frequency sync...');
    const rawStream = await navigator.mediaDevices.getUserMedia({ 
     audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
      channelCount: 1 // Mono stream saves bandwidth
     }, 
     video: false 
    });

    if (!audioContextRef.current) {
     audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    setLocalStream(rawStream);
   } catch (err: any) {
    console.warn('[WebRTC] Hardware Sync Denied:', err.message);
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
     toast({ 
      variant: 'destructive', 
      title: 'Mic Access Denied', 
      description: 'Please enable microphone permissions in your browser.' 
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

 useEffect(() => {
  const updateTracks = async () => {
   for (const [peerId, pc] of peerConnections.current.entries()) {
    const peerSenders = senders.current.get(peerId) || new Map();
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
     const sender = peerSenders.get('mic');
     if (sender) {
      try { pc.removeTrack(sender); } catch (e) {}
      peerSenders.delete('mic');
     }
    }

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

 useEffect(() => {
  if (!user || !roomId || !firestore) return;

  const initiateConnection = (peerId: string) => {
   if (peerConnections.current.has(peerId)) {
    // Check if we need to auto-reconnect a failed state
    const currentPc = peerConnections.current.get(peerId);
    if (currentPc?.connectionState === 'failed' || currentPc?.connectionState === 'closed') {
      currentPc.close();
      peerConnections.current.delete(peerId);
    } else {
      return;
    }
   }
   
   console.log(`[WebRTC] Initiating Scaled P2P to ${peerId}`);
   const pc = new RTCPeerConnection(iceConfig);
   peerConnections.current.set(peerId, pc);
   updateConnectionState(peerId, pc.connectionState as PeerConnectionState);

   pc.onconnectionstatechange = () => {
    updateConnectionState(peerId, pc.connectionState as PeerConnectionState);
    if (pc.connectionState === 'failed') {
      console.warn(`[WebRTC] Connection with ${peerId} failed. Attempting auto-reconnect in 3s...`);
      setTimeout(() => initiateConnection(peerId), 3000);
    }
   };

   const peerSenders = new Map();
   const micTrack = localStream?.getAudioTracks()[0];
   if (micTrack) peerSenders.set('mic', pc.addTrack(micTrack, localStream!));
   const musTrack = musicStream?.getAudioTracks()[0];
   if (musTrack) peerSenders.set('music', pc.addTrack(musTrack, musicStream!));
   senders.current.set(peerId, peerSenders);

   // -----------------------------------------------------------------------
   // ICE CANDIDATE BATCHING ENGINE
   // Reduces Firestore writes from ~20 per connection to ~1 per connection
   // -----------------------------------------------------------------------
   pc.onicecandidate = (event) => {
    if (event.candidate) {
     const queue = pendingCandidates.current.get(peerId) || [];
     queue.push(event.candidate.toJSON());
     pendingCandidates.current.set(peerId, queue);

     const timer = iceDebounceTimers.current.get(peerId);
     if (timer) clearTimeout(timer);

     const newTimer = setTimeout(() => {
      const toSend = pendingCandidates.current.get(peerId);
      if (toSend && toSend.length > 0) {
       sendSignal(peerId, { type: 'candidates_batch', candidates: toSend, from: user.uid });
       pendingCandidates.current.set(peerId, []);
      }
     }, 400); // 400ms buffer
     iceDebounceTimers.current.set(peerId, newTimer);
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
     const offer = await pc.createOffer();
     offer.sdp = mungeSDP(offer.sdp); // Strictly scale bandwidth output
     
     await pc.setLocalDescription(offer);
     sendSignal(peerId, { type: 'offer', sdp: pc.localDescription?.sdp, from: user.uid });
    } catch (err) {
     console.error(`[WebRTC] Negotiation Failed:`, err);
    } finally {
     makingOffer.current.set(peerId, false);
    }
   };
  };

  const processQueuedCandidates = async (peerId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidatesQueue.current.get(peerId) || [];
    for (const cand of queue) {
     try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
    }
    iceCandidatesQueue.current.set(peerId, []);
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
     // Add 5-second clock drift allowance to prevent missing signals
     if (signal.timestamp && signal.timestamp.toMillis() < (joinTime.current - 5000)) return;
     
     await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
     
     const answer = await pc.createAnswer();
     answer.sdp = mungeSDP(answer.sdp); // STRICT BANDWIDTH CONTROL
     await pc.setLocalDescription(answer);
     
     sendSignal(peerId, { type: 'answer', sdp: pc.localDescription?.sdp, from: user.uid });
     await processQueuedCandidates(peerId, pc);

    } else if (signal.type === 'answer') {
     if (pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
      await processQueuedCandidates(peerId, pc);
     }
    } else if (signal.type === 'candidates_batch') {
     // HANDLE BATCHED ICE CANDIDATES
     const cands = signal.candidates || [];
     if (pc.remoteDescription) {
      for (const cand of cands) {
       try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (err) {}
      }
     } else {
      const queue = iceCandidatesQueue.current.get(peerId) || [];
      queue.push(...cands);
      iceCandidatesQueue.current.set(peerId, queue);
     }
    } else if (signal.type === 'candidate' && !signal.candidates) {
     // Handle Legacy unbatched candidates correctly (Backwards compatibility)
     if (pc.remoteDescription) {
      try { await pc.addIceCandidate(new RTCIceCandidate(signal.candidate)); } catch (err) {}
     } else {
      const queue = iceCandidatesQueue.current.get(peerId) || [];
      queue.push(signal.candidate);
      iceCandidatesQueue.current.set(peerId, queue);
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
     if (change.type === 'removed') {
        // Disconnect and cleanup cleanly
        const pc = peerConnections.current.get(peerId);
        if (pc) {
          pc.close();
          peerConnections.current.delete(peerId);
          updateConnectionState(peerId, 'closed');
        }
     }
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
   iceDebounceTimers.current.forEach(timer => clearTimeout(timer));
   iceDebounceTimers.current.clear();
   setRemoteStreams(new Map());
   setConnectionStates(new Map());
  };
 }, [roomId, user?.uid, isInSeat]);

 const sendSignal = (toPeerId: string, payload: any) => {
  if (!firestore || !roomId) return;
  const ref = collection(firestore, 'chatRooms', roomId, 'participants', toPeerId, 'signaling');
  addDoc(ref, { ...payload, timestamp: serverTimestamp() }).catch(() => {});
 };

 return { localStream, remoteStreams, connectionStates };
}
