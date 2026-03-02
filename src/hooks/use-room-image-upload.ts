'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Hook to handle room image uploads to Firebase Storage and update Firestore.
 * Re-engineered with Non-Blocking Protocol to ensure high-fidelity room updates.
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

    try {
      // 1. Storage Upload (Must be awaited to get the URL)
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const storagePath = `chatRooms/${roomId}/cover_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Firestore Sync (Non-Blocking)
      const roomRef = doc(firestore, 'chatRooms', roomId);
      
      const updateData = { 
        id: roomId,
        coverUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      // Atomic update using non-blocking protocol
      setDocumentNonBlocking(roomRef, updateData, { merge: true });

      toast({
        title: 'Room DP Updated!',
        description: 'The frequency visual identity has been synchronized.',
      });
    } catch (error: any) {
      console.error('Error uploading room image:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not broadcast the new visual vibe.',
      });
    } finally {
      // Reset state immediately after initiation
      setIsUploading(false);
    }
  };

  return { isUploading, uploadRoomImage };
}
