'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ChatRoomCardProps {
 room: any;
 variant?: 'default' | 'modern';
}

/**
 * High-Fidelity Room Card.
 * Re-engineered for Edge-to-Edge Identity.
 * Features ultra-premium backdrop blurs and heavy font integrations.
 */
export function ChatRoomCard({ room, variant = 'modern' }: ChatRoomCardProps) {
 const { userProfile: owner } = useUserProfile(room?.ownerId);

 if (!room) return null;

 const roomTitle = room.name || room.title || 'Frequency';
 const ownerName = owner?.username || 'Tribe Member';
 const liveCount = Number(room.participantCount || 0);

 return (
  <Link href={`/rooms/${room.id}`} className="group block w-full animate-in fade-in duration-500 hover-scale active-press">
   <div className="relative aspect-[4/5] rounded-[1.5rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.06)] bg-[#F8F9FE] isolate ring-1 ring-black/5">
    {/* Full Cover Background */}
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
     <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
      <span className="text-primary/20 scale-150 text-4xl">🏠</span>
     </div>
    )}

    {/* Cinematic Gradients for Text Legibility */}
    <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/60 via-black/20 to-transparent z-10 pointer-events-none" />
    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-10 pointer-events-none" />

    {/* Top Left: ID & Flag Tag */}
    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
     <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full pl-1.5 pr-2.5 py-1 border border-white/20 shadow-sm">
      <span className="text-[10px] leading-none">🇮🇳</span>
      <span className="text-[8px] font-black text-white uppercase tracking-wider leading-none">ID:{room.roomNumber || '0000'}</span>
     </div>
    </div>

    {/* Top Right: Live Viewers */}
    <div className="absolute top-3 right-3 z-20">
     <div className="bg-black/40 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
      <div className={cn("h-1.5 w-1.5 rounded-full shadow-[0_0_8px_currentColor]", liveCount > 0 ? "bg-[#00E5FF] text-[#00E5FF] animate-pulse" : "bg-slate-400 text-slate-400")} />
      {liveCount}
     </div>
    </div>

    {/* Bottom Content: Title & Host */}
    <div className="absolute bottom-0 left-0 right-0 p-3.5 z-20 flex flex-col gap-1">
     <h3 className="font-black text-sm text-white truncate drop-shadow-md leading-tight">
      {roomTitle}
     </h3>
     <div className="flex items-center gap-1.5 mt-0.5">
      <Avatar className="h-4 w-4 border border-white/30 shadow-sm">
       <AvatarImage src={owner?.avatarUrl} />
       <AvatarFallback className="text-[6px] bg-slate-800 text-white font-bold">U</AvatarFallback>
      </Avatar>
      <span className="text-[8px] font-bold text-white/90 truncate uppercase tracking-widest">{ownerName}</span>
     </div>
    </div>
    
    {/* Glass Gloss Overlay for Apple-like shine */}
    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-30 mix-blend-overlay" />
   </div>
  </Link>
 );
}
