
'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, updateDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Hook to handle profile picture uploads to Firebase Storage and update Firestore.
 * Synchronizes identity across root summary and detailed profile.
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

    try {
      // 1. Upload to Storage
      const storagePath = `users/${user.uid}/profile-picture.jpg`;
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Update Firestore Summary and Detailed documents
      const userSummaryRef = doc(firestore, 'users', user.uid);
      const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      const updateData = { 
        avatarUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      updateDocumentNonBlocking(userSummaryRef, updateData);
      updateDocumentNonBlocking(userProfileRef, updateData);

      toast({
        title: 'Success!',
        description: 'Your profile has been updated globally.',
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
