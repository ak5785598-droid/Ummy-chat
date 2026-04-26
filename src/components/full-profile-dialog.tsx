'use client';

import React, { useEffect, useState } from 'react';
import { 
  ChevronLeft, 
  Heart, 
  MessageCircle, 
  MoreHorizontal,
  Star,
  Sparkles,
  Calendar,
  Globe,
  Phone,
  Loader,
  Camera,
  Armchair 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { cn } from '@/lib/utils';
import { BudgetTag } from '@/components/budget-tag';
import { OfficialTag } from '@/components/official-tag';
import { SellerTag } from '@/components/seller-tag';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { GoldCoinIcon } from '@/components/icons';

// Registries
import { MEDAL_REGISTRY } from '@/constants/medals';
import { AVATAR_FRAMES } from '@/constants/avatar-frames';
import { VEHICLE_REGISTRY } from '@/constants/vehicles';

// Flattened Gifts Registry
const GIFT_REGISTRY: Record<string, any> = {
  'heart': { id: 'heart', name: 'Heart', price: 99, emoji: '❤️' },
  'cake': { id: 'cake', name: 'Cake', price: 499, emoji: '🍰' },
  'popcorn': { id: 'popcorn', name: 'Popcorn', price: 799, emoji: '🍿' },
  'donut': { id: 'donut', name: 'Donut', price: 299, emoji: '🍩' },
  'lollipop': { id: 'lollipop', name: 'Lollipop', price: 199, emoji: '🍭' },
  'apple': { id: 'apple', name: 'Apple', price: 100, emoji: '🍎' },
  'watermelon': { id: 'watermelon', name: 'Watermelon', price: 499, emoji: '🍉' },
  'mango': { id: 'mango', name: 'Mango', price: 999, emoji: '🥭' },
  'strawberry': { id: 'strawberry', name: 'Strawberry', price: 2999, emoji: '🍓' },
  'cherry': { id: 'cherry', name: 'Cherry', price: 5000, emoji: '🍒' },
  'dm': { id: 'dm', name: 'Ball', price: 700000, emoji: '🎸' },
  'tp': { id: 'tp', name: 'Guitar', price: 999999, emoji: '🎳' },
};

interface FullProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  stats: any;
  followData?: any;
  onFollow?: () => void;
  isProcessingFollow?: boolean;
  isOwnProfile?: boolean;
}

const calculateAge = (birthday: string) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const GenderAgeTag = ({ gender, birthday }: { gender: string | null | undefined, birthday?: string }) => {
  const age = calculateAge(birthday || '');
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full shadow-md shrink-0",
      gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
    )}>
      <span className="text-[11px] font-bold text-white leading-none">{gender === 'Female' ? '♀' : '♂'}</span>
      {age !== null && <span className="text-[11px] font-bold text-white leading-none">{age}</span>}
    </div>
  );
};

const RichLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 pl-1.5 pr-2.5 py-1 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
    <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine"></div>
    <Star className="h-2.5 w-2.5 fill-white text-white" />
    <span className="text-[11px] font-outfit font-black text-white leading-none">Lv.{level}</span>
  </div>
);

const CharmLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 pl-1.5 pr-2.5 py-1 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
    <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine"></div>
    <Sparkles className="h-2.5 w-2.5 fill-white text-white" />
    <span className="text-[11px] font-outfit font-black text-white leading-none">Lv.{level}</span>
  </div>
);

// Updated ProfileSection to remove default title since tabs will handle navigation
const ProfileSection = ({ children, isEmpty, emptyLabel }: { children: React.ReactNode, isEmpty: boolean, emptyLabel: string }) => (
  <div className="mt-4">
    {isEmpty ? (
      <div className="py-12 flex flex-col items-center justify-center gap-2 opacity-60">
        <Sparkles className="h-6 w-6 text-white/40" />
        <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{emptyLabel}</span>
      </div>
    ) : (
      <div className="grid grid-cols-4 gap-4">
        {children}
      </div>
    )}
  </div>
);

export function FullProfileDialog({ 
  open, 
  onOpenChange, 
  profile, 
  stats,
  followData,
  onFollow,
  isProcessingFollow,
  isOwnProfile
}: FullProfileDialogProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [activeTab, setActiveTab] = useState<'medal' | 'vehicle' | 'frame' | 'gift'>('medal');
  const images = profile?.spaceImages || [];

  useEffect(() => {
    if (!api || images.filter(Boolean).length <= 1) return;
    const intervalId = setInterval(() => {
      api.scrollNext();
    }, 3000);
    return () => clearInterval(intervalId);
  }, [api, images.filter(Boolean).length]);

  if (!profile) return null;

  const ownedItems = profile.inventory?.ownedItems || [];
  const medals = profile.medals || [];
  const receivedGifts = profile.stats?.receivedGifts || {};

  const ownedVehicles = ownedItems.filter((id: string) => VEHICLE_REGISTRY[id]);
  const ownedFrames = ownedItems.filter((id: string) => AVATAR_FRAMES[id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="fixed inset-0 translate-x-0 translate-y-0 left-0 top-0 w-full h-full max-w-none bg-black p-0 border-none m-0 rounded-none z-[150] overflow-hidden">
        
        {/* Main Scrollable Container for both Background and Content */}
        <div className="w-full h-full overflow-y-auto no-scrollbar relative flex flex-col font-outfit">
          
          {/* Top Section with Background Carousel/Avatar Fallback */}
          <div className="relative h-[30vh] w-full shrink-0 bg-slate-900 overflow-hidden">
            {images.filter(Boolean).length > 0 ? (
              <Carousel setApi={setApi} className="h-full w-full" opts={{ loop: true }}>
                <CarouselContent className="h-full ml-0">
                  {images.filter(Boolean).map((url: string, i: number) => (
                    <CarouselItem key={i} className="h-full pl-0 basis-full">
                      <img src={url} className="h-full w-full object-cover" alt="" />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            ) : (
              /* Fallback: Clear background without blur or extra opacity layer */
              <div className="h-full w-full relative">
                 <img 
                   src={profile.avatarUrl} 
                   className="h-full w-full object-cover" 
                   alt="background-avatar" 
                 />
              </div>
            )}
            
            {/* Header Controls */}
            <div className="absolute top-12 left-0 right-0 px-6 flex items-center justify-between z-[100]">
              <button onClick={() => onOpenChange(false)} className="h-10 w-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/20">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button className="h-10 w-10 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/20">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30 z-10" />
          </div>

          {/* Content Section (GLOSSY BLACK GLOWING CARD) */}
          <div className="relative z-20 bg-gradient-to-b from-[#1a1a1a] via-[#0a0a0a] to-black rounded-t-[2rem] px-6 pt-0 pb-32 mt-[-40px] shadow-[0_-15px_40px_rgba(255,255,255,0.08),inset_0_2px_5px_rgba(255,255,255,0.15)] border-t border-white/10 ring-1 ring-white/5 backdrop-blur-2xl">
            
            {/* Identity Part */}
            <div className="flex flex-col items-center">
              <div className="relative -mt-4 mb-1 z-30 drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
                <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                  <Avatar className="h-28 w-28 border-4 border-[#222] shadow-2xl relative">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-4xl font-bold bg-slate-800 text-slate-300">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </AvatarFrame>
              </div>

              <div className="text-center space-y-2.5 w-full">
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-bold text-white tracking-tight leading-none truncate max-w-[200px] drop-shadow-md">{profile.username}</h2>
                  <span className="text-xl leading-none">🇮🇳</span>
                  <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
                </div>

                <div className="flex items-center justify-center gap-2">
                  <RichLevelBadge level={profile.level?.rich || 1} />
                  <CharmLevelBadge level={profile.level?.charm || 1} />
                </div>

                <div className="flex justify-center items-center gap-2 h-8">
                  <BudgetTag variant="diamond" label={`ID: ${profile.accountNumber || profile.id.substring(0, 6)}`} size="sm" />
                  {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                  {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SellerTag size="sm" />}
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="flex justify-between items-center py-5 mb-0 mx-[-24px]">
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-white leading-none">{stats.fans}</span>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Fans</span>
              </div>
              <div className="flex flex-col items-center text-white/10 text-2xl font-thin opacity-50">|</div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-white leading-none">{stats.following}</span>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Following</span>
              </div>
              <div className="flex flex-col items-center text-white/10 text-2xl font-thin opacity-50">|</div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-white leading-none">{stats.friends}</span>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Friend</span>
              </div>
               <div className="flex flex-col items-center text-white/10 text-2xl font-thin opacity-50">|</div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-white leading-none">{stats.visitors}</span>
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-1">Visitors</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/10 my-2" />

            {/* Top Contribution Section */}
            <div className="mt-2 mb-4">
              <h3 className="text-[9px] font-black text-white/80 uppercase tracking-widest px-1 opacity-70 mb-2">Top Contribution</h3>
              
              <div className="flex items-end justify-center gap-4 mt-5">
                {/* Left Chair - Silver */}
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="relative inline-block">
                    <div className="absolute -top-3.5 -left-2 z-30 -rotate-[22deg] text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] pointer-events-none">👑</div>
                    <div 
                      className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-[2px] border-[#C0C0C0]"
                      style={{
                        background: 'linear-gradient(135deg, #7A7A7A 0%, #2E2E2E 100%)',
                        boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.3), inset 0 -4px 6px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/30 to-transparent rounded-t-full z-20"></div>
                      <Armchair 
                        className="w-4 h-4 text-[#E8E8E8] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" 
                        fill="#C0C0C0" 
                        strokeWidth={1} 
                        stroke="#5A5A5A" 
                      />
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-white/50 uppercase tracking-tight">Empty</span>
                </div>

                {/* Center Chair - Gold */}
                <div className="flex flex-col items-center justify-center space-y-1.5 -mb-2">
                  <div className="relative inline-block">
                    <div className="absolute -top-4 -left-2.5 z-30 -rotate-[22deg] text-xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] pointer-events-none">👑</div>
                    <div 
                      className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-[2px] border-[#F2D06B]"
                      style={{
                        background: 'linear-gradient(135deg, #3F4724 0%, #1A2010 100%)',
                        boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.3), inset 0 -4px 6px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/30 to-transparent rounded-t-full z-20"></div>
                      
                      {profile?.avatarUrl ? (
                        <img src={profile.avatarUrl} className="w-full h-full object-cover relative z-10" alt="top-user" />
                      ) : (
                        <Armchair 
                          className="w-5 h-5 text-[#F6E199] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" 
                          fill="#F4D368" 
                          strokeWidth={1} 
                          stroke="#996515" 
                        />
                      )}
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-tight">{profile.username || 'Empty'}</span>
                </div>

                {/* Right Chair - Brown */}
                <div className="flex flex-col items-center justify-center space-y-1.5">
                  <div className="relative inline-block">
                    <div className="absolute -top-3.5 -left-2 z-30 -rotate-[22deg] text-lg drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] pointer-events-none">👑</div>
                    <div 
                      className="relative w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border-[2px] border-[#8B4513]"
                      style={{
                        background: 'linear-gradient(135deg, #5C2E0B 0%, #291404 100%)',
                        boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.3), inset 0 -4px 6px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.5)'
                      }}
                    >
                      <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/30 to-transparent rounded-t-full z-20"></div>
                      <Armchair 
                        className="w-4 h-4 text-[#CD853F] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" 
                        fill="#A0522D" 
                        strokeWidth={1} 
                        stroke="#4A2509" 
                      />
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-white/50 uppercase tracking-tight">Empty</span>
                </div>
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/10 my-2" />

            {/* Signature Bio Section */}
            <div className="mt-2 mb-4">
              <h3 className="text-[9px] font-black text-white/80 uppercase tracking-widest px-1 opacity-70 mb-2">Signature Bio</h3>
              <div className="px-1">
                 <p className="text-[13px] font-medium text-white/70 leading-relaxed">
                   {profile.bio || "Synchronized with the Ummy frequency."}
                 </p>
              </div>
              
              <div className="flex flex-wrap gap-4 px-1 mt-6">
                 {profile.country && (
                   <div className="flex items-center gap-1.5">
                     <Globe className="h-3 w-3 text-white/30" />
                     <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">{profile.country}</span>
                   </div>
                 )}
                 {(profile.showBirthday !== false && !!profile.birthday) && (
                   <div className="flex items-center gap-1.5">
                     <Calendar className="h-3 w-3 text-white/30" />
                     <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">{profile.birthday}</span>
                   </div>
                 )}
                 {(profile.showWhatsapp !== false && !!profile.whatsapp) && (
                   <div className="flex items-center gap-1.5">
                     <Phone className="h-3 w-3 text-white/30" />
                     <span className="text-[10px] font-black uppercase text-white/60 tracking-tight">{profile.whatsapp}</span>
                   </div>
                 )}
              </div>
            </div>

            <div className="h-[1px] w-full bg-white/10 my-2" />

            {/* TABS NAVIGATION */}
            <div className="flex items-center justify-between mt-6 border-b border-white/10 pb-0">
              {['medal', 'vehicle', 'frame', 'gift'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={cn(
                    "text-[11px] font-black uppercase tracking-wider transition-all px-3 py-3 relative w-full text-center",
                    activeTab === tab
                      ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      : "text-white/40 hover:text-white/70"
                  )}
                >
                  {tab}
                  {activeTab === tab && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,1)] rounded-t-md" />
                  )}
                </button>
              ))}
            </div>

            {/* 60VH SCROLL AREA FOR ACTIVE TAB CONTENT */}
            <div className="min-h-[60vh] mt-4 w-full">
              
              {activeTab === 'medal' && (
                <ProfileSection isEmpty={medals.length === 0} emptyLabel="No Medal Earned">
                  {medals.map((medalId: string) => {
                    const medal = MEDAL_REGISTRY[medalId];
                    if (!medal) return null;
                    return (
                      <div key={medalId} className="flex flex-col items-center gap-1.5 p-1 group transition-all">
                        <img src={medal.imageUrl} alt={medal.name} className="h-12 w-12 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                        <span className="text-[8px] font-bold text-white/70 uppercase truncate w-full text-center tracking-tighter">{medal.name}</span>
                      </div>
                    );
                  })}
                </ProfileSection>
              )}

              {activeTab === 'vehicle' && (
                <ProfileSection isEmpty={ownedVehicles.length === 0} emptyLabel="No Vehicle Owned">
                  {ownedVehicles.map((id: string) => {
                    const vehicle = VEHICLE_REGISTRY[id];
                    if (!vehicle) return null;
                    const isActive = profile.inventory?.activeVehicle === id;
                    return (
                      <div key={id} className="flex flex-col items-center gap-2 p-1 relative">
                        <div className="text-4xl filter drop-shadow-md py-1 animate-float">{vehicle.icon}</div>
                        <div className="flex flex-col items-center gap-1 w-full">
                          <span className="text-[8px] font-black text-white/80 truncate uppercase tracking-tighter">{vehicle.name}</span>
                          <button className={cn(
                            "w-full h-5 rounded-full text-[8px] font-black uppercase transition-all shadow-sm border border-white/5",
                            isActive ? "bg-emerald-500 text-white" : "bg-white/10 text-white/50"
                          )}>
                            {isActive ? 'Active' : (isOwnProfile ? 'Use' : 'Permanent')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </ProfileSection>
              )}

              {activeTab === 'frame' && (
                <ProfileSection isEmpty={ownedFrames.length === 0} emptyLabel="No Frame Owned">
                  {ownedFrames.map((id: string) => {
                    const frame = AVATAR_FRAMES[id];
                    if (!frame) return null;
                    const isActive = profile.inventory?.activeFrame === id;
                    return (
                      <div key={id} className="flex flex-col items-center gap-2 p-1 relative">
                        <div className="h-12 w-12 rounded-full border border-white/10 bg-[#111] flex items-center justify-center overflow-hidden relative shadow-sm">
                          {frame.imageUrl ? (
                            <img src={frame.imageUrl} className="w-full h-full object-cover scale-150" alt="" />
                          ) : (
                            <div className="w-full h-full opacity-50" style={{ background: frame.gradient }} />
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1 w-full">
                          <span className="text-[8px] font-black text-white/80 truncate uppercase tracking-tighter">{frame.name}</span>
                          <button className={cn(
                            "w-full h-5 rounded-full text-[8px] font-black uppercase transition-all shadow-sm border border-white/5",
                            isActive ? "bg-emerald-500 text-white" : "bg-white/10 text-white/50"
                          )}>
                            {isActive ? 'Active' : (isOwnProfile ? 'Use' : 'Permanent')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </ProfileSection>
              )}

              {activeTab === 'gift' && (
                <ProfileSection isEmpty={Object.keys(receivedGifts).length === 0} emptyLabel="No Gift Received">
                  {Object.entries(receivedGifts).map(([giftId, count]: [string, any]) => {
                    const gift = GIFT_REGISTRY[giftId];
                    if (!gift) return null;
                    return (
                      <div key={giftId} className="flex flex-col items-center gap-1 p-1 relative">
                        <div className="absolute top-1 right-2 text-[10px] font-black text-pink-500 italic drop-shadow-sm">x{count}</div>
                        <div className="text-3xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)] py-1">{gift.emoji}</div>
                        <div className="flex items-center gap-0.5 bg-white/10 px-2 rounded-full border border-white/5">
                          <GoldCoinIcon className="h-2 w-2" />
                          <span className="text-[9px] font-black text-white">{gift.price}</span>
                        </div>
                      </div>
                    );
                  })}
                </ProfileSection>
              )}

            </div>
          </div>
        </div>

        {/* Sticky Footer Actions - Darkened to match Glossy Black Theme */}
        {!isOwnProfile && (
          <footer className="absolute bottom-0 left-0 right-0 p-6 pb-12 bg-black/80 backdrop-blur-xl border-t border-white/10 flex gap-4 z-[160]">
             <button 
               onClick={onFollow}
               disabled={isProcessingFollow}
               className="flex-1 h-14 bg-[#111] border-2 border-pink-500 text-pink-500 rounded-full flex items-center justify-center gap-3 font-black uppercase text-sm shadow-[0_0_20px_rgba(236,72,153,0.2)] active:scale-95 transition-all"
             >
               {isProcessingFollow ? <Loader className="h-5 w-5 animate-spin text-pink-500" /> : (
                 <>
                   <Heart className={cn("h-5 w-5", followData && "fill-current")} />
                   {followData ? "Joined" : "Follow"}
                 </>
               )}
             </button>
             <button className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-full flex items-center justify-center gap-3 font-black uppercase text-sm shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 transition-all border border-white/10">
               <MessageCircle className="h-5 w-5" />
               Chat
             </button>
          </footer>
        )}

      </DialogContent>
    </Dialog>
  );
}
