
'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Elite Frequency Cover Sync Hook.
 * Optimized for High-Speed uploads by utilizing the direct uploadBytes protocol.
 * Re-engineered to use Atomic Merge (setDoc) to ensure reliability for virtual frequencies.
 */
export function useRoomImageUpload(roomId: string) {
  const storage = useStorage();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadRoomImage = async (file: File) => {
    if (!user || !storage || !firestore || !roomId) {
      toast({
        variant: 'destructive',
        title: 'Sync Error',
        description: 'Authorization context or Room ID missing.',
      });
      return;
    }

    setIsUploading(true);
    console.log(`[Visual Sync] Starting high-speed cover upload for: ${roomId}`, file.name);

    try {
      // 1. High-Speed Storage Upload
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const storagePath = `chatRooms/${roomId}/cover_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      // Transitioned to uploadBytes for minimum latency on small tribal assets
      const result = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(result.ref);

      // 2. Firestore Sync (Atomic Merge Protocol)
      const roomRef = doc(firestore, 'chatRooms', roomId);
      
      const updateData = { 
        coverUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      console.log('[Visual Sync] Dispatching room cover metadata to Firestore via Atomic Merge');
      setDocumentNonBlocking(roomRef, updateData, { merge: true });

      toast({
        title: 'Frequency Cover Updated!',
        description: 'The new visual vibe has been synchronized.',
      });
    } catch (error: any) {
      console.error('[Visual Sync] Room Cover Failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not broadcast the new visual vibe.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadRoomImage };
}
