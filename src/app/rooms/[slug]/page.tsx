'use client';

import { use, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomClient } from './room-client';
import { AppLayout } from '@/components/layout/app-layout';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, ShieldAlert, Ghost } from 'lucide-react';
import type { Room } from '@/lib/types';
import { useRoomContext } from '@/components/room-provider';

/**
 * Chat Room Entry Page Gateway.
 * Manages identity synchronization and room metadata retrieval.
 * Includes a Permanent Protocol for the Official Help Desk.
 */
export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { setActiveRoom, setIsMinimized } = useRoomContext();
  
  useEffect(() => {
    if (!isUserLoading && !currentUser) {
      router.replace('/login');
    }
  }, [isUserLoading, currentUser, router]);

  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || !slug || isUserLoading || !currentUser) return null;
    return doc(firestore, 'chatRooms', slug);
  }, [firestore, slug, isUserLoading, currentUser]);

  const { data: firestoreRoom, isLoading: isDocLoading, error: docError } = useDoc(roomDocRef);

  // Elite Permanent Fallback Protocol: Ensures Ummy Help Desk is never "Disbanded"
  const activeRoom: Room | null = useMemo(() => {
    if (firestoreRoom) {
      return {
        id: firestoreRoom.id,
        roomNumber: firestoreRoom.roomNumber,
        slug: firestoreRoom.id,
        title: firestoreRoom.name || 'Frequency',
        topic: firestoreRoom.description || '',
        category: (firestoreRoom.category as any) || 'Chat',
        coverUrl: firestoreRoom.coverUrl || '',
        ownerId: firestoreRoom.ownerId,
        moderatorIds: firestoreRoom.moderatorIds || [],
        lockedSeats: firestoreRoom.lockedSeats || [],
        announcement: firestoreRoom.announcement || "Enjoy the vibe!",
        createdAt: firestoreRoom.createdAt,
        stats: firestoreRoom.stats || { totalGifts: 0, dailyGifts: 0 },
        isChatMuted: firestoreRoom.isChatMuted,
        currentMusicUrl: firestoreRoom.currentMusicUrl,
        maxActiveMics: firestoreRoom.maxActiveMics,
        roomThemeId: firestoreRoom.roomThemeId
      } as any;
    }

    // Return hardcoded metadata for the official support portal if DB entry is missing
    if (slug === 'ummy-help-center') {
      return {
        id: 'ummy-help-center',
        roomNumber: '0000',
        slug: 'ummy-help-center',
        title: 'Ummy Official Help',
        topic: 'Ask any app related question quick and fast.',
        category: 'Chat',
        coverUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1000',
        ownerId: 'official-support-bot',
        moderatorIds: [],
        lockedSeats: [],
        announcement: 'Welcome to official support! How can we help you today?',
        createdAt: new Date(),
        participantCount: 0,
        stats: { totalGifts: 0, dailyGifts: 0 },
        maxActiveMics: 9,
        roomThemeId: 'royal'
      } as any;
    }

    return null;
  }, [firestoreRoom, slug]);

  useEffect(() => {
    if (activeRoom) {
      setActiveRoom(activeRoom);
      setIsMinimized(false);
    }
  }, [activeRoom, setActiveRoom, setIsMinimized]);

  if (docError && slug !== 'ummy-help-center') {
     return (
        <AppLayout>
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center px-6">
                <ShieldAlert className="h-16 w-16 text-destructive mb-2" />
                <h1 className="text-2xl font-black uppercase tracking-tighter">Access Denied</h1>
                <p className="text-muted-foreground font-body text-base">You do not have permission to access this frequency.</p>
                <button onClick={() => router.push('/rooms')} className="bg-primary text-white font-black uppercase tracking-widest text-xs px-8 py-3 rounded-full shadow-lg">Explore Others</button>
            </div>
        </AppLayout>
     );
  }

  const isWaiting = isUserLoading || (!!roomDocRef && isDocLoading && slug !== 'ummy-help-center');

  if (isWaiting) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] text-muted-foreground animate-pulse font-black uppercase tracking-widest">
            Tuning Frequency...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!activeRoom) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-6 text-center px-6 animate-in fade-in duration-700">
            <div className="h-24 w-24 bg-secondary/20 rounded-full flex items-center justify-center"><Ghost className="h-12 w-12 text-muted-foreground opacity-40" /></div>
            <h1 className="text-3xl font-black uppercase tracking-tighter">Frequency Not Found</h1>
            <p className="text-muted-foreground max-w-xs font-body text-lg">This tribe has disbanded or the frequency has been terminated by an Admin.</p>
            <button onClick={() => router.push('/rooms')} className="bg-primary text-white font-black uppercase tracking-widest text-xs px-10 py-4 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Back to Home</button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideSidebarOnMobile>
       <RoomClient room={activeRoom} />
    </AppLayout>
  );
}
