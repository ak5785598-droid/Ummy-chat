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
  Image as ImageIcon,
  Edit2,
  Copy,
  HelpCircle,
  Users
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

// Flattened Gifts Registry (Metadata from GiftPicker)
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
      "flex items-center gap-1.5 px-1.5 py-0.5 rounded-full shadow-md shrink-0",
      gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
    )}>
      <span className="text-[10px] font-bold text-white leading-none">{gender === 'Female' ? '♀' : '♂'}</span>
      {age !== null && <span className="text-[10px] font-bold text-white leading-none">{age}</span>}
    </div>
  );
};

const RichLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-[#c89b70] pl-1.5 pr-2 py-0.5 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
    <Star className="h-2 w-2 fill-white text-white" />
    <span className="text-[10px] font-outfit font-bold text-white leading-none">Lv.{level}</span>
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

  // Inventory Filtering
  const ownedItems = profile.inventory?.ownedItems || [];
  const medals = profile.medals || [];
  const receivedGifts = profile.stats?.receivedGifts || {}; 

  const ownedVehicles = ownedItems.filter((id: string) => VEHICLE_REGISTRY[id]);
  const ownedFrames = ownedItems.filter((id: string) => AVATAR_FRAMES[id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent hideClose className="fixed inset-0 translate-x-0 translate-y-0 left-0 top-0 w-full h-full max-w-none bg-[#12141d] p-0 border-none m-0 rounded-none z-[150] flex flex-col font-outfit">
        
        {/* TOP SECTION (Image jaisa layout) */}
        <div className="relative w-full shrink-0 bg-slate-900 pb-8 pt-12 px-6 shadow-md">
          
          {/* Background Carousel Setup Kept intact for logic, with dark overlay */}
          <div className="absolute inset-0 z-0 opacity-20">
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
              <div className="h-full w-full bg-slate-900" />
            )}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/80 to-slate-900/40 z-10" />

          {/* Header Controls */}
          <div className="relative z-20 flex items-center justify-between mb-8">
            <button onClick={() => onOpenChange(false)} className="text-white active:scale-90 transition-all">
              <ChevronLeft className="h-7 w-7" />
            </button>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-white text-[13px] font-medium transition-all border border-white/5">
                <ImageIcon className="h-4 w-4" /> Picture
              </button>
              <button className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-white text-[13px] font-medium transition-all border border-white/5">
                <Edit2 className="h-4 w-4" /> Edit
              </button>
            </div>
          </div>

          {/* Profile Identity - Left Aligned */}
          <div className="relative z-20 flex flex-col items-start">
            <div className="mb-4">
              <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                <Avatar className="h-20 w-20 border-[3px] border-white/10 shadow-2xl relative">
                  <AvatarImage src={profile.avatarUrl} className="object-cover" />
                  <AvatarFallback className="text-3xl font-bold bg-slate-800 text-slate-300">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </AvatarFrame>
            </div>

            <div className="flex items-center gap-2 mb-1.5">
              <h2 className="text-xl font-bold text-white tracking-tight leading-none truncate max-w-[200px]">{profile.username}</h2>
              <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="text-[13px] text-slate-400 font-medium">id:{profile.accountNumber || profile.id?.substring(0, 8)}</span>
              <Copy className="h-3.5 w-3.5 text-slate-400 cursor-pointer hover:text-white" />
              <RichLevelBadge level={profile.level?.rich || 1} />
            </div>

            <div className="mb-6 flex gap-2">
              <span className="text-lg leading-none bg-white/5 p-1 rounded">🇮🇳</span>
              {/* Keeping Budget Tag Logic Alive */}
              <BudgetTag variant="diamond" label={`Score`} size="sm" />
            </div>

            {/* Stats Row */}
            <div className="flex items-center gap-8 text-white w-full">
              <div className="flex flex-col items-center">
                <span className="text-[17px] font-bold">{stats.fans}</span>
                <span className="text-[12px] text-slate-400 font-medium mt-0.5">Follower</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[17px] font-bold">{stats.following}</span>
                <span className="text-[12px] text-slate-400 font-medium mt-0.5">Following</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[17px] font-bold">{stats.visitors}</span>
                <span className="text-[12px] text-slate-400 font-medium mt-0.5">Visitors</span>
              </div>
              {/* Keeping friends from original logic */}
              <div className="flex flex-col items-center">
                <span className="text-[17px] font-bold">{stats.friends}</span>
                <span className="text-[12px] text-slate-400 font-medium mt-0.5">Friends</span>
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM CONTENT AREA (Original Theme maintained inside) */}
        <div className="flex-1 relative z-20 bg-[#12141d] px-6 pt-6 overflow-y-auto no-scrollbar pb-32">
          
          {/* TABS (Image logic) */}
          <div className="mb-6 border-b border-white/5">
             <span className="text-[15px] font-bold text-white inline-block pb-2 border-b-[3px] border-yellow-400">Profile</span>
          </div>

          {/* ABOUT ME SECTION (Image logic) */}
          <div className="mb-8">
             <h3 className="text-[14px] font-semibold text-white mb-3">About Me</h3>
             <button className="w-full bg-[#1c1f2b] hover:bg-[#252a3b] transition-colors py-3.5 rounded-[14px] flex items-center justify-center gap-2 text-white text-[13px] font-medium border border-white/5">
                <Edit2 className="h-4 w-4 text-yellow-400" /> Edit
             </button>
          </div>

          {/* FAMILY SECTION (Image logic) */}
          <div className="mb-8">
             <div className="flex items-center justify-between mb-3">
                <h3 className="text-[14px] font-semibold text-white">Family</h3>
                <HelpCircle className="h-4 w-4 text-slate-400" />
             </div>
             <div className="bg-[#1c1f2b] p-4 rounded-[16px] flex items-center gap-3 border border-white/5">
                <div className="h-11 w-11 bg-white/5 rounded-xl flex items-center justify-center">
                   <Users className="h-6 w-6 text-slate-500" />
                </div>
                <span className="text-[13px] text-slate-400">Don't have a family yet.</span>
             </div>
          </div>

          {/* Original Logic Sections container mapping -> Adjusted text color to match dark background naturally without changing the structural logic */}
          <div className="bg-white rounded-[32px] p-6 mt-4 shadow-xl">
            
            {/* Contribution Section - Original */}
            <div className="mb-4">
              <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest px-1 opacity-70 mb-2">Top Contribution</h3>
              <div className="flex flex-col items-center justify-center space-y-1.5">
                 <Avatar className="h-10 w-10 border-2 border-slate-50 shadow-sm">
                   <AvatarImage src={profile.avatarUrl} />
                   <AvatarFallback>H</AvatarFallback>
                 </Avatar>
                 <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{profile.username}</span>
              </div>
            </div>

            <div className="h-[1px] w-full bg-slate-50 my-2" />

            {/* Signature Bio Section - Original */}
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

        {/* Sticky Footer Actions - Hidden for Own Profile */}
        {!isOwnProfile && (
          <footer className="shrink-0 p-6 pb-12 bg-white/80 backdrop-blur-xl border-t border-slate-100 flex gap-4 absolute bottom-0 left-0 right-0 z-[160]">
             <button 
               onClick={onFollow}
               disabled={isProcessingFollow}
               className="flex-1 h-14 bg-white border-2 border-pink-500 text-pink-500 rounded-full flex items-center justify-center gap-3 font-black uppercase text-sm shadow-xl shadow-pink-500/10 active:scale-95 transition-transform"
             >
               {isProcessingFollow ? <Loader className="h-5 w-5 animate-spin" /> : (
                 <>
                   <Heart className={cn("h-5 w-5", followData && "fill-current")} />
                   {followData ? "Joined" : "Follow"}
                 </>
               )}
             </button>
             <button className="flex-1 h-14 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-full flex items-center justify-center gap-3 font-black uppercase text-sm shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">
               <MessageCircle className="h-5 w-5" />
               Chat
             </button>
          </footer>
        )}

      </DialogContent>
    </Dialog>
  );
}
