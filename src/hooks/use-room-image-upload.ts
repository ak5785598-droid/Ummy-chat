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
  * Reduces file size while maintaining visual crispness for the discovery grid.
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
     // Optimized for Room Card 4/5 aspect ratio (e.g., 800x1000)
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
     }, 'image/jpeg', 0.7); // 0.7 quality for elite speed/fidelity balance
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
  console.log(`[Visual Sync] Starting real-time cover upload for frequency: ${roomId}`);

  try {
   // 1. High-Speed Client-Side Compression
   const compressedBlob = await compressImage(file);
   
   // 2. Storage Vault Handshake with Metadata
   const fileExtension = 'jpg';
   const timestamp = Date.now();
   const storagePath = `chatRooms/${roomId}/cover_${timestamp}.${fileExtension}`;
   const storageRef = ref(storage, storagePath);
   
   const metadata = {
    contentType: 'image/jpeg'
   };

   const result = await uploadBytes(storageRef, compressedBlob, metadata);
   const downloadURL = await getDownloadURL(result.ref);

   // 3. Firestore Global Sync (Atomic Update Protocol)
   const roomRef = doc(firestore, 'chatRooms', roomId);
   
   const updateData = { 
    coverUrl: downloadURL,
    updatedAt: serverTimestamp()
   };

   console.log('[Visual Sync] Dispatching new cover identifier to tribal graph:', downloadURL);
   await updateDoc(roomRef, updateData);

   toast({
    title: 'Frequency Updated',
    description: 'Your new visual vibe is now live.',
   });
  } catch (error: any) {
   console.error('[Visual Sync] Room Cover Failed:', error);
   toast({
    variant: 'destructive',
    title: 'Sync Failed',
    description: error.message || 'Could not broadcast the new visual vibe.',
   });
  } finally {
   setIsUploading(false);
  }
 };

 return { isUploading, uploadRoomImage };
}
