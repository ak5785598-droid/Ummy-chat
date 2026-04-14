'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  ChevronLeft, 
  Plus, 
  Heart, 
  Shield, 
  Gift as GiftIcon,
  History,
  TrendingUp,
  Loader,
  Sparkles,
  Activity,
  HeartCrack,
  Ring,
  Award
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { collection, query, where, limit } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';

// --- SVGA Kiss Icon (Mock, conceptual) ---
const SvgaKissIcon = () => (
  <img 
    src="https://img.icons8.com/?size=100&id=102555&format=png&color=F43F5E" 
    alt="Kiss SVGA" 
    className="h-12 w-12" 
  />
);

// --- Mock Image URLs for Privileges ---
const RING_IMAGE_URL = "https://img.icons8.com/?size=100&id=64860&format=png&color=FBBF24";
const COUPLE_THEME_URL = "https://img.icons8.com/?size=100&id=sE96Xg8VqNfS&format=png&color=FFFFFF";
const COUPLE_FRAME_URL = "https://img.icons8.com/?size=100&id=9810&format=png&color=EC4899";

// --- Falling Petals Animation (Subtle Clouds/Light) ---
const FloatingLight = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ y: '100%', opacity: 0 }}
    animate={{ 
      y: '-20vh', 
      x: [0, 20, -20, 0],
      opacity: [0, 0.4, 0] 
    }}
    transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
    className="absolute w-20 h-20 bg-white rounded-full blur-[40px]"
    style={{ left: `${Math.random() * 100}%` }}
  />
);

export default function CpHousePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile } = useUserProfile(user?.uid);
  
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [showPropose, setShowPropose] = useState(false);

  const cpQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'cpPairs'), where('participantIds', 'array-contains', user.uid), limit(1));
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
      <div className="h-[100dvh] w-full bg-rose-950 flex flex-col relative overflow-hidden font-sans select-none">
        
        {/* --- 1. TOP 40VH THEME (AS PER SCREENSHOT) --- */}
        <div className="relative h-[43vh] w-full overflow-hidden bg-gradient-to-b from-[#b195ff] via-[#f7cedc] to-rose-900">
          {/* Background Elements: Arch & Lights */}
          <div className="absolute inset-0 flex justify-center items-end">
             {/* Glowing Archway */}
             <div className="w-[85%] h-[90%] border-[12px] border-white/30 rounded-t-full blur-[2px] shadow-[0_0_40px_rgba(255,255,255,0.4)]" />
          </div>
          
          {/* Floating Dreamy Particles */}
          {[...Array(6)].map((_, i) => <FloatingLight key={i} delay={i * 2} />)}

          {/* Header UI */}
          <header className="absolute top-0 w-full z-50 flex items-center justify-between px-4 pt-10">
            <button onClick={() => router.back()} className="p-2 text-white drop-shadow-md">
              <ChevronLeft className="h-7 w-7" />
            </button>
            
            {/* CP / Friend Tabs */}
            <div className="flex gap-8 text-white font-bold tracking-widest text-lg items-center">
              <div className="flex flex-col items-center">
                <span className="drop-shadow-md">CP</span>
                <motion.div layoutId="underline" className="h-1.5 w-6 bg-yellow-400 rounded-full mt-1" />
              </div>
              <span className="opacity-70 drop-shadow-md">Friend</span>
            </div>

            <div className="w-10" /> {/* Spacer */}
          </header>

          {/* Rules Button */}
          <button className="absolute right-0 top-24 bg-[#ffb7c5]/80 backdrop-blur-md py-1.5 px-5 rounded-l-full border-y border-l border-white text-white text-sm font-bold shadow-sm">
            Rules
          </button>

          {/* Centerpiece: Wings & Heart */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
            <div className="relative flex items-center justify-center">
               {/* Wings (Animated) */}
               <motion.div 
                 animate={{ rotate: [-2, 2, -2] }} 
                 transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                 className="absolute w-[320px] pointer-events-none opacity-90"
               >
                 <img src="https://i.ibb.co/vYm6v6n/wings-overlay.png" alt="wings" className="w-full h-full object-contain" 
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://www.pngall.com/wp-content/uploads/5/Angel-Wings-Transparent.png' }} />
               </motion.div>

               {/* Glowing Heart */}
               <motion.div
                 animate={{ scale: [1, 1.08, 1] }}
                 transition={{ duration: 3, repeat: Infinity }}
                 className="relative z-10"
               >
                 <div className="absolute inset-0 bg-rose-400 blur-[40px] opacity-60 rounded-full scale-150" />
                 <Heart className="h-32 w-32 text-white fill-[#ff5d8f] drop-shadow-[0_0_20px_rgba(255,93,143,0.8)]" />
               </motion.div>
            </div>
          </div>
          
          {/* Ground Flowers (Bottom of Theme) */}
          <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-rose-900 to-transparent opacity-80" />
        </div>

        {/* --- 2. THE FLOATING CONNECTION CARD --- */}
        <div className="relative z-30 -mt-12 flex justify-center px-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-4 shadow-[0_15px_40px_rgba(244,63,94,0.12)] border border-white flex items-center gap-4 min-w-[320px] justify-between"
            >
                <div className="flex flex-col items-center gap-1">
                    <div className="relative p-1 rounded-full bg-rose-50 border border-rose-100">
                        <Avatar className="h-14 w-14 border-2 border-white">
                            <AvatarImage src={userProfile?.avatarUrl} />
                            <AvatarFallback className="bg-rose-100 text-rose-400">U</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-rose-500 rounded-full p-1 border-2 border-white">
                            <Sparkles className="h-2.5 w-2.5 text-white" />
                        </div>
                    </div>
                    <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">{userProfile?.username?.split(' ')[0] || 'Me'}</span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center relative px-2">
                    <Activity className="h-4 w-4 text-rose-300 animate-pulse absolute -top-3" />
                    <div className="w-full h-[1.5px] bg-gradient-to-r from-rose-100 via-rose-400 to-rose-100 rounded-full relative">
                        <motion.div 
                            animate={{ left: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-rose-500 rounded-full blur-[0.5px]" 
                        />
                    </div>
                    <Heart className={cn("h-5 w-5 mt-2", activeCp ? "text-rose-500 fill-rose-500 animate-bounce" : "text-rose-200")} />
                </div>

                <div className="flex flex-col items-center gap-1">
                    {activeCp ? (
                        <div className="relative p-1 rounded-full bg-rose-50 border border-rose-100">
                             <Avatar className="h-14 w-14 border-2 border-white">
                                <AvatarImage src={partnerProfile?.avatarUrl} />
                                <AvatarFallback className="bg-rose-100 text-rose-400">P</AvatarFallback>
                            </Avatar>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowSearch(true)}
                            className="h-14 w-14 rounded-full bg-rose-50/50 border-2 border-dashed border-rose-200 flex items-center justify-center group hover:bg-rose-100 transition-colors"
                        >
                            <Plus className="h-6 w-6 text-rose-300 group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                    <span className="text-[9px] font-black text-rose-300 uppercase tracking-tighter">
                        {activeCp ? partnerProfile?.username?.split(' ')[0] : 'Partner'}
                    </span>
                </div>
            </motion.div>
        </div>

        {/* --- 3. BODY CONTENT --- */}
        <main className="flex-1 px-6 pt-8 overflow-y-auto pb-10">
           {isCpLoading ? (
             <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Loader className="h-6 w-6 text-rose-300 animate-spin" />
                <span className="text-[9px] font-bold text-rose-300 uppercase tracking-[0.2em]">Syncing...</span>
             </div>
           ) : activeCp ? (
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-[2rem] border border-rose-50 shadow-sm">
                        <span className="text-[9px] font-bold text-rose-300 uppercase">Bond Level</span>
                        <h3 className="text-2xl font-black text-rose-600">LV.{activeCp.level || 1}</h3>
                    </div>
                    <div className="bg-white p-5 rounded-[2rem] border border-rose-50 shadow-sm text-right">
                        <span className="text-[9px] font-bold text-rose-300 uppercase">Love Score</span>
                        <div className="flex items-center justify-end gap-1">
                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                            <h3 className="text-2xl font-black text-rose-600">{(activeCp.cpValue || 0).toLocaleString()}</h3>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Tasks', icon: Shield, color: 'bg-indigo-400' },
                      { label: 'Gifts', icon: GiftIcon, color: 'bg-amber-400' },
                      { label: 'History', icon: History, color: 'bg-rose-400' }
                    ].map((item) => (
                        <button key={item.label} className="bg-white p-4 rounded-[2rem] flex flex-col items-center gap-2 shadow-sm border border-rose-50 active:scale-95 transition-all">
                            <div className={cn("p-2.5 rounded-2xl text-white", item.color)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[9px] font-bold text-rose-400 uppercase">{item.label}</span>
                        </button>
                    ))}
                </div>

                {/* --- PRIVILEGES SECTION (New requirement) --- */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }} 
                    animate={{ y: 0, opacity: 1 }}
                    className="bg-rose-800 rounded-[2.5rem] p-6 shadow-[0_10px_30px_rgba(244,63,94,0.15)] border-2 border-rose-700 mt-6"
                >
                    <div className="flex flex-col items-center gap-5">
                        <div className="flex items-center gap-3">
                            <Award className="h-6 w-6 text-rose-100" />
                            <h2 className="text-2xl font-black text-white">Privileges</h2>
                        </div>
                        
                        <div className="flex items-center justify-between w-full gap-4 px-2">
                           <SvgaKissIcon />
                           
                           <div className="flex-1 flex flex-col items-center gap-4">
                                <div className="p-3 bg-white/10 rounded-3xl w-full flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={RING_IMAGE_URL} />
                                    </Avatar>
                                    <span className="text-sm font-bold text-rose-100">CP Ring</span>
                                </div>

                                <div className="p-3 bg-white/10 rounded-3xl w-full flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={COUPLE_THEME_URL} />
                                    </Avatar>
                                    <span className="text-sm font-bold text-rose-100">Couple Theme</span>
                                </div>

                                <div className="p-3 bg-white/10 rounded-3xl w-full flex items-center gap-4">
                                    <Avatar className="h-10 w-10">
                                      <AvatarImage src={COUPLE_FRAME_URL} />
                                    </Avatar>
                                    <span className="text-sm font-bold text-rose-100">Couple Frame</span>
                                </div>
                           </div>

                           <SvgaKissIcon />
                        </div>
                    </div>
                </motion.div>
             </div>
           ) : (
             <div className="text-center py-10 flex flex-col items-center">
                <div className="w-16 h-1 bg-rose-100 rounded-full mb-6" />
                <p className="text-rose-300 font-bold text-[10px] uppercase tracking-[0.15em] leading-loose">
                    Your Love House is empty<br/>
                    <span className="text-rose-400/50">Invite someone special to begin</span>
                </p>
             </div>
           )}
        </main>

        {/* 🔍 MODALS */}
        <UserSearchDialog isOpen={showSearch} onClose={() => setShowSearch(false)} onSelect={handleProposeTarget} />
        {selectedTarget && (
            <CPProposeDialog isOpen={showPropose} onClose={() => { setShowPropose(false); setSelectedTarget(null); }} targetUser={selectedTarget} />
        )}
      </div>
    </AppLayout>
  );
}
