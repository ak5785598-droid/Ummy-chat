'use client';

import { use, useMemo, useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { RoomClient } from './room-client';
import { AppLayout } from '@/components/layout/app-layout';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { Loader, ShieldAlert } from 'lucide-react';
import type { Room } from '@/lib/types';
import { useRoomContext } from '@/components/room-provider';

/**
 * Chat Room Entry Page Gateway.
 * Ensures rooms are provisioned with sequential numeric IDs (0001+).
 */
export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { setActiveRoom, setIsMinimized } = useRoomContext();
  
  const [initStatus, setInitStatus] = useState<string>('Verifying Session...');
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [hasHandshaked, setHasHandshaked] = useState(false);

  // Authentication Guard
  useEffect(() => {
    if (!isAuthLoading && !currentUser) {
      router.replace('/login');
    }
  }, [isAuthLoading, currentUser, router]);

  // Memoized Document Reference
  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || !slug || isAuthLoading || !currentUser) return null;
    return doc(firestore, 'chatRooms', slug);
  }, [firestore, slug, isAuthLoading, currentUser]);

  const { data: firestoreRoom, isLoading: isDocLoading, error: docError } = useDoc(roomDocRef);

  // Frequency Handshake: Assigns sequential IDs to new rooms
  useEffect(() => {
    const performHandshake = async () => {
      if (!roomDocRef || isAuthLoading || !firestore || !currentUser || isDocLoading) return;

      if (!firestoreRoom && !isProvisioning) {
        setIsProvisioning(true);
        setInitStatus('Provisioning Frequency...');
        const countersRef = doc(firestore, 'appConfig', 'counters');
        
        try {
          const isOfficial = slug === 'official-help-room';
          
          await runTransaction(firestore, async (transaction) => {
            const countersSnap = await transaction.get(countersRef);
            let nextRoomNum = 1;
            
            if (!isOfficial) {
              if (countersSnap.exists()) {
                nextRoomNum = (countersSnap.data().roomCounter || 0) + 1;
              }
              transaction.set(countersRef, { roomCounter: nextRoomNum }, { merge: true });
            }

            const roomNumber = isOfficial ? '0001' : String(nextRoomNum).padStart(4, '0');

            transaction.set(roomDocRef, {
              name: isOfficial ? 'Ummy Official Hub' : `Tribe Frequency`,
              description: isOfficial ? 'Live community and team support.' : 'A new vibe just started.',
              roomNumber,
              ownerId: isOfficial ? 'official-admin' : currentUser.uid,
              category: 'Chat',
              coverUrl: `https://picsum.photos/seed/${slug}/1200/400`,
              announcement: 'Welcome to the frequency!',
              createdAt: serverTimestamp(),
              moderatorIds: [currentUser.uid],
              lockedSeats: [],
              stats: { totalGifts: 0 }
            }, { merge: true });
          });
        } catch (e) {
          console.warn("Handshake delayed:", e);
        } finally {
          setIsProvisioning(false);
          setHasHandshaked(true);
        }
      } else if (firestoreRoom) {
        setHasHandshaked(true);
      }
    };

    performHandshake();
  }, [slug, firestoreRoom, isDocLoading, firestore, currentUser, isProvisioning, roomDocRef, isAuthLoading]);

  // Sync global room context
  useEffect(() => {
    if (firestoreRoom) {
      setActiveRoom({
        id: firestoreRoom.id,
        roomNumber: firestoreRoom.roomNumber,
        slug: firestoreRoom.id,
        title: firestoreRoom.name || 'Frequency',
        topic: firestoreRoom.description || '',
        category: (firestoreRoom.category as any) || 'Chat',
        coverUrl: firestoreRoom.coverUrl || `https://picsum.photos/seed/${firestoreRoom.id}/1200/400`,
        ownerId: firestoreRoom.ownerId,
        moderatorIds: firestoreRoom.moderatorIds || [],
        lockedSeats: firestoreRoom.lockedSeats || [],
        announcement: firestoreRoom.announcement || "Enjoy the vibe!",
        createdAt: firestoreRoom.createdAt,
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
      coverUrl: firestoreRoom.coverUrl || `https://picsum.photos/seed/${firestoreRoom.id}/1200/400`,
      ownerId: firestoreRoom.ownerId,
      moderatorIds: firestoreRoom.moderatorIds || [],
      lockedSeats: firestoreRoom.lockedSeats || [],
      announcement: firestoreRoom.announcement || "Enjoy the vibe!",
      createdAt: firestoreRoom.createdAt,
    } as any;
  }, [firestoreRoom]);

  if (docError) {
     return (
        <AppLayout>
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center px-6">
                <ShieldAlert className="h-16 w-16 text-destructive mb-2" />
                <h1 className="text-2xl font-black uppercase italic">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to access this frequency.</p>
                <button onClick={() => router.push('/rooms')} className="bg-primary text-black font-black uppercase px-8 py-3 rounded-full">Explore Others</button>
            </div>
        </AppLayout>
     );
  }

  const isWaiting = isAuthLoading || (!!roomDocRef && isDocLoading) || isProvisioning || !hasHandshaked;

  if (isWaiting) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-xs text-muted-foreground animate-pulse font-black uppercase tracking-widest">
            {initStatus}
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!activeRoom) {
    notFound();
    return null;
  }

  return (
    <AppLayout>
       <RoomClient room={activeRoom} />
    </AppLayout>
  );
}
