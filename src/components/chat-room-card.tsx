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
    <Link href={`/rooms/${room.id}`} className="group block w-full animate-in fade-in duration-500 hover:scale-[1.02] active:scale-[0.98] transition-all">
     <div className="relative aspect-[1/1.2] rounded-[2rem] overflow-hidden shadow-[0_15px_40px_rgba(0,0,0,0.12)] bg-slate-100 ring-1 ring-black/5 group-hover:shadow-[0_25px_60px_rgba(0,0,0,0.2)] transition-all">
      {/* Cinematic Cover */}
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
       <div className="w-full h-full bg-gradient-to-br from-slate-200 to-slate-300" />
      )}

      {/* Glassmorphism Header */}
      <div className="absolute top-0 left-0 right-0 p-3 z-20 flex justify-between items-start">
         <div className="bg-black/30 backdrop-blur-xl px-2 py-0.5 rounded-full border border-white/10 shadow-lg">
           <span className="text-[7px] font-black text-white/90 uppercase tracking-widest">ID:{room.roomNumber || '0000'}</span>
         </div>
         <div className="bg-[#ff0844]/80 backdrop-blur-xl px-2 py-0.5 rounded-full border border-white/10 flex items-center gap-1 shadow-lg ring-1 ring-white/20">
            <div className="h-1 w-1 bg-white rounded-full animate-pulse shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
            <span className="text-[8px] font-black text-white">{liveCount}</span>
         </div>
      </div>

      {/* Bottom Content: Glass Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pb-4 z-20 flex flex-col gap-1.5 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
         <h3 className="font-black text-[13px] text-white truncate drop-shadow-md leading-none tracking-tight group-hover:text-yellow-400 transition-colors">
          {roomTitle}
         </h3>
         <div className="flex items-center gap-2">
            <Avatar className="h-4.5 w-4.5 border-1.5 border-white shadow-xl">
               <AvatarImage src={owner?.avatarUrl} />
               <AvatarFallback className="text-[6px] bg-slate-800 text-white font-black">U</AvatarFallback>
            </Avatar>
            <span className="text-[8px] font-black text-white/70 truncate uppercase tracking-[0.1em] group-hover:text-white transition-colors">{ownerName}</span>
         </div>
      </div>

      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 pointer-events-none z-30 transition-opacity duration-700" />
     </div>
    </Link>
 );
}
