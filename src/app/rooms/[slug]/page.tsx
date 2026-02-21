'use client';

import { use, useMemo } from 'react';
import { getRoomBySlug } from '@/lib/mock-data';
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

  // 1. Try mock data first
  const mockRoom = getRoomBySlug(slug);

  // 2. If not in mock, try Firestore (slug is the document ID for custom rooms)
  const roomDocRef = useMemoFirebase(() => {
    if (!firestore || mockRoom) return null;
    return doc(firestore, 'chatRooms', slug);
  }, [firestore, slug, mockRoom]);

  const { data: firestoreRoom, isLoading: isDocLoading } = useDoc(roomDocRef);

  // Transform Firestore data into Room type
  const activeRoom: Room | null = useMemo(() => {
    if (mockRoom) return mockRoom;
    if (firestoreRoom) {
      return {
        id: firestoreRoom.id,
        slug: firestoreRoom.id,
        title: firestoreRoom.name || 'Untitled Room',
        topic: firestoreRoom.description || 'No topic set',
        category: (firestoreRoom.category as any) || 'Chat',
        coverUrl: `https://picsum.photos/seed/${firestoreRoom.id}/1200/400`,
        ownerId: firestoreRoom.ownerId, // Fixed: ensure ownerId is passed
        participants: [], // New rooms start empty
        messages: [],
      };
    }
    return null;
  }, [mockRoom, firestoreRoom]);

  // Combined loading state
  const isLoading = isUserLoading || (isDocLoading && !mockRoom);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex h-[50vh] w-full items-center justify-center">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // If loading is done and we still have no room
  if (!activeRoom && !isLoading) {
    notFound();
  }

  // Final render
  return (
    <AppLayout>
      <RoomClient room={activeRoom!} />
    </AppLayout>
  );
}
