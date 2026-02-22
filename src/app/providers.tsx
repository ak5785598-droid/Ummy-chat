'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ProfileInitializer } from '@/components/profile-initializer';
import type { ReactNode } from 'react';

/**
 * The main providers component for the application.
 * Includes Firebase context and the Real-time Profile Initializer.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <FirebaseClientProvider>
      <ProfileInitializer />
      {children}
    </FirebaseClientProvider>
  );
}