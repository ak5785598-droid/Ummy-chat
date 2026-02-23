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
 * Real-time Room Page.
 * Handles the logic for loading a chat room and initializing the Official Help Hub.
 */
export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const [initStatus, setInitStatus] = useState<string>('Verifying Session...');

  // Redirect to login if auth check finishes and no user is found
  useEffect(() => {
    if (!isAuthLoading) {
      if (!currentUser) {
        router.replace('/login');
      } else {
        setInitStatus('Connecting to Frequency...');
      }
    }
  }, [isAuthLoading, currentUser, router]);

  // Guard: Only fetch document if we have an authenticated user context
  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || !slug || isAuthLoading || !currentUser) return null;
    return doc(firestore, 'chatRooms', slug);
  }, [firestore, slug, isAuthLoading, currentUser]);

  const { data: firestoreRoom, isLoading: isDocLoading, error: docError } = useDoc(roomDocRef);

  // Auto-initialize Official Help Room if it doesn't exist
  useEffect(() => {
    if (slug === 'official-help-room' && !isDocLoading && !firestoreRoom && firestore && currentUser) {
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
        console.error("Hub initialization failed", err);
      });
    }
  }, [slug, isDocLoading, firestoreRoom, firestore, currentUser]);

  // Transform Firestore data into Room type
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

  // Handle Permission or Fetch Errors
  if (docError) {
     return (
        <AppLayout>
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4 text-center px-6">
                <ShieldAlert className="h-16 w-16 text-destructive mb-2" />
                <h1 className="text-2xl font-black uppercase italic">Access Frequency Denied</h1>
                <p className="text-muted-foreground max-w-md">The room ID is invalid or you do not have permission to access this vibe.</p>
                <button onClick={() => router.push('/rooms')} className="bg-primary text-white font-black uppercase px-8 py-3 rounded-full shadow-lg">Back to Explore</button>
            </div>
        </AppLayout>
     );
  }

  // Final check for existence - only trigger if we definitely have a user and ref AND the fetch is done
  if (currentUser && roomDocRef && !isDocLoading && !firestoreRoom && slug !== 'official-help-room') {
    notFound();
  }

  // Loading screen for auth or doc loading
  if (isAuthLoading || (roomDocRef && !firestoreRoom)) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="h-10 w-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground animate-pulse font-mono uppercase tracking-[0.3em] font-bold">{initStatus}</p>
        </div>
      </AppLayout>
    );
  }

  // Ensure we have a user and a room before rendering client
  if (!currentUser || !activeRoom) {
     return (
        <AppLayout>
            <div className="flex h-[60vh] w-full flex-col items-center justify-center">
                <Loader className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs text-muted-foreground mt-4 uppercase font-bold tracking-widest">Finalizing Connection...</p>
            </div>
        </AppLayout>
     );
  }

  return (
    <AppLayout>
       <RoomClient room={activeRoom} />
    </AppLayout>
  );
}
