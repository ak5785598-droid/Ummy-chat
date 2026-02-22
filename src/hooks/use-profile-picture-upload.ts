
'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { useToast } from './use-toast';

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
      // 1. Create a storage reference
      const storagePath = `users/${user.uid}/profile-picture.jpg`;
      const storageRef = ref(storage, storagePath);

      // 2. Upload the file
      const uploadResult = await uploadBytes(storageRef, file);

      // 3. Get the download URL
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 4. Update Firebase Auth profile (for backup/fallback)
      await updateProfile(user, { photoURL: downloadURL });

      // 5. Update Firestore profile document (Primary Source of Truth)
      // Use setDoc with merge: true to handle cases where the document might not exist yet
      const userProfileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      await setDoc(userProfileRef, { 
        avatarUrl: downloadURL,
        updatedAt: new Date().toISOString()
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
