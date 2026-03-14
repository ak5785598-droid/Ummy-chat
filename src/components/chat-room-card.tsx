'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface ChatRoomCardProps {
  room: any;
  variant?: 'default' | 'modern';
}

/**
 * High-Fidelity Room Card.
 * Re-engineered to match the provided layout:
 * - Image area with multiple overlays (Tags, Levels, Flags).
 * - Host identity at the bottom of the image.
 * - Room title and topic synchronized below the image.
 */
export function ChatRoomCard({ room, variant = 'default' }: ChatRoomCardProps) {
  const { userProfile: owner } = useUserProfile(room.ownerId);

  const onlineCount = Math.max(0, room.participantCount || 0);
  const ownerName = owner?.username || 'Tribe Member';
  const roomTitle = room.name || room.title || 'Frequency';
  const roomTopic = room.description || room.topic || 'Syncing tribe vibes...';

  if (variant === 'modern') {
    return (
      <Link href={`/rooms/${room.id}`} className="group block w-full animate-in fade-in duration-500 font-headline active:scale-95 transition-transform">
        <div className="flex flex-col gap-3">
          {/* Visual Container */}
          <div className="relative aspect-[4/5] w-full rounded-[2rem] overflow-hidden shadow-xl bg-slate-200 border-2 border-white">
            {room.coverUrl ? (
              <Image
                key={room.coverUrl}
                src={room.coverUrl}
                alt={roomTitle}
                fill
                unoptimized
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <span className="text-4xl opacity-20">🏠</span>
              </div>
            )}
            
            {/* Top-Left Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
               <Badge className="bg-green-500 text-white text-[8px] font-black uppercase px-2 py-0 h-4 border-none shadow-sm">Official</Badge>
               <div className="flex items-center gap-1 bg-black/20 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/10">
                  <span className="text-[8px]">🇮🇳</span>
               </div>
            </div>

            {/* Top-Right Levels */}
            <div className="absolute top-3 right-3 z-20">
               <div className="bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full shadow-sm italic">
                  Lv.25
               </div>
            </div>

            {/* Bottom Identity Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2 z-20">
               <div className="bg-black/40 backdrop-blur-md rounded-full pl-1 pr-3 py-1 flex items-center gap-2 border border-white/10 max-w-full">
                  <Avatar className="h-5 w-5 border border-white/20">
                     <AvatarImage src={owner?.avatarUrl} />
                     <AvatarFallback className="text-[6px]">U</AvatarFallback>
                  </Avatar>
                  <span className="text-[10px] font-black text-white truncate drop-shadow-md uppercase italic">{ownerName}</span>
               </div>
            </div>

            {/* Visual Depth Gradients */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/20 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent z-10" />
          </div>
          
          {/* Metadata Section (Below Image) */}
          <div className="space-y-0.5 px-1 min-w-0">
            <h3 className="font-black text-sm text-slate-900 truncate uppercase tracking-tight">{roomTitle}</h3>
            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest">{roomTopic}</p>
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
