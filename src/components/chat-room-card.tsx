
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Users, Castle } from 'lucide-react';
import type { Room } from '@/lib/types';
import { Card } from '@/components/ui/card';

interface ChatRoomCardProps {
  room: Room;
  variant?: 'default' | 'modern';
}

/**
 * Chat Room Card Component.
 * Synchronized with the Discovery Hub: Uses the room's participantCount field directly for efficiency.
 */
export function ChatRoomCard({ room, variant = 'default' }: ChatRoomCardProps) {
  // Use the participantCount field directly from the room document
  // This ensures the list removal logic and the badge are perfectly aligned
  const onlineCount = room.participantCount || 0;

  if (variant === 'modern') {
    return (
      <Link href={`/rooms/${room.id}`} className="group block w-full animate-in fade-in zoom-in duration-500">
        <div className="space-y-2">
          <div className="relative aspect-square w-full rounded-[1.5rem] overflow-hidden shadow-sm border-2 border-white bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
            {room.coverUrl ? (
              <Image
                src={room.coverUrl}
                alt={room.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
            ) : (
              <Castle className="h-12 w-12 text-slate-300 group-hover:text-primary transition-colors" />
            )}
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            
            <div className="absolute bottom-2 left-2">
               <div className="bg-black/20 backdrop-blur-sm rounded-lg p-1 animate-pulse">
                  <span className="text-xl">🚀</span>
               </div>
            </div>

            <div className="absolute bottom-2 right-2 flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-2.5 py-0.5 rounded-lg border border-white/10">
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
          <div className="relative h-40 w-full bg-slate-100 flex items-center justify-center">
            {room.coverUrl ? (
              <Image
                src={room.coverUrl}
                alt={room.title}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            ) : (
              <Castle className="h-10 w-10 text-slate-300" />
            )}
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
