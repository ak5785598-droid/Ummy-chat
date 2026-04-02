import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  ChevronLeft, 
  HelpCircle, 
  Plus, 
  Heart, 
  Award, 
  Home, 
  CreditCard, 
  Scroll, 
  Loader, 
  Gift as GiftIcon,
  Search,
  Sparkles,
  TrendingUp,
  History,
  Shield
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { collection, query, where, limit, doc, increment, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { GoldCoinIcon } from '@/components/icons';
import { GiftAnimationOverlay } from '@/components/gift-animation-overlay';
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

 // 🔗 SYNC CP STATUS: Check for active pairing
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
 
 // Identify partner UID
 const partnerUid = activeCp?.participantIds?.find((id: string) => id !== user?.uid);
 const { userProfile: partnerProfile } = useUserProfile(partnerUid);

 const backgroundAsset = PlaceHolderImages.find(img => img.id === 'cp-house-bg');

 const handleProposeTarget = (target: any) => {
    setSelectedTarget(target);
    setShowSearch(false);
    setShowPropose(true);
 };

 return (
  <AppLayout fullScreen>
   <div className="h-[100dvh] w-full bg-[#0a0010] flex flex-col relative overflow-hidden font-sans text-white select-none">
    
    {/* 🎬 DYNAMIC BACKGROUND */}
    <div className="absolute inset-0 z-0">
       <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 z-10" />
       {activeCp ? (
         <div className="relative h-full w-full">
            <Image src={backgroundAsset?.imageUrl || ""} alt="CP Background" fill className="object-cover opacity-80 animate-pulse-slow" />
            <div className="absolute inset-0 backdrop-blur-[2px]" />
         </div>
       ) : (
         <div className="h-full w-full bg-gradient-to-br from-[#1a0a25] via-[#0f0514] to-[#040107]" />
       )}
    </div>

    <header className="relative z-50 flex items-center justify-between p-6 pt-12">
      <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white ring-1 ring-white/10"><ChevronLeft className="h-6 w-6" /></button>
      <div className="flex flex-col items-center">
        <h1 className="text-xl font-black uppercase tracking-[0.2em] italic drop-shadow-md">Love Dimension</h1>
        <div className="h-0.5 w-12 bg-rose-500 rounded-full mt-1 animate-pulse" />
      </div>
      <button className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white ring-1 ring-white/10"><HelpCircle className="h-6 w-6" /></button>
    </header>

    <main className="relative z-20 flex-1 flex flex-col items-center justify-center px-8 pb-20">
      {isCpLoading ? (
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-10 w-10 text-rose-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Syncing Heartbeats...</p>
        </div>
      ) : activeCp ? (
        /* ❤️ ACTIVE CP UI */
        <div className="w-full space-y-12 animate-in fade-in zoom-in duration-700">
           <div className="flex items-center justify-center gap-8 relative">
              {/* Pulsing Bond Line */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent animate-pulse" />
              
              <div className="flex flex-col items-center gap-3 group">
                 <div className="relative">
                    <div className="absolute -inset-4 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Avatar className="h-24 w-24 border-4 border-white shadow-[0_0_40px_rgba(59,130,246,0.3)] relative z-10 transition-transform group-hover:scale-110">
                      <AvatarImage src={userProfile?.avatarUrl} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{userProfile?.username}</span>
              </div>

              <div className="z-20 bg-white/10 backdrop-blur-xl p-4 rounded-full border border-white/20 shadow-2xl animate-bounce">
                <Heart className="h-8 w-8 text-rose-500 fill-rose-500" />
              </div>

              <div className="flex flex-col items-center gap-3 group">
                 <div className="relative">
                    <div className="absolute -inset-4 bg-rose-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Avatar className="h-24 w-24 border-4 border-white shadow-[0_0_40px_rgba(244,63,94,0.3)] relative z-10 transition-transform group-hover:scale-110">
                      <AvatarImage src={partnerProfile?.avatarUrl} />
                      <AvatarFallback>P</AvatarFallback>
                    </Avatar>
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{partnerProfile?.username || 'Partner'}</span>
              </div>
           </div>

           <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] p-6 border border-white/10 space-y-6 shadow-2xl">
              <div className="flex justify-between items-center px-2">
                 <div className="flex flex-col">
                    <span className="text-2xl font-black text-rose-500 tracking-tighter">LV. {activeCp.level || 1}</span>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30 italic">Bond Journey</span>
                 </div>
                 <div className="text-right flex flex-col">
                    <div className="flex items-center gap-2 justify-end">
                       <TrendingUp className="h-4 w-4 text-emerald-400" />
                       <span className="text-xl font-black text-white">{(activeCp.cpValue || 0).toLocaleString()}</span>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Love Score</span>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                 {[
                   { label: 'Tasks', icon: Shield, color: 'bg-indigo-500' },
                   { label: 'Gifts', icon: GiftIcon, color: 'bg-amber-500' },
                   { label: 'Moments', icon: History, color: 'bg-emerald-500' }
                 ].map((mod) => (
                   <button key={mod.label} className="p-4 rounded-3xl bg-white/5 border border-white/5 flex flex-col items-center gap-2 hover:bg-white/10 transition-all active:scale-95">
                      <div className={cn("p-2 rounded-xl text-white", mod.color)}>
                         <mod.icon className="h-4 w-4" />
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-tighter text-white/50">{mod.label}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>
      ) : (
        /* 💔 NO CP UI: Connect Partner Flow */
        <div className="text-center space-y-8 animate-in slide-in-from-bottom-5 duration-700">
           <div className="relative inline-block">
              <div className="absolute inset-0 bg-rose-500/30 blur-[60px] rounded-full animate-pulse" />
              <div className="h-32 w-32 bg-white/5 backdrop-blur-2xl rounded-full border-2 border-dashed border-rose-500/40 flex items-center justify-center relative z-10">
                 <Plus className="h-12 w-12 text-rose-500 opacity-40" />
              </div>
           </div>
           
           <div className="space-y-2">
              <h2 className="text-3xl font-black uppercase tracking-tight italic">Partner frequency</h2>
              <p className="text-white/40 font-medium text-xs uppercase tracking-[0.2em] max-w-[240px] leading-relaxed mx-auto">
                Scanning for a soul to merge vibes with in the tribal realm.
              </p>
           </div>

           <Button 
             onClick={() => setShowSearch(true)}
             className="bg-rose-500 hover:bg-rose-600 rounded-full h-16 px-12 font-black uppercase text-sm shadow-[0_15px_40px_rgba(244,63,94,0.4)] active:scale-95 transition-all ring-2 ring-white/20"
           >
              Connect Partner
           </Button>
        </div>
      )}
    </main>

    {/* 🔍 SEARCH & PROPOSE DIALOGS */}
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
