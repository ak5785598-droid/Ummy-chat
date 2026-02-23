'use client';

import Image from 'next/image';
import Link from 'next/link';
import { BarChart2 } from 'lucide-react';
import type { Room } from '@/lib/types';
import { Card } from '@/components/ui/card';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query } from 'firebase/firestore';

interface ChatRoomCardProps {
  room: Room;
  variant?: 'default' | 'modern';
}

export function ChatRoomCard({ room, variant = 'default' }: ChatRoomCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();

  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !user) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id, user]);

  const { data: participants } = useCollection(participantsQuery);
  const onlineCount = participants?.length || 0;

  if (variant === 'modern') {
    return (
      <Link href={`/rooms/${room.id}`} className="group block w-full">
        <div className="space-y-2">
          <div className="relative aspect-square w-full rounded-2xl overflow-hidden shadow-md">
            <Image
              src={room.coverUrl || `https://picsum.photos/seed/${room.id}/400/400`}
              alt={`Cover for room ${room.title}`}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] text-white font-bold">
              <BarChart2 className="h-3 w-3" />
              <span>{onlineCount}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 px-1">
            <span className="text-lg" aria-label="India flag">🇮🇳</span>
            <h3 className="font-bold text-sm truncate flex-1">{room.title}</h3>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/rooms/${room.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 bg-card">
        <div className="p-0">
          <div className="relative h-40 w-full">
            <Image
              src={room.coverUrl || `https://picsum.photos/seed/${room.id}/400/225`}
              alt={`Banner for room ${room.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-headline text-lg truncate font-bold">{room.title}</h3>
          <div className="mt-2 text-sm text-muted-foreground flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-green-500 uppercase tracking-tighter">{onlineCount} Real-time</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
