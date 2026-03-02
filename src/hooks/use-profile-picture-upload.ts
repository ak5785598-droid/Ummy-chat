'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Elite Visual Identity Sync Hook.
 * Re-engineered with Resumable Upload Protocol for high-fidelity resilience.
 */
export function useProfilePictureUpload() {
  const storage = useStorage();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

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
    console.log(`[Visual Sync] Starting profile upload for: ${user.uid}`);

    try {
      // 1. Storage Upload Handshake
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storagePath = `users/${user.uid}/profile_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Create completion promise
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[Visual Sync] Upload is ${progress}% complete`);
          },
          (error) => {
            console.error('[Visual Sync] Upload Task Error:', error);
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
      const userSummaryRef = doc(firestore, 'users', user.uid);
      const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      const updateData = { 
        avatarUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      setDocumentNonBlocking(userSummaryRef, updateData, { merge: true });
      setDocumentNonBlocking(userProfileRef, updateData, { merge: true });
      
      toast({
        title: 'Identity Synchronized',
        description: 'Your new persona is now live.',
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
