'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';
import type { Room } from '@/lib/types';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';

interface ChatRoomCardProps {
  room: Room;
}

export function ChatRoomCard({ room }: ChatRoomCardProps) {
  const firestore = useFirestore();

  // REAL-TIME PARTICIPANT COUNT
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id]);

  const { data: participants } = useCollection(participantsQuery);
  const onlineCount = participants?.length || 0;

  return (
    <Link href={`/rooms/${room.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 bg-card">
        <CardHeader className="p-0">
          <div className="relative h-40 w-full">
            <Image
              src={room.coverUrl || `https://picsum.photos/seed/${room.id}/400/225`}
              alt={room.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              data-ai-hint="abstract vibrant"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <CardTitle className="font-headline text-lg truncate">{room.title}</CardTitle>
          <Badge variant="outline" className="mt-2 font-normal truncate max-w-full opacity-70">
            {room.topic || 'No topic set'}
          </Badge>
        </CardContent>
        <CardFooter className="p-4 pt-0 text-sm text-muted-foreground flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="font-bold text-green-500 uppercase tracking-tighter">{onlineCount} Real-time</span>
            </div>
            <span className="text-[10px] uppercase font-bold opacity-30">{room.category}</span>
        </CardFooter>
      </Card>
    </Link>
  );
}
