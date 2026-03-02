'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';
import type { Game } from '@/lib/types';

/**
 * Hook to handle game logo/cover uploads to Firebase Storage and update Firestore.
 * Re-engineered with Resumable Upload Protocol for high-fidelity resilience.
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
    console.log(`[Visual Sync] Starting game logo upload for: ${game.id}`);

    try {
      // 1. Storage Upload Handshake
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storagePath = `games/${game.id}/logo_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      const uploadTask = uploadBytesResumable(storageRef, file);

      // Create completion promise
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log(`[Visual Sync] Game upload is ${progress}% complete`);
          },
          (error) => {
            console.error('[Visual Sync] Game Upload Task Error:', error);
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
      console.error('[Visual Sync] Game Logo Failed:', error);
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
