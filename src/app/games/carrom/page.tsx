'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Trophy, 
  X,
  Plus,
  Play,
  Settings,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useCarromEngine } from '@/hooks/use-carrom-engine';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * High-Fidelity Carrom Master.
 * Matches the requested screenshots for loading, lobby, and core gameplay.
 */
import { CarromGameContent } from '@/components/games/carrom-game-content';

export default function CarromGamePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-[#1A0B2E] flex items-center justify-center font-black text-white uppercase tracking-[0.5em] animate-pulse">Initializing Board...</div>}>
      <CarromGameContent />
    </Suspense>
  );
}
