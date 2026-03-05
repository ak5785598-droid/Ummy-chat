'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Users, Castle } from 'lucide-react';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface ChatRoomCardProps {
  room: any; // Flexible type to support real-time Firestore document sync
  variant?: 'default' | 'modern';
}

/**
 * High-Fidelity Chat Room Card Component.
 * RE-ENGINEERED: Features a reactive key on images bound to coverUrl to ensure 
 * uploaded Room DPs refresh instantly everywhere across the frequency.
 */
export function ChatRoomCard({ room, variant = 'default' }: ChatRoomCardProps) {
  const { userProfile: owner } = useUserProfile(room.ownerId);

  const onlineCount = Math.max(0, room.participantCount || 0);
  const ownerName = owner?.username || 'Tribe Member';
  const regionalFlag = '🇮🇳';
  
  // Real-time Title Logic: Supports both name and title fields from the tribal graph
  const roomTitle = room.name || room.title || 'Untitled Frequency';

  const eliteJet = PlaceHolderImages.find(img => img.id === 'elite-jet');

  if (variant === 'modern') {
    return (
      <Link href={`/rooms/${room.id}`} className="group block w-full animate-in fade-in duration-500 font-headline active:scale-95 transition-transform">
        <div className="space-y-2">
          {/* Main Image Container */}
          <div className="relative aspect-[4/5] w-full rounded-[1.2rem] overflow-hidden shadow-md bg-slate-200">
            {room.coverUrl ? (
              <Image
                key={room.coverUrl} // Force cache-bust refresh on every upload sync
                src={room.coverUrl}
                alt={roomTitle}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, 33vw"
                priority={onlineCount > 5} // Prioritize active rooms
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                <Castle className="h-12 w-12 text-slate-300" />
              </div>
            )}
            
            {/* Top-Right Participant Count */}
            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/30 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/10 z-20">
              <div className="flex items-end gap-0.5 h-2">
                 <div className="w-0.5 bg-white h-1" />
                 <div className="w-0.5 bg-white h-1.5" />
                 <div className="w-0.5 bg-white h-2" />
              </div>
              <span className="text-[10px] text-white font-black">{onlineCount}</span>
            </div>

            {/* Bottom Gradient for readability */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 to-transparent z-10" />

            {/* Bottom-Left Owner Identity */}
            <div className="absolute bottom-2 left-2 flex items-center gap-1.5 max-w-[70%] z-20">
               <div className="h-4 w-4 rounded-full flex items-center justify-center border border-white/20 shrink-0 bg-pink-500">
                  <span className="text-[8px] text-white font-bold">♀</span>
               </div>
               <span className="text-[10px] text-white font-black truncate drop-shadow-md">
                 {ownerName}
               </span>
            </div>

            {/* Bottom-Right Status Emblem */}
            <div className="absolute bottom-2 right-2 h-8 w-8 rounded-lg overflow-hidden border border-white/20 shadow-lg z-20">
               {eliteJet && (
                 <Image 
                   src={eliteJet.imageUrl} 
                   alt="Emblem" 
                   fill 
                   className="object-contain p-1 bg-black/20 backdrop-blur-sm"
                   data-ai-hint={eliteJet.imageHint}
                 />
               )}
            </div>
          </div>
          
          {/* Room Title Below Image */}
          <div className="flex items-center gap-1.5 px-1 min-w-0">
            <span className="text-sm shrink-0" aria-label="Region flag">{regionalFlag}</span>
            <h3 className={cn(
              "font-black text-xs truncate uppercase tracking-tight",
              "text-gray-900"
            )}>
              {roomTitle}
            </h3>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/rooms/${room.id}`} className="group block active:scale-95 transition-transform">
      <div className="overflow-hidden transition-all duration-300 hover:shadow-lg bg-white border-none rounded-2xl">
        <div className="relative h-40 w-full bg-slate-100">
          {room.coverUrl && (
            <Image key={room.coverUrl} src={room.coverUrl} alt={roomTitle} fill className="object-cover" />
          )}
          <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-black/40 px-2 py-0.5 rounded-full">
             <Users className="h-3 w-3 text-white" />
             <span className="text-[10px] text-white font-bold">{onlineCount}</span>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-gray-900 truncate uppercase text-sm">{roomTitle}</h3>
        </div>
      </div>
    </Link>
  );
}