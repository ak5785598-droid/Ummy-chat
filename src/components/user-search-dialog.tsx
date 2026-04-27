'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, limit, collectionGroup, doc, getDoc } from 'firebase/firestore';
import { Search, Loader, X, ArrowRight, User as UserIcon, Home as HomeIcon, CheckCircle2 } from 'lucide-react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUserProfile } from '@/hooks/use-user-profile';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * High-Fidelity Universal Search Dimension.
 * Perfectly mirrored from the provided blueprint screenshot.
 * Features full-screen navigation sync and User/Room frequency separation.
 */
interface UserSearchDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSelect?: (user: any) => void;
}

export function UserSearchDialog({ isOpen, onClose, onSelect }: UserSearchDialogProps) {
 const [internalOpen, setInternalOpen] = useState(false);
 const [searchId, setSearchId] = useState('');
 const [isSearching, setIsSearching] = useState(false);
 const [activeTab, setActiveTab] = useState('user');
 const [result, setResult] = useState<any>(null);
 const router = useRouter();
 const firestore = useFirestore();
 const { toast } = useToast();

 const open = isOpen !== undefined ? isOpen : internalOpen;
 const setOpen = (val: boolean) => {
   if (onClose && !val) onClose();
   setInternalOpen(val);
 };

 // LIVE SEARCH SYNC: Debounced frequency lookup
  useEffect(() => {
    const performLiveSearch = async () => {
      if (!firestore || searchId.length < 1) {
        setResult(null);
        return;
      }

      setIsSearching(true);
      try {
        const inputId = searchId.trim();
        
        if (activeTab === 'user') {
          const inputId = searchId.trim();
          
          // 1. Search by ID (Try String format first)
          const idQueryStr = query(collection(firestore, 'users'), where('accountNumber', '==', inputId), limit(1));
          const idSnapStr = await getDocs(idQueryStr);
          let foundUser = !idSnapStr.empty ? { ...idSnapStr.docs[0].data(), id: idSnapStr.docs[0].id, type: 'user' } : null;

          // 2. Try Number format if not found and input is numeric
          if (!foundUser && /^\d+$/.test(inputId)) {
            const idQueryNum = query(collection(firestore, 'users'), where('accountNumber', '==', Number(inputId)), limit(1));
            const idSnapNum = await getDocs(idQueryNum);
            if (!idSnapNum.empty) {
              foundUser = { ...idSnapNum.docs[0].data(), id: idSnapNum.docs[0].id, type: 'user' };
            }
          }

          // 3. Try Username fallback
          if (!foundUser) {
            const nameQuery = query(collection(firestore, 'users'), where('username', '==', inputId), limit(1));
            const nameSnap = await getDocs(nameQuery);
            if (!nameSnap.empty) {
              foundUser = { ...nameSnap.docs[0].data(), id: nameSnap.docs[0].id, type: 'user' };
            }
          }

          setResult(foundUser);
        } else {
          const roomQ = query(collection(firestore, 'chatRooms'), where('roomNumber', '==', inputId), limit(1));
          const rSnap = await getDocs(roomQ);
          if (!rSnap.empty) {
            setResult({ ...rSnap.docs[0].data(), id: rSnap.docs[0].id, type: 'room' });
          } else {
            setResult(null);
          }
        }
      } catch (e) {
        console.error("[Search Sync] Live lookup failed:", e);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(performLiveSearch, 400);
    return () => clearTimeout(timer);
  }, [searchId, activeTab, firestore]);

  const navigateToResult = () => {
   if (!result) return;
   
   if (onSelect) {
     onSelect(result);
     setOpen(false);
     setSearchId('');
     setResult(null);
     return;
   }

   if (result.type === 'user') {
    // This will now open the Standalone Premium Page (FullProfileDialog)
    router.push(`/profile/${result.id}`);
   } else {
    router.push(`/rooms/${result.id}`);
   }
   setOpen(false);
   setSearchId('');
   setResult(null);
  };

  const handleClose = (val: boolean) => {
   if (!val) {
    setSearchId('');
   }
   setOpen(val);
  };

 return (
  <Dialog open={open} onOpenChange={handleClose}>
    {isOpen === undefined && (
      <DialogTrigger asChild>
       <button className="p-1 hover:scale-110 active:scale-90 transition-all">
        <Search className="h-6 w-6 text-gray-800" />
       </button>
      </DialogTrigger>
    )}
   <DialogContent className="w-screen h-screen max-w-none m-0 rounded-none border-none bg-white text-black p-0 flex flex-col font-sans animate-in slide-in-from-right duration-300">
    <DialogHeader className="sr-only">
     <DialogTitle>Tribe Search</DialogTitle>
    </DialogHeader>

    {/* High-Fidelity Header - Mirrored from Blueprint */}
    <div className="pt-safe px-4 pb-2 bg-white shrink-0 shadow-sm relative z-10">
     <div className="pt-5 space-y-4">
     <div className="flex items-center gap-4">
      <div className="relative flex-1">
       <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" strokeWidth={2.5} />
       <Input 
        placeholder={activeTab === 'user' ? "Enter User ID..." : "Enter Room ID..."} 
        className="h-10 pl-10 pr-10 rounded-full border-none bg-slate-100/80 focus:ring-0 text-[15px] font-medium placeholder:text-slate-400 "
        value={searchId}
        autoFocus
        onChange={(e) => setSearchId(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && !!result && navigateToResult()}
       />
       {searchId && (
        <button 
         onClick={() => { setSearchId(''); setResult(null); }}
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
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent font-bold text-[17px] uppercase tracking-tight text-slate-400 data-[state=active]:text-slate-900 h-full px-2 transition-all"
       >
        User
       </TabsTrigger>
       <TabsTrigger 
        value="room" 
        className="rounded-none border-b-2 border-transparent data-[state=active]:border-slate-900 data-[state=active]:bg-transparent font-bold text-[17px] uppercase tracking-tight text-slate-400 data-[state=active]:text-slate-900 h-full px-2 transition-all"
       >
        Room
       </TabsTrigger>
      </TabsList>
     </Tabs>
    </div>
   </div>

    <div className="flex-1 bg-white relative p-6">
     {isSearching ? (
      <div className="flex flex-col items-center justify-center pt-24 gap-4 opacity-40">
        <Loader className="h-8 w-8 animate-spin text-primary" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] ">Synchronizing Graph...</p>
      </div>
     ) : result ? (
      <div className="animate-in slide-in-from-bottom-4 duration-500">
        <button 
         onClick={navigateToResult}
         className="w-full bg-slate-50/50 hover:bg-slate-100/80 rounded-3xl p-6 border-2 border-slate-100 transition-all group relative"
        >
         <div className="flex items-center gap-6">
           <div className="relative">
            <Avatar className="h-20 w-20 border-4 border-white shadow-xl">
              <AvatarImage src={result.avatarUrl || result.coverUrl} />
              <AvatarFallback className="bg-slate-200 text-slate-400">
               {result.type === 'user' ? <UserIcon /> : <HomeIcon />}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-lg">
              <CheckCircle2 className="h-3 w-3 text-white" />
            </div>
           </div>
           <div className="flex-1 text-left">
            <h4 className="text-2xl font-bold uppercase tracking-tight text-slate-900 group-hover:text-primary transition-colors">
              {result.username || result.name || result.title}
            </h4>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
               {result.type === 'user' ? 'Identity Sync' : 'Frequency Node'}
              </span>
              <span className="h-1 w-1 rounded-full bg-slate-300" />
              <span className="text-[10px] font-bold text-primary uppercase">ID: {result.accountNumber || result.roomNumber}</span>
            </div>
           </div>
           <ArrowRight className="h-6 w-6 text-slate-200 group-hover:text-primary group-hover:translate-x-2 transition-all" />
         </div>
        </button>
      </div>
     ) : searchId ? (
      <div className="flex flex-col items-center justify-center pt-24 gap-4 opacity-40">
        <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
         <X className="h-10 w-10" strokeWidth={3} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 ">No Match Found</p>
      </div>
     ) : (
      <div className="absolute inset-0 pointer-events-none flex flex-col items-center pt-24 text-slate-200">
        <Search className="h-24 w-24 opacity-10 mb-4" />
        <p className="text-xs font-bold uppercase tracking-wider opacity-20">Enter Numeric ID</p>
      </div>
     )}
    </div>
   </DialogContent>
  </Dialog>
 );
}
