'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ProfileInitializer } from '@/components/profile-initializer';
import { RoomProvider } from '@/components/room-provider';
import { RoomPresenceManager } from '@/components/room-presence-manager';
import { GlobalPresenceManager } from '@/components/global-presence-manager';
import { GlobalBanGuard } from '@/components/global-ban-guard';
import { LanguageProvider } from '@/components/language-provider';
import { AdBlockWarning } from '@/components/ad-block-warning';
import { ActiveRoomManager } from '@/components/active-room-manager';
import { VoiceActivityProvider } from '@/components/voice-activity-provider';
import type { ReactNode } from 'react';

/**
 * The main providers component for the application.
 * Synchronized with the Global Linguistic Protocol.
 */
export function Providers({ children }: { children: ReactNode }) {
 return (
  <FirebaseClientProvider>
   <LanguageProvider>
    <AdBlockWarning />
    <ProfileInitializer />
    <GlobalPresenceManager />
    <GlobalBanGuard>
     <VoiceActivityProvider>
      <RoomProvider>
       <ActiveRoomManager />
       <RoomPresenceManager />
       {children}
      </RoomProvider>
     </VoiceActivityProvider>
    </GlobalBanGuard>
   </LanguageProvider>
  </FirebaseClientProvider>
 );
}
