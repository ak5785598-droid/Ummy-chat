'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { AppLayout } from '@/components/layout/app-layout';
import {
  ChevronLeft,
  Plus,
  Heart,
  HelpCircle,
  X,
  Lock,
  Handshake,
  Sparkles,
  Gift,
  Trophy,
  Crown,
  Camera,
  MessageCircleHeart,
  Palette
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { collection, query, where, limit } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';

// --- Decorative Components ---

const FloatingHeart = ({ delay = 0, x = "50%" }) => (
  <motion.div
    initial={{ y: 100, opacity: 0, scale: 0 }}
    animate={{ y: -500, opacity: [0, 1, 0], scale: [0.5, 1, 0.8] }}
    transition={{ duration: 6, repeat: Infinity, delay, ease: "linear" }}
    className="absolute z-0 pointer-events-none"
    style={{ left: x }}
  >
    <Heart className="text-white/30 fill-white/20 h-6 w-6" />
  </motion.div>
);

const AngelWing = ({ side, color = "white" }: { side: 'left' | 'right', color?: string }) => (
  <motion.svg
    viewBox="0 0 200 200"
    className={cn(
      "absolute w-[180px] h-[180px] z-0 opacity-90 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]",
      side === 'left' ? "-translate-x-28" : "translate-x-28 scale-x-[-1]"
    )}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: 1,
      scale: 1,
      rotate: side === 'left' ? [-3, 6, -3] : [3, -6, 3]
    }}
    transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
  >
    <path
      fill={color}
      d="M20,100 C20,100 50,20 120,40 C150,50 180,90 180,120 C180,150 150,180 120,170 C100,165 80,140 80,140 L40,160 L60,120 L20,100 Z"
      className="opacity-95"
    />
  </motion.svg>
);

const PrivilegeItem = ({ label, icon: Icon, color }: { label: string, icon: any, color: string }) => (
  <div className="flex flex-col items-center gap-3 group">
    <motion.div 
      whileHover={{ scale: 1.1, rotate: 5 }}
      className={cn(
        "w-16 h-16 rounded-2xl border-2 border-white shadow-lg flex items-center justify-center transition-all",
        color
      )}
    >
      <Icon className="h-8 w-8 text-white drop-shadow-md" />
    </motion.div>
    <span className="text-xs font-bold text-pink-700/80 tracking-wide">{label}</span>
  </div>
);

const RulesSheet = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-md"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[101] bg-white border-t-[6px] border-pink-500 rounded-t-[3.5rem] max-h-[80vh] overflow-hidden flex flex-col"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-gradient-to-r from-pink-600 to-rose-500 px-14 py-3 rounded-full shadow-2xl border-4 border-white">
              <span className="text-white font-black text-lg uppercase tracking-[0.2em]">Rules</span>
            </div>
          </div>
          <div className="p-10 pt-16 overflow-y-auto">
            <button onClick={onClose} className="absolute right-8 top-8 text-pink-400 hover:text-pink-600 transition-colors">
              <X className="h-8 w-8" />
            </button>
            <div className="space-y-8 text-pink-900/80 leading-relaxed font-semibold">
              <section className="bg-pink-50 p-5 rounded-2xl border border-pink-100">
                <h3 className="text-pink-700 font-black text-lg mb-3 flex items-center gap-2">
                  <Heart className="h-5 w-5 fill-pink-500 text-pink-500" /> How to become CP?
                </h3>
                <p className="text-sm">Click the "Invite" button on Profile Page or from "Me - CP/Friendship", select the friend you want to bind and send the invitation.</p>
              </section>
              <section className="bg-pink-50 p-5 rounded-2xl border border-pink-100">
                <h3 className="text-pink-700 font-black text-lg mb-3 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-500" /> How to improve CP level?
                </h3>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-pink-400" />
                    <span>Sending gifts: 1 coin = 1 point</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-pink-400" />
                    <span>On mic together: 5 mins = 200 points</span>
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

export default function CpHousePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile } = useUserProfile(user?.uid);

  const [activeMainTab, setActiveMainTab] = useState<'cp' | 'friend'>('cp');
  const [friendSubTab, setFriendSubTab] = useState<'friend' | 'privileges' | 'rules'>('friend');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [showPropose, setShowPropose] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const cpQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    return query(collection(firestore, 'cpPairs'), where('participantIds', 'array-contains', user.uid), limit(1));
  }, [firestore, user?.uid]);

  const { data: cpData } = useCollection(cpQuery);
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
      <div className={cn(
        "h-[100dvh] w-full flex flex-col relative overflow-hidden font-sans select-none transition-all duration-700",
        activeMainTab === 'cp' ? "bg-rose-50" : "bg-[#0a192f]"
      )}>

        {/* --- Floating Elements --- */}
        {activeMainTab === 'cp' && (
          <>
            <FloatingHeart x="10%" delay={0} />
            <FloatingHeart x="30%" delay={2} />
            <FloatingHeart x="70%" delay={1} />
            <FloatingHeart x="90%" delay={3} />
          </>
        )}

        {/* --- HEADER --- */}
        <header className="absolute top-0 w-full z-50 flex items-center justify-between px-6 pt-12">
          <button onClick={() => router.back()} className="p-2.5 bg-black/10 backdrop-blur-md rounded-full text-white border border-white/20">
            <ChevronLeft className="h-6 w-6" />
          </button>
          
          <div className="flex bg-black/20 backdrop-blur-xl p-1.5 rounded-full border border-white/20">
            <button 
              onClick={() => setActiveMainTab('cp')}
              className={cn(
                "px-8 py-2 rounded-full text-sm font-black transition-all duration-300 tracking-widest",
                activeMainTab === 'cp' ? "bg-white text-rose-500 shadow-xl" : "text-white/70"
              )}
            >
              CP
            </button>
            <button 
              onClick={() => setActiveMainTab('friend')}
              className={cn(
                "px-8 py-2 rounded-full text-sm font-black transition-all duration-300 tracking-widest",
                activeMainTab === 'friend' ? "bg-white text-blue-600 shadow-xl" : "text-white/70"
              )}
            >
              FRIEND
            </button>
          </div>

          <button onClick={() => setShowRules(true)} className="p-2.5 bg-black/10 backdrop-blur-md rounded-full text-white border border-white/20">
            <HelpCircle className="h-6 w-6" />
          </button>
        </header>

        {/* --- CP VIEW --- */}
        {activeMainTab === 'cp' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            
            {/* LOVE THEME SECTION */}
            <div className="relative h-[40vh] w-full bg-gradient-to-b from-rose-400 via-pink-400 to-rose-50 flex flex-col items-center justify-center overflow-hidden">
              <div className="absolute top-[-10%] w-[300px] h-[300px] bg-white/20 blur-[100px] rounded-full" />
              
              <div className="relative flex items-center justify-center mt-8">
                <AngelWing side="left" color="white" />
                <AngelWing side="right" color="white" />
                
                <motion.div 
                  animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }} 
                  transition={{ duration: 4, repeat: Infinity }}
                  className="relative z-10"
                >
                  <Heart className="h-36 w-36 text-white fill-rose-500/90 drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]" />
                  <div className="absolute inset-0 flex items-center justify-center">
                     <Sparkles className="h-10 w-10 text-yellow-200 animate-pulse" />
                  </div>
                </motion.div>
              </div>
            </div>

            {/* AVATARS BRIDGE */}
            <div className="relative z-30 -mt-16 flex justify-center px-8">
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white/80 backdrop-blur-2xl rounded-[2.5rem] p-5 shadow-[0_20px_50px_rgba(244,114,182,0.3)] border border-white flex items-center gap-6 w-full max-w-md justify-between"
              >
                <div className="flex flex-col items-center gap-2">
                  <div className="relative">
                    <div className="absolute inset-0 bg-rose-400 blur-md rounded-full opacity-40 animate-pulse" />
                    <Avatar className="h-20 w-20 border-4 border-white shadow-md relative z-10">
                      <AvatarImage src={userProfile?.avatarUrl} />
                      <AvatarFallback className="bg-rose-100 text-rose-500 font-bold">ME</AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="text-[11px] font-black text-rose-600 bg-rose-100 px-3 py-1 rounded-full uppercase tracking-tighter">
                    {userProfile?.username?.split(' ')[0] || 'Me'}
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center gap-1">
                   <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                     <Heart className={cn("h-8 w-8", activeCp ? "text-rose-500 fill-rose-500" : "text-rose-200")} />
                   </motion.div>
                   <div className="h-1 w-16 bg-gradient-to-r from-transparent via-rose-200 to-transparent rounded-full" />
                </div>

                <div className="flex flex-col items-center gap-2">
                  {activeCp ? (
                    <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                      <AvatarImage src={partnerProfile?.avatarUrl} />
                    </Avatar>
                  ) : (
                    <motion.button 
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setShowSearch(true)} 
                      className="h-20 w-20 rounded-full border-4 border-dashed border-rose-200 bg-rose-50 flex items-center justify-center group"
                    >
                      <Plus className="h-10 w-10 text-rose-300 group-hover:text-rose-500 transition-colors" />
                    </motion.button>
                  )}
                  <span className="text-[11px] font-black text-rose-300 bg-white border border-rose-100 px-3 py-1 rounded-full uppercase tracking-tighter">Partner</span>
                </div>
              </motion.div>
            </div>

            {/* PRIVILEGES SECTION */}
            <main className="flex-1 bg-white/40 backdrop-blur-sm mt-8 mx-6 mb-8 rounded-[3rem] border border-white/60 shadow-[inset_0_2px_10px_rgba(255,255,255,0.8)] overflow-y-auto relative p-10 pt-20">
               
               {/* --- Yahan Change Kiya Hai: top-0 se top-2 kiya --- */}
               <div className="absolute top-2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                 <div className="relative">
                    <div className="absolute inset-0 bg-orange-400 blur-xl opacity-30" />
                    <div className="relative bg-gradient-to-r from-orange-400 via-rose-500 to-pink-600 px-12 py-3 rounded-2xl border-2 border-white shadow-xl flex items-center gap-3">
                      <Crown className="h-5 w-5 text-yellow-200 fill-yellow-200" />
                      <span className="text-white font-black text-base uppercase tracking-widest italic drop-shadow-sm">Privileges</span>
                    </div>
                 </div>
               </div>

               <div className="grid grid-cols-3 gap-x-6 gap-y-10">
                 <PrivilegeItem label="Gift" icon={Gift} color="bg-gradient-to-br from-pink-400 to-rose-500" />
                 <PrivilegeItem label="CP Icon" icon={Heart} color="bg-gradient-to-br from-purple-400 to-pink-500" />
                 <PrivilegeItem label="Badge" icon={Trophy} color="bg-gradient-to-br from-yellow-400 to-orange-500" />
                 <PrivilegeItem label="Frame" icon={Palette} color="bg-gradient-to-br from-blue-400 to-indigo-500" />
                 <PrivilegeItem label="Room BG" icon={Camera} color="bg-gradient-to-br from-green-400 to-emerald-500" />
                 <PrivilegeItem label="Emoji" icon={MessageCircleHeart} color="bg-gradient-to-br from-rose-400 to-pink-600" />
               </div>

               <div className="mt-12 text-center">
                  <p className="text-[10px] font-bold text-rose-400/60 uppercase tracking-widest">Upgrade level to unlock more</p>
               </div>
            </main>
          </motion.div>
        )}

        {/* --- FRIEND VIEW --- */}
        {activeMainTab === 'friend' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full pt-20">
             <div className="flex-1 flex flex-col items-center justify-center p-8">
                <Handshake className="h-24 w-24 text-blue-400 mb-4 opacity-50" />
                <h2 className="text-blue-200 font-black text-xl tracking-tighter italic">Coming Soon...</h2>
                <p className="text-blue-400/60 text-sm mt-2 font-bold uppercase tracking-widest">Friendship system is being polished</p>
             </div>
          </motion.div>
        )}

        {/* Dialogs */}
        <RulesSheet isOpen={showRules} onClose={() => setShowRules(false)} />
        <UserSearchDialog isOpen={showSearch} onClose={() => setShowSearch(false)} onSelect={handleProposeTarget} />
        {selectedTarget && (
          <CPProposeDialog isOpen={showPropose} onClose={() => { setShowPropose(false); setSelectedTarget(null); }} targetUser={selectedTarget} />
        )}
      </div>
    </AppLayout>
  );
}
