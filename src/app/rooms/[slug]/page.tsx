'use client';

import { use, useMemo, useEffect, useState } from 'react';
import { notFound, useRouter } from 'next/navigation';
import { RoomClient } from './room-client';
import { AppLayout } from '@/components/layout/app-layout';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Loader, ShieldAlert } from 'lucide-react';
import type { Room } from '@/lib/types';

/**
 * Chat Room Entry Page Gateway.
 * Hardened to prevent premature 404s and handle official room provisioning with high reliability.
 */
export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  
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

  // Frequency Handshake: Ensures rooms are provisioned or found before ever showing 404
  useEffect(() => {
    const performHandshake = async () => {
      if (!roomDocRef || isAuthLoading || !firestore || !currentUser || isDocLoading) return;

      if (!firestoreRoom && !isProvisioning) {
        setIsProvisioning(true);
        setInitStatus('Handshaking Frequency...');
        try {
          // Automatic provisioning for non-existent rooms or official hub
          const isOfficial = slug === 'official-help-room';
          await setDoc(roomDocRef, {
            name: isOfficial ? 'Ummy Official Hub' : `Tribe ${slug.substring(0, 4)}`,
            description: isOfficial ? 'Live community and team support.' : 'A new vibe just started.',
            ownerId: isOfficial ? 'official-admin' : currentUser.uid,
            category: 'Chat',
            coverUrl: `https://picsum.photos/seed/${slug}/1200/400`,
            announcement: 'Welcome! Enjoy the frequency.',
            createdAt: serverTimestamp(),
            moderatorIds: [currentUser.uid],
            lockedSeats: [],
            stats: { totalGifts: 0 } // Initialize nested object for leaderboard indexing
          }, { merge: true });
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

  const activeRoom: Room | null = useMemo(() => {
    if (!firestoreRoom) return null;
    return {
      id: firestoreRoom.id,
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
                <h1 className="text-2xl font-black uppercase italic">Handshake Denied</h1>
                <p className="text-muted-foreground max-w-md">You do not have permission to access this frequency.</p>
                <button onClick={() => router.push('/rooms')} className="bg-primary text-black font-black uppercase px-8 py-3 rounded-full">Back to Explore</button>
            </div>
        </AppLayout>
     );
  }

  // Robust loading check to prevent 404 flickering while background processes run
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
