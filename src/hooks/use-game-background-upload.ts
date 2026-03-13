'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';
import type { Game } from '@/lib/types';

/**
 * Hook to handle game background uploads to Firebase Storage and update Firestore.
 * Strictly restricted to Admin/Creator identity.
 */
export function useGameBackgroundUpload() {
  const storage = useStorage();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadGameBackground = async (game: Game, file: File) => {
    if (!user || !storage || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authorization context missing.',
      });
      return;
    }

    setIsUploading(true);
    console.log(`[Visual Sync] Starting high-fidelity game background upload for: ${game.slug}`);

    try {
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storagePath = `games/${game.slug}/background_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      const metadata = {
        contentType: file.type || 'image/jpeg'
      };
      
      const result = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(result.ref);

      const gameRef = doc(firestore, 'games', game.slug);
      
      const updateData = { 
        backgroundUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      setDocumentNonBlocking(gameRef, updateData, { merge: true });

      toast({
        title: 'Game Background Updated!',
        description: 'The new visual theme is now live for all tribe members.',
      });
    } catch (error: any) {
      console.error('[Visual Sync] Game Background Failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Check Admin permissions and try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadGameBackground };
}
