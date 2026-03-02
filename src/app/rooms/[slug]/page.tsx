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
 */
export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { setActiveRoom, setIsMinimized } = useRoomContext();
  
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.replace('/login');
    }
  }, [isAuthLoading, currentUser, router]);

  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || !slug || isAuthLoading || !currentUser) return null;
    return doc(firestore, 'chatRooms', slug);
  }, [firestore, slug, isAuthLoading, currentUser]);

  const { data: firestoreRoom, isLoading: isDocLoading, error: docError } = useDoc(roomDocRef);

  useEffect(() => {
    if (firestoreRoom) {
      setActiveRoom({
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
        stats: firestoreRoom.stats,
        isChatMuted: firestoreRoom.isChatMuted,
        currentMusicUrl: firestoreRoom.currentMusicUrl,
        maxActiveMics: firestoreRoom.maxActiveMics,
        roomThemeId: firestoreRoom.roomThemeId
      } as any);
      setIsMinimized(false);
    }
  }, [firestoreRoom, setActiveRoom, setIsMinimized]);

  const activeRoom: Room | null = useMemo(() => {
    if (!firestoreRoom) return null;
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
      stats: firestoreRoom.stats,
      isChatMuted: firestoreRoom.isChatMuted,
      currentMusicUrl: firestoreRoom.currentMusicUrl,
      maxActiveMics: firestoreRoom.maxActiveMics,
      roomThemeId: firestoreRoom.roomThemeId
    } as any;
  }, [firestoreRoom]);

  if (docError) {
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

  const isWaiting = isAuthLoading || (!!roomDocRef && isDocLoading);

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
