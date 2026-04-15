'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
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
  Users,
  History,
  LucideIcon
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { collection, query, where, limit, doc } from 'firebase/firestore';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';

// --- Types ---
type TabType = 'friend' | 'privileges' | 'rules';

// --- Decorative Components ---

const FloatingHeart = ({ delay = 0, x = "50%", color = "text-white/40" }) => (
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

const PrivilegeCard = ({ label, icon: Icon, isLocked, imageUrl }: { label: string, icon: LucideIcon, isLocked?: boolean, imageUrl?: string }) => (
  <motion.div 
    whileTap={{ scale: 0.95 }}
    className="flex flex-col items-center gap-2 group cursor-pointer"
  >
    <div className={cn(
      "w-24 h-24 rounded-[1.5rem] flex items-center justify-center relative overflow-hidden transition-all shadow-md border-2",
      isLocked ? "bg-white border-pink-100" : "bg-gradient-to-br from-pink-400 to-rose-400 border-white"
    )}>
      {imageUrl ? (
        <img src={imageUrl} alt={label} className="w-full h-full object-cover" />
      ) : (
        <Icon className={cn("h-8 w-8 text-white", isLocked && "text-pink-200")} />
      )}
      {isLocked && (
        <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
          <Lock className="h-4 w-4 text-pink-300" />
        </div>
      )}
    </div>
    <span className={cn(
      "text-[10px] font-bold tracking-tight",
      isLocked ? "text-pink-300 uppercase" : "text-slate-600 font-black uppercase"
    )}>{label}</span>
  </motion.div>
);

export default function CpHousePage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile } = useUserProfile(user?.uid);
  
  // Hydration fix
  const [isMounted, setIsMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState<'cp' | 'friend'>('cp');
  const [activeSubTab, setActiveSubTab] = useState<TabType>('privileges');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  const [showPropose, setShowPropose] = useState(false);
  const [showRules, setShowRules] = useState(false);

  // Global Config for Theme/Images
  const configRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'appConfig', 'global'), [firestore]);
  const { data: config } = useDoc(configRef);
  const cpHeaderTheme = config?.cpHeaderTheme || '#FF91B5';

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
        "h-[100dvh] w-full flex flex-col relative overflow-hidden font-sans select-none transition-colors duration-700 bg-white",
        activeMainTab === 'cp' ? "bg-pink-50" : "bg-blue-50"
      )}>

        {/* --- HEADER --- */}
        <header className="absolute top-0 w-full z-50 flex items-center justify-between px-6 pt-safe">
          <button onClick={() => router.back()} className="p-2 bg-black/5 backdrop-blur-md rounded-full text-white mt-4">
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <div className="flex gap-8 mt-4">
            <button 
              onClick={() => setActiveMainTab('cp')}
              className={cn(
                "text-base font-black transition-all tracking-tight relative pb-1",
                activeMainTab === 'cp' ? "text-white" : "text-white/60"
              )}
            >
              CP
              {activeMainTab === 'cp' && (
                <motion.div layoutId="header-active-tab" className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full" />
              )}
            </button>
            <button 
              onClick={() => setActiveMainTab('friend')}
              className={cn(
                "text-base font-black transition-all tracking-tight relative pb-1",
                activeMainTab === 'friend' ? "text-white" : "text-white/60"
              )}
            >
              Friend
              {activeMainTab === 'friend' && (
                <motion.div layoutId="header-active-tab" className="absolute -bottom-1 left-0 right-0 h-1 bg-white rounded-full" />
              )}
            </button>
          </div>

          <button onClick={() => setShowRules(true)} className="p-2 bg-black/5 backdrop-blur-md rounded-full text-white mt-4">
            <HelpCircle className="h-5 w-5" />
          </button>
        </header>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex flex-col h-full">
          
          {/* TOP 40vh (Dynamic based on Tab) */}
          <div 
            className="relative h-[40vh] w-full flex flex-col items-center justify-center overflow-hidden transition-all duration-1000"
            style={{ 
              backgroundColor: activeMainTab === 'cp' ? cpHeaderTheme : '#60a5fa', 
              background: activeMainTab === 'cp' 
                ? `linear-gradient(to bottom, ${cpHeaderTheme}, #FFCC00)` 
                : 'linear-gradient(to bottom, #60a5fa, #3b82f6)'
            }}
          >
            <div className="absolute inset-0 bg-white/10 backdrop-blur-[20px] opacity-20" />
            
            <FloatingHeart x="15%" delay={0} color="text-white/40" />
            <FloatingHeart x="85%" delay={2} color="text-white/40" />

            <motion.div 
               animate={{ y: [0, -10, 0], scale: [1, 1.05, 1] }} 
               transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
               className="relative z-10"
            >
               {activeMainTab === 'cp' ? (
                 <Heart className="h-40 w-40 text-white fill-white drop-shadow-[0_0_30px_rgba(255,100,100,0.5)]" />
               ) : (
                 <Handshake className="h-40 w-40 text-white drop-shadow-[0_0_30px_rgba(100,100,255,0.5)]" />
               )}
            </motion.div>
          </div>

          {/* MIDDLE NAVIGATION / AVATARS */}
          <div className="relative z-30 -mt-20 flex justify-center px-6">
            <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-6 border border-pink-100 flex items-center gap-12 w-full max-w-sm justify-between shadow-2xl relative">
              
              {/* HISTORY SLOT */}
              <div className="flex flex-col items-center gap-2">
                <div className="h-20 w-20 rounded-[1.5rem] bg-gradient-to-br from-pink-400 to-rose-400 p-0.5 shadow-lg active:scale-95 transition-transform cursor-pointer overflow-hidden border-2 border-white">
                  <div className="w-full h-full bg-white/10 backdrop-blur-md flex flex-col items-center justify-center gap-1 group">
                    <History className="h-8 w-8 text-white group-hover:rotate-12 transition-transform" />
                  </div>
                </div>
                <span className="text-[10px] font-black text-pink-500 uppercase tracking-widest">History</span>
              </div>

              {/* CENTER HEART / LINK */}
              <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-8">
                 <Heart className={cn("h-8 w-8", activeCp ? "text-rose-500 fill-rose-500" : "text-pink-100")} />
              </div>

              {/* PARTNER SLOT */}
              <div className="flex flex-col items-center gap-2">
                 {partnerProfile ? (
                    <Avatar className="h-20 w-20 border-4 border-pink-200">
                      <AvatarImage src={partnerProfile.avatarUrl} className="object-cover" />
                      <AvatarFallback className="bg-pink-100 text-pink-500 font-bold">P</AvatarFallback>
                    </Avatar>
                 ) : (
                    <button onClick={() => setShowSearch(true)} className="h-20 w-20 rounded-full border-4 border-dashed border-pink-100 bg-pink-50/50 flex items-center justify-center active:scale-95 transition-transform group">
                      <Plus className="h-8 w-8 text-pink-200 group-hover:text-pink-400 transition-colors" />
                    </button>
                 )}
                 <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">{partnerProfile?.username?.split(' ')[0] || 'Partner'}</span>
              </div>

            </div>
          </div>

          {/* BOTTOM CONTENT TAB SWITCHER */}
          <div className="flex justify-center mt-6 gap-6">
             {(['friend', 'privileges', 'rules'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveSubTab(tab)}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-[0.2em] relative pb-1 transition-colors",
                    activeSubTab === tab ? "text-slate-800" : "text-slate-300"
                  )}
                >
                  {tab}
                  {activeSubTab === tab && (
                    <motion.div layoutId="sub-tab-active" className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
                  )}
                </button>
             ))}
          </div>

          {/* BOTTOM MAIN GRID (60vh area approx) */}
          <main className="flex-1 mt-6 mx-5 mb-8 rounded-[3rem] bg-white border border-pink-100 shadow-xl overflow-y-auto no-scrollbar p-8">
            <AnimatePresence mode="wait">
              {activeSubTab === 'privileges' && (
                <motion.div 
                  key="privileges"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-3 gap-y-10 gap-x-4"
                >
                  <PrivilegeCard 
                    label="Frame" 
                    icon={Palette} 
                    imageUrl={activeCp?.rewards?.frame || config?.cpFrameIcon} 
                    isLocked={!activeCp?.rewards?.frame && !config?.cpFrameIcon}
                  />
                  <PrivilegeCard 
                    label="Room BG" 
                    icon={Camera} 
                    imageUrl={activeCp?.rewards?.roomBg || config?.cpRoomBgIcon} 
                    isLocked={!activeCp?.rewards?.roomBg && !config?.cpRoomBgIcon}
                  />
                  <PrivilegeCard 
                    label="Emoji" 
                    icon={Handshake} 
                    imageUrl={activeCp?.rewards?.emoji || config?.cpEmojiIcon} 
                    isLocked={!activeCp?.rewards?.emoji && !config?.cpEmojiIcon}
                  />
                  <PrivilegeCard 
                    label="Gift" 
                    icon={Gift} 
                    imageUrl={activeCp?.rewards?.gift}
                    isLocked={!activeCp?.rewards?.gift} 
                  />
                  <PrivilegeCard 
                    label="Badge" 
                    icon={Trophy} 
                    imageUrl={activeCp?.rewards?.badge}
                    isLocked={!activeCp?.rewards?.badge} 
                  />
                  <PrivilegeCard 
                    label="Card" 
                    icon={Crown} 
                    imageUrl={activeCp?.rewards?.card}
                    isLocked={!activeCp?.rewards?.card} 
                  />
                </motion.div>
              )}

              {activeSubTab === 'friend' && (
                <motion.div 
                   key="friend"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="flex flex-col items-center justify-center h-full space-y-4 pt-10"
                >
                   <Users className="h-12 w-12 text-slate-100" />
                   <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic">Friend features syncing...</p>
                </motion.div>
              )}

              {activeSubTab === 'rules' && (
                <motion.div 
                  key="rules"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 text-slate-400 text-[11px] leading-relaxed font-medium"
                >
                   <p className="bg-pink-50 p-4 rounded-2xl border border-pink-100 text-slate-600 font-bold">• Establish a CP connection to unlock shared exclusive privileges.</p>
                   <p>• Stay in room together for 30 minutes daily to maintain intimacy.</p>
                   <p>• Higher intimacy levels unlock custom Frames and specialized Chat Bubbles.</p>
                   <p>• Sending high-value gifts contributes 10x points to the relationship level.</p>
                </motion.div>
              )}
            </AnimatePresence>
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
