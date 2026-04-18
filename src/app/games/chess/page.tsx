'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
 Move, Volume2, VolumeX, HelpCircle, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useChessEngine } from '@/hooks/use-chess-engine';

import { ChessGameContent } from '@/components/games/chess-game-content';

export default function ChessGamePage() {
  return (
    <Suspense fallback={<div className="h-screen w-full bg-zinc-950 flex items-center justify-center text-white/20 font-black italic">LOADING ARENA...</div>}>
      <ChessGameContent />
    </Suspense>
  );
}
