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
    <div className="relative aspect-[1/1.2] rounded-[1.2rem] overflow-hidden shadow-[0_4px_20px_rgb(0,0,0,0.08)] bg-[#F8F9FE] isolate ring-1 ring-black/5">
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
       <span className="text-primary/20 scale-125 text-3xl">🏠</span>
      </div>
     )}

     {/* Cinematic Gradients for Text Legibility */}
     <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/50 via-black/10 to-transparent z-10 pointer-events-none" />
     <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 pointer-events-none" />

     {/* Top Left: ID & Flag Tag */}
     <div className="absolute top-2 left-2 z-20">
      <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/10 shadow-sm">
       <span className="text-[7px] font-black text-white uppercase tracking-tighter">ID:{room.roomNumber || '0000'}</span>
      </div>
     </div>

     {/* Top Right: Live Viewers */}
     <div className="absolute top-2 right-2 z-20">
      <div className="bg-black/40 backdrop-blur-md text-white text-[7px] font-black px-1.5 py-0.5 rounded-full border border-white/10 flex items-center gap-1 shadow-sm">
       <div className={cn("h-1 w-1 rounded-full shadow-[0_0_8px_currentColor]", liveCount > 0 ? "bg-[#00E5FF] text-[#00E5FF] animate-pulse" : "bg-slate-400 text-slate-400")} />
       {liveCount}
      </div>
     </div>

     {/* Bottom Content: Title & Host */}
     <div className="absolute bottom-0 left-0 right-0 p-2.5 z-20 flex flex-col gap-0.5">
      <h3 className="font-black text-[11px] text-white truncate drop-shadow-md leading-none mb-0.5">
       {roomTitle}
      </h3>
      <div className="flex items-center gap-1 mt-0.5">
       <Avatar className="h-3.5 w-3.5 border border-white/30 shadow-sm">
        <AvatarImage src={owner?.avatarUrl} />
        <AvatarFallback className="text-[5px] bg-slate-800 text-white font-bold">U</AvatarFallback>
       </Avatar>
       <span className="text-[7px] font-bold text-white/80 truncate uppercase tracking-widest leading-none">{ownerName}</span>
      </div>
     </div>
     
     <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/5 pointer-events-none z-30 mix-blend-overlay" />
    </div>
   </Link>
 );
}
