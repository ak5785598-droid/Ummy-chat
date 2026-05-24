'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { TeenPattiGameContent } from '@/components/games/teen-patti-game-content';

export default function TeenPattiPage() {
  return (
    <AppLayout fullScreen>
      <TeenPattiGameContent />
    </AppLayout>
  );
}
