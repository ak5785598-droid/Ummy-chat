'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * An invisible component that listens for globally emitted 'permission-error' events.
 * High-Fidelity Sync: Instead of throwing (which crashes the app), it triggers a system Toast.
 */
export function FirebaseErrorListener() {
 const { toast } = useToast();

 useEffect(() => {
  const handleError = (error: FirestorePermissionError) => {
   console.error("[Identity Sync] Permission Exception Captured:", error);
   
   // Instead of crashing the React tree, we notify the user gracefully.
   toast({
    variant: 'destructive',
    title: 'Frequency Sync Error',
    description: 'You do not have permission to access this node. Please ensure your identity is verified.',
   });
  };

  errorEmitter.on('permission-error', handleError);

  return () => {
   errorEmitter.off('permission-error', handleError);
  };
 }, [toast]);

 return null;
}
