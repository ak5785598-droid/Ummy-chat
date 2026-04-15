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
  Handshake
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { collection, query, where, limit } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';

// --- Decorative Components ---

const AngelWing = ({ side, color = "white" }: { side: 'left' | 'right', color?: string }) => (
  <motion.svg
    viewBox="0 0 200 200"
    className={cn(
      "absolute w-[150px] h-[150px] z-0 opacity-80 filter drop-shadow-[0_0_10px_rgba(255,255,255,0.6)]",
      side === 'left' ? "-translate-x-24" : "translate-x-24 scale-x-[-1]"
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
      fill={color}
      d="M20,100 C20,100 50,20 120,40 C150,50 180,90 180,120 C180,150 150,180 120,170 C100,165 80,140 80,140 L40,160 L60,120 L20,100 Z"
      className="opacity-90"
    />
  </motion.svg>
);

const PrivilegeItem = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center gap-2">
    <div className="w-full aspect-square rounded-xl bg-gradient-to-b from-[#ffbce3] to-[#ff8dc8] border border-white/40 shadow-sm flex items-center justify-center">
    </div>
    <span className="text-[10px] font-medium text-pink-600/80">{label}</span>
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
          className="fixed inset-0 bg-black/40 z-[100] backdrop-blur-sm"
        />
        <motion.div
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[101] bg-[#fff1f9] border-t-4 border-[#f472b6] rounded-t-[3rem] max-h-[85vh] overflow-hidden flex flex-col"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-[#db2777] px-12 py-2 rounded-full shadow-lg border-2 border-white">
              <span className="text-white font-black text-sm uppercase tracking-widest">Rules</span>
            </div>
          </div>
          <div className="p-8 pt-12 overflow-y-auto">
            <button onClick={onClose} className="absolute right-6 top-6 text-pink-400 hover:text-pink-600">
              <X className="h-6 w-6" />
            </button>
            <div className="space-y-6 text-sm text-pink-800/80 leading-relaxed font-medium">
              <section>
                <h3 className="text-[#be185d] font-bold text-base mb-2">How to become CP?</h3>
                <p>Click the "Invite" button on Profile Page or from "Me - CP/Friendship", select the friend you want to bind and send the invitation.</p>
              </section>
              <section>
                <h3 className="text-[#be185d] font-bold text-base mb-2">How to improve CP level?</h3>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Sending gifts, 1 coins = 1 points</li>
                  <li>On mic together in the same room, every 5 minutes = 200 points</li>
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

  // States
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
        "h-[100dvh] w-full flex flex-col relative overflow-hidden font-sans select-none transition-colors duration-500",
        activeMainTab === 'cp' ? "bg-[#fce7f3]" : "bg-[#1e3a8a]"
      )}>

        {/* --- HEADER --- */}
        <header className="absolute top-0 w-full z-50 flex items-center justify-between px-4 pt-10">
          <button onClick={() => router.back()} className="p-2 text-white">
            <ChevronLeft className="h-7 w-7" />
          </button>
          <div className="flex gap-8 text-white font-bold tracking-widest text-lg items-center relative">
            <button 
              onClick={() => setActiveMainTab('cp')}
              className={cn("transition-opacity", activeMainTab === 'cp' ? "opacity-100 drop-shadow-md" : "opacity-50")}
            >
              CP
            </button>
            <button 
              onClick={() => setActiveMainTab('friend')}
              className={cn("transition-opacity relative", activeMainTab === 'friend' ? "opacity-100 drop-shadow-md" : "opacity-50")}
            >
              Friend
              {activeMainTab === 'friend' && <motion.div layoutId="underline" className="absolute -bottom-1 left-0 right-0 h-1 bg-yellow-400 rounded-full" />}
            </button>
          </div>
          <button onClick={() => setShowRules(true)} className="p-2 text-white">
            <HelpCircle className="h-7 w-7" />
          </button>
        </header>

        {/* --- CP VIEW (PINK) --- */}
        {activeMainTab === 'cp' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <div className="relative h-[40vh] w-full bg-gradient-to-b from-[#ffafd6] to-[#fce7f3] flex flex-col items-center justify-center">
              <div className="relative flex items-center justify-center">
                <AngelWing side="left" color="white" />
                <AngelWing side="right" color="white" />
                <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                  <Heart className="h-28 w-28 text-white fill-pink-400 drop-shadow-xl" />
                </motion.div>
              </div>
            </div>

            <div className="relative z-30 -mt-10 flex justify-center px-6">
              <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-4 shadow-lg border border-white flex items-center gap-4 w-full max-w-sm justify-between">
                <div className="flex flex-col items-center gap-1">
                  <Avatar className="h-14 w-14 border-2 border-pink-200">
                    <AvatarImage src={userProfile?.avatarUrl} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <span className="text-[9px] font-bold text-pink-500 uppercase">{userProfile?.username?.split(' ')[0] || 'Me'}</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                   <Heart className={cn("h-5 w-5", activeCp ? "text-pink-500 fill-pink-500" : "text-pink-200")} />
                </div>
                <div className="flex flex-col items-center gap-1">
                  {activeCp ? (
                    <Avatar className="h-14 w-14 border-2 border-pink-200">
                      <AvatarImage src={partnerProfile?.avatarUrl} />
                    </Avatar>
                  ) : (
                    <button onClick={() => setShowSearch(true)} className="h-14 w-14 rounded-full border-2 border-dashed border-pink-200 flex items-center justify-center">
                      <Plus className="h-6 w-6 text-pink-300" />
                    </button>
                  )}
                  <span className="text-[9px] font-bold text-pink-300 uppercase">Partner</span>
                </div>
              </div>
            </div>

            <main className="flex-1 bg-pink-50/50 mt-4 mx-4 mb-6 rounded-[2.5rem] border border-white shadow-inner overflow-y-auto relative p-10 pt-12">
               <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-orange-300 via-pink-400 to-orange-300 px-10 py-2 rounded-full border-2 border-white shadow-md">
                 <span className="text-white font-bold text-sm">Privileges</span>
               </div>
               <div className="grid grid-cols-3 gap-x-4 gap-y-8">
                 <PrivilegeItem label="Gift" /> <PrivilegeItem label="CP icon" /> <PrivilegeItem label="Badge" />
                 <PrivilegeItem label="Frame" /> <PrivilegeItem label="Room BG" /> <PrivilegeItem label="Emoji" />
               </div>
            </main>
          </motion.div>
        )}

        {/* --- FRIEND VIEW (BLUE - AS PER IMAGE) --- */}
        {activeMainTab === 'friend' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full">
            <div className="relative h-[40vh] w-full bg-gradient-to-b from-[#3b82f6]/40 to-transparent flex flex-col items-center justify-center">
              {/* Handshake Illustration & Wings */}
              <div className="relative mt-10">
                <AngelWing side="left" color="#60a5fa" />
                <AngelWing side="right" color="#60a5fa" />
                <div className="relative z-10 bg-gradient-to-b from-blue-400 to-blue-600 p-4 rounded-full border-4 border-yellow-400/50 shadow-2xl">
                   <Handshake className="h-20 w-20 text-white" />
                </div>
              </div>
              
              {/* Podium base like the image */}
              <div className="absolute bottom-4 w-64 h-12 bg-gradient-to-t from-blue-900/50 to-blue-400/20 rounded-[100%] border-t-2 border-yellow-400/30" />
            </div>

            {/* Sub Tabs: Friend, Privileges, Rules */}
            <div className="flex justify-center gap-3 px-6 z-40">
               {['Friend', 'Privileges', 'Rules'].map((tab) => (
                 <button
                   key={tab}
                   onClick={() => setFriendSubTab(tab.toLowerCase() as any)}
                   className={cn(
                     "px-6 py-2 rounded-xl font-bold text-sm transition-all border-2",
                     friendSubTab === tab.toLowerCase() 
                      ? "bg-gradient-to-b from-blue-400 to-blue-600 text-white border-yellow-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                      : "bg-blue-900/40 text-blue-200 border-blue-700/50"
                   )}
                 >
                   {tab}
                 </button>
               ))}
            </div>

            {/* Friend List Container */}
            <main className="flex-1 bg-[#0f172a]/60 backdrop-blur-md mt-6 mx-4 mb-6 rounded-[2.5rem] border border-blue-500/30 overflow-y-auto p-6 flex flex-col items-center">
                
                {/* Ornate Counter Badge */}
                <div className="relative mb-8 w-full flex justify-center">
                    <div className="absolute inset-0 bg-blue-400 blur-xl opacity-20" />
                    <div className="relative bg-gradient-to-r from-blue-700 via-blue-500 to-blue-700 px-12 py-1.5 rounded-md border-y-2 border-yellow-400/80 shadow-lg">
                        <div className="absolute -left-2 top-0 bottom-0 w-4 bg-yellow-400/20 skew-x-12" />
                        <span className="text-white font-black text-xs italic tracking-widest">Friend 0/9</span>
                        <div className="absolute -right-2 top-0 bottom-0 w-4 bg-yellow-400/20 -skew-x-12" />
                    </div>
                </div>

                {/* Slots */}
                <div className="w-full space-y-4">
                  {/* Invite Slot */}
                  <button 
                    onClick={() => setShowSearch(true)}
                    className="w-full h-32 rounded-3xl border-2 border-blue-400/30 bg-gradient-to-br from-blue-900/40 to-transparent flex flex-col items-center justify-center gap-2 group hover:border-blue-400 transition-all"
                  >
                    <div className="p-3 rounded-full bg-blue-500/20 border border-blue-400/40 group-hover:scale-110 transition-transform">
                       <Plus className="h-8 w-8 text-blue-300" />
                    </div>
                    <span className="text-blue-300 font-bold text-sm tracking-widest uppercase opacity-60">Invite</span>
                  </button>

                  {/* Locked Slot */}
                  <div className="w-full h-32 rounded-3xl border-2 border-blue-900/50 bg-black/20 flex flex-col items-center justify-center gap-2 opacity-50">
                    <div className="p-3 rounded-full bg-slate-800/50">
                       <Lock className="h-6 w-6 text-slate-500" />
                    </div>
                    <span className="text-slate-500 font-bold text-sm tracking-widest uppercase">unlock</span>
                  </div>
                </div>
            </main>
          </motion.div>
        )}

        {/* --- Dialogs --- */}
        <RulesSheet isOpen={showRules} onClose={() => setShowRules(false)} />
        <UserSearchDialog isOpen={showSearch} onClose={() => setShowSearch(false)} onSelect={handleProposeTarget} />
        {selectedTarget && (
          <CPProposeDialog isOpen={showPropose} onClose={() => { setShowPropose(false); setSelectedTarget(null); }} targetUser={selectedTarget} />
        )}
      </div>
    </AppLayout>
  );
}
