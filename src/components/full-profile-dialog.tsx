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
  Armchair // Added for Top Contributor Sofa/Couch Icon
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

const ProfileSection = ({ title, children, isEmpty, emptyLabel }: { title: string, children: React.ReactNode, isEmpty: boolean, emptyLabel: string }) => (
  <div className="mt-8">
    <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] px-1 mb-4">{title}</h3>
    {isEmpty ? (
      <div className="py-8 flex flex-col items-center justify-center gap-2 opacity-40">
        <Sparkles className="h-5 w-5 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{emptyLabel}</span>
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
      <DialogContent hideClose className="fixed inset-0 translate-x-0 translate-y-0 left-0 top-0 w-full h-full max-w-none bg-white p-0 border-none m-0 rounded-none z-[150] overflow-hidden">
        
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
              <button onClick={() => onOpenChange(false)} className="h-10 w-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10">
                <ChevronLeft className="h-6 w-6" />
              </button>
              <button className="h-10 w-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10">
                <MoreHorizontal className="h-6 w-6" />
              </button>
            </div>

            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/10 z-10" />
          </div>

          {/* Content Section (White Card - Now scrolls naturally with background) */}
          <div className="relative z-20 bg-white rounded-none px-6 pt-0 pb-32 mt-[-40px]">
            
            {/* Identity Part */}
            <div className="flex flex-col items-center">
              <div className="relative -mt-4 mb-1 z-30">
                <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                  <Avatar className="h-28 w-28 border-4 border-white shadow-2xl relative">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-4xl font-bold bg-slate-50 text-slate-300">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </AvatarFrame>
              </div>

              <div className="text-center space-y-2.5 w-full">
                <div className="flex items-center justify-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none truncate max-w-[200px]">{profile.username}</h2>
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
                <span className="text-xl font-bold text-slate-900 leading-none">{stats.fans}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fans</span>
              </div>
              <div className="flex flex-col items-center text-slate-400/20 text-2xl font-thin opacity-50">|</div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-slate-900 leading-none">{stats.following}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Following</span>
              </div>
              <div className="flex flex-col items-center text-slate-400/20 text-2xl font-thin opacity-50">|</div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-slate-900 leading-none">{stats.friends}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Friend</span>
              </div>
               <div className="flex flex-col items-center text-slate-400/20 text-2xl font-thin opacity-50">|</div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-xl font-bold text-slate-900 leading-none">{stats.visitors}</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visitors</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-50 my-2" />

            {/* Contribution Section (UPDATED WITH 3D GLOSSY ICON) */}
            <div className="mt-2 mb-4">
              <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest px-1 opacity-70 mb-2">Top Contribution</h3>
              <div className="flex flex-col items-center justify-center space-y-1.5 mt-3">
                 <div className="relative inline-block">
                   {/* 3D Glossy Crown SVG */}
                   <div className="absolute -top-3.5 -left-3.5 z-20 -rotate-[22deg] drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)] pointer-events-none">
                     <svg width="26" height="26" viewBox="0 0 24 24" fill="url(#crown-gold)" stroke="#7A5311" strokeWidth="0.5" strokeLinejoin="round" strokeLinecap="round">
                       <defs>
                         <linearGradient id="crown-gold" x1="0%" y1="0%" x2="0%" y2="100%">
                           <stop offset="0%" stopColor="#FFF2C8" />
                           <stop offset="30%" stopColor="#F9D46C" />
                           <stop offset="70%" stopColor="#D4A017" />
                           <stop offset="100%" stopColor="#996515" />
                         </linearGradient>
                       </defs>
                       <path d="M2 20h20v2H2v-2zm1.5-3l2-11 4 5 2.5-8 2.5 8 4-5 2 11H3.5z" />
                     </svg>
                   </div>

                   {/* 3D Glossy Frame with Couch */}
                   <div 
                     className="relative w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-[2px] border-[#F2D06B]"
                     style={{
                       background: 'linear-gradient(135deg, #3F4724 0%, #1A2010 100%)',
                       boxShadow: 'inset 0 4px 6px rgba(255,255,255,0.3), inset 0 -4px 6px rgba(0,0,0,0.6), 0 4px 8px rgba(0,0,0,0.3)'
                     }}
                   >
                     {/* Glossy Top Highlight */}
                     <div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-white/30 to-transparent rounded-t-full"></div>
                     
                     {/* Inner Couch/Armchair Icon */}
                     <Armchair 
                       className="w-5 h-5 text-[#F6E199] relative z-10 drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]" 
                       fill="#F4D368" 
                       strokeWidth={1} 
                       stroke="#996515" 
                     />
                   </div>
                 </div>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{profile.username}</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-50 my-2" />

            {/* Signature Bio Section */}
            <div className="mt-2 mb-4">
              <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest px-1 opacity-70 mb-2">Signature Bio</h3>
              <div className="px-1">
                 <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                   {profile.bio || "Synchronized with the Ummy frequency."}
                 </p>
              </div>
              
              <div className="flex flex-wrap gap-4 px-1 mt-6">
                 {profile.country && (
                   <div className="flex items-center gap-1.5">
                     <Globe className="h-3 w-3 text-slate-300" />
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">{profile.country}</span>
                   </div>
                 )}
                 {(profile.showBirthday !== false && !!profile.birthday) && (
                   <div className="flex items-center gap-1.5">
                     <Calendar className="h-3 w-3 text-slate-300" />
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">{profile.birthday}</span>
                   </div>
                 )}
                 {(profile.showWhatsapp !== false && !!profile.whatsapp) && (
                   <div className="flex items-center gap-1.5">
                     <Phone className="h-3 w-3 text-slate-300" />
                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">{profile.whatsapp}</span>
                   </div>
                 )}
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-50 my-2" />

            {/* Medals Section */}
            <ProfileSection title="Medal" isEmpty={medals.length === 0} emptyLabel="No Medal Earned">
              {medals.map((medalId: string) => {
                const medal = MEDAL_REGISTRY[medalId];
                if (!medal) return null;
                return (
                  <div key={medalId} className="flex flex-col items-center gap-1.5 p-1 group transition-all">
                    <img src={medal.imageUrl} alt={medal.name} className="h-12 w-12 object-contain drop-shadow-sm group-hover:scale-110 transition-transform" />
                    <span className="text-[8px] font-bold text-slate-500 uppercase truncate w-full text-center tracking-tighter">{medal.name}</span>
                  </div>
                );
              })}
            </ProfileSection>

            {/* Vehicles Section */}
            <ProfileSection title="Vehicle" isEmpty={ownedVehicles.length === 0} emptyLabel="No Vehicle Owned">
              {ownedVehicles.map((id: string) => {
                const vehicle = VEHICLE_REGISTRY[id];
                if (!vehicle) return null;
                const isActive = profile.inventory?.activeVehicle === id;
                return (
                  <div key={id} className="flex flex-col items-center gap-2 p-1 relative">
                    <div className="text-4xl filter drop-shadow-md py-1 animate-float">{vehicle.icon}</div>
                    <div className="flex flex-col items-center gap-1 w-full">
                      <span className="text-[8px] font-black text-slate-600 truncate uppercase tracking-tighter">{vehicle.name}</span>
                      <button className={cn(
                        "w-full h-5 rounded-full text-[8px] font-black uppercase transition-all shadow-sm",
                        isActive ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {isActive ? 'Active' : (isOwnProfile ? 'Use' : 'Permanent')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </ProfileSection>

            {/* Avatar Frames Section */}
            <ProfileSection title="Avatar Frame" isEmpty={ownedFrames.length === 0} emptyLabel="No Frame Owned">
              {ownedFrames.map((id: string) => {
                const frame = AVATAR_FRAMES[id];
                if (!frame) return null;
                const isActive = profile.inventory?.activeFrame === id;
                return (
                  <div key={id} className="flex flex-col items-center gap-2 p-1 relative">
                    <div className="h-12 w-12 rounded-full border border-slate-100 bg-white flex items-center justify-center overflow-hidden relative shadow-sm">
                      {frame.imageUrl ? (
                        <img src={frame.imageUrl} className="w-full h-full object-cover scale-150" alt="" />
                      ) : (
                        <div className="w-full h-full opacity-30" style={{ background: frame.gradient }} />
                      )}
                    </div>
                    <div className="flex flex-col items-center gap-1 w-full">
                      <span className="text-[8px] font-black text-slate-600 truncate uppercase tracking-tighter">{frame.name}</span>
                      <button className={cn(
                        "w-full h-5 rounded-full text-[8px] font-black uppercase transition-all shadow-sm",
                        isActive ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {isActive ? 'Active' : (isOwnProfile ? 'Use' : 'Permanent')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </ProfileSection>

            {/* Received Gifts Section */}
            <ProfileSection title="Gift" isEmpty={Object.keys(receivedGifts).length === 0} emptyLabel="No Gift Received">
              {Object.entries(receivedGifts).map(([giftId, count]: [string, any]) => {
                const gift = GIFT_REGISTRY[giftId];
                if (!gift) return null;
                return (
                  <div key={giftId} className="flex flex-col items-center gap-1 p-1 relative">
                    <div className="absolute top-1 right-2 text-[10px] font-black text-primary italic drop-shadow-sm">x{count}</div>
                    <div className="text-3xl filter drop-shadow-md py-1">{gift.emoji}</div>
                    <div className="flex items-center gap-0.5 bg-slate-50 px-2 rounded-full border border-slate-100">
                      <GoldCoinIcon className="h-2 w-2" />
                      <span className="text-[9px] font-black text-slate-900">{gift.price}</span>
                    </div>
                  </div>
                );
              })}
            </ProfileSection>

          </div>
        </div>

        {/* Sticky Footer Actions - Now Fixed relative to Dialog Content so it stays on top while background scrolls */}
        {!isOwnProfile && (
          <footer className="absolute bottom-0 left-0 right-0 p-6 pb-12 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-4 z-[160]">
             <button 
               onClick={onFollow}
               disabled={isProcessingFollow}
               className="flex-1 h-14 bg-white border-2 border-pink-500 text-pink-500 rounded-full flex items-center justify-center gap-3 font-black uppercase text-sm shadow-xl shadow-pink-500/10 active:scale-95 transition-all"
             >
               {isProcessingFollow ? <Loader className="h-5 w-5 animate-spin" /> : (
                 <>
                   <Heart className={cn("h-5 w-5", followData && "fill-current")} />
                   {followData ? "Joined" : "Follow"}
                 </>
               )}
             </button>
             <button className="flex-1 h-14 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-full flex items-center justify-center gap-3 font-black uppercase text-sm shadow-xl shadow-blue-500/10 active:scale-95 transition-all">
               <MessageCircle className="h-5 w-5" />
               Chat
             </button>
          </footer>
        )}

      </DialogContent>
    </Dialog>
  );
}
