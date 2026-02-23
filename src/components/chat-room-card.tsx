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

/**
 * Chat Room Card Component.
 * Redesigned to match the Yari high-density grid style.
 */
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
      <Link href={`/rooms/${room.id}`} className="group block w-full animate-in fade-in zoom-in duration-500">
        <div className="space-y-2">
          <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden shadow-sm border-2 border-white">
            <Image
              src={room.coverUrl || `https://picsum.photos/seed/${room.id}/400/400`}
              alt={`Live community room: ${room.title}`}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110"
              sizes="(max-width: 768px) 50vw, 33vw"
            />
            
            {/* Status Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            
            {/* Rocket/Level Overlay */}
            <div className="absolute bottom-2 left-2">
               <div className="bg-black/20 backdrop-blur-sm rounded-lg p-1 animate-pulse">
                  <span className="text-xl">🚀</span>
               </div>
            </div>

            {/* Real-time Bars/Count Overlay */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10">
              <div className="flex items-end gap-0.5 h-3">
                 <div className="w-0.5 bg-white h-1 animate-bounce" style={{ animationDelay: '0.1s' }} />
                 <div className="w-0.5 bg-white h-2 animate-bounce" style={{ animationDelay: '0.2s' }} />
                 <div className="w-0.5 bg-white h-3 animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
              <span className="text-[10px] text-white font-black">{onlineCount}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 px-1 min-w-0">
            <span className="text-sm shrink-0" aria-label="Region flag">🇮🇳</span>
            <h3 className="font-bold text-xs text-gray-800 truncate uppercase tracking-tight">
              {room.title}
            </h3>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/rooms/${room.id}`} className="group block">
      <Card className="overflow-hidden transition-all duration-300 group-hover:shadow-lg group-hover:-translate-y-1 bg-white border-none shadow-sm rounded-2xl">
        <div className="p-0">
          <div className="relative h-40 w-full">
            <Image
              src={room.coverUrl || `https://picsum.photos/seed/${room.id}/400/225`}
              alt={`Chat room background for ${room.title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-bold text-gray-900 truncate">{room.title}</h3>
          <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-2 uppercase font-black">
             <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
             {onlineCount} Tribe Online
          </div>
        </div>
      </Card>
    </Link>
  );
}
