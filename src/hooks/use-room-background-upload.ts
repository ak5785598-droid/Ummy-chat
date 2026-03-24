'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';

/**
 * Elite Room Background Sync Hook.
 * Optimized for high-resolution (2000px) environmental assets.
 * Utilizes 0.8 quality compression for the perfect balance of visual fidelity and sync speed.
 */
export function useRoomBackgroundUpload(roomId: string) {
 const storage = useStorage();
 const firestore = useFirestore();
 const { user } = useUser();
 const { toast } = useToast();
 const [isUploading, setIsUploading] = useState(false);

 const compressBackground = (file: File): Promise<Blob> => {
  return new Promise((resolve) => {
   const reader = new FileReader();
   reader.readAsDataURL(file);
   reader.onload = (event) => {
    const img = new Image();
    img.src = event.target?.result as string;
    img.onload = () => {
     const canvas = document.createElement('canvas');
     const MAX_WIDTH = 2000;
     let width = img.width;
     let height = img.height;

     if (width > MAX_WIDTH) {
      height *= MAX_WIDTH / width;
      width = MAX_WIDTH;
     }
     
     canvas.width = width;
     canvas.height = height;
     const ctx = canvas.getContext('2d');
     ctx?.drawImage(img, 0, 0, width, height);
     canvas.toBlob((blob) => {
      resolve(blob || file);
     }, 'image/jpeg', 0.8);
    };
   };
  });
 };

 const uploadBackground = async (file: File) => {
  if (!user || !storage || !firestore || !roomId) {
   toast({ variant: 'destructive', title: 'Sync Error', description: 'Room frequency context missing.' });
   return;
  }

  setIsUploading(true);
  console.log(`[Visual Sync] Dispatching new background asset for room: ${roomId}`);

  try {
   const compressedBlob = await compressBackground(file);
   const timestamp = Date.now();
   const storagePath = `chatRooms/${roomId}/background_${timestamp}.jpg`;
   const storageRef = ref(storage, storagePath);
   
   const result = await uploadBytes(storageRef, compressedBlob, { contentType: 'image/jpeg' });
   const downloadURL = await getDownloadURL(result.ref);

   const roomRef = doc(firestore, 'chatRooms', roomId);
   setDocumentNonBlocking(roomRef, { 
    backgroundUrl: downloadURL,
    roomThemeId: 'custom', // Setting to 'custom' to prioritize the URL
    updatedAt: serverTimestamp()
   }, { merge: true });

   toast({ title: 'Background Synchronized', description: 'Your custom frequency is now live.' });
  } catch (error: any) {
   console.error('[Visual Sync] Background Failed:', error);
   toast({ variant: 'destructive', title: 'Sync Failed', description: error.message });
  } finally {
   setIsUploading(false);
  }
 };

 return { isUploading, uploadBackground };
}
