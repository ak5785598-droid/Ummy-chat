'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Elite Frequency Cover Sync Hook.
 * Re-engineered with Resumable Upload Protocol for high-fidelity resilience.
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
    console.log(`[Visual Sync] Starting room cover upload for: ${roomId}`);

    try {
      // 1. Storage Upload Handshake
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const timestamp = Date.now();
      const storagePath = `chatRooms/${roomId}/cover_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, file);

      // Create completion promise
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[Visual Sync] Room upload is ${progress}% complete`);
          },
          (error) => {
            console.error('[Visual Sync] Room Upload Task Error:', error);
            reject(error);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              resolve(url);
            } catch (urlError) {
              reject(urlError);
            }
          }
        );
      });

      // 2. Firestore Sync (Non-Blocking)
      const roomRef = doc(firestore, 'chatRooms', roomId);
      
      const updateData = { 
        id: roomId,
        coverUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

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
