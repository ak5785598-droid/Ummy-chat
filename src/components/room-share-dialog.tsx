'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share2, Copy, Send, Check } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface RoomShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room: any;
}

/**
 * High-Fidelity Room Sharing Portal.
 * Allows tribe members to broadcast the current frequency URL.
 */
export function RoomShareDialog({ open, onOpenChange, room }: RoomShareDialogProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const roomUrl = typeof window !== 'undefined' ? `${window.location.origin}/rooms/${room.id}` : '';

   const handleCopy = () => {
    navigator.clipboard.writeText(room.roomNumber || '');
    setCopied(true);
    toast({ title: 'Tribal ID Secured', description: 'Room ID synchronized to clipboard.' });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[2.5rem] md:rounded-[2.5rem] border-none shadow-2xl overflow-hidden font-headline animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="p-8 pb-4 border-b border-gray-50 flex flex-row items-center gap-4">
          <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0">
             <Share2 className="h-6 w-6" />
          </div>
          <div className="flex-1 text-left">
            <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter">Broadcast Frequency</DialogTitle>
            <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
              Invite Tribe Members via Tribal ID
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-8">
           <div className="p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center shadow-md">
                 <img src={room.coverUrl || undefined} className="h-12 w-12 rounded-lg object-cover" />
              </div>
              <div>
                 <h3 className="font-black uppercase italic text-lg">{room.title}</h3>
                 <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.3em]">Tribal ID: {room.roomNumber}</p>
              </div>
           </div>

           <div className="space-y-4">
              <div className="flex flex-col items-center gap-2">
                 <div className="text-4xl font-black italic tracking-tighter text-slate-900 bg-slate-100 px-8 py-4 rounded-3xl border-2 border-slate-200 shadow-inner">
                    #{room.roomNumber}
                 </div>
                 <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">Tap Invite to Copy This ID</p>
              </div>
           </div>
        </div>

        <DialogFooter className="p-8 pt-0 grid grid-cols-2 gap-4">
           <Button variant="outline" className="h-14 rounded-2xl border-2 font-black uppercase italic text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button className="h-14 rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-900/20 font-black uppercase italic text-xs" onClick={handleCopy}>
              <Send className="h-4 w-4 mr-2" /> Invite Now
           </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
