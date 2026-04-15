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
  Palette,
  Users
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { collection, query, where, limit } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';

// --- Decorative Components ---

const FloatingHeart = ({ delay = 0, x = "50%", color = "text-white/20" }) => (
  <motion.div
    initial={{ y: 100, opacity: 0, scale: 0 }}
    animate={{ y: -500, opacity: [0, 1, 0], scale: [0.5, 1, 0.8] }}
    transition={{ duration: 6, repeat: Infinity, delay, ease: "linear" }}
    className="absolute z-0 pointer-events-none"
    style={{ left: x }}
  >
    <Heart className={cn("h-6 w-6 fill-current", color)} />
  </motion.div>
);

const AngelWing = ({ side, color = "white" }: { side: 'left' | 'right', color?: string }) => (
  <motion.svg
    viewBox="0 0 200 200"
    className={cn(
      "absolute w-[180px] h-[180px] z-0 opacity-80 filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]",
      side === 'left' ? "-translate-x-28" : "translate-x-28 scale-x-[-1]"
    )}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{
      opacity: 1,
      scale: 1,
      rotate: side === 'left' ? [-2, 4, -2] : [2, -4, 2]
    }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
  >
    <path
      fill={color}
      d="M20,100 C20,100 50,20 120,40 C150,50 180,90 180,120 C180,150 150,180 120,170 C100,165 80,140 80,140 L40,160 L60,120 L20,100 Z"
      className="opacity-90"
    />
  </motion.svg>
);

const PrivilegeItem = ({ label, icon: Icon, color }: { label: string, icon: any, color: string }) => (
  <div className="flex flex-col items-center gap-2 group">
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className={cn(
        "w-14 h-14 rounded-2xl border border-white/20 shadow-lg flex items-center justify-center transition-all",
        color
      )}
    >
      <Icon className="h-6 w-6 text-white" />
    </motion.div>
    <span className="text-[9px] font-bold text-pink-200/70 tracking-widest uppercase">{label}</span>
  </div>
);

const RulesSheet = ({ isOpen, onClose, title }: { isOpen: boolean; onClose: () => void; title: string }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 z-[100] backdrop-blur-md"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[101] bg-[#0a192f] border-t-2 border-blue-500 rounded-t-[3rem] max-h-[70vh] overflow-hidden flex flex-col"
        >
          <div className="p-8 pt-12 overflow-y-auto">
            <button onClick={onClose} className="absolute right-6 top-6 text-blue-400">
              <X className="h-6 w-6" />
            </button>
            <div className="space-y-6">
               <h2 className="text-white font-black text-xl italic uppercase tracking-tighter">{title} Rules</h2>
               <div className="space-y-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <p className="text-blue-200 text-xs leading-relaxed">Invite your friends to your friendship house and build bonds together.</p>
                  </div>
               </div>
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

  const [activeMainTab, setActiveMainTab] = useState<'cp' | 'friend'>('friend');
  const [activeFriendSubTab, setActiveFriendSubTab] = useState<'friend' | 'privileges' | 'rules'>('friend');
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
        "h-[100dvh] w-full flex flex-col relative overflow-hidden font-sans select-none transition-colors duration-700",
        activeMainTab === 'cp' ? "bg-[#1a050d]" : "bg-[#060b1d]"
      )}>

        {/* --- HEADER --- */}
        <header className="absolute top-0 w-full z-50 flex items-center justify-between px-6 pt-12">
          <button onClick={() => router.back()} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex bg-black/40 backdrop-blur-xl p-1 rounded-full border border-white/10">
            <button 
              onClick={() => setActiveMainTab('cp')}
              className={cn(
                "px-6 py-1.5 rounded-full text-[10px] font-black transition-all tracking-widest",
                activeMainTab === 'cp' ? "bg-rose-600 text-white shadow-lg" : "text-white/40"
              )}
            >
              CP HOUSE
            </button>
            <button 
              onClick={() => setActiveMainTab('friend')}
              className={cn(
                "px-6 py-1.5 rounded-full text-[10px] font-black transition-all tracking-widest",
                activeMainTab === 'friend' ? "bg-blue-600 text-white shadow-lg" : "text-white/40"
              )}
            >
              FRIENDS
            </button>
          </div>

          <button onClick={() => setShowRules(true)} className="p-2 bg-white/10 backdrop-blur-md rounded-full text-white">
            <HelpCircle className="h-5 w-5" />
          </button>
        </header>

        {/* --- CP VIEW (UNCHANGED) --- */}
        {activeMainTab === 'cp' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <div className="relative h-[40vh] w-full bg-gradient-to-b from-rose-500 via-pink-600 to-[#2d0714] flex flex-col items-center justify-center overflow-hidden">
              <FloatingHeart x="15%" delay={0} />
              <FloatingHeart x="85%" delay={2} />
              <div className="relative flex items-center justify-center mt-10">
                <AngelWing side="left" />
                <AngelWing side="right" />
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }} className="relative z-10">
                  <Heart className="h-28 w-28 text-white fill-white/20 drop-shadow-2xl" />
                </motion.div>
              </div>
            </div>
            <div className="relative z-30 -mt-12 flex justify-center px-8">
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-4 border border-white/10 flex items-center gap-8 w-full max-w-sm justify-between shadow-2xl">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-16 w-16 border-2 border-pink-500 p-0.5">
                    <AvatarImage src={userProfile?.avatarUrl} />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] font-bold text-white/60 tracking-tighter uppercase">{userProfile?.username?.split(' ')[0]}</span>
                </div>
                <Heart className={cn("h-6 w-6", activeCp ? "text-rose-500 fill-rose-500" : "text-white/20")} />
                <div className="flex flex-col items-center gap-2">
                   <button onClick={() => setShowSearch(true)} className="h-16 w-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-white/30" />
                   </button>
                   <span className="text-[9px] font-bold text-white/30 tracking-tighter uppercase">Partner</span>
                </div>
              </div>
            </div>
            <main className="flex-1 bg-[#2d0714] mt-6 mx-4 mb-6 rounded-[2.5rem] border border-white/5 overflow-hidden">
               <div className="pt-8 pb-4 flex justify-center">
                  <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10 flex items-center gap-2">
                    <Crown className="h-3 w-3 text-yellow-500" />
                    <span className="text-white font-bold text-[10px] uppercase tracking-[0.2em]">Privileges</span>
                  </div>
               </div>
               <div className="grid grid-cols-3 gap-y-8 px-8 py-4">
                    <PrivilegeItem label="CP Gift" icon={Gift} color="bg-rose-500/20" />
                    <PrivilegeItem label="Icon" icon={Heart} color="bg-purple-500/20" />
                    <PrivilegeItem label="Badge" icon={Trophy} color="bg-orange-500/20" />
               </div>
            </main>
          </motion.div>
        )}

        {/* --- FRIEND VIEW (New Blue Design) --- */}
        {activeMainTab === 'friend' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            
            {/* 40vh TOP THEME SECTION (Blue Theme) */}
            <div className="relative h-[40vh] w-full bg-gradient-to-b from-blue-500 via-indigo-600 to-[#0e1b35] flex flex-col items-center justify-center overflow-hidden">
              <FloatingHeart x="10%" delay={1} color="text-blue-200/20" />
              <FloatingHeart x="90%" delay={3} color="text-cyan-200/20" />
              
              <div className="relative flex items-center justify-center mt-12">
                <AngelWing side="left" color="#60a5fa" />
                <AngelWing side="right" color="#60a5fa" />
                
                {/* Handshake Stage */}
                <div className="relative z-10 flex flex-col items-center">
                   <div className="absolute -bottom-4 w-32 h-10 bg-blue-400/20 blur-2xl rounded-full" />
                   {/* Gold/Glowing Stage Circle */}
                   <div className="w-36 h-12 bg-gradient-to-t from-yellow-600/40 to-transparent border-t-2 border-yellow-400/50 rounded-[100%] absolute translate-y-16" />
                   <div className="w-44 h-16 bg-gradient-to-t from-yellow-700/20 to-transparent border-t border-yellow-500/30 rounded-[100%] absolute translate-y-20" />
                   
                   <motion.div 
                    animate={{ y: [0, -10, 0] }} 
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                   >
                    <Handshake className="h-24 w-24 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
                   </motion.div>
                </div>
              </div>
            </div>

            {/* Sub Tabs Section */}
            <div className="relative z-30 -mt-8 flex justify-center px-4">
                <div className="flex gap-2 bg-black/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                    {['friend', 'privileges', 'rules'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveFriendSubTab(tab as any)}
                            className={cn(
                                "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                                activeFriendSubTab === tab 
                                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg" 
                                    : "text-blue-200/40 hover:text-blue-200"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* 60vh BLUE LIST SECTION */}
            <main className="flex-1 bg-[#0e1b35] mt-6 mx-4 mb-6 rounded-[2.5rem] border border-blue-500/10 shadow-2xl overflow-hidden flex flex-col">
               
               {/* Friend 0/9 Header */}
               <div className="pt-6 pb-2 flex justify-center">
                  <div className="relative group">
                      <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full" />
                      <div className="relative bg-[#162a45] px-10 py-2.5 rounded-xl border border-blue-400/30 flex items-center gap-3">
                         <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                         <span className="text-blue-100 font-black text-xs uppercase tracking-[0.15em] italic">
                            Friend 0/9
                         </span>
                         <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
                      </div>
                      {/* Decorative corner wings on label */}
                      <div className="absolute -left-2 -top-1 text-blue-400/50"><Sparkles size={12}/></div>
                      <div className="absolute -right-2 -top-1 text-blue-400/50"><Sparkles size={12}/></div>
                  </div>
               </div>

               {/* Slots Grid */}
               <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  
                  {/* Slot 1: Invite */}
                  <motion.div 
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowSearch(true)}
                    className="w-full h-36 bg-[#162a45]/50 rounded-[2rem] border border-dashed border-blue-400/20 flex flex-col items-center justify-center gap-3 hover:bg-[#162a45] transition-colors group"
                  >
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="text-blue-400 h-6 w-6" />
                    </div>
                    <span className="text-blue-400/60 font-bold text-[10px] uppercase tracking-widest">Invite</span>
                  </motion.div>

                  {/* Slot 2: Locked */}
                  <div className="w-full h-36 bg-[#162a45]/30 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-3 opacity-60">
                    <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                        <Lock className="text-slate-500 h-5 w-5" />
                    </div>
                    <span className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">unlock</span>
                  </div>

                  <div className="h-10" /> {/* Bottom Padding */}
               </div>
            </main>
          </motion.div>
        )}

        {/* --- Dialogs --- */}
        <RulesSheet 
            isOpen={showRules} 
            onClose={() => setShowRules(false)} 
            title={activeMainTab === 'cp' ? 'CP' : 'Friend'} 
        />
        <UserSearchDialog isOpen={showSearch} onClose={() => setShowSearch(false)} onSelect={handleProposeTarget} />
        {selectedTarget && (
          <CPProposeDialog isOpen={showPropose} onClose={() => { setShowPropose(false); setSelectedTarget(null); }} targetUser={selectedTarget} />
        )}
      </div>
    </AppLayout>
  );
}q
