'use client';

import { use, useMemo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RoomClient } from './room-client';
import { AppLayout } from '@/components/layout/app-layout';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, ShieldAlert, Ghost, Ban, Lock, ArrowRight } from 'lucide-react';
import type { Room } from '@/lib/types';
import { useRoomContext } from '@/components/room-provider';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * Chat Room Entry Page Gateway.
 * DEFERRED SYNC: Hydration mismatch protection for 'bannedUntil'.
 * Synchronized with Global App Loading Background.
 */
export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { setActiveRoom, setIsMinimized } = useRoomContext();
  const { toast } = useToast();
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);
  const loadingBg = config?.appLoadingBackgroundUrl;

  useEffect(() => {
    setIsMounted(true);
    if (!isUserLoading && !currentUser) {
      router.replace('/login');
    }
  }, [isUserLoading, currentUser, router]);

  const banDocRef = useMemoFirebase(() => {
    if (!firestore || !slug || isUserLoading || !currentUser) return null;
    return doc(firestore, 'chatRooms', slug, 'bans', currentUser.uid);
  }, [firestore, slug, isUserLoading, currentUser]);

  const { data: banData, isLoading: isBanLoading } = useDoc(banDocRef);

  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || !slug || isUserLoading || !currentUser) return null;
    return doc(firestore, 'chatRooms', slug);
  }, [firestore, slug, isUserLoading, currentUser]);

  const { data: firestoreRoom, isLoading: isDocLoading } = useDoc(roomDocRef);

  const bannedUntil = useMemo(() => {
    if (!banData || !isMounted) return null;
    const expires = banData.expiresAt?.toDate();
    return (expires && expires > new Date()) ? expires : null;
  }, [banData, isMounted]);

  const activeRoom: Room | null = useMemo(() => {
    if (firestoreRoom) {
      return {
        id: firestoreRoom.id,
        roomNumber: firestoreRoom.roomNumber || '0000',
        slug: firestoreRoom.id,
        title: firestoreRoom.name || 'Frequency',
        topic: firestoreRoom.description || '',
        category: (firestoreRoom.category as any) || 'Chat',
        coverUrl: firestoreRoom.coverUrl || '',
        ownerId: firestoreRoom.ownerId || '',
        moderatorIds: firestoreRoom.moderatorIds || [],
        lockedSeats: firestoreRoom.lockedSeats || [],
        announcement: firestoreRoom.announcement || "Enjoy the vibe!",
        password: firestoreRoom.password || '',
        createdAt: firestoreRoom.createdAt,
        stats: firestoreRoom.stats || { totalGifts: 0, dailyGifts: 0 },
        isChatMuted: firestoreRoom.isChatMuted,
        currentMusicUrl: firestoreRoom.currentMusicUrl,
        maxActiveMics: firestoreRoom.maxActiveMics,
        roomThemeId: firestoreRoom.roomThemeId,
        isSuperMic: firestoreRoom.isSuperMic || false
      } as any;
    }

    return null;
  }, [firestoreRoom]);

  const isOwner = currentUser?.uid === activeRoom?.ownerId;
  const requiresPassword = activeRoom?.password && !isOwner && !isUnlocked;

  useEffect(() => {
    if (activeRoom && !bannedUntil && !requiresPassword && isMounted) {
      setActiveRoom(activeRoom);
      setIsMinimized(false);
    }
  }, [activeRoom, setActiveRoom, setIsMinimized, bannedUntil, requiresPassword, isMounted]);

  const handleVerifyPassword = () => {
    if (passwordInput === activeRoom?.password) {
      setIsUnlocked(true);
      toast({ title: 'Sync Verified', description: 'Synchronizing with private frequency.' });
    } else {
      setPasswordInput('');
      toast({ variant: 'destructive', title: 'Invalid Code', description: 'Incorrect 4-digit password.' });
    }
  };

  if (bannedUntil) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-6 text-center px-6">
          <Ban className="h-12 w-12 text-red-500" />
          <h1 className="text-3xl font-black uppercase italic">Frequency Exclusion</h1>
          <p className="text-muted-foreground">Restricted until {format(bannedUntil, 'MMM d, HH:mm')}</p>
        </div>
      </AppLayout>
    );
  }

  if (isUserLoading || isBanLoading || (!!roomDocRef && isDocLoading) || !isMounted) {
    return (
      <AppLayout fullScreen>
        <div 
          className="flex h-[100dvh] w-full flex-col items-center justify-center space-y-4 bg-black relative"
          style={loadingBg ? { backgroundImage: `url(${loadingBg})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
        >
          <div className="absolute inset-0 bg-black/40" />
          <Loader className="h-10 w-10 animate-spin text-primary relative z-10" />
          <p className="text-[10px] text-white/60 animate-pulse font-black uppercase tracking-widest relative z-10">
            Tuning Frequency...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!activeRoom) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center px-6">
            <Ghost className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
            <h1 className="text-2xl font-black uppercase">Frequency Not Found</h1>
            <button onClick={() => router.push('/rooms')} className="mt-6 bg-primary text-white px-10 py-3 rounded-full font-black uppercase italic">Back to Home</button>
        </div>
      </AppLayout>
    );
  }

  if (requiresPassword) {
    return (
      <AppLayout fullScreen>
        <div className="fixed inset-0 bg-[#FFCC00] z-[1000] flex flex-col items-center justify-center p-8 font-headline">
           <div className="mb-8 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in duration-700">
              <div className="h-20 w-20 bg-white rounded-[1.25rem] flex items-center justify-center shadow-2xl border-4 border-black/5">
                 <Lock className="h-8 w-8 text-black" />
              </div>
              <div className="space-y-1">
                 <h2 className="text-3xl font-black uppercase italic tracking-tighter text-black">{activeRoom.title}</h2>
                 <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/60">Private Frequency Active</p>
              </div>
           </div>

           <div className="w-full max-w-xs space-y-8 animate-in slide-in-from-bottom-10 duration-700">
              <div className="space-y-4 text-center">
                 <Input 
                   type="password"
                   inputMode="numeric"
                   maxLength={4}
                   value={passwordInput}
                   onChange={(e) => setPasswordInput(e.target.value.replace(/\D/g, ''))}
                   onKeyDown={(e) => e.key === 'Enter' && passwordInput.length === 4 && handleVerifyPassword()}
                   className="h-16 bg-white border-none rounded-[1.25rem] shadow-xl text-3xl font-black tracking-[1em] text-center focus:ring-4 focus:ring-black/10 placeholder:text-black/5"
                   placeholder="0000"
                   autoFocus
                 />
                 <p className="text-[10px] font-black uppercase tracking-widest text-black/40">Enter 4-Digit Entry Code</p>
              </div>

              <div className="flex gap-4">
                 <button 
                   onClick={() => router.push('/rooms')}
                   className="flex-1 h-12 rounded-xl bg-white/20 border border-black/10 font-black uppercase italic text-xs hover:bg-white/30 transition-all"
                 >
                    Exit
                 </button>
                 <Button 
                   onClick={handleVerifyPassword}
                   disabled={passwordInput.length < 4}
                   className="flex-[2] h-12 rounded-xl bg-black text-white font-black uppercase italic text-base shadow-2xl hover:scale-[1.02] active:scale-95 transition-all"
                 >
                    Verify Sync <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </div>
           </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideSidebarOnMobile fullScreen>
       <RoomClient room={activeRoom} />
    </AppLayout>
  );
}
