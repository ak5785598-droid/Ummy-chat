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
  Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { collection, query, where, limit } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';

// --- Decorative SVG Components (Midjourney Style) ---

const AngelWing = ({ side }: { side: 'left' | 'right' }) => (
  <motion.svg
    viewBox="0 0 200 200"
    className={cn(
      "absolute w-[180px] h-[180px] z-0 opacity-80 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]",
      side === 'left' ? "-translate-x-28" : "translate-x-28 scale-x-[-1]"
    )}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ 
      opacity: 1, 
      scale: 1,
      rotate: side === 'left' ? [-2, 5, -2] : [2, -5, 2] 
    }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <path
      fill="white"
      d="M20,100 C20,100 50,20 120,40 C150,50 180,90 180,120 C180,150 150,180 120,170 C100,165 80,140 80,140 L40,160 L60,120 L20,100 Z"
      className="fill-white/90"
    />
    <path
      fill="rgba(255,192,203,0.3)"
      d="M60,110 C80,90 120,80 150,100 M70,130 C90,120 130,110 160,130"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </motion.svg>
);

const FlowerDecoration = ({ index }: { index: number }) => {
  const sizes = [30, 45, 35, 50, 40];
  const size = sizes[index % sizes.length];
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: index * 0.1 }}
      className="relative flex-shrink-0"
      style={{ marginBottom: `${Math.sin(index) * 10}px` }}
    >
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
        <circle cx="50" cy="50" r="15" fill="#FFD700" />
        {[0, 72, 144, 216, 288].map((angle) => (
          <ellipse
            key={angle}
            cx="50"
            cy="25"
            rx="20"
            ry="30"
            fill="white"
            transform={`rotate(${angle} 50 50)`}
            className="opacity-95"
          />
        ))}
      </svg>
    </motion.div>
  );
};

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
        
        {/* --- 1. TOP 40VH THEME --- */}
        <div className="relative h-[43vh] w-full overflow-hidden bg-gradient-to-b from-[#b195ff] via-[#f7cedc] to-rose-900">
          <div className="absolute inset-0 flex justify-center items-end">
             <div className="w-[85%] h-[90%] border-[12px] border-white/30 rounded-t-full blur-[2px] shadow-[0_0_40px_rgba(255,255,255,0.4)]" />
          </div>
          
          {[...Array(6)].map((_, i) => <FloatingLight key={i} delay={i * 2} />)}

          <header className="absolute top-0 w-full z-50 flex items-center justify-between px-4 pt-10">
            <button onClick={() => router.back()} className="p-2 text-white drop-shadow-md">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <div className="flex gap-8 text-white font-bold tracking-widest text-lg items-center">
              <div className="flex flex-col items-center">
                <span className="drop-shadow-md">CP</span>
                <motion.div layoutId="underline" className="h-1.5 w-6 bg-yellow-400 rounded-full mt-1" />
              </div>
              <span className="opacity-70 drop-shadow-md">Friend</span>
            </div>
            <div className="w-10" />
          </header>

          <button className="absolute right-0 top-24 z-50 bg-[#ffb7c5]/80 backdrop-blur-md py-1.5 px-5 rounded-l-full border-y border-l border-white text-white text-sm font-bold shadow-sm">
            Rules
          </button>

          {/* --- CENTER HEART & WINGS --- */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-10">
            <div className="relative flex items-center justify-center">
               <AngelWing side="left" />
               <AngelWing side="right" />

               <motion.div
                 animate={{ scale: [1, 1.08, 1] }}
                 transition={{ duration: 3, repeat: Infinity }}
                 className="relative z-10"
               >
                 <div className="absolute inset-0 bg-rose-400 blur-[40px] opacity-60 rounded-full scale-150" />
                 <Heart className="h-32 w-32 text-white fill-[#ff5d8f] drop-shadow-[0_0_25px_rgba(255,93,143,0.9)]" />
               </motion.div>
            </div>
          </div>

          {/* --- BOTTOM FLOWER BED --- */}
          <div className="absolute bottom-0 w-full flex justify-center items-end px-2 gap-1 overflow-hidden h-24">
            {[...Array(12)].map((_, i) => (
              <FlowerDecoration key={i} index={i} />
            ))}
          </div>
          
          <div className="absolute bottom-0 w-full h-20 bg-gradient-to-t from-rose-900 to-transparent opacity-80" />
        </div>

        {/* --- 2. THE FLOATING CONNECTION CARD --- */}
        <div className="relative z-30 -mt-12 flex justify-center px-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] p-4 shadow-[0_15px_40px_rgba(244,63,94,0.12)] border border-white flex items-center gap-4 min-w-[320px] justify-between"
            >
                {/* User Avatar */}
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

                {/* Center Pulse */}
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

                {/* Partner Avatar */}
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

        <UserSearchDialog isOpen={showSearch} onClose={() => setShowSearch(false)} onSelect={handleProposeTarget} />
        {selectedTarget && (
            <CPProposeDialog isOpen={showPropose} onClose={() => { setShowPropose(false); setSelectedTarget(null); }} targetUser={selectedTarget} />
        )}
      </div>
    </AppLayout>
  );
}
