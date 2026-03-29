'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * AIPerformanceShield - A global monitoring system handled by Ummy AI.
 * It listens for sync errors and network health to keep the app running smoothly.
 */
export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    // 1. FIRESTORE ERROR MONITOR
    const handleError = (error: FirestorePermissionError) => {
      console.error("[Performance Shield] Sync Exception:", error);
      toast({
        variant: 'destructive',
        title: 'Ummy AI Shield',
        description: 'Sync me thoda issue hai, but don\'t worry! Main sab handle kar rahi hoon. 🛡️',
      });
    };

    // 2. NETWORK CONNECTIVITY MONITOR
    const handleOnline = () => {
      toast({
        title: 'Ummy AI Online',
        description: 'Aapka internet wapas aa gaya hai! Happy chatting! ✨',
      });
    };

    const handleOffline = () => {
      toast({
        variant: 'destructive',
        title: 'Ummy AI Alert',
        description: 'Connection slow hai ya toot gaya hai. Please check karein! 📶',
      });
    };

    errorEmitter.on('permission-error', handleError);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      errorEmitter.off('permission-error', handleError);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  return null;
}
