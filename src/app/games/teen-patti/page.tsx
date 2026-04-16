'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { 
 ChevronLeft, 
 Volume2, 
 VolumeX, 
 HelpCircle, 
 History, 
 Users,
 LayoutGrid
} from 'lucide-react';
import { GoldCoinIcon, UmmyLogoIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GameResultOverlay, GameWinner } from '@/components/game-result-overlay';

const CHIPS = [
 { value: 10000, label: '10k', color: 'bg-[#00E5FF] border-[#00E5FF]/50 shadow-[#00E5FF]/40' },
 { value: 100000, label: '100k', color: 'bg-[#2196F3] border-[#2196F3]/50 shadow-[#2196F3]/40' },
 { value: 300000, label: '300k', color: 'bg-[#9C27B0] border-[#9C27B0]/50 shadow-[#9C27B0]/40' },
 { value: 1000000, label: '1000k', color: 'bg-[#F44336] border-[#F44336]/50 shadow-[#F44336]/40' },
 { value: 2000000, label: '2000k', color: 'bg-[#795548] border-[#795548]/50 shadow-[#795548]/40' },
 { value: 5000000, label: '5000k', color: 'bg-[#FFD700] border-[#FFD700]/50 shadow-[#FFD700]/40' },
];

const FACTIONS = [
 { id: 'WOLF', label: 'Wolf', bannerUrl: 'https://img.icons8.com/color/144/game-of-thrones-stark.png' },
 { id: 'LION', label: 'Lion', bannerUrl: 'https://img.icons8.com/color/144/game-of-thrones-lannister.png' },
 { id: 'FISH', label: 'Fish', bannerUrl: 'https://img.icons8.com/color/144/game-of-thrones-tully.png' },
];

const CARDS = ['A', 'JOKER', 'B', 'K', 'Q', '10', '9'];

import { TeenPattiGameContent } from '@/components/games/teen-patti-game-content';

export default function TeenPattiGamePage() {
  return (
    <AppLayout fullScreen>
      <TeenPattiGameContent />
    </AppLayout>
  );
}
