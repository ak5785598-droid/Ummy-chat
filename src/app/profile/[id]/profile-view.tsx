'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader, 
  ChevronLeft,
  Crown,
  UserPlus,
  Star,
  Heart,
  ShoppingBag,
  ShoppingCart,
  MoreHorizontal,
  Pencil,
  MessageCircle,
  ClipboardList,
  HelpCircle,
  ChevronRight,
  Sparkles,
  History,
  Trophy,
  Info,
  Settings as SettingsIcon,
  LogOut,
  Users,
  Gem,
  Calendar,
  Globe,
  Phone,
  Camera,
  ShieldAlert,
  Medal,
  DollarSign 
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, deleteDocumentNonBlocking, setDocumentNonBlocking, useFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { DirectMessageDialog } from '@/components/direct-message-dialog';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { OfficialTag } from '@/components/official-tag';
import { SellerTag } from '@/components/seller-tag';
import { doc, serverTimestamp, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { SocialRelationsDialog } from '@/components/social-relations-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { SellerTransferDialog } from "@/components/seller-transfer-dialog";
import { BudgetTag } from "@/components/budget-tag";
import { FullProfileDialog } from '@/components/full-profile-dialog';
import { ReportUserDialog } from '@/components/report-user-dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MEDAL_REGISTRY } from '@/constants/medals';
import { AVATAR_FRAMES } from '@/constants/avatar-frames';
import { VEHICLE_REGISTRY } from '@/constants/vehicles';

// --- CUSTOM 3D SVGA GOLD COIN ICON ---
const SVGA_GoldDollar = () => (
  <div className="relative h-7 w-7 flex items-center justify-center rounded-full bg-gradient-to-b from-[#FFE770] via-[#FDB931] to-[#9E7302] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_4px_rgba(0,0,0,0.3)] border border-[#B8860B]">
    <DollarSign className="h-4 w-4 text-[#5C4000] drop-shadow-sm" strokeWidth={3} />
    <div className="absolute top-0.5 left-1 w-2 h-1 bg-white/40 rounded-full blur-[1px] rotate-[-20deg]" />
  </div>
);

// --- CUSTOM IMAGE REFERENCE ICONS ---
const CustomIconInvite = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11 6L16 2L21 6H11Z" fill="#FCA5A5"/>
    <path d="M6 12C6 8 10 6 16 6C22 6 26 8 26 12V24C26 27.3137 23.3137 30 20 30H12C8.68629 30 6 27.3137 6 24V12Z" fill="#EF4444"/>
    <text x="16" y="23" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">$</text>
  </svg>
);

const CustomIconMedal = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="#8B5CF6"/>
    <path d="M16 8L18.47 13.01L24 13.82L20 17.72L20.94 23.23L16 20.63L11.06 23.23L12 17.72L8 13.82L13.53 13.01L16 8Z" fill="white"/>
  </svg>
);

const CustomIconSVIP = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L4 8V18C4 24 16 30 16 30C16 30 28 24 28 18V8L16 2Z" fill="#1A1D23"/>
    <path d="M10 12L16 22L22 12" stroke="#FBBF24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CustomIconLevel = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 26H29V30H3V26ZM4 23L7 8L16 16L25 8L28 23H4Z" fill="#F97316"/>
  </svg>
);

const CustomIconCP = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 29C16 29 3 20.5 3 11.5C3 6.8 6.8 3 11.5 3C14.2 3 16 5 16 5C16 5 17.8 3 20.5 3C25.2 3 29 6.8 29 11.5C29 20.5 16 29 16 29Z" fill="#F472B6"/>
    <path d="M10 16L15 21L22 14" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M13 13L18 18" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CustomIconFamily = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 2L4 8V18C4 24 16 30 16 30C16 30 28 24 28 18V8L16 2Z" fill="#B45309"/>
    <circle cx="16" cy="13" r="3" fill="white"/>
    <circle cx="10" cy="16" r="2.5" fill="white"/>
    <circle cx="22" cy="16" r="2.5" fill="white"/>
    <path d="M16 18C13 18 10 20 10 23V24H22V23C22 20 19 18 16 18Z" fill="white"/>
  </svg>
);

const CustomIconStore = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 4H7L9 12M9 12L11 22H25L28 12H9ZM9 12H28" fill="#06B6D4" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="13" cy="27" r="2.5" fill="#06B6D4"/>
    <circle cx="23" cy="27" r="2.5" fill="#06B6D4"/>
  </svg>
);

const CustomIconMyItems = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6L16 2L24 6V28C24 29.1 23.1 30 22 30H10C8.9 30 8 29.1 8 28V6Z" fill="#8B5CF6"/>
    <path d="M12 6L16 10L20 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 14H22V18C22 19 21 20 20 20C19 20 18 19 18 18V14Z" fill="#A78BFA"/>
  </svg>
);

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

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

const getBudgetVariant = (profile: any) => {
  if (profile.id === CREATOR_ID || profile.tags?.includes('Official')) return 'rainbow';
  if (profile.idColor && profile.idColor !== 'none') return profile.idColor;
  return 'none';
};

const formatCompactNumber = (num: number) => {
  if (!num || num === 0) return '0';
  const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  return formatter.format(num);
};

const RichLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 pl-1 pr-2 py-0.5 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
    <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine"></div>
    <Star className="h-2 w-2 fill-white text-white" />
    <span className="text-[10px] font-outfit font-black text-white leading-none">Lv.{level}</span>
  </div>
);

const CharmLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 pl-1 pr-2 py-0.5 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
    <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine"></div>
    <Sparkles className="h-2 w-2 fill-white text-white" />
    <span className="text-[10px] font-outfit font-black text-white leading-none">Lv.{level}</span>
  </div>
);

const calculateAge = (birthday: string) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const GenderAgeTag = ({ gender, birthday }: { gender: string | null | undefined, birthday?: string }) => {
  const age = calculateAge(birthday || '');
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-full shadow-sm shrink-0",
      gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
    )}>
      <span className="text-[10px] font-bold text-white leading-none">{gender === 'Female' ? '♀' : '♂'}</span>
      {age !== null && <span className="text-[10px] font-bold text-white leading-none">{age}</span>}
    </div>
  );
};

const StatItem = ({ label, value, onClick }: { label: string, value: number, onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center py-1 active:scale-95 transition-transform min-w-[60px]">
    <span className="text-[20px] font-outfit font-semibold text-slate-900 leading-none mb-1">{formatCompactNumber(value)}</span>
    <span className="text-[9px] font-outfit font-black text-slate-400 tracking-wider uppercase">{label}</span>
  </button>
);

const IconButton = ({ icon: Icon, label, iconColor, onClick }: { icon: any, label: string, iconColor: string, onClick: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 group">
    <div className="flex items-center justify-center py-1">
      <Icon className={cn("h-7 w-7 transition-all group-hover:scale-110", iconColor)} />
    </div>
    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
  </button>
);

const ProfileMenuItem = ({ icon: Icon, label, extra, iconColor, onClick, destructive, extraColor }: { icon: any, label: string, extra?: string, iconColor?: string, onClick: () => void, destructive?: boolean, extraColor?: string }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between py-4 pl-4 pr-3 hover:bg-slate-50/50 active:bg-slate-100/50 transition-all text-left group">
    <div className="flex items-center gap-4">
      <div className={cn("p-2 rounded-xl transition-colors", iconColor || "bg-slate-100 text-slate-400")}>
        <Icon className="h-5 w-5" />
      </div>
      <span className={cn("font-medium text-[16px]", destructive ? "text-red-500" : "text-[#1F2937]")}>{label}</span>
    </div>
    <div className="flex items-center gap-1">
      {extra && <span className={cn("text-[11px] font-medium uppercase tracking-wider", extraColor || "text-slate-300")}>{extra}</span>}
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
    </div>
  </button>
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

export default function ProfileView({ profileId, mode = 'public' }: { profileId: string; mode?: 'public' | 'editable' }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);

  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialTab, setSocialTab] = useState<'followers' | 'following' | 'friends' | 'visitors'>('followers');
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();

  const isOwnProfile = currentUser?.uid === profileId;

  const fansQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'followers'), where('followingId', '==', profileId));
  }, [firestore, profileId]);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'followers'), where('followerId', '==', profileId));
  }, [firestore, profileId]);

  const visitorsQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'users', profileId, 'profileVisitors'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore, profileId]);

  const { data: fansData } = useCollection(fansQuery);
  const { data: followingData } = useCollection(followingQuery);
  const { data: visitorsData } = useCollection(visitorsQuery);

  const stats = useMemo(() => {
    const fans = fansData?.length || 0;
    const following = followingData?.length || 0;
    const visitors = visitorsData?.length || 0;
    const fanIds = new Set(fansData?.map(f => f.followerId) || []);
    const followingIds = followingData?.map(f => f.followingId) || [];
    const friends = followingIds.filter(id => fanIds.has(id)).length;
    return { fans, following, friends, visitors };
  }, [fansData, followingData, visitorsData]);

  const isAuthorizedAdmin = currentUser?.uid === CREATOR_ID || profile?.isAdmin === true;
  const isCertifiedSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) || isAuthorizedAdmin;

  useEffect(() => {
    if (!firestore || !currentUser || !profileId || isOwnProfile) return;
    const recordVisit = async () => {
      try {
        const visitRef = doc(firestore, 'users', profileId, 'profileVisitors', currentUser.uid);
        await setDocumentNonBlocking(visitRef, { visitorId: currentUser.uid, timestamp: serverTimestamp() }, { merge: true });
      } catch (e) { console.error(e); }
    };
    recordVisit();
  }, [firestore, currentUser, profileId, isOwnProfile]);

  const followRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
    return doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
  }, [firestore, currentUser, profileId]);
  const { data: followData } = useDoc(followRef);

  const handleFollow = async () => {
    if (!firestore || !currentUser || !profileId || isProcessingFollow) return;
    setIsProcessingFollow(true);
    const fRef = doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
    try {
      if (followData) {
        await deleteDocumentNonBlocking(fRef);
        toast({ title: 'Unfollowed' });
      } else {
        await setDocumentNonBlocking(fRef, { followerId: currentUser.uid, followingId: profileId, timestamp: serverTimestamp() }, { merge: true });
        toast({ title: 'Following' });
      }
    } catch (e) { console.error(e); } finally { setIsProcessingFollow(false); }
  };

  const handleCopyId = () => {
    const idToCopy = (!profile?.accountNumber || profile?.accountNumber === 'undefined' || profile?.accountNumber === 'UNDEFINED') ? (profile?.id || '') : profile?.accountNumber;
    if (!idToCopy) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy).then(() => {
        toast({ title: 'ID Copied' });
      }).catch(() => {});
    }
  };

  if (isUserLoading || isProfileLoading || !profile) return (
    <AppLayout>
      <div className="flex h-full w-full flex-col items-center justify-center bg-white space-y-4">
        <Loader className="animate-spin h-10 w-10 text-slate-300" />
        <p className="text-[10px] font-outfit font-black uppercase text-slate-400">Syncing Identity...</p>
      </div>
    </AppLayout>
  );

  const images = profile.spaceImages || [];
  const ownedItems = profile.inventory?.ownedItems || [];
  const medals = profile.medals || [];
  const receivedGifts = profile.stats?.receivedGifts || {};
  const ownedVehicles = ownedItems.filter((id: string) => VEHICLE_REGISTRY[id]);
  
  if (!isOwnProfile) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full overflow-hidden bg-white font-outfit text-[13px] relative">
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
              <div className="h-full w-full bg-gradient-to-br from-pink-500 via-rose-500 to-pink-600 flex items-center justify-center">
                 <div className="flex flex-col items-center gap-2 opacity-50">
                   <Camera className="h-8 w-8 text-white/40" />
                   <span className="text-[10px] font-black text-white/40 uppercase tracking-widest text-center">No Space Photos</span>
                 </div>
              </div>
            )}
            <div className="absolute top-12 left-0 right-0 px-6 flex items-center justify-between z-[100]">
              <button onClick={() => router.back()} className="h-10 w-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10">
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 w-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white active:scale-90 transition-all border border-white/10 outline-none">
                    <MoreHorizontal className="h-6 w-6" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white/80 backdrop-blur-3xl rounded-2xl border-white/20 shadow-2xl z-[200] p-1 font-outfit">
                  {!isOwnProfile && (
                    <DropdownMenuItem 
                      onClick={() => setReportOpen(true)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl focus:bg-red-50 focus:text-red-600 font-bold uppercase text-[10px] tracking-widest transition-all cursor-pointer text-slate-600"
                    >
                      <ShieldAlert className="h-4 w-4" />
                      Report User
                    </DropdownMenuItem>
                  )}
                  {isOwnProfile && (
                    <DropdownMenuItem 
                      onClick={() => router.push('/settings')}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl focus:bg-slate-50 font-bold uppercase text-[10px] tracking-widest transition-all cursor-pointer text-slate-600"
                    >
                      <SettingsIcon className="h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/10 z-10" />
          </div>

          <div className="flex-1 mt-[-40px] relative z-20 bg-white rounded-t-[40px] px-6 pt-0 overflow-y-auto no-scrollbar pb-32">
            <div className="max-w-[440px] mx-auto">
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
                    <span className="text-xl">🇮🇳</span>
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

              <div className="flex justify-between items-center py-5 mb-0 mx-[-24px]">
                <div className="flex flex-col items-center flex-1" onClick={() => { setSocialTab('followers'); setSocialOpen(true); }}>
                  <span className="text-xl font-bold text-slate-900 leading-none">{stats.fans}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Fans</span>
                </div>
                <div className="flex flex-col items-center text-slate-400/20 text-2xl font-thin opacity-50">|</div>
                <div className="flex flex-col items-center flex-1" onClick={() => { setSocialTab('following'); setSocialOpen(true); }}>
                  <span className="text-xl font-bold text-slate-900 leading-none">{stats.following}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Following</span>
                </div>
                <div className="flex flex-col items-center text-slate-400/20 text-2xl font-thin opacity-50">|</div>
                <div className="flex flex-col items-center flex-1" onClick={() => { setSocialTab('friends'); setSocialOpen(true); }}>
                  <span className="text-xl font-bold text-slate-900 leading-none">{stats.friends}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Friend</span>
                </div>
                 <div className="flex flex-col items-center text-slate-400/20 text-2xl font-thin opacity-50">|</div>
                <div className="flex flex-col items-center flex-1" onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }}>
                  <span className="text-xl font-bold text-slate-900 leading-none">{stats.visitors}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Visitors</span>
                </div>
              </div>

              <div className="h-[1px] w-full bg-slate-50 my-2" />
              <div className="mt-2 mb-4">
                <h3 className="text-[9px] font-black text-slate-900 uppercase tracking-widest px-1 opacity-70 mb-2">Signature Bio</h3>
                <div className="px-1"><p className="text-[13px] font-medium text-slate-500 leading-relaxed">{profile.bio || "Synchronized with the Ummy frequency."}</p></div>
              </div>
              <div className="h-[1px] w-full bg-slate-50 my-2" />

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
                        <button className={cn("w-full h-5 rounded-full text-[8px] font-black uppercase transition-all shadow-sm", isActive ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>{isActive ? 'Active' : 'Permanent'}</button>
                      </div>
                    </div>
                  );
                })}
              </ProfileSection>

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

          <footer className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-white/80 backdrop-blur-3xl z-[110] border-t border-slate-100 shadow-2xl">
            <div className="max-w-[440px] mx-auto flex gap-4 w-full">
              <button onClick={handleFollow} disabled={isProcessingFollow} className="flex-2 h-14 bg-slate-900 text-white rounded-3xl font-outfit font-black uppercase text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 px-8">
                 {isProcessingFollow ? <Loader className="animate-spin h-5 w-5" /> : (
                   <><Heart className={cn("h-5 w-5", followData && "fill-current text-rose-500")} />{followData ? "Joined" : "Join"}</>
                 )}
              </button>
              <DirectMessageDialog recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl || '' }} trigger={
                <button className="flex-1 h-14 bg-white text-slate-900 border-2 border-slate-900 rounded-3xl font-outfit font-black uppercase text-sm active:scale-95 transition-all flex items-center justify-center gap-3"><MessageCircle className="h-5 w-5" />Vibe</button>
              }/>
            </div>
          </footer>
        <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
        <FullProfileDialog open={fullViewOpen} onOpenChange={setFullViewOpen} profile={profile} stats={stats} followData={followData} onFollow={handleFollow} isProcessingFollow={isProcessingFollow} isOwnProfile={isOwnProfile} />
        <ReportUserDialog 
          open={reportOpen} 
          onOpenChange={setReportOpen} 
          targetUser={{ 
            uid: profile.id, 
            username: profile.username, 
            accountNumber: profile.accountNumber || profile.id.substring(0, 6) 
          }} 
        />
      </div>
    </AppLayout>
  );
}

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden bg-white font-outfit text-[13px] relative">
        <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-[#b28dff]/80 via-purple-100 to-white z-0 pointer-events-none" />

        <header className="absolute top-0 right-0 z-[100] bg-transparent px-6 pt-10 pb-0">
          <div className="flex items-center justify-end max-w-[440px] mx-auto">
             {isOwnProfile && (
               <EditProfileDialog profile={profile} trigger={
                 <button className="h-10 w-10 bg-slate-100/50 backdrop-blur-xl rounded-full flex items-center justify-center active:scale-90 transition-all shadow-sm border border-slate-200"><Pencil className="h-5 w-5 text-slate-700" strokeWidth={2.5} /></button>
               }/>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-14 z-10 relative mt-2">
          <div className="max-w-[440px] mx-auto px-5">
            <div className="flex items-center gap-1 mb-0 pt-0">
              <div onClick={() => setFullViewOpen(true)} className="shrink-0 cursor-pointer active:scale-95 transition-transform">
                <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                  <Avatar className="h-[100px] w-[100px] border-2 border-white shadow-xl rounded-full ring-1 ring-slate-100">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-3xl font-bold bg-slate-50 text-slate-300">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </AvatarFrame>
              </div>
              <div className="flex-1 min-w-0 -ml-1 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-[22px] font-bold text-slate-900 tracking-tighter leading-none truncate">{profile.username}</h2>
                  <span className="text-lg">🇮🇳</span>
                  <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <RichLevelBadge level={profile.level?.rich || 1} />
                  <CharmLevelBadge level={profile.level?.charm || 1} />
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <div onClick={handleCopyId} className="cursor-pointer active:opacity-60 transition-opacity">
                    <BudgetTag variant={getBudgetVariant(profile)} label={`ID: ${(!profile.accountNumber || profile.accountNumber === 'undefined' || profile.accountNumber === 'UNDEFINED') ? profile.id.substring(0, 6) : profile.accountNumber}`} size="sm" />
                  </div>
                  {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                  {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SellerTag size="sm" />}
                </div>
              </div>
            </div>

            <div className="flex justify-start gap-8 items-center py-2 px-1 border-b border-slate-50 mb-4 mt-[-5px] pl-1">
              <StatItem label="Fans" value={stats.fans} onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
              <StatItem label="Following" value={stats.following} onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
              <StatItem label="Friends" value={stats.friends} onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
              <StatItem label="Visitors" value={stats.visitors} onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
            </div>

            {isOwnProfile && (
              <div className="flex flex-col gap-3 mt-2 px-1">
                {/* 3D GLOSSY COIN CARD - NOW WIDE */}
                <div onClick={() => router.push('/wallet')} className="h-[85px] w-full bg-gradient-to-br from-[#FFD700] via-[#FDB931] to-[#9E7302] rounded-[32px] p-4 shadow-[0_10px_20px_rgba(253,185,49,0.3),inset_0_2px_4px_rgba(255,255,255,0.6)] cursor-pointer relative overflow-hidden group border-t border-white/50 active:scale-95 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 skew-x-[-20deg] translate-x-[-100%] group-hover:animate-shine" />
                  <div className="flex items-center gap-2 relative z-10">
                    <SVGA_GoldDollar />
                    <span className="text-[10px] font-black text-[#5C4000] uppercase tracking-widest opacity-90">Coins</span>
                  </div>
                  <p className="font-black text-[20px] text-[#422E00] tracking-tighter leading-none absolute bottom-4 left-5 drop-shadow-sm">
                    {profile.wallet?.coins?.toFixed(1) || '0.0'}
                  </p>
                </div>

                {/* 3D GLOSSY DIAMOND CARD - NOW WIDE */}
                <div onClick={() => router.push('/wallet')} className="h-[85px] w-full bg-gradient-to-br from-[#00D2FF] via-[#3a7bd5] to-[#004e92] rounded-[32px] p-4 shadow-[0_10px_20px_rgba(58,123,213,0.3),inset_0_2px_4px_rgba(255,255,255,0.4)] cursor-pointer relative overflow-hidden group border-t border-white/40 active:scale-95 transition-all">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 skew-x-[-20deg] translate-x-[-100%] group-hover:animate-shine" />
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="h-7 w-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-[14px]">💎</div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-90">Diamonds</span>
                  </div>
                  <p className="font-black text-[20px] text-white tracking-tighter leading-none absolute bottom-4 left-5 drop-shadow-md">
                    {profile.wallet?.diamonds?.toFixed(1) || '0.0'}
                  </p>
                </div>
              </div>
            )}

            <div onClick={() => router.push('/vips')} className="bg-[#0F1115] rounded-3xl p-4 shadow-2xl flex items-center justify-between cursor-pointer border border-[#1A1D23] active:scale-[0.98] transition-all group relative overflow-hidden mt-2">
              <div className="flex items-center gap-4 relative z-10">
                <div className="flex items-center justify-center group-hover:scale-105 transition-transform">
                  <CustomIconSVIP className="h-8 w-8" />
                </div>
                <div className="flex flex-col">
                  <h3 className="text-[16px] font-bold text-white uppercase tracking-tight leading-tight">VIP Premium™</h3>
                  <p className="text-[9px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Secret card get rewards</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-white/50 group-hover:text-white transition-all" />
            </div>

            <div className="flex justify-between items-center px-4 mt-6">
              <IconButton 
                icon={CustomIconLevel} 
                label="Level" 
                iconColor="" 
                onClick={() => router.push('/level')} 
              />
              <IconButton 
                icon={CustomIconStore} 
                label="Store" 
                iconColor="" 
                onClick={() => router.push('/store')} 
              />
              <IconButton 
                icon={CustomIconMedal} 
                label="Medal" 
                iconColor="" 
                onClick={() => router.push('/medals')} 
              />
              <IconButton 
                icon={ClipboardList} 
                label="Task" 
                iconColor="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" 
                onClick={() => router.push('/tasks')} 
              />
            </div>

            <div className="space-y-2 pt-6 pb-32">
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <ProfileMenuItem icon={CustomIconInvite} label="Invite Friends" iconColor="bg-transparent" onClick={() => {}}/>
                <ProfileMenuItem icon={CustomIconFamily} label="Family" extra="TRIBAL UNITY" extraColor="text-indigo-500" iconColor="bg-transparent" onClick={() => router.push('/families')} />
                <ProfileMenuItem icon={CustomIconMyItems} label="My Items" extra="INVENTORY" extraColor="text-purple-500" iconColor="bg-transparent" onClick={() => router.push('/store')} />
                <ProfileMenuItem icon={CustomIconCP} label="CP / Friend" iconColor="bg-transparent" onClick={() => router.push('/cp-house')} />
                {isCertifiedSeller && <SellerTransferDialog />}
                {isAuthorizedAdmin && <ProfileMenuItem icon={CustomIconLevel} label="Official Centre" extra="Supreme Authority" extraColor="text-blue-600" iconColor="bg-transparent" onClick={() => router.push('/admin')} />}
              </div>
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <ProfileMenuItem icon={SettingsIcon} label="Settings" iconColor="bg-slate-50 text-slate-500" onClick={() => router.push('/settings')} />
                <ProfileMenuItem icon={HelpCircle} label="Help center" iconColor="bg-orange-50 text-orange-500" onClick={() => router.push('/help-center')} />
              </div>
            </div>
          </div>
        </div>

        <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
        <FullProfileDialog open={fullViewOpen} onOpenChange={setFullViewOpen} profile={profile} stats={stats} followData={followData} onFollow={handleFollow} isProcessingFollow={isProcessingFollow} isOwnProfile={isOwnProfile} />
        <ReportUserDialog 
          open={reportOpen} 
          onOpenChange={setReportOpen} 
          targetUser={{ 
            uid: profile.id, 
            username: profile.username, 
            accountNumber: profile.accountNumber || profile.id.substring(0, 6) 
          }} 
        />
      </div>
    </AppLayout>
  );
}

