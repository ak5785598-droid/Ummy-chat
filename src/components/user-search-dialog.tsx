'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Search, Loader, User, X, ArrowRight, Copy } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const SpecialIdBadge = ({ id, color }: { id: string, color?: string | null }) => {
  const { toast } = useToast();
  
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => {
        toast({ title: 'ID Copied' });
      }).catch(() => {
        toast({ variant: 'destructive', title: 'Copy Failed' });
      });
    } else {
      toast({ variant: 'destructive', title: 'Clipboard Unavailable' });
    }
  };

  if (!color) {
    return (
      <span 
        onClick={handleCopy}
        className="text-[10px] font-black uppercase italic tracking-widest text-slate-500 leading-none cursor-pointer hover:text-slate-700 transition-colors px-1"
      >
        ID: {id}
      </span>
    );
  }

  const theme = color === 'blue' 
    ? "from-blue-300 via-blue-500 to-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)] border-white/30"
    : color === 'red'
    ? "from-rose-300 via-rose-500 to-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)] border-white/30"
    : "from-slate-100 to-slate-200 border-slate-300 shadow-none";

  return (
    <div 
      onClick={handleCopy}
      className={cn(
        "relative overflow-hidden px-3 py-0.5 rounded-full border group animate-in fade-in duration-500 w-fit bg-gradient-to-r cursor-pointer",
        theme
      )}
    >
      {color && <div className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />}
      <span className={cn(
        "relative z-10 text-[10px] font-black uppercase italic tracking-widest drop-shadow-sm leading-none",
        !color ? "text-slate-500" : "text-white"
      )}>ID: {id}</span>
    </div>
  );
};

/**
 * Universal Tribe & Room Search Portal.
 * Re-engineered to support both 8-digit Account Numbers and manually assigned Special IDs.
 * Compact Interface Protocol active.
 */
export function UserSearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!firestore || !searchId) return;

    setIsSearching(true);
    try {
      const inputId = searchId.trim();
      
      const userQ1 = query(collection(firestore, 'users'), where('specialId', '==', inputId), limit(1));
      const userQ2 = query(collection(firestore, 'users'), where('accountNumber', '==', inputId), limit(1));
      const roomQ = query(collection(firestore, 'chatRooms'), where('roomNumber', '==', inputId), limit(1));
      
      const [uSnap1, uSnap2, rSnap] = await Promise.all([
        getDocs(userQ1), 
        getDocs(userQ2),
        getDocs(roomQ)
      ]);
      
      if (!uSnap1.empty) {
        router.push(`/profile/${uSnap1.docs[0].id}`);
        setOpen(false);
        setSearchId('');
        return;
      }
      
      if (!uSnap2.empty) {
        router.push(`/profile/${uSnap2.docs[0].id}`);
        setOpen(false);
        setSearchId('');
        return;
      }

      if (!rSnap.empty) {
        router.push(`/rooms/${rSnap.docs[0].id}`);
        setOpen(false);
        setSearchId('');
        return;
      }

      toast({
        variant: 'destructive',
        title: 'Identity Not Found',
        description: `No tribe member or room exists with ID ${searchId}.`,
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="p-1 hover:scale-110 active:scale-90 transition-all">
          <Search className="h-6 w-6 text-gray-800" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-headline">
        <DialogHeader className="p-6 flex flex-row items-center justify-between border-b border-gray-50 space-y-0 shrink-0">
           <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                 <Search className="h-5 w-5 text-yellow-600" />
              </div>
              <DialogTitle className="font-black uppercase italic text-sm tracking-tighter">Identity & Room Finder</DialogTitle>
           </div>
           <button onClick={() => setOpen(false)} className="p-2 bg-secondary/50 rounded-full"><X className="h-6 w-6 text-gray-400" /></button>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">Tribe & Room</h2>
            <p className="text-muted-foreground font-body text-sm italic">Enter any ID to sync with a member's profile or join a frequency.</p>
          </div>
          
          <div className="w-full space-y-6">
            <Input 
              placeholder="ENTER ID" 
              className="h-16 rounded-[1.5rem] border-4 border-yellow-100 bg-yellow-50 focus:border-yellow-400 text-3xl font-black tracking-[0.2em] text-center text-yellow-900 placeholder:text-yellow-200 italic"
              value={searchId}
              autoFocus
              onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && !!searchId && handleSearch()}
            />
            
            <Button onClick={handleSearch} disabled={isSearching || !searchId} className="w-full h-14 text-lg font-black uppercase italic rounded-[1.5rem] bg-[#FFCC00] text-black shadow-xl border-b-4 border-[#B8860B] active:border-b-0 active:translate-y-1">
              {isSearching ? <Loader className="animate-spin h-6 w-6" /> : 'Sync Frequency'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
