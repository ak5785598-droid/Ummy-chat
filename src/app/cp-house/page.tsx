'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  History,
  TrendingUp,
  Loader,
  Sparkles,
  Activity
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { collection, query, where, limit } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';

// --- Falling Petals Animation ---
const FallingPetal = ({ delay }: { delay: number }) => (
  <motion.div
    initial={{ y: -20, opacity: 0, rotate: 0 }}
    animate={{ 
      y: ['0vh', '40vh'], 
      x: ['0vw', Math.random() > 0.5 ? '10vw' : '-10vw'],
      opacity: [0, 1, 0],
      rotate: 360 
    }}
    transition={{ duration: 6, repeat: Infinity, delay, ease: "linear" }}
    className="absolute w-3 h-3 bg-white/60 rounded-full blur-[1px]"
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

  // 🔗 CP Sync Logic
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
      <div className="h-[100dvh] w-full bg-[#FFF0F5] flex flex-col relative overflow-hidden font-sans select-none">
        
        {/* --- 1. TOP 40VH THEME --- */}
        <div className="relative h-[40vh] w-full bg-gradient-to-br from-rose-400 via-rose-500 to-pink-500 overflow-hidden">
          {[...Array(10)].map((_, i) => <FallingPetal key={i} delay={i * 1.2} />)}
          
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 5, repeat: Infinity }}>
                <Heart className="w-72 h-72 text-white/10 fill-white/5" strokeWidth={0.5} />
            </motion.div>
          </div>

          <header className="absolute top-0 w-full z-50 flex items-center justify-between p-6 pt-12">
            <button onClick={() => router.back()} className="p-2 bg-white/20 backdrop-blur-xl rounded-full text-white"><ChevronLeft /></button>
            <h1 className="text-xl font-black text-white tracking-[0.2em] uppercase italic drop-shadow-lg">Love House</h1>
            <button className="p-2 bg-white/20 backdrop-blur-xl rounded-full text-white"><HelpCircle /></button>
          </header>
        </div>

        {/* --- 2. THE FLOATING CONNECTION CARD (The "Circle Card") --- */}
        <div className="relative z-30 -mt-20 flex justify-center px-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }} 
              animate={{ y: 0, opacity: 1 }}
              className="bg-white/90 backdrop-blur-2xl rounded-[3rem] p-4 shadow-[0_20px_50px_rgba(244,63,94,0.15)] border border-white flex items-center gap-4 min-w-[300px] justify-between"
            >
                {/* User Side */}
                <div className="flex flex-col items-center gap-1">
                    <div className="relative p-1 rounded-full bg-rose-100 border border-rose-200">
                        <Avatar className="h-16 w-16 border-2 border-white">
                            <AvatarImage src={userProfile?.avatarUrl} />
                            <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 bg-rose-500 rounded-full p-1 border-2 border-white">
                            <Sparkles className="h-3 w-3 text-white" />
                        </div>
                    </div>
                    <span className="text-[10px] font-black text-rose-500 uppercase">{userProfile?.username?.split(' ')[0]}</span>
                </div>

                {/* The "Heart Beat" Bridge */}
                <div className="flex-1 flex flex-col items-center justify-center relative px-2">
                    <Activity className="h-5 w-5 text-rose-400 animate-pulse absolute -top-4" />
                    <div className="w-full h-[2px] bg-gradient-to-r from-rose-200 via-rose-500 to-rose-200 rounded-full relative">
                        <motion.div 
                            animate={{ left: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-rose-600 rounded-full blur-[1px]" 
                        />
                    </div>
                    <Heart className={cn("h-6 w-6 mt-2", activeCp ? "text-rose-600 fill-rose-600 animate-bounce" : "text-rose-200")} />
                </div>

                {/* Partner / Plus Side */}
                <div className="flex flex-col items-center gap-1">
                    {activeCp ? (
                        <div className="relative p-1 rounded-full bg-rose-100 border border-rose-200">
                             <Avatar className="h-16 w-16 border-2 border-white">
                                <AvatarImage src={partnerProfile?.avatarUrl} />
                                <AvatarFallback>P</AvatarFallback>
                            </Avatar>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setShowSearch(true)}
                            className="h-16 w-16 rounded-full bg-rose-50 border-2 border-dashed border-rose-300 flex items-center justify-center group hover:bg-rose-100 transition-colors"
                        >
                            <Plus className="h-8 w-8 text-rose-400 group-hover:scale-110 transition-transform" />
                        </button>
                    )}
                    <span className="text-[10px] font-black text-rose-400 uppercase">
                        {activeCp ? partnerProfile?.username?.split(' ')[0] : 'Connect'}
                    </span>
                </div>
            </motion.div>
        </div>

        {/* --- 3. ROSE PINK BODY (60VH Area) --- */}
        <main className="flex-1 px-6 pt-10 overflow-y-auto">
           {isCpLoading ? (
             <div className="flex flex-col items-center justify-center h-40 gap-3">
                <Loader className="h-8 w-8 text-rose-400 animate-spin" />
                <span className="text-[10px] font-bold text-rose-300 uppercase tracking-widest">Syncing Hearts...</span>
             </div>
           ) : activeCp ? (
             /* STATS DISPLAY */
             <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/60 p-5 rounded-[2rem] border border-white shadow-sm">
                        <span className="text-[9px] font-bold text-rose-300 uppercase">Bond Level</span>
                        <h3 className="text-2xl font-black text-rose-600">LV.{activeCp.level || 1}</h3>
                    </div>
                    <div className="bg-white/60 p-5 rounded-[2rem] border border-white shadow-sm text-right">
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
                        <button key={item.label} className="bg-white/80 p-4 rounded-[2rem] flex flex-col items-center gap-2 shadow-sm active:scale-95 transition-all">
                            <div className={cn("p-2 rounded-xl text-white shadow-md", item.color)}>
                                <item.icon className="h-5 w-5" />
                            </div>
                            <span className="text-[9px] font-bold text-rose-400 uppercase">{item.label}</span>
                        </button>
                    ))}
                </div>
             </div>
           ) : (
             /* EMPTY STATE MESSAGE */
             <div className="text-center py-10">
                <p className="text-rose-400/60 font-medium text-xs uppercase tracking-widest leading-loose">
                    Your Love House feels a bit quiet.<br/>Invite a partner to start your journey.
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
