'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase, addDocumentNonBlocking, useCollection } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { 
 ChevronLeft, 
 Volume2, 
 VolumeX, 
 HelpCircle, 
 Trophy, 
 X,
 History,
 Move,
 ChevronDown,
 Users
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GameResultOverlay } from '@/components/game-result-overlay';
import Image from 'next/image';

const NUMBERS = [
 0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const RED_NUMBERS = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];

const CHIPS = [
 { value: 100, label: '100', color: 'bg-blue-500' },
 { value: 5000, label: '5K', color: 'bg-green-500' },
 { value: 50000, label: '50K', color: 'bg-yellow-500' },
 { value: 100000, label: '100K', color: 'bg-orange-500' },
 { value: 500000, label: '500K', color: 'bg-red-500' },
 { value: 1000000, label: '1M', color: 'bg-pink-500' },
 { value: 100000000, label: '100M', color: 'bg-purple-500' },
 { value: 500000000, label: '500M', color: 'bg-cyan-500' },
];

const BET_OPTIONS = [
 { id: '0', label: '0', multiplier: 36, color: 'bg-emerald-600' },
 { id: '1-12', label: '1-12', multiplier: 3, color: 'bg-emerald-800' },
 { id: '13-24', label: '13-24', multiplier: 3, color: 'bg-emerald-800' },
 { id: '25-36', label: '25-36', multiplier: 3, color: 'bg-emerald-800' },
 { id: 'red', label: 'Red', multiplier: 2, color: 'bg-red-600' },
 { id: 'black', label: 'Black', multiplier: 2, color: 'bg-slate-900' },
 { id: 'single', label: 'Single', multiplier: 2, color: 'bg-emerald-700' },
 { id: 'double', label: 'Double', multiplier: 2, color: 'bg-emerald-700' },
];

import { RouletteGameContent } from '@/components/games/roulette-game-content';

export default function RoulettePage() {
  return (
    <AppLayout fullScreen>
      <RouletteGameContent />
    </AppLayout>
  );
}
