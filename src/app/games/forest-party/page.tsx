'use client';

import ForestPartyGame from '@/components/games/forest-party-game';
import { AppLayout } from '@/components/layout/app-layout';
import { CompactRoomView } from '@/components/compact-room-view';
import { useRouter } from 'next/navigation';

export default function ForestPartyPage() {
 const router = useRouter();

 return (
  <AppLayout fullScreen>
   <div className="h-screen w-full relative overflow-hidden">
    <CompactRoomView />
    <ForestPartyGame onBack={() => router.back()} />
   </div>
  </AppLayout>
 );
}
