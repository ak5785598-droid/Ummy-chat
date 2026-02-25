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
 * High-Fidelity Full-Screen User Search Dialog.
 * Immersive portal for finding tribe members by their unique 6-digit ID.
 */
export function UserSearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!firestore || searchId.length < 6) return;

    setIsSearching(true);
    try {
      const q = query(
        collection(firestore, 'users'),
        where('specialId', '==', searchId),
        limit(1)
      );
      
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const userId = snap.docs[0].id;
        setOpen(false);
        setSearchId('');
        router.push(`/profile/${userId}`);
      } else {
        toast({
          variant: 'destructive',
          title: 'Identity Not Found',
          description: `No tribe member exists with ID ${searchId}.`,
        });
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'Synchronizing with social graph failed.',
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
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col animate-in slide-in-from-bottom duration-500">
        <DialogHeader className="p-6 flex flex-row items-center justify-between border-b border-gray-50 space-y-0">
           <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                 <Search className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle className="font-black uppercase italic text-sm tracking-tighter">Locate Tribe</DialogTitle>
           </div>
           <DialogDescription className="sr-only">
             Enter the unique 6-digit identity code to sync with your friend's frequency.
           </DialogDescription>
           <button 
             onClick={() => setOpen(false)}
             className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-all"
           >
              <X className="h-6 w-6 text-gray-400" />
           </button>
        </DialogHeader>

        <div className="flex-1 flex flex-col items-center justify-center p-8 max-w-lg mx-auto w-full space-y-12">
          <div className="text-center space-y-4">
            <h2 className="font-headline text-5xl font-black uppercase italic tracking-tighter">
              Tribe Finder
            </h2>
            <p className="text-muted-foreground font-body text-lg max-w-xs mx-auto">
              Enter the unique 6-digit identity code to sync with your friend's frequency.
            </p>
          </div>
          
          <div className="w-full space-y-8">
            <div className="relative group">
              <User className="absolute left-6 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-300 group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="000000" 
                className="pl-16 h-24 rounded-[2rem] border-4 border-gray-100 focus:border-primary transition-all text-5xl font-black tracking-[0.3em] text-center placeholder:text-gray-100"
                maxLength={6}
                value={searchId}
                autoFocus
                onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && searchId.length === 6 && handleSearch()}
              />
            </div>
            
            <div className="space-y-4">
              <Button 
                onClick={handleSearch} 
                disabled={isSearching || searchId.length < 6}
                className="w-full h-20 text-2xl font-black uppercase italic rounded-[2rem] bg-primary text-white shadow-2xl shadow-yellow-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-4"
              >
                {isSearching ? <Loader className="animate-spin h-8 w-8" /> : <ArrowRight className="h-8 w-8" />}
                {isSearching ? 'Locating...' : 'Sync Identity'}
              </Button>
              
              <button 
                onClick={() => setOpen(false)}
                className="w-full text-center text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-gray-900 transition-colors"
              >
                Cancel Search
              </button>
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-2 opacity-40">
             <div className="flex gap-1">
                {Array.from({length: 6}).map((_, i) => (
                  <div key={i} className={`h-1.5 w-1.5 rounded-full ${searchId.length > i ? 'bg-primary' : 'bg-gray-200'}`} />
                ))}
             </div>
             <p className="text-[9px] font-black uppercase tracking-widest italic">
               Waiting for 6-Digit Frequency...
             </p>
          </div>
        </div>

        <footer className="p-8 text-center border-t border-gray-50 bg-gray-50/30">
           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
             End-to-End Social Graph Encryption Active
           </p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
