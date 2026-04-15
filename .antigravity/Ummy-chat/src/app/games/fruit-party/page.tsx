'use client';

import FruitPartyGame from '@/components/games/fruit-party-game';
import { AppLayout } from '@/components/layout/app-layout';

export default function FruitPartyPage() {
 return (
  <AppLayout fullScreen>
   <FruitPartyGame />
  </AppLayout>
 );
}
