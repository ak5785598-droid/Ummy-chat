'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { 
 Dialog, 
 DialogContent, 
 DialogHeader, 
 DialogTitle,
 DialogDescription
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader, Users, Star, Crown, ChevronRight, X, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RoomUserListDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 roomId: string;
 participants?: any[]; // Optional: pass participants from parent
}

/**
 * Mobile-First Compact Room Roster.
 * Matches UI screenshot with centered header and streamlined user rows.
 */
export function RoomUserListDialog({ open, onOpenChange, roomId, participants: propParticipants }: RoomUserListDialogProps) {
 const firestore = useFirestore();

 const participantsQuery = useMemoFirebase(() => {
  if (!firestore || !roomId) return null;
  return query(collection(firestore, 'chatRooms', roomId, 'participants'), orderBy('joinedAt', 'desc'));
 }, [firestore, roomId]);

 const { data: rawParticipants, isLoading } = useCollection(participantsQuery);

 // Use prop participants if provided, otherwise use fetched data
 const participants = useMemo(() => {
  // If parent provides participants, use those
  if (propParticipants) return propParticipants;
  // Otherwise use fetched data without aggressive filtering
  if (!rawParticipants) return [];
  return rawParticipants;
 }, [rawParticipants, propParticipants]);

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="max-w-full sm:max-w-md bg-white text-black p-0 rounded-t-[2rem] border-none shadow-2xl overflow-hidden font-sans animate-in slide-in-from-bottom duration-500 bottom-0 top-auto fixed translate-y-0">
    <DialogHeader className="sr-only">
      <DialogTitle>Online Users</DialogTitle>
      <DialogDescription>List of users currently in this room</DialogDescription>
    </DialogHeader>
    
    {/* COMPACT CENTERED HEADER */}
    <div className="relative py-6 px-4 border-b border-gray-100 flex items-center justify-center">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        Online User: <span className="text-cyan-500 font-black">{participants.length}</span>
      </h2>
      <button 
        onClick={() => onOpenChange(false)}
        className="absolute right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <X className="h-5 w-5 text-gray-400" />
      </button>
    </div>

    <ScrollArea className="max-h-[70vh] min-h-[40vh] p-0">
      {isLoading && !propParticipants ? (
       <div className="py-20 flex flex-col items-center gap-4">
        <Loader className="animate-spin text-primary h-8 w-8" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Syncing Roster...</p>
       </div>
      ) : participants.length > 0 ? (
       <div className="divide-y divide-gray-50">
        {participants.map((p: any) => (
         <div key={p.uid} className="p-4 flex items-center justify-between group active:bg-gray-50 transition-all cursor-pointer">
           <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="h-14 w-14 border-2 border-white shadow-sm">
                <AvatarImage src={p.avatarUrl || undefined} />
                <AvatarFallback className="bg-slate-200">{(p.name || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
              {p.seatIndex !== undefined && p.seatIndex > 0 && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 h-4 w-4 rounded-full border-2 border-white" />
              )}
            </div>
            
            <div className="space-y-1">
              <p className="font-bold text-sm text-gray-900 leading-none">{p.name || 'Incognito User'}</p>
              
              <div className="flex items-center gap-2">
                {/* ROLE BADGE */}
                {(p.role === 'owner' || p.role === 'admin') && (
                  <div className="bg-purple-100 p-1 rounded-md">
                    <Users className="h-3 w-3 text-purple-600 fill-current" />
                  </div>
                )}
                
                {/* LEVEL STAR BADGE (Matching Screenshot 2) */}
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-1 pl-1 pr-2 py-0.5 rounded-full shadow-sm">
                  <Star className="h-2 w-2 text-white fill-current" />
                  <span className="text-[8px] font-black text-white italic">Lv.{p.level?.rich || 1}</span>
                </div>

                {/* GENDER BADGE */}
                <div className={cn(
                  "h-4 w-4 rounded-full flex items-center justify-center text-white",
                  p.gender === 'female' ? "bg-pink-400" : "bg-blue-400"
                )}>
                  <span className="text-[8px] font-bold">{p.gender === 'female' ? '♀' : '♂'}</span>
                </div>
              </div>
            </div>
           </div>
           
           <div className="flex items-center gap-2">
              <p className="text-[8px] text-gray-300 font-bold uppercase tracking-tight">ID:{p.accountNumber || p.uid?.slice(0, 6)}</p>
              <ChevronRight className="h-4 w-4 text-gray-200" />
           </div>
         </div>
        ))}
       </div>
      ) : (
       <div className="py-20 text-center opacity-20 font-bold uppercase text-xs tracking-widest">The roster is empty</div>
      )}
    </ScrollArea>
    
    {/* NO FOOTER BUTTON AS PER SCREENSHOT */}
    <div className="h-8 bg-white" />
   </DialogContent>
  </Dialog>
 );
}
