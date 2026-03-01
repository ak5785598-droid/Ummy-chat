
'use client';

import { use, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RoomClient } from './room-client';
import { AppLayout } from '@/components/layout/app-layout';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader, ShieldAlert, Ghost, Clock } from 'lucide-react';
import type { Room } from '@/lib/types';
import { useRoomContext } from '@/components/room-provider';
import { format } from 'date-fns';

/**
 * Chat Room Entry Page Gateway.
 * Implements the 1-Hour Ban Security Protocol.
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

  const banDocRef = useMemoFirebase(() => {
    if (!firestore || !slug || !currentUser) return null;
    return doc(firestore, 'chatRooms', slug, 'bans', currentUser.uid);
  }, [firestore, slug, currentUser]);

  const { data: firestoreRoom, isLoading: isDocLoading, error: docError } = useDoc(roomDocRef);
  const { data: banData, isLoading: isBanLoading } = useDoc(banDocRef);

  const activeBan = useMemo(() => {
    if (!banData || !banData.expiresAt) return null;
    const expiry = banData.expiresAt.toDate();
    return expiry > new Date() ? expiry : null;
  }, [banData]);

  useEffect(() => {
    if (firestoreRoom && !activeBan) {
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
      } as any);
      setIsMinimized(false);
    }
  }, [firestoreRoom, activeBan, setActiveRoom, setIsMinimized]);

  const activeRoom: Room | null = useMemo(() => {
    if (!firestoreRoom || activeBan) return null;
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
    } as any;
  }, [firestoreRoom, activeBan]);

  if (activeBan) {
    return (
      <AppLayout>
        <div className="flex h-[70vh] flex-col items-center justify-center space-y-8 text-center px-8 animate-in fade-in duration-700">
          <div className="relative">
            <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full" />
            <ShieldAlert className="h-24 w-24 text-red-500 relative z-10" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-black uppercase tracking-tighter text-gray-900">Frequency Blocked</h1>
            <p className="text-muted-foreground font-body text-xl max-w-sm">
              You have been temporarily removed from this frequency by a Manager.
            </p>
          </div>
          <div className="bg-red-50 p-6 rounded-[2rem] border-2 border-red-100 flex items-center gap-4 shadow-sm">
            <Clock className="h-6 w-6 text-red-500" />
            <div className="text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Sync Restored At</p>
              <p className="text-lg font-black text-red-600 italic">{format(activeBan, 'HH:mm:ss')} (Local Time)</p>
            </div>
          </div>
          <button 
            onClick={() => router.push('/rooms')} 
            className="w-full max-w-xs h-16 bg-primary text-white font-black uppercase text-lg rounded-[1.5rem] shadow-xl hover:scale-105 active:scale-95 transition-transform"
          >
            Explore Other Frequencies
          </button>
        </div>
      </AppLayout>
    );
  }

  if (docError) {
     return (
        <AppLayout>
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center px-6">
                <ShieldAlert className="h-16 w-16 text-destructive mb-2" />
                <h1 className="text-2xl font-black uppercase italic">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to access this frequency or you have been banned.</p>
                <button onClick={() => router.push('/rooms')} className="bg-primary text-black font-black uppercase px-8 py-3 rounded-full">Explore Others</button>
            </div>
        </AppLayout>
     );
  }

  const isWaiting = isAuthLoading || (!!roomDocRef && isDocLoading) || isBanLoading;

  if (isWaiting) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse font-black uppercase tracking-widest">
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
            <h1 className="text-3xl font-black uppercase italic tracking-tighter">Frequency Not Found</h1>
            <p className="text-muted-foreground max-w-xs font-body text-lg">This tribe has disbanded or the frequency has been terminated by an Admin.</p>
            <button onClick={() => router.push('/rooms')} className="bg-primary text-white font-black uppercase italic tracking-widest text-xs px-10 py-4 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform">Back to Home</button>
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
