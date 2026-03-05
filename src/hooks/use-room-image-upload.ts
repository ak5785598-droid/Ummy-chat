
'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Elite Frequency Cover Sync Hook.
 * Optimized for High-Speed uploads by utilizing client-side compression.
 * Re-engineered to use Atomic Merge (setDoc) to ensure reliability for virtual frequencies.
 */
export function useRoomImageUpload(roomId: string) {
  const storage = useStorage();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  /**
   * High-Fidelity Compression Engine.
   * Reduces file size by ~90% while maintaining visual crispness.
   */
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.7);
        };
      };
    });
  };

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
    console.log(`[Visual Sync] Starting high-speed cover upload for: ${roomId}`);

    try {
      // 1. High-Speed Client-Side Compression
      const compressedBlob = await compressImage(file);
      
      // 2. Storage Upload Handshake
      const fileExtension = 'jpg';
      const timestamp = Date.now();
      const storagePath = `chatRooms/${roomId}/cover_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      const result = await uploadBytes(storageRef, compressedBlob);
      const downloadURL = await getDownloadURL(result.ref);

      // 3. Firestore Sync (Atomic Merge Protocol)
      const roomRef = doc(firestore, 'chatRooms', roomId);
      
      const updateData = { 
        coverUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      console.log('[Visual Sync] Dispatching room cover metadata to Firestore');
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
