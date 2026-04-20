'use client';

import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ProfileInitializer } from '@/components/profile-initializer';
import { useBackButtonHandler } from '@/hooks/use-back-button-handler';
import { RoomProvider } from '@/components/room-provider';
import { RoomPresenceManager } from '@/components/room-presence-manager';
import { GlobalPresenceManager } from '@/components/global-presence-manager';
import { GlobalBanGuard } from '@/components/global-ban-guard';
import { LanguageProvider } from '@/components/language-provider';
import { AdBlockWarning } from '@/components/ad-block-warning';
import { ActiveRoomManager } from '@/components/active-room-manager';
import { VoiceActivityProvider } from '@/components/voice-activity-provider';
import { FloatingRoomOverlay } from '@/components/floating-room-overlay';
import type { ReactNode } from 'react';

/**
 * THE ULTIMATE STABLE PROVIDER STACK.
 * Simplified for maximum React 18 compatibility.
 */
export function Providers({ children }: { children: ReactNode }) {
  useBackButtonHandler();
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
       <FloatingRoomOverlay />
       {children}
      </RoomProvider>
     </VoiceActivityProvider>
    </GlobalBanGuard>
   </LanguageProvider>
  </FirebaseClientProvider>
 );
}
