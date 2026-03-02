'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';
import type { Game } from '@/lib/types';

/**
 * Hook to handle game logo/cover uploads to Firebase Storage and update Firestore.
 * Synchronized with the high-fidelity non-blocking protocol.
 */
export function useGameLogoUpload() {
  const storage = useStorage();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadGameLogo = async (game: Game, file: File) => {
    if (!user || !storage || !firestore) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Authorization context missing.',
      });
      return;
    }

    setIsUploading(true);

    try {
      // 1. Storage Upload
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storagePath = `games/${game.id}/logo_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      const uploadResult = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(uploadResult.ref);

      // 2. Firestore Sync (Non-Blocking)
      const gameRef = doc(firestore, 'games', game.id);
      
      const updateData = { 
        id: game.id,
        title: game.title,
        slug: game.slug,
        coverUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      setDocumentNonBlocking(gameRef, updateData, { merge: true });

      toast({
        title: 'Game Logo Updated!',
        description: 'The new visual identity is now live across the frequency.',
      });
    } catch (error: any) {
      console.error('Error uploading game logo:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error.message || 'Check Admin permissions and try again.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return { isUploading, uploadGameLogo };
}
