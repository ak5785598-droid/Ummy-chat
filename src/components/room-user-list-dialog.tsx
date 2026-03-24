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
import { Loader, Users, Star, Crown, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RoomUserListDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 roomId: string;
}

/**
 * High-Fidelity Room Roster Dimension.
 * DEFERRED SYNC: Hydration mismatch protection.
 */
export function RoomUserListDialog({ open, onOpenChange, roomId }: RoomUserListDialogProps) {
 const firestore = useFirestore();
 // DEFERRED IDENTITY SYNC: Initialize to null for hydration safety
 const [now, setNow] = useState<number | null>(null);

 useEffect(() => {
  if (open) {
   setNow(Date.now());
   const timer = setInterval(() => setNow(Date.now()), 15000);
   return () => clearInterval(timer);
  }
 }, [open]);

 const participantsQuery = useMemoFirebase(() => {
  if (!firestore || !roomId) return null;
  return query(collection(firestore, 'chatRooms', roomId, 'participants'), orderBy('joinedAt', 'desc'));
 }, [firestore, roomId]);

 const { data: rawParticipants, isLoading } = useCollection(participantsQuery);

 const participants = useMemo(() => {
  if (!rawParticipants) return [];
  if (now === null) return rawParticipants;

  return rawParticipants.filter(p => {
   const lastSeen = (p as any).lastSeen?.toDate?.()?.getTime?.() || 0;
   if (!lastSeen) return true;
   return (now - lastSeen) < 65000;
  });
 }, [rawParticipants, now]);

 return (
  <Dialog open={open} onOpenChange={onOpenChange}>
   <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] md:rounded-3xl border-none shadow-2xl overflow-hidden font-sans animate-in slide-in-from-bottom-full duration-500">
    <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4">
     <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
       <Users className="h-6 w-6" />
     </div>
     <div className="flex-1 text-left">
      <DialogTitle className="text-2xl font-bold uppercase tracking-tight">Room Roster</DialogTitle>
      <DialogDescription className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">
       Currently Synchronized: {participants.length} Members
      </DialogDescription>
     </div>
    </DialogHeader>

    <ScrollArea className="max-h-[60vh] p-4">
      {isLoading ? (
       <div className="py-20 flex flex-col items-center gap-4">
        <Loader className="animate-spin text-primary h-8 w-8" />
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-300">Syncing Roster...</p>
       </div>
      ) : participants.length > 0 ? (
       <div className="space-y-2">
        {participants.map((p: any) => (
         <div key={p.uid} className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer border border-gray-100/50 hover:bg-gray-100">
           <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
              <AvatarImage src={p.avatarUrl || undefined} />
              <AvatarFallback className="bg-slate-200">{(p.name || 'U').charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
               <p className="font-bold text-sm uppercase tracking-tight">{p.name}</p>
               {p.seatIndex > 0 && <Badge className="bg-green-500 text-white text-[8px] font-bold h-4 px-1.5">ON MIC</Badge>}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
               <Badge className="bg-gradient-to-r from-cyan-400 to-blue-600 border-none h-3 text-[6px] font-bold px-1.5 uppercase">Lv. 1</Badge>
               <p className="text-[8px] text-muted-foreground font-bold uppercase tracking-wider">ID:{p.accountNumber || p.uid.slice(0, 6)}</p>
              </div>
            </div>
           </div>
           <ChevronRight className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
         </div>
        ))}
       </div>
      ) : (
       <div className="py-20 text-center opacity-20 ">The roster is empty.</div>
      )}
    </ScrollArea>
    
    <div className="p-8 pt-0">
      <button onClick={() => onOpenChange(false)} className="w-full h-16 bg-black text-white rounded-2xl font-bold uppercase text-lg shadow-xl active:scale-95 transition-all">Close</button>
    </div>
   </DialogContent>
  </Dialog>
 );
}
