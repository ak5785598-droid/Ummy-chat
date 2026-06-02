'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  ChevronLeft, 
  Star, 
  Zap, 
  Settings, 
  HelpCircle, 
  Gift,
  Gem
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { doc, onSnapshot } from 'firebase/firestore';
import { useCachedMedia } from '@/hooks/use-cached-media';

// --- DATA STRUCTURES ---

// Define the 18 level thresholds and maintenance requirements
const SVIP_LEVELS_DATA = [
  { level: 1, name: 'SVIP 1', points: '1.5M', exp: 1500000, validity: '7 Days', maintPoints: '375K', maintExp: 375000, theme: 'owl' },
  { level: 2, name: 'SVIP 2', points: '3.0M', exp: 3000000, validity: '7 Days', maintPoints: '375K', maintExp: 375000, theme: 'owl' },
  { level: 3, name: 'SVIP 3', points: '6.25M', exp: 6250000, validity: '15 Days', maintPoints: '1.25M', maintExp: 1250000, theme: 'owl' },
  { level: 4, name: 'SVIP 4', points: '12.5M', exp: 12500000, validity: '15 Days', maintPoints: '1.25M', maintExp: 1250000, theme: 'owl' },
  { level: 5, name: 'SVIP 5', points: '25.0M', exp: 25000000, validity: '15 Days', maintPoints: '1.25M', maintExp: 1250000, theme: 'owl' },
  { level: 6, name: 'SVIP 6', points: '50.0M', exp: 50000000, validity: '15 Days', maintPoints: '1.25M', maintExp: 1250000, theme: 'owl' },
  { level: 7, name: 'SVIP 7', points: '75.0M', exp: 75000000, validity: '30 Days', maintPoints: '5.0M', maintExp: 5000000, theme: 'wolf' },
  { level: 8, name: 'SVIP 8', points: '100.0M', exp: 100000000, validity: '30 Days', maintPoints: '5.0M', maintExp: 5000000, theme: 'wolf' },
  { level: 9, name: 'SVIP 9', points: '150.0M', exp: 150000000, validity: '30 Days', maintPoints: '5.0M', maintExp: 5000000, theme: 'wolf' },
  { level: 10, name: 'SVIP 10', points: '200.0M', exp: 200000000, validity: '30 Days', maintPoints: '5.0M', maintExp: 5000000, theme: 'wolf' },
  { level: 11, name: 'SVIP 11', points: '275.0M', exp: 275000000, validity: '45 Days', maintPoints: '20.0M', maintExp: 20000000, theme: 'lion' },
  { level: 12, name: 'SVIP 12', points: '350.0M', exp: 350000000, validity: '45 Days', maintPoints: '20.0M', maintExp: 20000000, theme: 'lion' },
  { level: 13, name: 'SVIP 13', points: '425.0M', exp: 425000000, validity: '45 Days', maintPoints: '20.0M', maintExp: 20000000, theme: 'lion' },
  { level: 14, name: 'SVIP 14', points: '500.0M', exp: 500000000, validity: '45 Days', maintPoints: '20.0M', maintExp: 20000000, theme: 'lion' },
  { level: 15, name: 'SVIP 15', points: '575.0M', exp: 575000000, validity: '45 Days', maintPoints: '20.0M', maintExp: 20000000, theme: 'lion' },
  { level: 16, name: 'SVIP 16', points: '650.0M', exp: 650000000, validity: '60 Days', maintPoints: '100.0M', maintExp: 100000000, theme: 'dragon' },
  { level: 17, name: 'SVIP 17', points: '700.0M', exp: 700000000, validity: '60 Days', maintPoints: '100.0M', maintExp: 100000000, theme: 'dragon' },
  { level: 18, name: 'SVIP 18', points: '750.0M', exp: 750000000, validity: '60 Days', maintPoints: '100.0M', maintExp: 100000000, theme: 'dragon' },
];

// Define the 31 unique privileges with respective unlock levels
const SVIP_PRIVILEGES_DATA = [
  { id: 1, name: 'SVIP Badge', desc: 'Premium level status marker', level: 1, icon: Star, category: 'Identity' },
  { id: 2, name: 'Silver-Wing Frame', desc: 'Noble Owl Avatar frame decoration', level: 1, icon: Star, category: 'Identity' },
  { id: 3, name: 'Owl Chat Bubble', desc: 'Distinctive blue message border', level: 2, icon: Star, category: 'Interaction' },
  { id: 4, name: 'Entering Sound', desc: 'Audio sound wave chime on room entry', level: 2, icon: Star, category: 'VFX' },
  { id: 5, name: 'Golden Wave Mic', desc: 'Gilded mic waves in rooms', level: 3, icon: Star, category: 'Interaction' },
  { id: 6, name: 'Silver Greeting Card', desc: 'Gleaming Owl entry greeting card', level: 4, icon: Star, category: 'VFX' },
  { id: 7, name: 'Owl Portal Ride', desc: 'Animated Owl flight entry ride', level: 4, icon: Star, category: 'VFX' },
  { id: 8, name: 'Mysterious Visitor', desc: 'Visit profiles with 100% stealth', level: 5, icon: Star, category: 'Stealth' },
  { id: 9, name: 'Exclusive Owl Gift', desc: 'Unlock Owl core token gifting item', level: 5, icon: Gift, category: 'Gifts' },
  { id: 10, name: 'Weekly Coin Rebate', desc: 'Daily claimable coin multiplier bonuses', level: 6, icon: Zap, category: 'Rebates' },
  { id: 11, name: 'Wolf Velvet Frame', desc: 'Dark purple neon wolf border decoration', level: 7, icon: Star, category: 'Identity' },
  { id: 12, name: 'Hide Gift Record', desc: 'Stealthily receive/send without record', level: 8, icon: Star, category: 'Stealth' },
  { id: 13, name: 'Purple Crescent Ride', desc: 'Hovering moon ride portal entrance', level: 8, icon: Star, category: 'VFX' },
  { id: 14, name: 'Rank Hiding', desc: 'Become completely invisible on charts', level: 9, icon: Star, category: 'Stealth' },
  { id: 15, name: 'Wolf Neon Bubble', desc: 'Luminous violet chat bubble border', level: 9, icon: Star, category: 'Interaction' },
  { id: 16, name: 'Private Space Album', desc: 'Hidden album with access key control', level: 10, icon: Star, category: 'Interaction' },
  { id: 17, name: 'Fiery Lion Frame', desc: 'Solar ruby-red fiery card outline', level: 11, icon: Star, category: 'Identity' },
  { id: 18, name: 'Lion Crimson Nameplate', desc: 'Stand out with bold red nameplate text', level: 11, icon: Star, category: 'Identity' },
  { id: 19, name: 'Room Stealth Entry', desc: 'Enter any chatroom in absolute silence', level: 12, icon: Star, category: 'Stealth' },
  { id: 20, name: 'Lion Portal Ride', desc: 'Fiery solar lion chariot entry portal', level: 12, icon: Star, category: 'VFX' },
  { id: 21, name: 'Absolute Kick Immunity', desc: 'Immunity against all kicks & bans', level: 13, icon: Star, category: 'Stealth' },
  { id: 22, name: 'Lion Crimson Bubble', desc: 'Glowing crimson flame chat outline', level: 14, icon: Star, category: 'Interaction' },
  { id: 23, name: 'CP Room Decoration', desc: 'Custom themed luxury CP room design', level: 14, icon: Star, category: 'Interaction' },
  { id: 24, name: 'Custom Micro-Badge', desc: 'Personalized mini icon next to name', level: 15, icon: Star, category: 'Identity' },
  { id: 25, name: 'Obsidian Dragon Frame', desc: 'Cosmic scale dragon wings ornament', level: 16, icon: Star, category: 'Identity' },
  { id: 26, name: 'Dragon Flight Ride', desc: 'Grand majestic dragon mount ride VFX', level: 16, icon: Star, category: 'VFX' },
  { id: 27, name: 'Diamond Conversion Buff', desc: 'Higher limit for coin-to-diamond swaps', level: 17, icon: Gem, category: 'Rebates' },
  { id: 28, name: 'VIP Liaison Officer', desc: '24/7 dedicated support representative', level: 17, icon: Star, category: 'Interaction' },
  { id: 29, name: 'Imperial Dragon Bubble', desc: 'Dragon scales neon border overlay', level: 18, icon: Star, category: 'Interaction' },
  { id: 30, name: 'Global Server Broadcast', desc: 'Announce presence to all rooms globally', level: 18, icon: Star, category: 'VFX' },
  { id: 31, name: 'Infinite Validity Lock', desc: 'Never downgrade; level locked forever', level: 18, icon: Star, category: 'Rebates' },
];

export default function VipsClubPage() {
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const { userProfile, isLoading } = useUserProfile(user?.uid);

  // States
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [vipConfig, setVipConfig] = useState<any>({
    bgType: 'dynamic',
    bgUrl: '',
    levels: {}
  });

  // Sync global VIP configs from Firestore in real-time
  useEffect(() => {
    if (!firestore) return;
    const docRef = doc(firestore, 'settings', 'svipConfig');
    const unsubscribe = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setVipConfig({
          bgType: data.bgType || 'dynamic',
          bgUrl: data.bgUrl || '',
          levels: data.levels || {}
        });
      }
    }, (err) => {
      console.warn("VIP settings sync warning: ", err);
    });

    return () => unsubscribe();
  }, [firestore]);

  // Stealth toggle states local replica for quick feedback
  const [stealthSettings, setStealthSettings] = useState({
    mysteriousVisitor: false,
    hideGiftRecord: false,
    rankInvisible: false,
    roomInvisible: false,
    avoidBeingKicked: false,
  });

  // Sync toggles when profile loads
  useEffect(() => {
    if (userProfile) {
      setStealthSettings({
        mysteriousVisitor: !!userProfile.mysteriousVisitor,
        hideGiftRecord: !!userProfile.hideGiftRecord,
        rankInvisible: !!userProfile.rankInvisible,
        roomInvisible: !!userProfile.roomInvisible,
        avoidBeingKicked: !!userProfile.avoidBeingKicked,
      });
    }
  }, [userProfile]);

  // Current user's real SVIP level
  const userSvipLevel = userProfile?.svip || 0;

  // Active theme based on selected level
  const activeLevelData = SVIP_LEVELS_DATA.find(l => l.level === selectedLevel) || SVIP_LEVELS_DATA[0];
  const activeTheme = activeLevelData.theme;

  // Custom level background override
  const levelBgUrl = vipConfig?.levels?.[selectedLevel]?.bgUrl;
  const showCustomBg = !!levelBgUrl;

  // Caching integration for high-speed media rendering (0.1s load time)
  const cachedGlobalBgUrl = useCachedMedia(vipConfig?.bgUrl);
  const cachedLevelBgUrl = useCachedMedia(levelBgUrl);

  // Calculate exp progress
  const totalSpent = userProfile?.wallet?.totalSpent || 0;
  const currentLevelData = SVIP_LEVELS_DATA.find(l => l.level === (userSvipLevel || 1)) || SVIP_LEVELS_DATA[0];
  const nextLevelData = SVIP_LEVELS_DATA.find(l => l.level === (userSvipLevel + 1));
  const expTarget = nextLevelData ? nextLevelData.exp : currentLevelData.exp;
  const expProgress = Math.min(100, (totalSpent / expTarget) * 100);

  // Calculate this month's points (totalSpent as proxy)
  const thisMonthPoints = totalSpent;
  const userCoins = userProfile?.wallet?.coins || 0;

  // Format number to K/M format
  const formatToKM = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Count privileges unlocked for the currently selected level
  const unlockedCount = SVIP_PRIVILEGES_DATA.filter(p => p.level <= selectedLevel).length;

  // Firestore update for toggles
  const handleToggleChange = async (key: keyof typeof stealthSettings, requiredLevel: number) => {
    if (userSvipLevel < requiredLevel) {
      toast({
        variant: 'destructive',
        title: 'Privilege Locked',
        description: `This toggle requires SVIP ${requiredLevel} or higher!`,
      });
      return;
    }

    if (!user?.uid || !firestore) return;

    const newStatus = !stealthSettings[key];
    setStealthSettings(prev => ({ ...prev, [key]: newStatus }));

    try {
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      await setDocumentNonBlocking(profileRef, { [key]: newStatus }, { merge: true });
      toast({
        title: 'Setting Synced',
        description: `${key.replace(/([A-Z])/g, ' $1')} is now ${newStatus ? 'ENABLED' : 'DISABLED'}.`,
      });
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Sync Failed',
        description: e.message,
      });
      // Rollback
      setStealthSettings(prev => ({ ...prev, [key]: !newStatus }));
    }
  };

  // UI Colors mapped to tier
  const tierColor = {
    owl: {
      text: 'text-cyan-400',
      border: 'border-cyan-500/20',
      bg: 'from-cyan-900/10 to-transparent',
      glow: 'shadow-[0_0_50px_rgba(6,182,212,0.15)]',
      gradient: 'from-cyan-400 via-sky-500 to-blue-500',
      btn: 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-900/30'
    },
    wolf: {
      text: 'text-purple-400',
      border: 'border-purple-500/20',
      bg: 'from-purple-900/10 to-transparent',
      glow: 'shadow-[0_0_50px_rgba(168,85,247,0.15)]',
      gradient: 'from-purple-400 via-fuchsia-500 to-pink-500',
      btn: 'bg-purple-500 hover:bg-purple-600 shadow-purple-900/30'
    },
    lion: {
      text: 'text-orange-400',
      border: 'border-orange-500/20',
      bg: 'from-orange-900/10 to-transparent',
      glow: 'shadow-[0_0_50px_rgba(249,115,22,0.15)]',
      gradient: 'from-orange-500 via-amber-500 to-red-500',
      btn: 'bg-orange-500 hover:bg-orange-600 shadow-orange-900/30'
    },
    dragon: {
      text: 'text-yellow-400',
      border: 'border-yellow-500/25',
      bg: 'from-yellow-950/15 to-transparent',
      glow: 'shadow-[0_0_60px_rgba(234,179,8,0.2)]',
      gradient: 'from-yellow-400 via-amber-500 to-purple-600',
      btn: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-black hover:opacity-90 shadow-yellow-900/40'
    }
  }[activeTheme as 'owl' | 'wolf' | 'lion' | 'dragon'] || {
    text: 'text-cyan-400',
    border: 'border-cyan-500/20',
    bg: 'from-cyan-900/10 to-transparent',
    glow: 'shadow-[0_0_50px_rgba(6,182,212,0.15)]',
    gradient: 'from-cyan-400 via-sky-500 to-blue-500',
    btn: 'bg-cyan-500 hover:bg-cyan-600 shadow-cyan-900/30'
  };

  return (
    <AppLayout>
      <div className="min-h-screen animate-bg-gradient text-white font-outfit relative flex flex-col pb-28 overflow-x-hidden animate-in fade-in duration-500">
        
        {/* Background Image/Video Override - SB kuch remove, sirf ye rahega */}
        {showCustomBg && levelBgUrl && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {levelBgUrl.includes('.mp4') || levelBgUrl.includes('video') ? (
              <video 
                src={cachedLevelBgUrl} 
                className="w-full h-full object-cover animate-in fade-in duration-700" 
                muted 
                autoPlay 
                loop 
                playsInline 
              />
            ) : (
              <div 
                className="w-full h-full bg-cover bg-center animate-in fade-in duration-700" 
                style={{ backgroundImage: `url(${cachedLevelBgUrl})` }}
              />
            )}
          </div>
        )}

        {/* Agar custom background hai to baki sab starfield, glow, SVG remove ho jayenge - condition already lag chuki hai */}
        {/* Bina custom bg ke dynamic gradient hi chalega (animate-bg-gradient class already defined) */}

        {/* Premium Header Bar - Sirf back icon rahega */}
        <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-transparent backdrop-blur-md border-b border-white/[0.02] z-[90] shrink-0">
          <button 
            onClick={() => router.back()} 
            className="p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-full hover:bg-white/[0.08] active:scale-95 transition-all shadow-sm"
          >
            <ChevronLeft className="h-5.5 w-5.5 text-slate-300" />
          </button>
          
          <h1 className="text-[17px] font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-400">
            VIP CLUB
          </h1>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsRulesOpen(true)}
              className="p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-full hover:bg-white/[0.08] active:scale-95 transition-all"
            >
              <HelpCircle className="h-5 w-5 text-slate-300" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-full hover:bg-white/[0.08] active:scale-95 transition-all"
            >
              <Settings className="h-5 w-5 text-slate-300" />
            </button>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 pt-6 space-y-5 z-10 relative">
          
          {/* Bottom Tab Card - Yehi hai main card ab */}
          <div className="bg-[#0b0e1e]/70 border border-white/[0.06] rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            
            {/* 1st Row - User Avatar + SVIP Status */}
            <div className="flex items-center gap-4 mb-5">
              <AvatarFrame frameId={userProfile?.inventory?.activeFrame} size="md">
                <Avatar className="h-14 w-14 border-2 border-white/10 shadow-xl">
                  <AvatarImage src={userProfile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-slate-900 text-lg font-bold">
                    {(userProfile?.username || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </AvatarFrame>

              <div className="flex-1 min-w-0">
                <h3 className="text-[16px] font-black text-white leading-tight truncate">
                  {userProfile?.username || 'Gamer'}
                </h3>
                
                {/* SVIP Status Message */}
                {userSvipLevel > 0 ? (
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative rounded-full px-3 py-0.5 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-500/40 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.2)]">
                      <Star className="h-3 w-3 fill-current shrink-0" />
                      <span>SVIP {userSvipLevel}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase tracking-wider">
                    You do not have SVIP 1
                  </p>
                )}
              </div>
            </div>

            {/* 2nd Row - This Month Points + User Coins */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">This Month Points</p>
                <p className="text-[18px] font-black text-white">
                  {formatToKM(thisMonthPoints)}
                </p>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">Your Coins</p>
                <p className="text-[18px] font-black text-white flex items-center gap-1.5">
                  <Gem className="h-4 w-4 text-amber-400" />
                  {formatToKM(userCoins)}
                </p>
              </div>
            </div>

            {/* 3rd Row - Loading Patti (EXP Progress Bar) */}
            <div className="space-y-2 mb-5">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>VIP EXP Progress</span>
                <span className="text-amber-400">
                  {formatToKM(totalSpent)} / {formatToKM(expTarget)} EXP
                </span>
              </div>
              <div className="h-2.5 bg-slate-900/80 rounded-full overflow-hidden border border-white/[0.03]">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  style={{ width: `${expProgress}%` }}
                />
              </div>
            </div>

            {/* 4th Row - 0 Point + SVIP Prize Coins + Recharge Button */}
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  0 Point
                </p>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  SVIP Prize Coins in... {formatToKM(expTarget)}
                </p>
              </div>
              
              <Button 
                onClick={() => {
                  toast({
                    title: 'Store Sync',
                    description: 'Redirecting to checkout/diamonds portal...',
                  });
                  router.push('/wallet');
                }}
                className={cn(
                  "h-11 px-6 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all flex items-center gap-2",
                  tierColor.btn
                )}
              >
                <Zap className="h-4 w-4 fill-current" />
                RECHARGE
              </Button>
            </div>
          </div>

        </main>

        {/* --- DYNAMIC SLIDE-OUT DRAWERS (CUSTOM IMPLEMENTED) --- */}

        {/* 1. Privilege Stealth Settings Drawer */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-[#070914] border-t border-white/[0.05] rounded-t-[3rem] p-6 pb-12 flex flex-col gap-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
              
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.03]">
                <div>
                  <h3 className="text-[17px] font-black text-white uppercase tracking-wider">PRIVILEGE STEALTH</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Configure hidden immunity options</p>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-300"
                >
                  Close
                </button>
              </div>

              {/* Your SVIP Level Banner */}
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Your Active Level:</span>
                <div className="relative rounded-full px-3 py-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-500/40 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.2)]">
                  <Star className="h-3 w-3 fill-current shrink-0" />
                  <span>SVIP {userSvipLevel}</span>
                </div>
              </div>

              {/* Switches Grid */}
              <div className="space-y-4">
                {[
                  { key: 'mysteriousVisitor', label: 'Mysterious Visitor', desc: 'Visit other user profiles completely incognito.', reqLevel: 5 },
                  { key: 'hideGiftRecord', label: 'Hide Gift Record', desc: 'Prevent gift list updates from showing in public rooms.', reqLevel: 8 },
                  { key: 'rankInvisible', label: 'Rank Invisible', desc: 'Hide your username and score entirely from leaderboards.', reqLevel: 9 },
                  { key: 'roomInvisible', label: 'Room Invisible', desc: 'Enter any chatroom with absolute silence and stealth.', reqLevel: 12 },
                  { key: 'avoidBeingKicked', label: 'Avoid Being Kicked', desc: 'Absolute immunity to all room kicks, bans, or mutes.', reqLevel: 13 },
                ].map((sw) => {
                  const isLocked = userSvipLevel < sw.reqLevel;
                  const isActive = stealthSettings[sw.key as keyof typeof stealthSettings];
                  
                  return (
                    <div 
                      key={sw.key} 
                      className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between gap-5 transition-all",
                        isLocked ? "bg-black/40 border-white/[0.02] opacity-40" : "bg-[#0b0e1e]/60 border-white/[0.04]"
                      )}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-black text-white">{sw.label}</span>
                          {isLocked ? (
                            <span className="text-[8px] font-black uppercase bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                              SVIP {sw.reqLevel}+ Required
                            </span>
                          ) : (
                            <span className="text-[8px] font-black uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                              Unlocked
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] font-medium text-slate-400 leading-normal">{sw.desc}</p>
                      </div>

                      <button 
                        disabled={isLocked}
                        onClick={() => handleToggleChange(sw.key as keyof typeof stealthSettings, sw.reqLevel)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-colors duration-300 relative focus:outline-none shrink-0",
                          isActive ? "bg-amber-400" : "bg-slate-800"
                        )}
                      >
                        <div 
                          className={cn(
                            "w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300",
                            isActive ? "translate-x-6" : "translate-x-0"
                          )}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )}

        {/* 2. SVIP Rules & Validity Introduction Modal */}
        {isRulesOpen && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-x-0 bottom-0 max-h-[90vh] bg-[#070914] border-t border-white/[0.05] rounded-t-[3rem] p-6 pb-12 flex flex-col gap-6 animate-in slide-in-from-bottom duration-300">
              
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.03] shrink-0">
                <div>
                  <h3 className="text-[17px] font-black text-white uppercase tracking-wider">SVIP INTRODUCTION</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rules, Validity & EXP Guidelines</p>
                </div>
                <button 
                  onClick={() => setIsRulesOpen(false)}
                  className="px-4 py-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl text-[9px] font-black uppercase tracking-wider text-slate-300"
                >
                  Close
                </button>
              </div>

              {/* Scrollable Rules Container */}
              <div className="flex-1 overflow-y-auto space-y-6 pr-1 custom-scrollbar text-[12px] leading-relaxed text-slate-300 focus-visible:outline-none">
                
                {/* EXP Principles */}
                <div className="bg-[#0b0e1e]/60 border border-white/[0.04] rounded-2xl p-4 space-y-2">
                  <h4 className="font-black text-white uppercase text-[10px] tracking-widest text-amber-400">1. EXP Earning Principles</h4>
                  <ul className="list-disc list-inside space-y-1.5 font-medium text-slate-400">
                    <li>Earn exactly <span className="text-white font-bold">1 EXP for every 1 Coin</span> purchased.</li>
                    <li>Points are added instantly to your totalspent accumulation.</li>
                    <li>EXP deductions are made in case of processed chargebacks or refunds.</li>
                  </ul>
                </div>

                {/* Level Thresholds Table */}
                <div className="space-y-2">
                  <h4 className="font-black text-white uppercase text-[10px] tracking-widest text-amber-400 ml-1">2. Level Threshold EXP Table</h4>
                  <div className="border border-white/[0.03] rounded-2xl overflow-hidden shadow-md">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] text-[9px] uppercase font-black tracking-wider text-slate-400 border-b border-white/[0.03]">
                          <th className="py-2.5 px-3">Level</th>
                          <th className="py-2.5 px-3">EXP Required</th>
                          <th className="py-2.5 px-3">Tier Animal</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px] font-bold text-slate-400 divide-y divide-white/[0.02]">
                        {SVIP_LEVELS_DATA.map((lvl) => (
                          <tr key={lvl.level} className="hover:bg-white/[0.01]">
                            <td className="py-2 px-3 text-white">SVIP {lvl.level}</td>
                            <td className="py-2 px-3 text-amber-400">{lvl.points} EXP</td>
                            <td className="py-2 px-3 uppercase text-[8px] tracking-widest">{lvl.theme}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Level Maintenance & Validity Table */}
                <div className="space-y-2">
                  <h4 className="font-black text-white uppercase text-[10px] tracking-widest text-amber-400 ml-1">3. Validity & Maintenance Periods</h4>
                  <div className="border border-white/[0.03] rounded-2xl overflow-hidden shadow-md">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        <tr className="bg-white/[0.02] text-[9px] uppercase font-black tracking-wider text-slate-400 border-b border-white/[0.03]">
                          <th className="py-2.5 px-3">Level Group</th>
                          <th className="py-2.5 px-3">Validity Days</th>
                          <th className="py-2.5 px-3">Maint. Target</th>
                        </tr>
                      </thead>
                      <tbody className="text-[10px] font-bold text-slate-400 divide-y divide-white/[0.02]">
                        <tr className="hover:bg-white/[0.01]">
                          <td className="py-2.5 px-3 text-white">SVIP 1 - 2</td>
                          <td className="py-2.5 px-3">7 Days</td>
                          <td className="py-2.5 px-3 text-orange-400">375K EXP</td>
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="py-2.5 px-3 text-white">SVIP 3 - 6</td>
                          <td className="py-2.5 px-3">15 Days</td>
                          <td className="py-2.5 px-3 text-orange-400">1.25M EXP</td>
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="py-2.5 px-3 text-white">SVIP 7 - 10</td>
                          <td className="py-2.5 px-3">30 Days</td>
                          <td className="py-2.5 px-3 text-orange-400">5.0M EXP</td>
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="py-2.5 px-3 text-white">SVIP 11 - 15</td>
                          <td className="py-2.5 px-3">45 Days</td>
                          <td className="py-2.5 px-3 text-orange-400">20.0M EXP</td>
                        </tr>
                        <tr className="hover:bg-white/[0.01]">
                          <td className="py-2.5 px-3 text-white">SVIP 16 - 18</td>
                          <td className="py-2.5 px-3">60 Days</td>
                          <td className="py-2.5 px-3 text-orange-400">100.0M EXP</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.08);
          border-radius: 99px;
        }
        @keyframes gradientBackground {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-bg-gradient {
          background: linear-gradient(-45deg, #070922, #1d0f3a, #0b1d3d, #140723);
          background-size: 400% 400%;
          animation: gradientBackground 14s ease infinite;
        }
      `}</style>
    </AppLayout>
  );
  }
