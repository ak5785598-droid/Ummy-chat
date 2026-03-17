'use client';

import { useEffect } from 'react';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ProfileInitializer } from '@/components/profile-initializer';
import { RoomProvider } from '@/components/room-provider';
import { RoomPresenceManager } from '@/components/room-presence-manager';
import { GlobalPresenceManager } from '@/components/global-presence-manager';
import { GlobalBanGuard } from '@/components/global-ban-guard';
import { LanguageProvider } from '@/components/language-provider';
import type { ReactNode } from 'react';

/**
 * The main providers component for the application.
 */
export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('[PWA Sync] ServiceWorker registration successful with scope: ', registration.scope);
        },
        (err) => {
          console.log('[PWA Sync] ServiceWorker registration failed: ', err);
        }
      );
    }
  }, []);

  return (
    <FirebaseClientProvider>
      <LanguageProvider>
        <ProfileInitializer />
        <GlobalPresenceManager />
        <GlobalBanGuard>
          <RoomProvider>
            <RoomPresenceManager />
            {children}
          </RoomProvider>
        </GlobalBanGuard>
      </LanguageProvider>
    </FirebaseClientProvider>
  );
}
