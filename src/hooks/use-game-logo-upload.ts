
'use client';

import { useState } from 'react';
import { useStorage, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from './use-toast';
import type { Game } from '@/lib/types';

/**
 * Hook to handle game logo/cover uploads to Firebase Storage and update Firestore.
 * Re-engineered with Slug-Based Identity Sync.
 * Uses the game's slug as the Firestore document ID to ensure absolute cross-portal synchronization.
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
    console.log(`[Visual Sync] Starting high-fidelity game logo upload for: ${game.slug}`, file.name);

    try {
      // 1. Storage Upload Handshake
      const timestamp = Date.now();
      const fileExtension = file.name.split('.').pop() || 'jpg';
      const storagePath = `games/${game.slug}/cover_${timestamp}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);
      
      const metadata = {
        contentType: file.type || 'image/jpeg'
      };
      
      const result = await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(result.ref);

      // 2. Firestore Atomic Sync (Slug-Based Document ID)
      // Standardizing on game.slug as the document ID for absolute routing stability.
      const gameRef = doc(firestore, 'games', game.slug);
      
      const updateData = { 
        id: game.slug, // Synchronize ID field with the slug
        title: game.title || (game as any).name || 'Untitled Game', // PROTOCOL GUARD: Prevents 'undefined' errors
        slug: game.slug,
        coverUrl: downloadURL,
        updatedAt: serverTimestamp()
      };

      console.log(`[Visual Sync] Dispatching game logo metadata to Firestore path: games/${game.slug}`);
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
