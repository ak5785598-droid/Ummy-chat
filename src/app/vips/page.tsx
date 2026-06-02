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

// --- DATA STRUCTURES (SAME RAKHA HAI) ---

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

  const [selectedLevel, setSelectedLevel] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [vipConfig, setVipConfig] = useState<any>({
    bgType: 'dynamic',
    bgUrl: '',
    levels: {}
  });

  // Check karo ki koi custom background active hai ya nahi
  const hasCustomBackground = (vipConfig.bgType === 'image' || vipConfig.bgType === 'video') && vipConfig.bgUrl;
  const hasLevelCustomBg = vipConfig?.levels?.[selectedLevel]?.bgUrl;
  // Agar koi bhi custom background hai toh saara content hide karo
  const shouldHideContent = !!(hasCustomBackground || hasLevelCustomBg);

  // Sync global VIP configs
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

  const [stealthSettings, setStealthSettings] = useState({
    mysteriousVisitor: false,
    hideGiftRecord: false,
    rankInvisible: false,
    roomInvisible: false,
    avoidBeingKicked: false,
  });

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

  const userSvipLevel = userProfile?.svip || 0;
  const activeLevelData = SVIP_LEVELS_DATA.find(l => l.level === selectedLevel) || SVIP_LEVELS_DATA[0];
  const unlockedCount = SVIP_PRIVILEGES_DATA.filter(p => p.level <= selectedLevel).length;

  const cachedGlobalBgUrl = useCachedMedia(vipConfig?.bgUrl);
  const cachedLevelBgUrl = useCachedMedia(vipConfig?.levels?.[selectedLevel]?.bgUrl);

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
      setStealthSettings(prev => ({ ...prev, [key]: !newStatus }));
    }
  };

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
    let label = `SVIP ${lvl}`;

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
      <div className={cn("relative rounded-full px-3 py-1 flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase select-none transition-all duration-300", baseStyle, glowStyle)}>
        <Star className={cn("h-3 w-3 fill-current shrink-0", lvl >= 16 && "text-yellow-300 animate-spin")} style={{ animationDuration: '4s' }} />
        <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{label}</span>
      </div>
    );
  };

  return (
    <AppLayout>
      <div className="min-h-screen text-white font-outfit relative flex flex-col overflow-x-hidden">
        
        {/* Default Background - Jab koi custom background nahi hai */}
        {!shouldHideContent && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 z-0" />
        )}

        {/* Custom Background - Jab aata hai tab dikhega */}
        {shouldHideContent && (
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            {hasLevelCustomBg && cachedLevelBgUrl ? (
              cachedLevelBgUrl.includes('.mp4') || cachedLevelBgUrl.includes('video') ? (
                <video src={cachedLevelBgUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
              ) : (
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${cachedLevelBgUrl})` }} />
              )
            ) : hasCustomBackground && cachedGlobalBgUrl ? (
              vipConfig.bgType === 'video' ? (
                <video src={cachedGlobalBgUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
              ) : (
                <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url(${cachedGlobalBgUrl})` }} />
              )
            ) : null}
          </div>
        )}

        {/* Header - Hamesha rahega */}
        <header className="px-6 pt-10 pb-4 flex items-center justify-between sticky top-0 bg-transparent backdrop-blur-sm z-[90] shrink-0">
          <button 
            onClick={() => router.back()} 
            className="p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-full hover:bg-white/[0.08] active:scale-95 transition-all"
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

        {/* 🔥🔥 TEXT TABS - HAMESHA DIKHENGE (Background ho ya na ho) 🔥🔥 */}
        <div className="px-4 pt-2 pb-4 z-10 relative">
          <div className="flex flex-wrap items-center justify-center gap-2 gap-y-3">
            {SVIP_LEVELS_DATA.map((lvl) => {
              const isSelected = selectedLevel === lvl.level;
              const isUserLevel = userSvipLevel >= lvl.level;
              
              return (
                <button 
                  key={lvl.level}
                  onClick={() => setSelectedLevel(lvl.level)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs font-black uppercase transition-all active:scale-95",
                    isSelected 
                      ? "bg-amber-500 text-black shadow-lg" 
                      : "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10",
                    isUserLevel && !isSelected && "text-emerald-400"
                  )}
                >
                  {lvl.name}
                  {isUserLevel && <CheckCircle className="inline h-3 w-3 ml-1 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content - Jab custom background ho toh pura HIDE ho jayega, nahi toh dikhega */}
        {!shouldHideContent ? (
          <main className="flex-1 px-4 pt-2 space-y-8 z-10 relative pb-32">
            
            {/* Identity Card */}
            <div className="bg-[#0b0e1e]/60 border border-white/[0.04] rounded-[2.5rem] p-6 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center gap-5">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center border border-white/10">
                  <span className="text-2xl font-black text-white">
                    {(userProfile?.username || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <h3 className="text-[17px] font-black text-white leading-tight truncate">{userProfile?.username || 'Gamer'}</h3>
                  <div className="flex items-center gap-2">
                    {userSvipLevel > 0 ? (
                      renderUniqueBadge(userSvipLevel, false)
                    ) : (
                      <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full border border-slate-700">
                        Non-SVIP Member
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* EXP Progress Bar */}
              <div className="mt-6 pt-2 border-t border-white/[0.03] space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  <span>VIP EXP Progress</span>
                  <span className="text-amber-400">
                    {userProfile?.wallet?.totalSpent?.toLocaleString() || '0'} / 1,500,000
                  </span>
                </div>
                <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-white/[0.02]">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min(100, ((userProfile?.wallet?.totalSpent || 0) / 1500000) * 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Unlocked Privileges Counter */}
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/[0.05] rounded-3xl p-5">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">SVIP Benefits</p>
                <h4 className="text-[17px] font-black text-white">
                  Unlocked: <span className="text-amber-400">{unlockedCount} / 31</span>
                </h4>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="px-4 py-2 bg-white/[0.05] hover:bg-white/[0.09] active:scale-95 border border-white/[0.08] rounded-xl text-[10px] font-black uppercase tracking-wider"
              >
                Stealth
              </button>
            </div>

            {/* Privileges Grid */}
            <div className="space-y-4 pb-8">
              <div className="flex items-center justify-between ml-1">
                <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.2em]">Privileges</h4>
                <span className="text-[9px] font-black text-slate-500 uppercase">SVIP {selectedLevel}+ unlocks</span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {SVIP_PRIVILEGES_DATA.map((benefit) => {
                  const isUnlockedForSelected = benefit.level <= selectedLevel;
                  const BenefitIcon = benefit.icon;
                  
                  return (
                    <div 
                      key={benefit.id} 
                      className={cn(
                        "p-4 rounded-3xl border flex flex-col items-center text-center gap-2.5 relative transition-all",
                        isUnlockedForSelected 
                          ? "bg-[#0b0e1e]/80 border-amber-500/30" 
                          : "bg-[#050711]/60 border-white/[0.02] opacity-40"
                      )}
                    >
                      {!isUnlockedForSelected && (
                        <div className="absolute top-2 right-2 p-1 bg-black/60 rounded-full border border-white/5">
                          <Lock className="h-2.5 w-2.5 text-slate-400" />
                        </div>
                      )}
                      <div className={cn("h-11 w-11 rounded-2xl flex items-center justify-center border",
                        isUnlockedForSelected ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-white/[0.02] text-slate-500 border-white/[0.04]"
                      )}>
                        <BenefitIcon className="h-5.5 w-5.5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[11px] font-black text-white truncate max-w-full">{benefit.name}</p>
                        <p className="text-[7.5px] font-black text-slate-400 uppercase">SVIP {benefit.level}+</p>
                      </div>
                      <p className="text-[8px] font-medium text-slate-500 leading-normal line-clamp-2">{benefit.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </main>
        ) : (
          /* Jab custom background ho - saara content hide, sirf tabs dikhenge */
          <div className="flex-1" />
        )}

        {/* Recharge Button - Hamesha rahega */}
        <footer className="fixed bottom-0 left-0 right-0 p-5 z-[80] shrink-0">
          <div className="max-w-lg mx-auto">
            <Button 
              onClick={() => {
                toast({
                  title: 'Recharge',
                  description: 'Redirecting to wallet...',
                });
                router.push('/wallet');
              }}
              className="w-full h-14 rounded-2xl font-black uppercase text-[15px] tracking-widest shadow-xl active:scale-95 transition-all bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-black"
            >
              <Zap className="h-4.5 w-4.5 fill-current mr-2" />
              RECHARGE NOW
            </Button>
          </div>
        </footer>

        {/* Settings Drawer - Same */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-x-0 bottom-0 max-h-[85vh] bg-[#070914] border-t border-white/[0.05] rounded-t-[3rem] p-6 pb-12 flex flex-col gap-6 animate-in slide-in-from-bottom duration-300 overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.03]">
                <div>
                  <h3 className="text-[17px] font-black text-white uppercase">STEALTH MODE</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Configure hidden options</p>
                </div>
                <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-1.5 bg-white/[0.04] rounded-xl text-[9px] font-black uppercase">Close</button>
              </div>

              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-400 uppercase">Your Level:</span>
                {renderUniqueBadge(userSvipLevel, false)}
              </div>

              <div className="space-y-4">
                {[
                  { key: 'mysteriousVisitor', label: 'Mysterious Visitor', desc: 'Visit profiles incognito.', reqLevel: 5 },
                  { key: 'hideGiftRecord', label: 'Hide Gift Record', desc: 'Hide gift history.', reqLevel: 8 },
                  { key: 'rankInvisible', label: 'Rank Invisible', desc: 'Hide from leaderboards.', reqLevel: 9 },
                  { key: 'roomInvisible', label: 'Room Invisible', desc: 'Enter rooms silently.', reqLevel: 12 },
                  { key: 'avoidBeingKicked', label: 'Kick Immunity', desc: 'Cannot be kicked.', reqLevel: 13 },
                ].map((sw) => {
                  const isLocked = userSvipLevel < sw.reqLevel;
                  const isActive = stealthSettings[sw.key as keyof typeof stealthSettings];
                  return (
                    <div key={sw.key} className={cn("p-4 rounded-2xl border flex items-center justify-between gap-5", isLocked ? "bg-black/40 border-white/[0.02] opacity-40" : "bg-[#0b0e1e]/60 border-white/[0.04]")}>
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-black text-white">{sw.label}</span>
                          {isLocked && <span className="text-[8px] font-black bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">SVIP {sw.reqLevel}+</span>}
                        </div>
                        <p className="text-[10px] font-medium text-slate-400">{sw.desc}</p>
                      </div>
                      <button disabled={isLocked} onClick={() => handleToggleChange(sw.key as keyof typeof stealthSettings, sw.reqLevel)} className={cn("w-12 h-6 rounded-full p-1 transition-colors", isActive ? "bg-amber-400" : "bg-slate-800")}>
                        <div className={cn("w-4 h-4 bg-white rounded-full shadow-md transform transition-transform", isActive ? "translate-x-6" : "translate-x-0")} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rules Modal */}
        {isRulesOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="absolute inset-x-0 bottom-0 max-h-[90vh] bg-[#070914] border-t border-white/[0.05] rounded-t-[3rem] p-6 pb-12 flex flex-col gap-6 animate-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center pb-2 border-b border-white/[0.03]">
                <div>
                  <h3 className="text-[17px] font-black text-white uppercase">SVIP RULES</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">Validity & Guidelines</p>
                </div>
                <button onClick={() => setIsRulesOpen(false)} className="px-4 py-1.5 bg-white/[0.04] rounded-xl text-[9px] font-black uppercase">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6 pr-1">
                <div className="bg-[#0b0e1e]/60 border border-white/[0.04] rounded-2xl p-4">
                  <h4 className="font-black text-white uppercase text-[10px] tracking-widest text-amber-400">1. EXP Earning</h4>
                  <ul className="list-disc list-inside space-y-1.5 font-medium text-slate-400 text-xs mt-2">
                    <li>1 Coin = 1 EXP</li>
                    <li>Instant points accumulation</li>
                    <li>Deductions on chargebacks</li>
                  </ul>
                </div>
                <div className="border border-white/[0.03] rounded-2xl overflow-hidden">
                  <table className="w-full text-center">
                    <thead>
                      <tr className="bg-white/[0.02] text-[9px] uppercase font-black text-slate-400">
                        <th className="py-2.5 px-3">Level</th>
                        <th className="py-2.5 px-3">EXP</th>
                        <th className="py-2.5 px-3">Validity</th>
                      </tr>
                    </thead>
                    <tbody className="text-[10px] font-bold text-slate-400">
                      {SVIP_LEVELS_DATA.slice(0, 6).map((lvl) => (
                        <tr key={lvl.level} className="border-t border-white/[0.02]">
                          <td className="py-2 text-white">SVIP {lvl.level}</td>
                          <td className="py-2 text-amber-400">{lvl.points}</td>
                          <td className="py-2">{lvl.validity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </AppLayout>
  );
   }
