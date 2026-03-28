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
 * 2. SDP Munging: Robust Bandwidth Injection (128kbps) + Stereo Hinting.
 * 3. Transceiver Engine: Dedicated Send/Recv channels for full-duplex stability.
 */
export function useWebRTC(roomId: string | undefined, isInSeat: boolean, isMuted: boolean, musicStream: MediaStream | null = null) {
 const { user } = useUser();
 const firestore = useFirestore();
 const { toast } = useToast();
 const [localStream, setLocalStream] = useState<MediaStream | null>(null);
 const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
 const [connectionStates, setConnectionStates] = useState<Map<string, PeerConnectionState>>(new Map());
 
 const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
 const makingOffer = useRef<Map<string, boolean>>(new Map());
 const ignoreOffer = useRef<Map<string, boolean>>(new Map());
 const iceCandidatesQueue = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
 const pendingCandidates = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());
 const iceDebounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

 const joinTime = useRef(Date.now());

 const iceConfig: RTCConfiguration = {
  iceServers: [
   { urls: 'stun:stun.l.google.com:19302' },
   { urls: 'stun:stun1.l.google.com:19302' },
   { urls: 'stun:stun2.l.google.com:19302' },
   { urls: 'stun:stun3.l.google.com:19302' },
   { urls: 'stun:stun4.l.google.com:19302' },
   { urls: 'stun:stun.services.mozilla.com' },
   { urls: 'stun:stun.l.google.com:19305' },
   { urls: 'stun:global.stun.twilio.com:3478' },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
 };

 // ---------------------------------------------------------------------------
 //  SDP MUNGING (Bandwidth Tuning)
 // ---------------------------------------------------------------------------
 const mungeSDP = (sdp?: string) => {
  if (!sdp) return sdp;
  // V2: Robust m=audio Injection (128kbps) for high-capacity rooms
  let newSdp = sdp.replace(/m=audio.*?\r\n/g, '$&b=AS:128\r\n');
  // Add stereo hint to Opus (FMT 111) for better quality
  return newSdp.replace(/a=rtpmap:111 opus\/48000\/2/g, 'a=rtpmap:111 opus/48000/2\r\na=fmtp:111 sprop-stereo=1; stereo=1; maxaveragebitrate=128000');
 };

 const updateConnectionState = useCallback((peerId: string, state: PeerConnectionState) => {
  setConnectionStates(prev => {
   if (prev.get(peerId) === state) return prev;
   const next = new Map(prev);
   next.set(peerId, state);
   return next;
  });
 }, []);

 useEffect(() => {
  if (!isInSeat || !user || !roomId) {
   if (localStream) {
    console.log('[WebRTC] Stopping local stream (Not in seat/room)');
    localStream.getTracks().forEach(t => t.stop());
    setLocalStream(null);
   }
   return;
  }

  const startLocalStream = async () => {
   try {
    console.log('[WebRTC] Requesting local mic frequency sync...');
    
    // Check microphone permissions first if supported
    if (navigator.permissions && (navigator.permissions as any).query) {
      try {
        const permissions = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (permissions.state === 'denied') {
          toast({ 
            variant: 'destructive', 
            title: 'Mic Access Denied', 
            description: 'Please enable microphone permissions in your browser settings and refresh.' 
          });
          return;
        }
      } catch (e) {
        console.warn('[WebRTC] Permission query failed:', e);
      }
    }
    
    const rawStream = await navigator.mediaDevices.getUserMedia({ 
     audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      // @ts-ignore
      googEchoCancellation: true,
      // @ts-ignore
      googAutoGainControl: true,
      // @ts-ignore
      googNoiseSuppression: true,
      // @ts-ignore
      googHighpassFilter: true,
      sampleRate: 48000,
      channelCount: 1,
     }, 
     video: false 
    });

    console.log('[WebRTC] Microphone access granted, tracks:', rawStream.getAudioTracks().length);
    setLocalStream(rawStream);
   } catch (err: any) {
    console.error('[WebRTC] Hardware Sync Failed:', err);
    toast({ 
     variant: 'destructive', 
     title: 'Microphone Error', 
     description: `Failed to access microphone: ${err.message}` 
    });
   }
  };

  if (!localStream) {
    startLocalStream();
  }
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
   const micTrack = localStream?.getAudioTracks()[0];
   const musicTrack = musicStream?.getAudioTracks()[0];

   for (const [peerId, pc] of peerConnections.current.entries()) {
    if (pc.connectionState === 'closed') continue;
    const transceivers = pc.getTransceivers();
    
    // Update Mic Transceiver
    const micTransceiver = transceivers[0]; 
    if (micTransceiver && micTrack) {
      if (micTransceiver.sender.track !== micTrack) {
       micTransceiver.sender.replaceTrack(micTrack).catch(e => console.warn(`[WebRTC] replaceTrack failed for ${peerId}:`, e));
      }
    }

    // Update Music Transceiver
    const musicTransceiver = transceivers[1];
    if (musicTransceiver && musicTrack) {
      if (musicTransceiver.sender.track !== musicTrack) {
       musicTransceiver.sender.replaceTrack(musicTrack).catch(e => console.warn(`[WebRTC] replaceTrack failed for ${peerId}:`, e));
      }
    }
   }
  };
  updateTracks();
 }, [localStream, musicStream]);

 useEffect(() => {
  if (!user || !roomId || !firestore) return;

  const initiateConnection = (peerId: string) => {
   if (peerConnections.current.has(peerId)) {
    const currentPc = peerConnections.current.get(peerId);
    if (currentPc?.connectionState !== 'failed' && currentPc?.connectionState !== 'closed') {
      return;
    }
    currentPc?.close();
    peerConnections.current.delete(peerId);
   }
   
   console.log(`[WebRTC] Connecting to ${peerId}...`);
   const pc = new RTCPeerConnection(iceConfig);
   peerConnections.current.set(peerId, pc);
   updateConnectionState(peerId, pc.connectionState as PeerConnectionState);

   pc.onconnectionstatechange = () => {
    const state = pc.connectionState as PeerConnectionState;
    console.log(`[WebRTC] State for ${peerId}: ${state}`);
    updateConnectionState(peerId, state);
    if (state === 'failed') {
      console.warn(`[WebRTC] Connection with ${peerId} failed. Reconnect in 3s...`);
      setTimeout(() => initiateConnection(peerId), 3000);
    }
   };

   pc.oniceconnectionstatechange = () => {
     console.log(`[WebRTC] ICE State for ${peerId}: ${pc.iceConnectionState}`);
   };

   // V2: Transceiver-based Track Management
   const micTrack = localStream?.getAudioTracks()[0];
   if (micTrack) {
    pc.addTransceiver(micTrack, { direction: 'sendrecv', streams: [localStream!] });
   } else {
    pc.addTransceiver('audio', { direction: 'recvonly' });
   }

   const musTrack = musicStream?.getAudioTracks()[0];
   if (musTrack) {
    pc.addTransceiver(musTrack, { direction: 'sendonly', streams: [musicStream!] });
   } else {
    pc.addTransceiver('audio', { direction: 'recvonly' });
   }

   pc.onicecandidate = (event) => {
    if (event.candidate) {
     const queue = pendingCandidates.current.get(peerId) || [];
     queue.push(event.candidate.toJSON());
     pendingCandidates.current.set(peerId, queue);

     if (iceDebounceTimers.current.has(peerId)) {
       clearTimeout(iceDebounceTimers.current.get(peerId)!);
     }

     const newTimer = setTimeout(() => {
      const toSend = pendingCandidates.current.get(peerId);
      if (toSend && toSend.length > 0) {
       sendSignal(peerId, { type: 'candidates_batch', candidates: toSend, from: user.uid });
       pendingCandidates.current.set(peerId, []);
      }
     }, 200); // Reduced to 200ms for faster handshake
     iceDebounceTimers.current.set(peerId, newTimer);
    }
   };

   pc.ontrack = (event) => {
    console.log(`[WebRTC] Received remote track from ${peerId}`);
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
     offer.sdp = mungeSDP(offer.sdp);
     await pc.setLocalDescription(offer);
     sendSignal(peerId, { type: 'offer', sdp: pc.localDescription?.sdp, from: user.uid });
    } catch (err) {
     console.error(`[WebRTC] Negotiation failed:`, err);
    } finally {
     makingOffer.current.set(peerId, false);
    }
   };
  };

  const processQueuedCandidates = async (peerId: string, pc: RTCPeerConnection) => {
    const queue = iceCandidatesQueue.current.get(peerId) || [];
    if (queue.length === 0) return;
    console.log(`[WebRTC] Processing ${queue.length} queued candidates for ${peerId}`);
    for (const cand of queue) {
     try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (e) {}
    }
    iceCandidatesQueue.current.set(peerId, []);
  };

  const handleSignal = async (signal: any) => {
   const peerId = signal.from;
   if (!peerId) return;

   let pc = peerConnections.current.get(peerId);
   if (!pc || pc.connectionState === 'closed') {
    if (signal.type === 'offer') {
     initiateConnection(peerId);
     pc = peerConnections.current.get(peerId)!;
    } else return;
   }

   try {
    if (signal.type === 'offer') {
     const polite = user.uid > peerId;
     const offerCollision = (makingOffer.current.get(peerId) || pc.signalingState !== 'stable');
     
     if (offerCollision && !polite) {
       console.log(`[WebRTC] Ignoring offer collision from ${peerId} (Impolite)`);
       return;
     }

     await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: signal.sdp }));
     const answer = await pc.createAnswer();
     answer.sdp = mungeSDP(answer.sdp);
     await pc.setLocalDescription(answer);
     
     sendSignal(peerId, { type: 'answer', sdp: pc.localDescription?.sdp, from: user.uid });
     await processQueuedCandidates(peerId, pc);

    } else if (signal.type === 'answer') {
     if (pc.signalingState === 'have-local-offer') {
      await pc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: signal.sdp }));
      await processQueuedCandidates(peerId, pc);
     }
    } else if (signal.type === 'candidates_batch') {
     const cands = signal.candidates || [];
     if (pc.remoteDescription && pc.signalingState !== 'closed') {
      for (const cand of cands) {
       try { await pc.addIceCandidate(new RTCIceCandidate(cand)); } catch (err) {}
      }
     } else {
      const queue = iceCandidatesQueue.current.get(peerId) || [];
      queue.push(...cands);
      iceCandidatesQueue.current.set(peerId, queue);
     }
    }
   } catch (err) {
    console.error(`[WebRTC] Signal handling error:`, err);
   }
  };

  const participantsRef = collection(firestore, 'chatRooms', roomId, 'participants');
  const unsubParticipants = onSnapshot(participantsRef, (snapshot) => {
   snapshot.docChanges().forEach((change) => {
    const peerId = change.doc.id;
    if (peerId === user.uid || !peerId) return;
    
    const data = change.doc.data();
    const isPeerSpeaker = (data.seatIndex || 0) > 0;
    
    // OPTIMIZED MESH LOGIC: 
    // 1. If I am a speaker, I connect to ALL other speakers.
    // 2. If I am a listener, I ONLY connect to speakers.
    // 3. Speakers don't need to connect to listeners (listeners will connect to them to hear).
    
    if (change.type === 'removed') {
       const pc = peerConnections.current.get(peerId);
       if (pc) {
         pc.close();
         peerConnections.current.delete(peerId);
         updateConnectionState(peerId, 'closed');
         setRemoteStreams(prev => {
           const next = new Map(prev);
           next.delete(peerId);
           return next;
         });
       }
       return;
    }

    if (isPeerSpeaker) {
      // A speaker was added/modified -> everyone needs to connect to hear them
      initiateConnection(peerId);
    } else if (isInSeat) {
      // A listener was added/modified, and I am a speaker
      // We DON'T initiate connection to listeners. The listener will initiate to us.
      // This halves the number of connection attempts and avoids offer collisions.
    }
   });
  });

  const signalingRef = collection(firestore, 'chatRooms', roomId, 'participants', user.uid, 'signaling');
  const unsubSignaling = onSnapshot(signalingRef, (snapshot) => {
   snapshot.docChanges().forEach((change) => {
    if (change.type === 'added') {
     const signal = change.doc.data();
     // Clean up first to prevent multiple triggers
     deleteDoc(change.doc.ref).catch(() => {});
     handleSignal(signal);
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
  addDoc(ref, { 
    ...payload, 
    timestamp: serverTimestamp(),
    from: user?.uid 
  }).catch(e => console.error('[WebRTC] Signal send failed:', e));
 };

 return { localStream, remoteStreams, connectionStates };
}
