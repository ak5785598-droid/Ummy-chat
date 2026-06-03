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

  // Render SVIP Badge
  const renderUniqueBadge = (lvl: number, animated = true) => {
    const customBadgeUrl = vipConfig?.levels?.[lvl]?.badgeUrl;

    if (customBadgeUrl) {
      return (
        <div className="relative rounded-full px-3 py-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase select-none transition-all duration-300 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-yellow-500/40 text-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.2)]">
          <img src={customBadgeUrl} className="h-4.5 w-4.5 object-contain" alt={`SVIP ${lvl}`} />
          <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">SVIP {lvl}</span>
        </div>
      );
    }

    let baseStyle = "";
    let glowStyle = "";

    if (lvl >= 1 && lvl <= 6) {
      baseStyle = "bg-gradient-to-r from-slate-400 via-cyan-400 to-slate-400 border border-cyan-300 text-slate-900";
      glowStyle = "shadow-[0_0_12px_rgba(34,211,238,0.5)]";
    } else if (lvl >= 7 && lvl <= 10) {
      baseStyle = "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 border border-purple-300 text-white";
      glowStyle = "shadow-[0_0_15px_rgba(168,85,247,0.7)]";
    } else if (lvl >= 11 && lvl <= 15) {
      baseStyle = "bg-gradient-to-r from-red-600 via-amber-500 to-red-600 border border-amber-400 text-white font-black";
      glowStyle = "shadow-[0_0_18px_rgba(249,115,22,0.8)]";
    } else {
      baseStyle = "bg-gradient-to-r from-[#111] via-[#aa33ff] to-[#ffd700] border-2 border-amber-300 text-[#ffd700] font-black";
      glowStyle = "shadow-[0_0_25px_rgba(255,215,0,0.9)]";
    }

    return (
      <div className={cn(
        "relative rounded-full px-3 py-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase select-none transition-all duration-300", 
        baseStyle, 
        glowStyle
      )}>
        <Star className="h-3 w-3 fill-current shrink-0" />
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">SVIP {lvl}</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen animate-bg-gradient text-white font-outfit relative flex flex-col overflow-x-hidden animate-in fade-in duration-500">
        
        {/* BACKGROUND LAYER - Full Screen background with image/video */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {showCustomBg && levelBgUrl ? (
            levelBgUrl.includes('.mp4') || levelBgUrl.includes('video') ? (
              <video 
                src={cachedLevelBgUrl} 
                className="w-full h-full object-cover" 
                muted 
                autoPlay 
                loop 
                playsInline 
              />
            ) : (
              <div 
                className="w-full h-full bg-cover bg-center" 
                style={{ backgroundImage: `url(${cachedLevelBgUrl})` }}
              />
            )
          ) : vipConfig.bgType === 'image' && vipConfig.bgUrl ? (
            <div 
              className="w-full h-full bg-cover bg-center" 
              style={{ backgroundImage: `url(${cachedGlobalBgUrl})`, opacity: 0.25 }}
            />
          ) : vipConfig.bgType === 'video' && vipConfig.bgUrl ? (
            <video 
              src={cachedGlobalBgUrl} 
              className="w-full h-full object-cover opacity-20" 
              muted 
              autoPlay 
              loop 
              playsInline 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#070922] via-[#1d0f3a] to-[#0b1d3d]" />
          )}
        </div>

        {/* HEADER BAR - Back Icon, SVIP Title, Settings & Help Icons */}
        <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-black/30 backdrop-blur-md border-b border-white/[0.05] z-[90] shrink-0">
          <button 
            onClick={() => router.back()} 
            className="p-2.5 bg-white/[0.06] border border-white/[0.1] rounded-full hover:bg-white/[0.12] active:scale-95 transition-all shadow-lg"
          >
            <ChevronLeft className="h-5.5 w-5.5 text-white" />
          </button>
          
          <h1 className="text-[17px] font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300">
            SVIP CLUB
          </h1>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsRulesOpen(true)}
              className="p-2.5 bg-white/[0.06] border border-white/[0.1] rounded-full hover:bg-white/[0.12] active:scale-95 transition-all shadow-lg"
            >
              <HelpCircle className="h-5 w-5 text-white" />
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2.5 bg-white/[0.06] border border-white/[0.1] rounded-full hover:bg-white/[0.12] active:scale-95 transition-all shadow-lg"
            >
              <Settings className="h-5 w-5 text-white" />
            </button>
          </div>
        </header>

        {/* BACKGROUND AREA - Pura screen background ke liye flexible space */}
        <div className="flex-1 w-full relative z-10">
          {/* Ye area background dikhane ke liye khali rakha hai */}
        </div>

        {/* PRIVILEGES SECTION - Background ke niche scroll karne pe dikhega */}
        <section className="relative z-20 bg-[#0a0c1a]/95 backdrop-blur-xl border-t border-white/[0.08] pt-8 pb-32 px-4">
          
          {/* Section Header */}
          <div className="max-w-lg mx-auto space-y-3 mb-8">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1.5 bg-gradient-to-b from-amber-400 to-yellow-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wider">
                  PRIVILEGES
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  SVIP {selectedLevel} • {unlockedCount} Unlocked Benefits
                </p>
              </div>
            </div>
            
            {/* Level Switcher - Horizontal Scroll Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 -mx-1 px-1 mask-gradient">
              {SVIP_LEVELS_DATA.map((lvl) => {
                const isSelected = selectedLevel === lvl.level;
                
                return (
                  <button 
                    key={lvl.level}
                    onClick={() => setSelectedLevel(lvl.level)}
                    className={cn(
                      "shrink-0 h-10 px-4 rounded-2xl border flex items-center gap-2 font-black text-[11px] transition-all active:scale-95",
                      isSelected 
                        ? "bg-gradient-to-r from-amber-400 to-yellow-500 border-amber-300/50 text-black shadow-[0_0_15px_rgba(245,158,11,0.4)]" 
                        : "bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]"
                    )}
                  >
                    <Star className={cn("h-3 w-3", isSelected ? "fill-black text-black" : "fill-slate-600 text-slate-600")} />
                    <span>{lvl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privileges Grid - 3 Columns */}
          <div className="max-w-lg mx-auto">
            <div className="grid grid-cols-3 gap-3">
              {SVIP_PRIVILEGES_DATA.map((benefit) => {
                const isUnlockedForSelected = benefit.level <= selectedLevel;
                const BenefitIcon = benefit.icon;
                
                return (
                  <div 
                    key={benefit.id} 
                    className={cn(
                      "p-4 rounded-2xl border flex flex-col items-center text-center gap-2.5 relative overflow-hidden transition-all duration-300 select-none",
                      isUnlockedForSelected 
                        ? "bg-white/[0.04] border-amber-500/25 shadow-[0_0_12px_rgba(245,158,11,0.08)]" 
                        : "bg-white/[0.01] border-white/[0.03] opacity-35"
                    )}
                  >
                    {/* Unlock glow effect */}
                    {isUnlockedForSelected && (
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />
                    )}

                    {/* Lock icon for locked privileges */}
                    {!isUnlockedForSelected && (
                      <div className="absolute top-2 right-2">
                        <Lock className="h-3 w-3 text-slate-600" />
                      </div>
                    )}

                    {/* Icon Container */}
                    <div 
                      className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-all border",
                        isUnlockedForSelected 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                          : "bg-white/[0.02] text-slate-600 border-white/[0.04]"
                      )}
                    >
                      <BenefitIcon className="h-5 w-5" />
                    </div>

                    {/* Benefit Name & Level */}
                    <div className="space-y-0.5">
                      <p className={cn(
                        "text-[10px] font-bold leading-snug truncate max-w-full",
                        isUnlockedForSelected ? "text-white" : "text-slate-500"
                      )}>
                        {benefit.name}
                      </p>
                      <p className={cn(
                        "text-[8px] font-black uppercase tracking-widest",
                        isUnlockedForSelected ? "text-amber-400" : "text-slate-600"
                      )}>
                        SVIP {benefit.level}+
                      </p>
                    </div>

                    {/* Description micro-text */}
                    <p className="text-[7px] font-medium text-slate-600 leading-tight line-clamp-2">
                      {benefit.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

        </section>

        {/* SETTINGS DRAWER - Privilege Stealth Settings */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-[#0a0c1a] border-t border-white/[0.08] rounded-t-[3rem] p-6 pb-12 flex flex-col gap-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto custom-scrollbar">
              
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.05]">
                <div>
                  <h3 className="text-[17px] font-black text-white uppercase tracking-wider">PRIVILEGE STEALTH</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">Hidden immunity options</p>
                </div>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 transition-all"
                >
                  Close
                </button>
              </div>

              {/* Current Level Badge */}
              <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Your Level:</span>
                {renderUniqueBadge(userSvipLevel, false)}
              </div>

              {/* Stealth Toggles */}
              <div className="space-y-4">
                {[
                  { key: 'mysteriousVisitor', label: 'Mysterious Visitor', desc: 'Browse profiles completely incognito.', reqLevel: 5 },
                  { key: 'hideGiftRecord', label: 'Hide Gift Record', desc: 'Gift transactions stay private always.', reqLevel: 8 },
                  { key: 'rankInvisible', label: 'Rank Invisible', desc: 'Disappear from all public leaderboards.', reqLevel: 9 },
                  { key: 'roomInvisible', label: 'Room Invisible', desc: 'Enter chatrooms in total silence.', reqLevel: 12 },
                  { key: 'avoidBeingKicked', label: 'Kick Immunity', desc: 'Absolute protection from kicks/bans.', reqLevel: 13 },
                ].map((sw) => {
                  const isLocked = userSvipLevel < sw.reqLevel;
                  const isActive = stealthSettings[sw.key as keyof typeof stealthSettings];
                  
                  return (
                    <div 
                      key={sw.key} 
                      className={cn(
                        "p-4 rounded-2xl border flex items-center justify-between gap-4 transition-all",
                        isLocked ? "bg-black/30 border-white/[0.02] opacity-40" : "bg-white/[0.03] border-white/[0.05]"
                      )}
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] font-bold text-white">{sw.label}</span>
                          {isLocked ? (
                            <span className="text-[8px] font-black uppercase bg-red-500/10 border border-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                              SVIP {sw.reqLevel}+
                            </span>
                          ) : (
                            <span className="text-[8px] font-black uppercase bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                              Unlocked
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">{sw.desc}</p>
                      </div>

                      {/* Toggle Switch */}
                      <button 
                        disabled={isLocked}
                        onClick={() => handleToggleChange(sw.key as keyof typeof stealthSettings, sw.reqLevel)}
                        className={cn(
                          "w-12 h-6 rounded-full p-1 transition-colors duration-300 relative shrink-0",
                          isActive ? "bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]" : "bg-slate-700"
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

        {/* RULES DRAWER - SVIP Information & Tables */}
        {isRulesOpen && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
            <div className="absolute inset-x-0 bottom-0 max-h-[90vh] bg-[#0a0c1a] border-t border-white/[0.08] rounded-t-[3rem] p-6 pb-12 flex flex-col gap-6 animate-in slide-in-from-bottom duration-300">
              
              {/* Drawer Header */}
              <div className="flex justify-between items-center pb-3 border-b border-white/[0.05] shrink-0">
                <div>
                  <h3 className="text-[17px] font-black text-white uppercase tracking-wider">SVIP RULES</h3>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">EXP, Validity & Thresholds</p>
                </div>
                <button 
                  onClick={() => setIsRulesOpen(false)}
                  className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl text-[10px] font-black uppercase tracking-wider text-slate-300 transition-all"
                >
                  Close
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto space-y-5 pr-1 custom-scrollbar text-[12px] leading-relaxed text-slate-300">
                
                {/* EXP Rules */}
                <div className="bg-white/[0.03] border border-white/[0.05] rounded-2xl p-4 space-y-2">
                  <h4 className="font-black text-amber-400 uppercase text-[10px] tracking-widest">1. EXP Earning</h4>
                  <ul className="list-disc list-inside space-y-1.5 font-medium text-slate-400 text-[11px]">
                    <li>1 Coin purchase = <span className="text-white font-bold">1 EXP</span> instantly.</li>
                    <li>Refunds ya chargebacks pe EXP deduct hota hai.</li>
                  </ul>
                </div>

                {/* Level Table */}
                <div className="space-y-2">
                  <h4 className="font-black text-amber-400 uppercase text-[10px] tracking-widest ml-1">2. Level EXP Table</h4>
                  <div className="border border-white/[0.04] rounded-2xl overflow-hidden">
                    <table className="w-full text-center border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-white/[0.03] uppercase font-black tracking-wider text-slate-400 border-b border-white/[0.04]">
                          <th className="py-2.5 px-3">Level</th>
                          <th className="py-2.5 px-3">EXP</th>
                          <th className="py-2.5 px-3">Tier</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold text-slate-400 divide-y divide-white/[0.02]">
                        {SVIP_LEVELS_DATA.map((lvl) => (
                          <tr key={lvl.level} className="hover:bg-white/[0.02]">
                            <td className="py-2 px-3 text-white">SVIP {lvl.level}</td>
                            <td className="py-2 px-3 text-amber-400">{lvl.points}</td>
                            <td className="py-2 px-3 uppercase text-[8px] tracking-widest text-slate-500">{lvl.theme}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Validity Table */}
                <div className="space-y-2">
                  <h4 className="font-black text-amber-400 uppercase text-[10px] tracking-widest ml-1">3. Validity Periods</h4>
                  <div className="border border-white/[0.04] rounded-2xl overflow-hidden">
                    <table className="w-full text-center border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-white/[0.03] uppercase font-black tracking-wider text-slate-400 border-b border-white/[0.04]">
                          <th className="py-2.5 px-3">Level</th>
                          <th className="py-2.5 px-3">Days</th>
                          <th className="py-2.5 px-3">Maint. EXP</th>
                        </tr>
                      </thead>
                      <tbody className="font-bold text-slate-400 divide-y divide-white/[0.02]">
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white">1-2</td>
                          <td className="py-2.5 px-3">7</td>
                          <td className="py-2.5 px-3 text-orange-400">375K</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white">3-6</td>
                          <td className="py-2.5 px-3">15</td>
                          <td className="py-2.5 px-3 text-orange-400">1.25M</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white">7-10</td>
                          <td className="py-2.5 px-3">30</td>
                          <td className="py-2.5 px-3 text-orange-400">5.0M</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white">11-15</td>
                          <td className="py-2.5 px-3">45</td>
                          <td className="py-2.5 px-3 text-orange-400">20.0M</td>
                        </tr>
                        <tr className="hover:bg-white/[0.02]">
                          <td className="py-2.5 px-3 text-white">16-18</td>
                          <td className="py-2.5 px-3">60</td>
                          <td className="py-2.5 px-3 text-orange-400">100.0M</td>
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

      {/* Global Styles */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-gradient {
          mask-image: linear-gradient(to right, black 80%, transparent 100%);
          -webkit-mask-image: linear-gradient(to right, black 80%, transparent 100%);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 99px;
        }
        @keyframes gradientBackground {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-bg-gradient {
          background: linear-gradient(-45deg, #0a0c1a, #141028, #0d1a2d, #100d26);
          background-size: 400% 400%;
          animation: gradientBackground 14s ease infinite;
        }
      `}</style>
    </AppLayout>
  );
    }
