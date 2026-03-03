
'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';
import type { Game } from '@/lib/types';

/**
 * Hook to handle game logo/cover uploads to Firebase Storage and update Firestore.
 * Re-engineered with high-speed direct upload protocol and Atomic Merge reliability.
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
    console.log(`[Visual Sync] Starting game logo upload for: ${game.id}`, file.name);

    try {
      // 1. Storage Upload Handshake
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storagePath = `games/${game.id}/logo_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      const result = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(result.ref);

      // 2. Firestore Sync (Atomic Merge Protocol)
      const gameRef = doc(firestore, 'games', game.id);
      
      const updateData = { 
        coverUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      console.log('[Visual Sync] Dispatching game logo metadata to Firestore via Atomic Merge');
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
