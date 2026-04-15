'use client';

import { useState, useEffect } from 'react';
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
  LucideIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { collection, query, where, limit } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';

// --- Types ---
type TabType = 'friend' | 'privileges' | 'rules';

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

const PrivilegeItem = ({ label, icon: Icon, color }: { label: string, icon: LucideIcon, color: string }) => (
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
    <span className="text-[9px] font-bold text-white/50 tracking-widest uppercase">{label}</span>
  </div>
);

export default function CpHousePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile } = useUserProfile(user?.uid);
  
  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'cp' | 'friend'>('friend');
  const [activeFriendSubTab, setActiveFriendSubTab] = useState<TabType>('friend');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [showPropose, setShowPropose] = useState(false);
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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

  if (!isMounted) return null;

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

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex flex-col h-full">
          
          {/* TOP 40vh (Dynamic based on Tab) */}
          <div className={cn(
            "relative h-[40vh] w-full flex flex-col items-center justify-center overflow-hidden transition-all duration-1000",
            activeMainTab === 'cp' 
              ? "bg-gradient-to-b from-rose-500 via-pink-600 to-[#1a050d]" 
              : "bg-gradient-to-b from-blue-500 via-indigo-600 to-[#0e1b35]"
          )}>
            {activeMainTab === 'cp' ? (
              <>
                <FloatingHeart x="15%" delay={0} />
                <FloatingHeart x="85%" delay={2} />
                <div className="relative flex items-center justify-center mt-10">
                  <AngelWing side="left" color="white" />
                  <AngelWing side="right" color="white" />
                  <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 4, repeat: Infinity }} className="relative z-10">
                    <Heart className="h-24 w-24 text-white fill-white/20 drop-shadow-2xl" />
                  </motion.div>
                </div>
              </>
            ) : (
              <>
                <FloatingHeart x="10%" delay={1} color="text-blue-200/20" />
                <FloatingHeart x="90%" delay={3} color="text-cyan-200/20" />
                <div className="relative flex items-center justify-center mt-12">
                  <AngelWing side="left" color="#60a5fa" />
                  <AngelWing side="right" color="#60a5fa" />
                  <div className="relative z-10 flex flex-col items-center">
                     <div className="w-36 h-12 bg-gradient-to-t from-yellow-600/40 to-transparent border-t-2 border-yellow-400/50 rounded-[100%] absolute translate-y-16" />
                     <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                        <Handshake className="h-24 w-24 text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]" />
                     </motion.div>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* MIDDLE NAVIGATION / AVATARS */}
          <div className="relative z-30 -mt-10 flex justify-center px-6">
            {activeMainTab === 'cp' ? (
              <div className="bg-white/5 backdrop-blur-2xl rounded-3xl p-4 border border-white/10 flex items-center gap-8 w-full max-w-sm justify-between shadow-2xl">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-14 w-14 border-2 border-pink-500">
                    <AvatarImage src={userProfile?.avatarUrl} />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] font-bold text-white/60 uppercase">{userProfile?.username?.split(' ')[0] || 'User'}</span>
                </div>
                <Heart className={cn("h-6 w-6", activeCp ? "text-rose-500 fill-rose-500" : "text-white/20")} />
                <div className="flex flex-col items-center gap-2">
                   <button onClick={() => setShowSearch(true)} className="h-14 w-14 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                      <Plus className="h-5 w-5 text-white/30" />
                   </button>
                   <span className="text-[9px] font-bold text-white/30 uppercase">Partner</span>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 bg-black/40 backdrop-blur-2xl p-1.5 rounded-2xl border border-white/10 shadow-2xl">
                {(['friend', 'privileges', 'rules'] as TabType[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveFriendSubTab(tab)}
                    className={cn(
                      "px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all",
                      activeFriendSubTab === tab 
                        ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg" 
                        : "text-blue-200/40"
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* BOTTOM 60vh CONTENT */}
          <main className={cn(
            "flex-1 mt-6 mx-4 mb-6 rounded-[2.5rem] border overflow-hidden flex flex-col shadow-2xl",
            activeMainTab === 'cp' ? "bg-[#2d0714] border-white/5" : "bg-[#0e1b35] border-blue-500/10"
          )}>
            {activeMainTab === 'cp' ? (
              /* CP PRIVILEGES VIEW */
              <div className="flex-1 overflow-y-auto p-8">
                <div className="flex justify-center mb-8">
                   <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10 flex items-center gap-2">
                     <Crown className="h-3 w-3 text-yellow-500" />
                     <span className="text-white font-bold text-[10px] uppercase tracking-[0.2em]">Privileges</span>
                   </div>
                </div>
                <div className="grid grid-cols-3 gap-y-8">
                  <PrivilegeItem label="CP Gift" icon={Gift} color="bg-rose-500/20" />
                  <PrivilegeItem label="Icon" icon={Heart} color="bg-purple-500/20" />
                  <PrivilegeItem label="Badge" icon={Trophy} color="bg-orange-500/20" />
                  <PrivilegeItem label="Frame" icon={Palette} color="bg-blue-500/20" />
                  <PrivilegeItem label="Wall" icon={Camera} color="bg-emerald-500/20" />
                  <PrivilegeItem label="Chat" icon={MessageCircleHeart} color="bg-pink-500/20" />
                </div>
              </div>
            ) : (
              /* FRIENDS SUB-TAB LOGIC */
              <div className="flex-1 flex flex-col overflow-hidden">
                {activeFriendSubTab === 'friend' && (
                  <div className="flex-1 flex flex-col">
                    <div className="pt-6 pb-2 flex justify-center">
                      <div className="relative bg-[#162a45] px-10 py-2.5 rounded-xl border border-blue-400/30 flex items-center gap-3">
                         <span className="text-blue-100 font-black text-xs uppercase tracking-[0.15em] italic">Friend 0/9</span>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      <motion.div 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowSearch(true)}
                        className="w-full h-32 bg-[#162a45]/50 rounded-[2rem] border border-dashed border-blue-400/20 flex flex-col items-center justify-center gap-2"
                      >
                        <Plus className="text-blue-400 h-6 w-6" />
                        <span className="text-blue-400/60 font-bold text-[10px] uppercase">Invite</span>
                      </motion.div>
                      {[...Array(2)].map((_, i) => (
                        <div key={i} className="w-full h-32 bg-[#162a45]/30 rounded-[2rem] border border-white/5 flex flex-col items-center justify-center gap-2 opacity-40">
                          <Lock className="text-slate-500 h-5 w-5" />
                          <span className="text-slate-500 font-bold text-[10px] uppercase">locked</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeFriendSubTab === 'privileges' && (
                  <div className="flex-1 p-8 grid grid-cols-3 gap-y-8">
                    <PrivilegeItem label="Shared" icon={Users} color="bg-blue-500/20" />
                    <PrivilegeItem label="Gifts" icon={Gift} color="bg-cyan-500/20" />
                    <PrivilegeItem label="Badges" icon={Trophy} color="bg-indigo-500/20" />
                  </div>
                )}

                {activeFriendSubTab === 'rules' && (
                  <div className="flex-1 p-8 text-blue-200/70 text-[11px] leading-relaxed space-y-4">
                    <p>• Invite up to 9 friends to join your house.</p>
                    <p>• Stay active on mic together to earn points.</p>
                    <p>• Sending gifts increases intimacy levels.</p>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>

        {/* --- Dialogs --- */}
        <UserSearchDialog isOpen={showSearch} onClose={() => setShowSearch(false)} onSelect={handleProposeTarget} />
        {selectedTarget && (
          <CPProposeDialog isOpen={showPropose} onClose={() => { setShowPropose(false); setSelectedTarget(null); }} targetUser={selectedTarget} />
        )}
      </div>
    </AppLayout>
  );
}
