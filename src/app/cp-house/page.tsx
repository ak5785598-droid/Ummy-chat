'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  ChevronLeft, 
  HelpCircle, 
  Plus, 
  Heart, 
  Shield,
  Gift as GiftIcon,
  TrendingUp,
  History,
  Loader
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { collection, query, where, limit } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';

export default function CpHousePage() {
 const router = useRouter();
 const { user } = useUser();
 const firestore = useFirestore();
 const { userProfile } = useUserProfile(user?.uid);
 
 const [showSearch, setShowSearch] = useState(false);
 const [selectedTarget, setSelectedTarget] = useState<any>(null);
 const [showPropose, setShowPropose] = useState(false);

 // SYNC CP STATUS
 const cpQuery = useMemoFirebase(() => {
   if (!firestore || !user?.uid) return null;
   return query(
     collection(firestore, 'cpPairs'),
     where('participantIds', 'array-contains', user.uid),
     limit(1)
   );
 }, [firestore, user?.uid]);

 const { data: cpData, isLoading: isCpLoading } = useCollection(cpQuery);
 const activeCp = cpData?.[0];
 
 const partnerUid = activeCp?.participantIds?.find((id: string) => id !== user?.uid);
 const { userProfile: partnerProfile } = useUserProfile(partnerUid);

 const handleProposeTarget = (target: any) => {
    setSelectedTarget(target);
    setShowSearch(false);
    setShowPropose(true);
 };

 return (
  <AppLayout fullScreen>
   <div className="h-[100dvh] w-full bg-[#1a050d] flex flex-col relative overflow-hidden font-sans text-white select-none">
    
    {/* 🎨 TOP THEME COVER (40vh) */}
    <div className="absolute top-0 left-0 w-full h-[40vh] z-0 overflow-hidden">
       {/* Deep Rose Pink Gradient Base */}
       <div className="absolute inset-0 bg-gradient-to-b from-rose-600 via-rose-900 to-[#1a050d]" />
       
       {/* Heart Pattern Overlay */}
       <div 
         className="absolute inset-0 opacity-20" 
         style={{ 
           backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 35.52l-1.45-1.32C13.4 29.3 10 26.22 10 22.5 10 19.47 12.38 17.09 15.41 17.09c1.72 0 3.37.8 4.59 2.08 1.22-1.28 2.87-2.08 4.59-2.08 3.03 0 5.41 2.38 5.41 5.41 0 3.72-3.4 6.8-8.55 11.7L20 35.52z' fill='%23ffffff' fill-rule='evenodd'/%3E%3C/svg%3E")`,
           backgroundSize: '80px 80px'
         }}
       />

       {/* Optional Image Background if CP exists */}
       {activeCp && (
          <Image 
            src={PlaceHolderImages.find(img => img.id === 'cp-house-bg')?.imageUrl || ""} 
            alt="Cover" fill className="object-cover mix-blend-overlay opacity-50" 
          />
       )}
       
       {/* Soft Glow */}
       <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#1a050d] to-transparent" />
    </div>

    {/* 🏛️ HEADER */}
    <header className="relative z-50 flex items-center justify-between px-6 pt-12">
      <button 
        onClick={() => router.back()} 
        className="p-2.5 bg-black/20 backdrop-blur-xl rounded-full text-white border border-white/10 hover:bg-black/40 transition-all"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      <div className="flex flex-col items-center">
        <h1 className="text-xl font-black uppercase tracking-[0.3em] drop-shadow-lg italic">Love House</h1>
        <div className="h-1 w-8 bg-white rounded-full mt-1 animate-pulse shadow-[0_0_10px_#fff]" />
      </div>

      <button className="p-2.5 bg-black/20 backdrop-blur-xl rounded-full text-white border border-white/10 opacity-0 pointer-events-none">
        <HelpCircle className="h-6 w-6" />
      </button>
    </header>

    {/* 💖 MAIN CONTENT */}
    <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-8 pb-10">
      {isCpLoading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-10 w-10 text-rose-400 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Opening Doors...</p>
        </div>
      ) : activeCp ? (
        /* ❤️ COUPLE DISPLAY */
        <div className="w-full space-y-10 animate-in fade-in zoom-in duration-700">
           <div className="flex items-center justify-center gap-6 relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-0.5 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
              
              <div className="flex flex-col items-center gap-3">
                 <Avatar className="h-24 w-24 border-4 border-white/20 shadow-2xl scale-110">
                    <AvatarImage src={userProfile?.avatarUrl} />
                    <AvatarFallback>U</AvatarFallback>
                 </Avatar>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{userProfile?.username}</span>
              </div>

              <div className="z-20 bg-rose-500 p-4 rounded-full shadow-[0_0_30px_rgba(244,63,94,0.6)] animate-bounce">
                <Heart className="h-8 w-8 text-white fill-white" />
              </div>

              <div className="flex flex-col items-center gap-3">
                 <Avatar className="h-24 w-24 border-4 border-white/20 shadow-2xl scale-110">
                    <AvatarImage src={partnerProfile?.avatarUrl} />
                    <AvatarFallback>P</AvatarFallback>
                 </Avatar>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/70">{partnerProfile?.username || 'Partner'}</span>
              </div>
           </div>

           <div className="bg-black/30 backdrop-blur-2xl rounded-[3rem] p-8 border border-white/10 space-y-8 shadow-2xl">
              <div className="flex justify-between items-end">
                 <div className="space-y-1">
                    <span className="text-3xl font-black text-rose-400 italic">LV. {activeCp.level || 1}</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Bond Level</p>
                 </div>
                 <div className="text-right space-y-1">
                    <div className="flex items-center gap-2 justify-end text-white">
                       <TrendingUp className="h-5 w-5 text-rose-400" />
                       <span className="text-2xl font-black">{(activeCp.cpValue || 0).toLocaleString()}</span>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">Intimacy Score</p>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                 {[
                   { label: 'Gifts', icon: GiftIcon, color: 'bg-rose-500' },
                   { label: 'Tasks', icon: Shield, color: 'bg-rose-700' },
                   { label: 'Story', icon: History, color: 'bg-rose-900' }
                 ].map((item) => (
                   <button key={item.label} className="py-5 rounded-[2rem] bg-white/5 border border-white/5 flex flex-col items-center gap-3 active:scale-95 transition-all">
                      <div className={cn("p-2.5 rounded-xl", item.color)}>
                         <item.icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-white/60">{item.label}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      ) : (
        /* 💔 CONNECT FLOW */
        <div className="text-center space-y-8 animate-in slide-in-from-bottom-5 duration-700">
           <div className="relative inline-block">
              <div className="absolute inset-0 bg-rose-500/40 blur-[80px] rounded-full animate-pulse" />
              <div className="h-32 w-32 bg-black/40 backdrop-blur-3xl rounded-full border-2 border-dashed border-white/20 flex items-center justify-center relative z-10">
                 <Plus className="h-10 w-10 text-white/50" />
              </div>
           </div>
           
           <div className="space-y-3">
              <h2 className="text-3xl font-black uppercase tracking-tight italic leading-none">The House is Empty</h2>
              <p className="text-white/50 font-bold text-[10px] uppercase tracking-[0.25em] max-w-[260px] mx-auto leading-loose">
                Invite your special person to start your bond journey.
              </p>
           </div>

           <Button 
             onClick={() => setShowSearch(true)}
             className="bg-white text-rose-600 hover:bg-rose-50 rounded-full h-16 px-14 font-black uppercase text-xs shadow-2xl active:scale-95 transition-all"
           >
              Find Partner
           </Button>
        </div>
      )}
    </main>

    {/* DIALOGS */}
    <UserSearchDialog 
      isOpen={showSearch} 
      onClose={() => setShowSearch(false)} 
      onSelect={handleProposeTarget}
    />
    
    {selectedTarget && (
      <CPProposeDialog 
        isOpen={showPropose} 
        onClose={() => { setShowPropose(false); setSelectedTarget(null); }}
        targetUser={selectedTarget}
      />
    )}
   </div>
  </AppLayout>
 );
}
