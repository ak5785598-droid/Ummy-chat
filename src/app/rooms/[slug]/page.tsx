'use client';

import { use, useMemo } from 'react';
import { notFound } from 'next/navigation';
import { RoomClient } from './room-client';
import { AppLayout } from '@/components/layout/app-layout';
import { useDoc, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader } from 'lucide-react';
import type { Room } from '@/lib/types';

export default function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const firestore = useFirestore();
  const { user: currentUser, isLoading: isUserLoading } = useUser();

  // Fetch real room data from Firestore using slug as ID
  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || !slug) return null;
    return doc(firestore, 'chatRooms', slug);
  }, [firestore, slug]);

  const { data: firestoreRoom, isLoading: isDocLoading } = useDoc(roomDocRef);

  // Transform Firestore data into Room type
  const activeRoom: Room | null = useMemo(() => {
    if (!firestoreRoom) return null;
    return {
      id: firestoreRoom.id,
      slug: firestoreRoom.id,
      title: firestoreRoom.name || 'Untitled Room',
      topic: firestoreRoom.description || 'No topic set',
      category: (firestoreRoom.category as any) || 'Chat',
      coverUrl: `https://picsum.photos/seed/${firestoreRoom.id}/1200/400`,
      ownerId: firestoreRoom.ownerId,
      moderatorIds: firestoreRoom.moderatorIds || [],
      lockedSeats: firestoreRoom.lockedSeats || [],
      announcement: firestoreRoom.announcement || "Welcome! Be respectful and enjoy the group vibe.",
      createdAt: firestoreRoom.createdAt,
    } as any;
  }, [firestoreRoom]);

  const isLoading = isUserLoading || isDocLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  if (!activeRoom) {
    notFound();
  }

  return (
    <div className="bg-[#1a1a2e] min-h-screen">
       <RoomClient room={activeRoom!} />
    </div>
  );
}
