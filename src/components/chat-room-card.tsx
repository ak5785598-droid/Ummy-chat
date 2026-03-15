'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Users } from 'lucide-react';

interface ChatRoomCardProps {
  room: any;
  variant?: 'default' | 'modern';
}

/**
 * High-Fidelity Room Card.
 * Re-engineered for Square Card Identity (Squad Shape).
 * Features Identity Color Sync for the room name.
 */
export function ChatRoomCard({ room, variant = 'default' }: ChatRoomCardProps) {
  const { userProfile: owner } = useUserProfile(room.ownerId);

  const roomTitle = room.name || room.title || 'Frequency';
  const roomTopic = room.description || room.topic || 'Synchronizing...';
  const ownerName = owner?.username || 'Tribe Member';
  const liveCount = Number(room.participantCount || 0);

  /**
   * IDENTITY COLOR SYNC ENGINE
   */
  const getSyncGradient = () => {
    const themeId = room.roomThemeId;
    const category = room.category?.toLowerCase();

    if (themeId === 'official_ummy') return 'from-yellow-500 via-amber-500 to-orange-600';
    if (themeId === 'gaming_arcade' || category === 'games') return 'from-blue-500 via-cyan-500 to-indigo-500';
    if (themeId === 'neon_universe' || category === 'party') return 'from-purple-500 via-pink-500 to-rose-500';
    if (themeId === 'emoji_party') return 'from-orange-400 via-yellow-500 to-amber-500';
    
    if (category === 'chat') return 'from-sky-500 to-blue-600';
    if (category === 'newcomers') return 'from-emerald-500 to-teal-400';

    return 'from-slate-900 to-slate-700';
  };

  if (variant === 'modern') {
    return (
      <Link href={`/rooms/${room.id}`} className="group block w-full animate-in fade-in duration-500 font-headline active:scale-95 transition-transform">
        <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border-2 border-white group-hover:border-primary/20 transition-all flex flex-col relative">
          {/* Glass Glossy Overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-30" />
          
          {/* Square Cover Image Dimension */}
          <div className="relative aspect-square w-full bg-slate-50">
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
                <div className="text-slate-200 scale-150 opacity-20 text-4xl">🏠</div>
              </div>
            )}
            
            {/* Top-Left Overlays */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
               <div className="flex items-center gap-1 bg-black/30 backdrop-blur-md rounded-full px-1.5 py-0.5 border border-white/10 w-fit">
                  <span className="text-[10px]">🇮🇳</span>
               </div>
            </div>

            {/* Top-Right Live Indicator Protocol */}
            <div className="absolute top-3 right-3 z-20">
               <div className="bg-black/40 backdrop-blur-md text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-xl border border-white/20 italic flex items-center gap-1">
                  <div className="h-1 w-1 rounded-full bg-green-500 animate-pulse" />
                  LIVE {liveCount}
               </div>
            </div>

            {/* Bottom Glass Pill (Host) */}
            <div className="absolute bottom-3 left-3 z-20">
               <div className="bg-black/40 backdrop-blur-xl rounded-full pl-1 pr-3 py-1 flex items-center gap-1.5 border border-white/10 w-fit max-w-[120px] shadow-2xl">
                  <Avatar className="h-5 w-5 border border-white/30 shadow-sm">
                     <AvatarImage src={owner?.avatarUrl} />
                     <AvatarFallback className="text-[6px] bg-slate-800 text-white">U</AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] font-black text-white truncate uppercase italic tracking-tight">{ownerName}</span>
               </div>
            </div>

            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/20 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent z-10" />
          </div>
          
          {/* Connected Content Section */}
          <div className="p-3 bg-white space-y-0.5 relative z-20">
            <h3 className={cn(
              "font-black text-sm truncate uppercase tracking-tight leading-none bg-clip-text text-transparent bg-gradient-to-r",
              getSyncGradient()
            )}>
              {roomTitle}
            </h3>
            <p className="text-[9px] font-bold text-slate-400 truncate uppercase tracking-widest leading-none">{roomTopic}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/rooms/${room.id}`} className="group block active:scale-95 transition-transform">
      <div className="overflow-hidden bg-white border-none rounded-2xl shadow-md flex flex-col">
        <div className="relative aspect-square w-full bg-slate-100">
          {room.coverUrl && (
            <Image key={room.coverUrl} src={room.coverUrl} alt={roomTitle} fill unoptimized className="object-cover" />
          )}
        </div>
        <div className="p-3">
          <h3 className={cn(
            "font-black truncate uppercase text-sm bg-clip-text text-transparent bg-gradient-to-r",
            getSyncGradient()
          )}>
            {roomTitle}
          </h3>
        </div>
      </div>
    </Link>
  );
}