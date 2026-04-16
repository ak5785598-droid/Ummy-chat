'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, Volume2, VolumeX, X, Trophy } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { useLudoEngine } from '@/hooks/use-ludo-engine';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { LudoBoard } from '@/components/games/ludo-board';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

import { LudoGameContent } from '@/components/games/ludo-game-content';

export default function LudoGamePage() {
  return (
    <AppLayout fullScreen>
      <Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-[#0a1a4a] font-black text-white uppercase tracking-[0.5em] animate-pulse">Initializing Board...</div>}>
        <LudoGameContent />
      </Suspense>
    </AppLayout>
  );
}
