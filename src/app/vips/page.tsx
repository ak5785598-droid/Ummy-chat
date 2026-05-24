'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { 
  ChevronLeft, 
  Crown, 
  Star, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Lock, 
  Settings, 
  HelpCircle, 
  EyeOff, 
  UserCheck, 
  Volume2, 
  MessageSquare, 
  Gift, 
  Compass, 
  Users, 
  ShieldAlert, 
  Award,
  Heart,
  Skull,
  Radio,
  Flame,
  Key,
  Infinity as InfIcon,
  CheckCircle,
  Gem
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { Button } from '@/components/ui/button';
import { useUser, useFirestore, setDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { doc } from 'firebase/firestore';

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
  { id: 1, name: 'SVIP Badge', desc: 'Premium level status marker', level: 1, icon: Award, category: 'Identity' },
  { id: 2, name: 'Silver-Wing Frame', desc: 'Noble Owl Avatar frame decoration', level: 1, icon: Crown, category: 'Identity' },
  { id: 3, name: 'Owl Chat Bubble', desc: 'Distinctive blue message border', level: 2, icon: MessageSquare, category: 'Interaction' },
  { id: 4, name: 'Entering Sound', desc: 'Audio sound wave chime on room entry', level: 2, icon: Volume2, category: 'VFX' },
  { id: 5, name: 'Golden Wave Mic', desc: 'Gilded mic waves in rooms', level: 3, icon: Radio, category: 'Interaction' },
  { id: 6, name: 'Silver Greeting Card', desc: 'Gleaming Owl entry greeting card', level: 4, icon: ShieldAlert, category: 'VFX' },
  { id: 7, name: 'Owl Portal Ride', desc: 'Animated Owl flight entry ride', level: 4, icon: Compass, category: 'VFX' },
  { id: 8, name: 'Mysterious Visitor', desc: 'Visit profiles with 100% stealth', level: 5, icon: EyeOff, category: 'Stealth' },
  { id: 9, name: 'Exclusive Owl Gift', desc: 'Unlock Owl core token gifting item', level: 5, icon: Gift, category: 'Gifts' },
  { id: 10, name: 'Weekly Coin Rebate', desc: 'Daily claimable coin multiplier bonuses', level: 6, icon: Zap, category: 'Rebates' },
  { id: 11, name: 'Wolf Velvet Frame', desc: 'Dark purple neon wolf border decoration', level: 7, icon: Crown, category: 'Identity' },
  { id: 12, name: 'Hide Gift Record', desc: 'Stealthily receive/send without record', level: 8, icon: Lock, category: 'Stealth' },
  { id: 13, name: 'Purple Crescent Ride', desc: 'Hovering moon ride portal entrance', level: 8, icon: Compass, category: 'VFX' },
  { id: 14, name: 'Rank Hiding', desc: 'Become completely invisible on charts', level: 9, icon: UserCheck, category: 'Stealth' },
  { id: 15, name: 'Wolf Neon Bubble', desc: 'Luminous violet chat bubble border', level: 9, icon: MessageSquare, category: 'Interaction' },
  { id: 16, name: 'Private Space Album', desc: 'Hidden album with access key control', level: 10, icon: Key, category: 'Interaction' },
  { id: 17, name: 'Fiery Lion Frame', desc: 'Solar ruby-red fiery card outline', level: 11, icon: Crown, category: 'Identity' },
  { id: 18, name: 'Lion Crimson Nameplate', desc: 'Stand out with bold red nameplate text', level: 11, icon: Flame, category: 'Identity' },
  { id: 19, name: 'Room Stealth Entry', desc: 'Enter any chatroom in absolute silence', level: 12, icon: EyeOff, category: 'Stealth' },
  { id: 20, name: 'Lion Portal Ride', desc: 'Fiery solar lion chariot entry portal', level: 12, icon: Compass, category: 'VFX' },
  { id: 21, name: 'Absolute Kick Immunity', desc: 'Immunity against all kicks & bans', level: 13, icon: ShieldCheck, category: 'Stealth' },
  { id: 22, name: 'Lion Crimson Bubble', desc: 'Glowing crimson flame chat outline', level: 14, icon: MessageSquare, category: 'Interaction' },
  { id: 23, name: 'CP Room Decoration', desc: 'Custom themed luxury CP room design', level: 14, icon: Heart, category: 'Interaction' },
  { id: 24, name: 'Custom Micro-Badge', desc: 'Personalized mini icon next to name', level: 15, icon: Award, category: 'Identity' },
  { id: 25, name: 'Obsidian Dragon Frame', desc: 'Cosmic scale dragon wings ornament', level: 16, icon: Crown, category: 'Identity' },
  { id: 26, name: 'Dragon Flight Ride', desc: 'Grand majestic dragon mount ride VFX', level: 16, icon: Compass, category: 'VFX' },
  { id: 27, name: 'Diamond Conversion Buff', desc: 'Higher limit for coin-to-diamond swaps', level: 17, icon: Gem, category: 'Rebates' },
  { id: 28, name: 'VIP Liaison Officer', desc: '24/7 dedicated support representative', level: 17, icon: Users, category: 'Interaction' },
  { id: 29, name: 'Imperial Dragon Bubble', desc: 'Dragon scales neon border overlay', level: 18, icon: MessageSquare, category: 'Interaction' },
  { id: 30, name: 'Global Server Broadcast', desc: 'Announce presence to all rooms globally', level: 18, icon: Radio, category: 'VFX' },
  { id: 31, name: 'Infinite Validity Lock', desc: 'Never downgrade; level locked forever', level: 18, icon: InfIcon, category: 'Rebates' },
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

  // Render fully-customized 18 Level Badge Graphic
  const renderUniqueBadge = (lvl: number, animated = true) => {
    let baseStyle = "";
    let glowStyle = "";
    let wings = null;
    let label = `SVIP ${lvl}`;

    if (lvl >= 1 && lvl <= 6) {
      // Silver Owl Tier
      baseStyle = "bg-gradient-to-r from-slate-400 via-cyan-400 to-slate-400 border border-cyan-300 text-slate-900";
      glowStyle = "shadow-[0_0_12px_rgba(34,211,238,0.5)]";
      wings = (
        <span className={cn("absolute -inset-x-2 -inset-y-0.5 border border-cyan-400/40 rounded-full scale-105 pointer-events-none", 
          animated && "animate-pulse"
        )} />
      );
    } else if (lvl >= 7 && lvl <= 10) {
      // Velvet Wolf Tier
      baseStyle = "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 border border-purple-300 text-white";
      glowStyle = "shadow-[0_0_15px_rgba(168,85,247,0.7)]";
      wings = (
        <span className="absolute -inset-x-1.5 inset-y-0 flex items-center justify-between text-[6px] text-purple-200 pointer-events-none px-0.5">
          <span>⚡</span>
          <span>⚡</span>
        </span>
      );
    } else if (lvl >= 11 && lvl <= 15) {
      // Fiery Lion Tier
      baseStyle = "bg-gradient-to-r from-red-600 via-amber-500 to-red-600 border border-amber-400 text-white font-black";
      glowStyle = "shadow-[0_0_18px_rgba(249,115,22,0.8)]";
      wings = (
        <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 text-[8px] text-amber-300 animate-bounce pointer-events-none">
          🔥
        </span>
      );
    } else {
      // Obsidian Dragon Tier
      baseStyle = "bg-gradient-to-r from-[#111] via-[#aa33ff] to-[#ffd700] border-2 border-amber-300 text-[#ffd700] font-black";
      glowStyle = "shadow-[0_0_25px_rgba(255,215,0,0.9)]";
      wings = (
        <span className="absolute -inset-x-3.5 -top-1 flex justify-between text-[9px] pointer-events-none">
          <span className="rotate-[-20deg] animate-pulse">👑</span>
          <span className="rotate-[20deg] animate-pulse">👑</span>
        </span>
      );
    }

    return (
      <div className={cn(
        "relative rounded-full px-3 py-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase select-none transition-all duration-300", 
        baseStyle, 
        glowStyle
      )}>
        {wings}
        <Star className={cn("h-3 w-3 fill-current shrink-0", lvl >= 16 && "text-yellow-300 animate-spin")} style={{ animationDuration: '4s' }} />
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{label}</span>
      </div>
    );
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
  }[activeTheme];

  return (
    <AppLayout>
      <div className="min-h-full animate-bg-gradient text-white font-outfit relative flex flex-col pb-28 overflow-x-hidden animate-in fade-in duration-500">
        
        {/* Deep Space Starfield & Sparkle Layers */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {/* Sparkly Star 1 */}
          <div className="absolute top-[12%] left-[15%] h-1 w-1 bg-white rounded-full animate-sparkle" style={{ animationDelay: '0.2s' }} />
          <div className="absolute top-[28%] left-[80%] h-1.5 w-1.5 bg-cyan-300 rounded-full animate-sparkle" style={{ animationDelay: '1.5s' }} />
          <div className="absolute top-[45%] left-[8%] h-0.5 w-0.5 bg-white rounded-full opacity-60" />
          <div className="absolute top-[62%] left-[88%] h-1 w-1 bg-purple-300 rounded-full animate-sparkle" style={{ animationDelay: '0.8s' }} />
          <div className="absolute top-[75%] left-[22%] h-1.5 w-1.5 bg-amber-300 rounded-full animate-sparkle" style={{ animationDelay: '2.3s' }} />
          <div className="absolute top-[90%] left-[70%] h-1 w-1 bg-white rounded-full opacity-40" />

          {/* Drifting Nebulae Dust Clouds */}
          <div className="absolute top-[15%] left-[10%] w-[350px] h-[350px] bg-indigo-500/10 blur-[130px] rounded-full animate-float-slow" />
          <div className="absolute bottom-[20%] right-[5%] w-[400px] h-[400px] bg-purple-600/5 blur-[150px] rounded-full animate-float-slow" style={{ animationDuration: '14s' }} />
          
          {/* Glowing orbital ring backdrop */}
          <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-80 h-80 rounded-full border border-white/[0.02] scale-[1.3] pointer-events-none opacity-40 z-0">
            <div className="absolute inset-0 rounded-full border border-dashed border-white/[0.04] animate-spin" style={{ animationDuration: '40s' }} />
          </div>
        </div>

        {/* Dynamic Glowing Ambient Spotlights */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[50vh] pointer-events-none z-0">
          <div className="absolute top-[-10vh] left-1/4 w-80 h-80 bg-purple-600/15 blur-[120px] rounded-full animate-pulse" />
          <div className={cn("absolute top-[-5vh] right-1/4 w-72 h-72 blur-[100px] rounded-full transition-colors duration-700", 
            activeTheme === 'owl' ? 'bg-cyan-500/15 shadow-[0_0_80px_rgba(6,182,212,0.15)]' :
            activeTheme === 'wolf' ? 'bg-fuchsia-500/15 shadow-[0_0_80px_rgba(168,85,247,0.15)]' :
            activeTheme === 'lion' ? 'bg-orange-500/15 shadow-[0_0_80px_rgba(249,115,22,0.15)]' : 'bg-yellow-400/20 shadow-[0_0_100px_rgba(234,179,8,0.2)]'
          )} />
        </div>

        {/* Premium Header Bar */}
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

        {/* Main Dashboard Section */}
        <main className="flex-1 px-4 pt-6 space-y-8 z-10 relative">
          
          {/* Identity & Progress Card */}
          <div className="bg-[#0b0e1e]/60 border border-white/[0.04] rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/[0.01] rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-5">
              <AvatarFrame frameId={userProfile?.inventory?.activeFrame} size="lg">
                <Avatar className="h-16 w-16 border-2 border-white/10 shadow-xl">
                  <AvatarImage src={userProfile?.avatarUrl || undefined} />
                  <AvatarFallback className="bg-slate-900 text-xl font-bold">
                    {(userProfile?.username || 'U').charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </AvatarFrame>

              <div className="flex-1 space-y-1 min-w-0">
                <h3 className="text-[17px] font-black text-white leading-tight truncate">{userProfile?.username || 'Gamer'}</h3>
                
                {/* Active Level Badge */}
                <div className="flex items-center gap-2">
                  {userSvipLevel > 0 ? (
                    renderUniqueBadge(userSvipLevel, false)
                  ) : (
                    <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700 tracking-wider">
                      Non-SVIP Member
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-slate-400">ID: {userProfile?.accountNumber || '000000'}</span>
                </div>
              </div>
            </div>

            {/* EXP Progress Bar */}
            <div className="mt-6 pt-2 border-t border-white/[0.03] space-y-2">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <span>VIP EXP Progress</span>
                <span className="text-amber-400">
                  {userProfile?.wallet?.totalSpent?.toLocaleString() || '0'} / 1,500,000 EXP
                </span>
              </div>
              <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.02]">
                <div 
                  className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  style={{ width: `${Math.min(100, ((userProfile?.wallet?.totalSpent || 0) / 1500000) * 100)}%` }}
                />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-right">
                1 Coin Purchase = 1 EXP. Updates instantly.
              </p>
            </div>
          </div>

          {/* Level Switcher (Horizontal Ribbon) */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">Select SVIP Level</h4>
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-3 px-1 -mx-4 px-4 mask-gradient">
              {SVIP_LEVELS_DATA.map((lvl) => {
                const isSelected = selectedLevel === lvl.level;
                const isUserLevel = userSvipLevel >= lvl.level;
                
                return (
                  <button 
                    key={lvl.level}
                    onClick={() => setSelectedLevel(lvl.level)}
                    className={cn(
                      "shrink-0 h-11 px-5 rounded-2xl border flex items-center justify-center gap-2 font-black text-xs transition-all active:scale-95 shadow-md",
                      isSelected 
                        ? "bg-gradient-to-r border-white/30 text-white scale-105 " + tierColor.gradient
                        : "bg-[#0b0e1e]/60 border-white/[0.04] text-slate-400 hover:text-slate-200"
                    )}
                  >
                    {isUserLevel && <CheckCircle className="h-3 w-3 text-emerald-400 fill-current" />}
                    <span>{lvl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ornate 3D Podium & Dynamic Tier Beast Emblem */}
          <div className="relative py-8 flex flex-col items-center justify-center">
            
            {/* Ambient Radial Spotlight */}
            <div className={cn("absolute w-64 h-64 blur-[80px] rounded-full opacity-40 pointer-events-none z-0", tierColor.glow)} />

            {/* Emblem Image/Symbol Presentation */}
            <div className="relative h-60 w-60 z-10 flex items-center justify-center group">
              
              {/* Emblem-specific custom SVGs */}
              {activeTheme === 'owl' && (
                <div className="relative animate-float duration-3000">
                  {/* Glowing Wings backdrop */}
                  <div className="absolute inset-0 h-44 w-44 rounded-full border border-cyan-400/20 bg-cyan-900/10 blur-[10px] animate-pulse" />
                  {/* Owl Core representation */}
                  <svg viewBox="0 0 100 100" className="h-44 w-44 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="3 3" />
                    {/* Owl wings */}
                    <path d="M15,40 C35,25 45,45 50,45 C55,45 65,25 85,40 C75,65 55,75 50,75 C45,75 25,65 15,40 Z" fill="url(#owlGrad)" />
                    {/* Glowing Gem center */}
                    <polygon points="50,42 56,50 50,58 44,50" fill="#22d3ee" className="animate-pulse" />
                    <circle cx="50" cy="50" r="2" fill="white" />
                    {/* Glowing eyes */}
                    <circle cx="43" cy="48" r="1.5" fill="#fff" />
                    <circle cx="57" cy="48" r="1.5" fill="#fff" />
                    <defs>
                      <linearGradient id="owlGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0891b2" />
                        <stop offset="50%" stopColor="#22d3ee" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}

              {activeTheme === 'wolf' && (
                <div className="relative animate-float" style={{ animationDelay: '0.5s' }}>
                  <div className="absolute inset-0 h-44 w-44 rounded-full border border-purple-500/20 bg-purple-900/10 blur-[15px] animate-pulse" />
                  <svg viewBox="0 0 100 100" className="h-44 w-44 drop-shadow-[0_0_25px_rgba(168,85,247,0.6)]">
                    {/* Crescent moon outline */}
                    <path d="M30,30 A20,20 0 1,0 70,70 A25,25 0 1,1 30,30 Z" fill="#c084fc" opacity="0.3" />
                    {/* Wolf howling head */}
                    <path d="M50,70 L48,62 Q45,55 52,48 Q55,45 50,38 L55,30 L58,35 Q65,40 58,48 Q56,52 58,58 Z" fill="url(#wolfGrad)" />
                    {/* Center Core Amethyst Gem */}
                    <polygon points="50,48 54,54 50,60 46,54" fill="#d946ef" className="animate-pulse" />
                    <circle cx="50" cy="54" r="1.5" fill="white" />
                    <defs>
                      <linearGradient id="wolfGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#a855f7" />
                        <stop offset="50%" stopColor="#e9d5ff" />
                        <stop offset="100%" stopColor="#d946ef" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}

              {activeTheme === 'lion' && (
                <div className="relative animate-float" style={{ animationDelay: '1s' }}>
                  <div className="absolute inset-0 h-44 w-44 rounded-full border border-orange-500/20 bg-orange-950/10 blur-[20px] animate-pulse" />
                  <svg viewBox="0 0 100 100" className="h-44 w-44 drop-shadow-[0_0_30px_rgba(249,115,22,0.75)]">
                    {/* Solar/Fire radial rings */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#f97316" strokeWidth="1" strokeDasharray="5 5" className="animate-spin" style={{ animationDuration: '20s' }} />
                    {/* Lion silhouette with fiery mane */}
                    <path d="M35,65 Q30,55 35,42 Q40,30 50,32 Q60,30 65,42 Q70,55 65,65 L60,62 C62,55 60,45 50,45 C40,45 38,55 40,62 Z" fill="url(#lionGrad)" />
                    {/* Glowing crimson gem */}
                    <polygon points="50,38 55,45 50,52 45,45" fill="#ef4444" className="animate-pulse" />
                    <circle cx="50" cy="45" r="2" fill="white" />
                    <defs>
                      <linearGradient id="lionGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="50%" stopColor="#facc15" />
                        <stop offset="100%" stopColor="#ef4444" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}

              {activeTheme === 'dragon' && (
                <div className="relative animate-float" style={{ animationDelay: '1.5s' }}>
                  <div className="absolute inset-0 h-48 w-48 rounded-full border border-yellow-500/20 bg-yellow-950/10 blur-[25px] animate-pulse" />
                  <svg viewBox="0 0 100 100" className="h-48 w-48 drop-shadow-[0_0_40px_rgba(251,191,36,0.85)]">
                    {/* Rotating magic boundary rings */}
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="10 4" className="animate-spin" style={{ animationDuration: '10s' }} />
                    <circle cx="50" cy="50" r="38" fill="none" stroke="#a855f7" strokeWidth="0.8" className="animate-spin" style={{ animationDuration: '6s', animationDirection: 'reverse' }} />
                    {/* Majestic Dragon wrapping around a central orb */}
                    <path d="M25,50 C20,30 35,15 50,15 C65,15 80,30 75,50 C70,70 50,85 50,85 C50,85 30,70 25,50 Z" fill="none" stroke="url(#dragonGrad)" strokeWidth="2" />
                    <path d="M38,40 Q40,30 50,28 Q60,30 62,40 C65,55 50,72 50,72 C50,72 35,55 38,40 Z" fill="url(#dragonGrad)" />
                    {/* Dragon Wings representation */}
                    <path d="M12,48 C20,38 35,46 38,40 C41,46 56,38 64,48 C60,54 48,52 38,46 C28,52 16,54 12,48 Z" fill="#fb11ff" opacity="0.3" className="animate-pulse" />
                    {/* Floating emerald purple core jewel */}
                    <polygon points="50,34 56,42 50,50 44,42" fill="#c084fc" className="animate-pulse" />
                    <circle cx="50" cy="42" r="2.5" fill="#fbbf24" />
                    <defs>
                      <linearGradient id="dragonGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#fbbf24" />
                        <stop offset="50%" stopColor="#c084fc" />
                        <stop offset="100%" stopColor="#a855f7" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
            </div>

            {/* 3D Circular Ornate Podium Base */}
            <div className="w-80 h-16 relative mt-[-20px] z-10 flex flex-col items-center">
              {/* Top Tier Disc */}
              <div className="w-72 h-8 rounded-full bg-gradient-to-b from-[#1b223c] to-[#0d1223] border border-white/[0.08] shadow-inner relative flex items-center justify-center">
                {/* Glowing Core Gem inserted in the podium center */}
                <div className={cn("absolute top-1/2 -translate-y-1/2 h-3.5 w-16 rounded-full blur-[2px] transition-colors duration-700",
                  activeTheme === 'owl' ? 'bg-cyan-400/50' :
                  activeTheme === 'wolf' ? 'bg-purple-400/50' :
                  activeTheme === 'lion' ? 'bg-orange-400/50' : 'bg-yellow-400/60'
                )} />
                <div className="absolute top-1/2 -translate-y-1/2 h-1.5 w-8 rounded-full bg-white/70 blur-[1px]" />
              </div>
              
              {/* Lower Tier Ornate Ring */}
              <div className="w-80 h-8 bg-gradient-to-b from-[#0f1429] to-[#070914] border-x border-b border-white/[0.04] rounded-full shadow-[0_15px_30px_rgba(0,0,0,0.8)] mt-[-18px] relative flex items-center justify-center">
                {/* Embedded decorative base gems */}
                <div className="flex justify-between w-64 px-10 text-[6px] text-slate-500 opacity-60">
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                  <span>✦</span>
                </div>
              </div>
            </div>

            {/* Selected Level Display details */}
            <div className="text-center mt-6 space-y-2 z-10 relative">
              <h2 className="text-2xl font-black tracking-tight text-white uppercase flex items-center justify-center gap-2">
                <span>{activeLevelData.name}</span>
                <span>•</span>
                <span className={cn("text-sm", tierColor.text)}>
                  {activeTheme === 'owl' ? 'Owl Domain' :
                   activeTheme === 'wolf' ? 'Wolf Sanctuary' :
                   activeTheme === 'lion' ? 'Lion Arena' : 'Dragon Dynasty'}
                </span>
              </h2>
              <div className="flex justify-center">{renderUniqueBadge(selectedLevel, true)}</div>
            </div>

          </div>

          {/* Unlocked Privileges Counter Banner */}
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-3xl p-5 shadow-inner">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SVIP Benefits</p>
              <h4 className="text-[17px] font-black text-white">
                Unlocked Privileges: <span className={tierColor.text}>{unlockedCount} / 31</span>
              </h4>
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.09] active:scale-95 border border-white/[0.08] rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Control Stealth
            </button>
          </div>

          {/* 3-Column Privileges Benefits Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Tier Privileges Grid</h4>
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Select level above to preview unlocks</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {SVIP_PRIVILEGES_DATA.map((benefit) => {
                const isUnlockedForSelected = benefit.level <= selectedLevel;
                const BenefitIcon = benefit.icon;
                
                return (
                  <div 
                    key={benefit.id} 
                    className={cn(
                      "p-4 rounded-3xl border flex flex-col items-center text-center gap-2.5 relative overflow-hidden transition-all duration-300 select-none group",
                      isUnlockedForSelected 
                        ? "bg-[#0b0e1e]/80 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.05)] cursor-default" 
                        : "bg-[#050711]/60 border-white/[0.02] opacity-40 cursor-not-allowed"
                    )}
                  >
                    {/* Glowing highlight for unlocked */}
                    {isUnlockedForSelected && (
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.02] to-transparent pointer-events-none" />
                    )}

                    {/* Lock Icon Overlay */}
                    {!isUnlockedForSelected && (
                      <div className="absolute top-2 right-2 p-1 bg-black/60 rounded-full border border-white/5">
                        <Lock className="h-2.5 w-2.5 text-slate-400" />
                      </div>
                    )}

                    {/* Icon wrapper */}
                    <div 
                      className={cn(
                        "h-11 w-11 rounded-2xl flex items-center justify-center shadow-md transition-all border",
                        isUnlockedForSelected 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20 group-hover:scale-110" 
                          : "bg-white/[0.02] text-slate-500 border-white/[0.04]"
                      )}
                    >
                      <BenefitIcon className="h-5.5 w-5.5" />
                    </div>

                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black leading-snug text-white truncate max-w-full">
                        {benefit.name}
                      </p>
                      <p className="text-[7.5px] font-black text-slate-400 uppercase tracking-widest">
                        SVIP {benefit.level}+
                      </p>
                    </div>

                    {/* Subtle micro-text for descriptions */}
                    <p className="text-[8px] font-medium text-slate-500 leading-normal line-clamp-2 px-0.5">
                      {benefit.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </main>

        {/* BOTTOM FIXED CTA OR CONVERSION ACTION */}
        <footer className="fixed bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-[#050711] via-[#050711]/95 to-transparent z-[80] border-t border-white/[0.02] backdrop-blur-sm shrink-0">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <button 
              onClick={() => setIsRulesOpen(true)}
              className="h-14 px-6 bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 border border-white/[0.08] rounded-2xl flex items-center justify-center font-black uppercase text-xs tracking-wider transition-all text-slate-300"
            >
              Rules
            </button>
            <Button 
              onClick={() => {
                toast({
                  title: 'Store Sync',
                  description: 'Redirecting to checkout/diamonds portal...',
                });
                router.push('/wallet');
              }}
              className={cn("flex-1 h-14 rounded-2xl font-black uppercase text-[15px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2", 
                tierColor.btn
              )}
            >
              <Zap className="h-4.5 w-4.5 fill-current" />
              UPGRADE SVIP
            </Button>
          </div>
        </footer>

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
                {renderUniqueBadge(userSvipLevel, false)}
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .mask-gradient {
          mask-image: linear-gradient(to right, black 85%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, black 85%, transparent 100%);
        }
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
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(1deg); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          50% { transform: translateY(-20px) translateX(15px); }
        }
        .animate-float-slow {
          animation: floatSlow 10s ease-in-out infinite;
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        .animate-sparkle {
          animation: sparkle 3s ease-in-out infinite;
        }
        @keyframes gradientBackground {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-bg-gradient {
          background: linear-gradient(-45deg, #050714, #0d0a21, #060e1d, #03040a);
          background-size: 400% 400%;
          animation: gradientBackground 18s ease infinite;
        }
      `}</style>
    </AppLayout>
  );
}
