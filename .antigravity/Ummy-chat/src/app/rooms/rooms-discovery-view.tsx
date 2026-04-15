'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import RoomsExplorer from './rooms-explorer';

/**
 * THE UNIFIED DISCOVERY REALITY.
 * This component brings together the Layout and the Content into one 
 * Client-Side Only bundle. This is the only way to ensure 100% 
 * hydration stability in highly dynamic Firebase apps.
 */
export default function RoomsDiscoveryView() {
  return (
    <AppLayout>
      <RoomsExplorer />
      <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
    </AppLayout>
  );
}
