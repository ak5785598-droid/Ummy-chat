'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Hook to handle room image uploads to Firebase Storage and update Firestore.
 * Synchronized with Ummy production persistence protocol.
 * Optimized with setDoc merge to support fallback room updates.
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
      // Create a unique storage reference with timestamp to avoid browser caching issues
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const storagePath = `chatRooms/${roomId}/cover_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      const roomRef = doc(firestore, 'chatRooms', roomId);
      
      const updateData = { 
        id: roomId, // Required for setDoc
        coverUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      // Atomic update using setDoc with merge to ensure visual synchronization even for new or fallback rooms
      await setDoc(roomRef, updateData, { merge: true });

      toast({
        title: 'Room DP Updated!',
        description: 'The frequency visual identity has been synchronized across the tribe.',
      });
    } catch (error: any) {
      console.error('Error uploading room image:', error);
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
