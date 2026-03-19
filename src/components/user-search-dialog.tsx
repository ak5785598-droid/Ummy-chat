'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, collectionGroup } from 'firebase/firestore';
import { Search, Loader, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * High-Fidelity Universal Search Dimension.
 * Perfectly mirrored from the provided blueprint screenshot.
 * Features full-screen navigation sync and User/Room frequency separation.
 */
export function UserSearchDialog() {
  const [open, setOpen] = useState(false);
  const [searchId, setSearchId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState('user');
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!firestore || !searchId) return;

    setIsSearching(true);
    try {
      const inputId = searchId.trim();
      
      if (activeTab === 'user') {
        // IDENTITY SYNC: Look for Special ID or Account Number in public profile dimension
        const userQ1 = query(collectionGroup(firestore, 'profile'), where('specialId', '==', inputId), limit(1));
        const userQ2 = query(collectionGroup(firestore, 'profile'), where('accountNumber', '==', inputId), limit(1));
        
        const [uSnap1, uSnap2] = await Promise.all([
          getDocs(userQ1), 
          getDocs(userQ2)
        ]);
        
        const foundDoc = uSnap1.docs[0] || uSnap2.docs[0];
        
        if (foundDoc) {
          router.push(`/profile/${foundDoc.id}`);
          setOpen(false);
          setSearchId('');
          return;
        }
      } else {
        // ROOM SYNC: Target roomNumber identifier
        const roomQ = query(collection(firestore, 'chatRooms'), where('roomNumber', '==', inputId), limit(1));
        const rSnap = await getDocs(roomQ);
        
        if (!rSnap.empty) {
          router.push(`/rooms/${rSnap.docs[0].id}`);
          setOpen(false);
          setSearchId('');
          return;
        }
      }

      toast({
        variant: 'destructive',
        title: 'Identity Not Found',
        description: `No ${activeTab === 'user' ? 'tribe member' : 'room'} exists with ID ${searchId}.`,
      });
    } catch (e: any) {
      console.error("[Search Sync] Error:", e);
      toast({
        variant: 'destructive',
        title: 'Search Failed',
        description: 'Check your connection frequency.'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleClose = (val: boolean) => {
    if (!val) {
      setSearchId('');
    }
    setOpen(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <button className="p-1 hover:scale-110 active:scale-90 transition-all">
          <Search className="h-6 w-6 text-gray-800" />
        </button>
      </DialogTrigger>
      <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-headline animate-in slide-in-from-right duration-300">
        <DialogHeader className="sr-only">
          <DialogTitle>Tribe Search</DialogTitle>
        </DialogHeader>

        {/* High-Fidelity Header - Mirrored from Blueprint */}
        <div className="pt-12 px-4 pb-2 space-y-4 bg-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={2.5} />
              <Input 
                placeholder="Search user or Room ID" 
                className="h-10 pl-10 pr-10 rounded-full border-none bg-slate-100/80 focus:ring-0 text-[15px] font-medium placeholder:text-slate-400 italic"
                value={searchId}
                autoFocus
                onChange={(e) => setSearchId(e.target.value.replace(/\D/g, ''))}
                onKeyDown={(e) => e.key === 'Enter' && !!searchId && handleSearch()}
              />
              {searchId && (
                <button 
                  onClick={() => setSearchId('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-300 rounded-full p-0.5 text-white hover:bg-slate-400 transition-colors"
                >
                  <X className="h-3 w-3" strokeWidth={3} />
                </button>
              )}
            </div>
            <button 
              onClick={() => setOpen(false)}
              className="text-[15px] font-bold text-slate-500 hover:text-slate-800 transition-colors px-1"
            >
              Cancel
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-transparent w-full h-10 p-0 justify-center gap-16 border-none">
              <TabsTrigger 
                value="user" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent font-black text-[17px] uppercase tracking-tighter text-slate-400 data-[state=active]:text-slate-900 h-full px-2 transition-all"
              >
                User
              </TabsTrigger>
              <TabsTrigger 
                value="room" 
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent font-black text-[17px] uppercase tracking-tighter text-slate-400 data-[state=active]:text-slate-900 h-full px-2 transition-all"
              >
                Room
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content Dimension */}
        <div className="flex-1 bg-white relative">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center pt-32 gap-4 opacity-40">
               <Loader className="h-8 w-8 animate-spin text-primary" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em]">Syncing Graph...</p>
            </div>
          ) : (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center pt-32 text-slate-200">
               <Search className="h-20 w-20 opacity-10 mb-4" />
               <p className="text-xs font-black uppercase tracking-widest italic opacity-20">Enter ID to Synchronize</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
