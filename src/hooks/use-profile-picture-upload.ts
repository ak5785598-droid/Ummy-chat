'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Hook to handle profile picture uploads to Firebase Storage and update Firestore.
 * Ensures the app's internal DP is isolated from the external Auth provider (Google/Phone).
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
        title: 'Error',
        description: 'You must be logged in to upload a picture.',
      });
      return;
    }

    setIsUploading(true);
    toast({ title: 'Uploading...', description: 'Please wait while we update your DP.' });

    try {
      // 1. Upload to Storage
      const storagePath = `users/${user.uid}/profile-picture.jpg`;
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Update Firestore ONLY (Source of Truth)
      // We explicitly DO NOT call updateProfile(user, { photoURL }) to ensure
      // the app identity never reflects back to the real Gmail/Google account.
      const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      await setDoc(userProfileRef, { 
        avatarUrl: downloadURL,
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({
        title: 'Success!',
        description: 'Your profile picture has been updated.',
      });
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Could not upload your new picture.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadProfilePicture };
}
