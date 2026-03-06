
'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Elite Visual Identity Sync Hook.
 * Optimized for High-Speed uploads by utilizing client-side compression.
 * Ensures reliability on mobile browsers by standardizing image frequencies.
 */
export function useProfilePictureUpload() {
  const storage = useStorage();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  /**
   * High-Fidelity Compression Engine.
   * Reduces file size while maintaining visual crispness for the tribal graph.
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
          // Standard DP dimensions: 512x512
          const SIZE = 512;
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext('2d');
          
          // Center crop logic if image is not square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;
          
          ctx?.drawImage(img, sx, sy, minDim, minDim, 0, 0, SIZE, SIZE);
          canvas.toBlob((blob) => {
            resolve(blob || file);
          }, 'image/jpeg', 0.8); // 0.8 quality for elite mobile sync
        };
      };
    });
  };

  const uploadProfilePicture = async (file: File) => {
    if (!user || !storage || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Sync Error',
        description: 'Identity frequency missing. Please sign in again.',
      });
      return;
    }

    setIsUploading(true);
    console.log(`[Visual Sync] Starting high-speed compressed upload for: ${user.uid}`);

    try {
      // 1. Client-Side Compression Handshake
      const compressedBlob = await compressImage(file);

      // 2. Storage Vault Handshake with Metadata
      const timestamp = Date.now();
      const storagePath = `users/${user.uid}/profile_${timestamp}.jpg`;
      const storageRef = ref(storage, storagePath);
      
      const metadata = {
        contentType: 'image/jpeg'
      };

      const result = await uploadBytes(storageRef, compressedBlob, metadata);
      const downloadURL = await getDownloadURL(result.ref);

      // 3. Firestore Sync (Non-Blocking)
      const userSummaryRef = doc(firestore, 'users', user.uid);
      const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      const updateData = { 
        avatarUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      console.log('[Visual Sync] Dispatching compressed identity metadata to Firestore');
      setDocumentNonBlocking(userSummaryRef, updateData, { merge: true });
      setDocumentNonBlocking(userProfileRef, updateData, { merge: true });
      
      toast({
        title: 'Identity Synchronized',
        description: 'Your new persona is now live across the frequency.',
      });
    } catch (error: any) {
      console.error('[Visual Sync] Identity Upload Failed:', error);
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: error.message || 'Could not broadcast your new identity.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProfilePicture };
}
