'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star } from 'lucide-react';

interface ChatRoomCardProps {
  room: any;
  variant?: 'default' | 'modern';
}

/**
 * High-Fidelity Room Card.
 * Matches the requested visual:
 * - Rounded visual container (4/5 aspect).
 * - Upper overlays: Official Tag, Level Badge, Flag.
 * - Bottom Identity Pill: Host avatar and name.
 * - Info stack below: Title and Description.
 */
export function ChatRoomCard({ room, variant = 'default' }: ChatRoomCardProps) {
  const { userProfile: owner } = useUserProfile(room.ownerId);

  const roomTitle = room.name || room.title || 'Frequency';
  const roomTopic = room.description || room.topic || 'Synchronizing...';
  const ownerName = owner?.username || 'Tribe Member';

  if (variant === 'modern') {
    return (
      <Link href={`/rooms/${room.id}`} className="group block w-full animate-in fade-in duration-500 font-headline active:scale-95 transition-transform">
        <div className="flex flex-col gap-3">
          {/* Visual Container: High-Fidelity Rounded Dimension */}
          <div className="relative aspect-[4/5] w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border-2 border-white group-hover:shadow-primary/10 transition-shadow">
            {room.coverUrl ? (
              <Image
                key={room.coverUrl}
                src={room.coverUrl}
                alt={roomTitle}
                fill
                unoptimized
                className="object-cover transition-transform duration-1000 group-hover:scale-110"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-slate-200 scale-150 opacity-20">🏠</div>
              </div>
            )}
            
            {/* Top-Left Stack: Authority & Region */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
               <Badge className="bg-[#4CAF50] text-white text-[9px] font-black uppercase px-2.5 h-5 border-none shadow-lg">Official</Badge>
               <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md rounded-full px-2 py-0.5 border border-white/10">
                  <span className="text-xs">🇮🇳</span>
               </div>
            </div>

            {/* Top-Right Stack: Level Signature */}
            <div className="absolute top-4 right-4 z-20">
               <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-black text-[9px] font-black px-3 py-1 rounded-full shadow-xl border border-white/20 italic">
                  Lv.25
               </div>
            </div>

            {/* Bottom Host Identity Pill: Glassmorphism Sync */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
               <div className="bg-black/40 backdrop-blur-xl rounded-full pl-1.5 pr-4 py-1.5 flex items-center gap-2 border border-white/10 w-fit max-w-full shadow-2xl">
                  <Avatar className="h-6 w-6 border border-white/30 shadow-sm">
                     <AvatarImage src={owner?.avatarUrl} />
                     <AvatarFallback className="text-[8px] bg-slate-800 text-white">U</AvatarFallback>
                  </Avatar>
                  <span className="text-[11px] font-black text-white truncate drop-shadow-md uppercase italic tracking-tight">{ownerName}</span>
               </div>
            </div>

            {/* Visual Depth Overlay */}
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/20 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 via-black/10 to-transparent z-10" />
          </div>
          
          {/* Metadata Section: Positioned below visual */}
          <div className="space-y-0.5 px-2 min-w-0">
            <h3 className="font-black text-sm text-slate-900 truncate uppercase tracking-tight leading-none">{roomTitle}</h3>
            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest opacity-80">{roomTopic}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/rooms/${room.id}`} className="group block active:scale-95 transition-transform">
      <div className="overflow-hidden bg-white border-none rounded-2xl shadow-md">
        <div className="relative h-40 w-full bg-slate-100">
          {room.coverUrl && (
            <Image key={room.coverUrl} src={room.coverUrl} alt={roomTitle} fill unoptimized className="object-cover" />
          )}
        </div>
        <div className="p-3">
          <h3 className="font-bold text-slate-900 truncate uppercase text-sm">{roomTitle}</h3>
        </div>
      </div>
    </Link>
  );
}
