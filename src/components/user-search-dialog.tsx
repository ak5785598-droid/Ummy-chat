'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { Search, Loader, User, X, ArrowRight } from 'lucide-react';
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

/**
 * Universal Tribe & Room Search Portal.
 * Re-engineered to support both 8-digit Account Numbers and manually assigned Special IDs.
 * Features a high-fidelity yellow visual signature.
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
      
      // IDENTITY RESOLVER PROTOCOL:
      // Parallel scan for Special IDs, Account Numbers, and Room Numbers.
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
        description: 'Tuning frequency failed. Please try again.',
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
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col animate-in slide-in-from-bottom duration-500 font-headline">
        <DialogHeader className="p-6 flex flex-row items-center justify-between border-b border-gray-50 space-y-0 shrink-0">
           <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
                 <Search className="h-5 w-5 text-yellow-600" />
              </div>
              <DialogTitle className="font-black uppercase italic text-sm tracking-tighter">Identity & Room Finder</DialogTitle>
           </div>
           <DialogDescription className="sr-only">
             Enter any digit ID to locate a member profile or room frequency.
           </DialogDescription>
           <button 
             onClick={() => setOpen(false)}
             className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-all"
           >
              <X className="h-6 w-6 text-gray-400" />
           </button>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full space-y-12">
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-700">
            <h2 className="text-5xl font-black uppercase italic tracking-tighter text-slate-900">
              Tribe & Room
            </h2>
            <p className="text-muted-foreground font-body text-lg max-w-xs mx-auto italic">
              Enter any ID to sync with a member's profile or join a room frequency.
            </p>
          </div>
          
          <div className="w-full space-y-8 animate-in slide-in-from-bottom-4 duration-700">
            <div className="relative group">
              <div className="absolute left-6 top-1/2 -translate-y-1/2 flex items-center gap-2 z-10">
                <Search className="h-8 w-8 text-yellow-600 group-focus-within:text-yellow-700 transition-colors" />
              </div>
              <Input 
                placeholder="ENTER ID" 
                className="pl-16 h-24 rounded-[2rem] border-4 border-yellow-100 bg-yellow-50 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all text-5xl font-black tracking-[0.2em] text-center text-yellow-900 placeholder:text-yellow-200 italic"
                value={searchId}
                autoFocus
                onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && !!searchId && handleSearch()}
              />
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || !searchId}
                className="w-full h-20 text-2xl font-black uppercase italic rounded-[2rem] bg-[#FFCC00] text-black shadow-2xl shadow-yellow-500/30 hover:bg-[#FFD700] hover:scale-[1.02] transition-all flex items-center justify-center gap-4 border-b-8 border-[#B8860B] active:border-b-0 active:translate-y-2"
              >
                {isSearching ? <Loader className="animate-spin h-8 w-8" /> : <ArrowRight className="h-8 w-8" />}
                {isSearching ? 'Locating...' : 'Sync Frequency'}
              </Button>
              
              <button 
                onClick={() => setOpen(false)}
                className="w-full text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-gray-900 transition-colors"
              >
                Cancel Search
              </button>
            </div>
          </div>
        </div>

        <footer className="p-8 text-center border-t border-gray-50 bg-gray-50/30 shrink-0">
           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
             Universal Identity & Frequency Search Protocol Active
           </p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
