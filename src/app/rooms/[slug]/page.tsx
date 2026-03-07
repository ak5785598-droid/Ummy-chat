'use client';

import { use, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomClient } from './room-client';
import { AppLayout } from '@/components/layout/app-layout';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, ShieldAlert, Ghost, Ban } from 'lucide-react';
import type { Room } from '@/lib/types';
import { useRoomContext } from '@/components/room-provider';
import { format } from 'date-fns';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * Chat Room Entry Page Gateway.
 * Synchronizes identity and ensures all theme/background metadata is passed to the client.
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
    if (!banData) return null;
    const expires = banData.expiresAt?.toDate();
    return (expires && expires > new Date()) ? expires : null;
  }, [banData]);

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
        roomThemeId: firestoreRoom.roomThemeId,
        isSuperMic: firestoreRoom.isSuperMic || false
      } as any;
    }

    if (slug === 'ummy-help-center') {
      return {
        id: 'ummy-help-center',
        roomNumber: '0000',
        slug: 'ummy-help-center',
        title: 'Ummy Official Help',
        topic: 'Ask any app related question quick and fast.',
        category: 'Chat',
        coverUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1000',
        ownerId: CREATOR_ID,
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
    if (activeRoom && !bannedUntil) {
      setActiveRoom(activeRoom);
      setIsMinimized(false);
    }
  }, [activeRoom, setActiveRoom, setIsMinimized, bannedUntil]);

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

  if (isUserLoading || isBanLoading || (!!roomDocRef && isDocLoading && slug !== 'ummy-help-center')) {
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
        <div className="flex h-[60vh] flex-col items-center justify-center text-center px-6">
            <Ghost className="h-12 w-12 text-muted-foreground opacity-40 mb-4" />
            <h1 className="text-2xl font-black uppercase">Frequency Not Found</h1>
            <button onClick={() => router.push('/rooms')} className="mt-6 bg-primary text-white px-10 py-3 rounded-full font-black uppercase italic">Back to Home</button>
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
