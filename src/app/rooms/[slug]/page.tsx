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
 * Chat Room Entry Page.
 * Handles authentication checks, room data fetching, and official room provisioning.
 */
export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const [initStatus, setInitStatus] = useState<string>('Verifying Session...');
  const [hasActuallyLoadedOnce, setHasActuallyLoadedOnce] = useState(false);

  // Authentication Guard
  useEffect(() => {
    if (!isAuthLoading) {
      if (!currentUser) {
        router.replace('/login');
      } else {
        setInitStatus('Connecting to Frequency...');
      }
    }
  }, [isAuthLoading, currentUser, router]);

  // Memoized Document Reference
  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || !slug || isAuthLoading || !currentUser) return null;
    return doc(firestore, 'chatRooms', slug);
  }, [firestore, slug, isAuthLoading, currentUser]);

  const { data: firestoreRoom, isLoading: isDocLoading, error: docError } = useDoc(roomDocRef);

  // Verification Logic: Only conclude loading is finished after Firestore responds
  useEffect(() => {
    if (!isDocLoading && !isAuthLoading && roomDocRef) {
      // Small delay to ensure state batching is finished before showing 404
      const timer = setTimeout(() => {
        setHasActuallyLoadedOnce(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isDocLoading, isAuthLoading, roomDocRef]);

  // Provision official room if it doesn't exist
  useEffect(() => {
    if (slug === 'official-help-room' && hasActuallyLoadedOnce && !firestoreRoom && firestore && currentUser) {
      setInitStatus('Provisioning Official Hub...');
      const officialRef = doc(firestore, 'chatRooms', 'official-help-room');
      setDoc(officialRef, {
        name: 'Ummy Official Help Room',
        description: 'Meet the community and get live support from the official team.',
        ownerId: 'official-admin',
        category: 'Popular',
        coverUrl: 'https://picsum.photos/seed/official-help/1200/400',
        announcement: 'Welcome to Ummy! Be respectful and enjoy the group vibe. Official support is active here.',
        createdAt: serverTimestamp(),
        moderatorIds: ['official-admin'],
        lockedSeats: []
      }, { merge: true }).catch(err => {
        console.warn("Hub initialization failed", err);
      });
    }
  }, [slug, firestoreRoom, firestore, currentUser, hasActuallyLoadedOnce]);

  const activeRoom: Room | null = useMemo(() => {
    if (!firestoreRoom) return null;
    return {
      id: firestoreRoom.id,
      slug: firestoreRoom.id,
      title: firestoreRoom.name || 'Untitled Room',
      topic: firestoreRoom.description || 'No topic set',
      category: (firestoreRoom.category as any) || 'Chat',
      coverUrl: firestoreRoom.coverUrl || `https://picsum.photos/seed/${firestoreRoom.id}/1200/400`,
      ownerId: firestoreRoom.ownerId,
      moderatorIds: firestoreRoom.moderatorIds || [],
      lockedSeats: firestoreRoom.lockedSeats || [],
      announcement: firestoreRoom.announcement || "Welcome! Be respectful and enjoy the group vibe.",
      createdAt: firestoreRoom.createdAt,
    } as any;
  }, [firestoreRoom]);

  // Permission/Security Error Display
  if (docError) {
     return (
        <AppLayout>
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center px-6">
                <ShieldAlert className="h-16 w-16 text-destructive mb-2" />
                <h1 className="text-2xl font-black uppercase italic">Access Frequency Denied</h1>
                <p className="text-muted-foreground max-w-md">The room ID is invalid or you do not have permission to access this vibe.</p>
                <button 
                  onClick={() => router.push('/rooms')} 
                  className="bg-primary text-black font-black uppercase px-8 py-3 rounded-full shadow-lg"
                >
                  Back to Explore
                </button>
            </div>
        </AppLayout>
     );
  }

  // Loading State Guard: Wait for definitive response
  if (!hasActuallyLoadedOnce || (slug === 'official-help-room' && !firestoreRoom)) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse font-mono uppercase tracking-[0.3em] font-bold">
            {initStatus}
          </p>
        </div>
      </AppLayout>
    );
  }

  // Final 404 Guard: Only trigger after verified loading completion
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
