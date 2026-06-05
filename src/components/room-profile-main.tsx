'use client';

import React from 'react';
import { 
  MoreHorizontal, 
  Copy, 
  MessageCircle, 
  UserPlus, 
  Gift as GiftIcon,
  MicOff,
  Ban,
  Star,
  Loader,
  LogOut,
  Mic,
  User,
  Heart,
  Plus,
  CheckCircle2,
  AtSign,
  Sparkles,
  ChevronRight,
  Flag,
  AlertTriangle,
  Lock,
  MessageSquare,
  MapPin,
  Users,
  Zap,
  ShieldAlert,
  ExternalLink
} from 'lucide-react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { CompactVideoAvatarFrame } from '@/components/compact-video-avatar-frame';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { GoldCoinIcon } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { CPProposeDialog } from '@/components/cp-propose-dialog';
import { MEDAL_REGISTRY, MedalConfig } from '@/constants/medals';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ReportUserDialog } from '@/components/report-user-dialog';

// ==================== NEW SVG TAGS ====================

const SVGA_OfficialTag = () => (
  <div className="relative inline-flex items-center h-[18px] rounded-md bg-gradient-to-r from-[#1DA1F2] to-[#0052CC] shadow-[0_2px_8px_rgba(0,82,204,0.25),inset_0_1px_2px_rgba(255,255,255,0.5)] px-1.5 border border-[#1DA1F2]/50 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[40%] bg-gradient-to-b from-white/60 to-transparent rounded-sm blur-[0.5px]" />
    <svg viewBox="0 0 24 24" className="w-3 h-3 relative z-10 drop-shadow-sm mr-1" fill="none">
       <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="white" />
    </svg>
    <span className="relative z-10 text-[9px] font-black text-white tracking-widest uppercase drop-shadow-[0_1px_1px_rgba(0,0,0,0.3)]">Official</span>
  </div>
);

const SVGA_SellerTag = () => (
  <div className="relative inline-flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#FFAE00] via-[#FFC300] to-[#FF9500] shadow-[0_2px_8px_rgba(255,149,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.7)] px-2 border border-[#FFE1A8] ml-1 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[45%] bg-gradient-to-b from-white/70 to-transparent rounded-full blur-[0.5px]" />
    <div className="relative z-10 -ml-1 mr-1 flex items-center justify-center w-[14px] h-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="redBag" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5F5F" />
            <stop offset="100%" stopColor="#C81E1E" />
          </linearGradient>
        </defs>
        <path d="M20 8 C16 8 14 11 14 13 L26 13 C26 11 24 8 20 8 Z" fill="#991B1B" />
        <path d="M12 14 C12 14 8 20 8 28 C8 34 12 36 20 36 C28 36 32 34 32 28 C32 20 28 14 28 14 Z" fill="url(#redBag)" />
        <text x="20" y="30" fontSize="15" fontWeight="900" fill="white" textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>$</text>
        <ellipse cx="14" cy="22" rx="3" ry="1.5" fill="white" fillOpacity="0.4" transform="rotate(-20 14 22)" />
      </svg>
    </div>
    <span className="relative z-10 text-[9px] font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Seller</span>
  </div>
);

const SVGA_HostTag = () => (
  <div className="relative inline-flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#B57AFF] via-[#9E60FA] to-[#803AF5] shadow-[0_2px_8px_rgba(158,96,250,0.3),inset_0_1px_2px_rgba(255,255,255,0.7)] px-2 border border-[#E0C6FF] ml-1 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[45%] bg-gradient-to-b from-white/70 to-transparent rounded-full blur-[0.5px]" />
    <div className="relative z-10 -ml-1 mr-1 flex items-center justify-center w-[14px] h-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="balloonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d="M 24 24 Q 24 30 22 34" fill="none" stroke="#D8B4FE" strokeWidth="2" strokeLinecap="round" />
        <path d="M 16 26 Q 16 32 18 36" fill="none" stroke="#D8B4FE" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="26" cy="18" r="8" fill="url(#balloonGrad)" />
        <circle cx="15" cy="16" r="10" fill="url(#balloonGrad)" />
        <path d="M 9 13 Q 12 8 16 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
    <span className="relative z-10 text-[9px] font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Host</span>
  </div>
);

const SVGA_ServiceTag = () => (
  <div className="relative inline-flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#17CFB8] via-[#10B9A4] to-[#0D9482] shadow-[0_2px_8px_rgba(23,207,184,0.3),inset_0_1px_2px_rgba(255,255,255,0.7)] px-2 border border-[#A7FFF1] ml-1 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[45%] bg-gradient-to-b from-white/70 to-transparent rounded-full blur-[0.5px]" />
    <div className="relative z-10 -ml-1 mr-1 flex items-center justify-center w-[14px] h-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="tealBubble" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#43F3D8" />
            <stop offset="100%" stopColor="#0ACAA8" />
          </linearGradient>
        </defs>
        <path d="M20 6 C12.27 6 6 12.27 6 20 C6 23.5 7.3 26.7 9.4 29.2 C9.8 29.7 9.9 30.4 9.7 31.0 L8.5 34.5 L12.2 33.6 C12.8 33.4 13.5 33.6 14.1 33.9 C15.9 34.9 17.9 35.5 20 35.5 C27.73 35.5 34 29.23 34 21.5 C34 13.77 27.73 6 20 6 Z" fill="url(#tealBubble)" />
        <path d="M 13 21 Q 20 27 27 21" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
    <span className="relative z-10 text-[9px] font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">Service</span>
  </div>
);

const SVGA_GlossyID = ({ variant, label }: { variant: string, label: string }) => {
  const idNum = label ? label.replace('ID:', '').replace('ID: ', '').trim() : '000000';

  return (
    <div className="relative flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#6b1e60] via-[#912480] to-[#b33596] shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.4)] ml-1 pr-2.5 pl-[20px] border border-[#c157a8]">
      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-[30px] h-[30px] z-10 flex items-center justify-center">
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="goldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBE3A4" />
              <stop offset="40%" stopColor="#D2923A" />
              <stop offset="60%" stopColor="#F9D479" />
              <stop offset="100%" stopColor="#B37322" />
            </linearGradient>
            <linearGradient id="purpleGem" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D57EEB" />
              <stop offset="50%" stopColor="#8A2387" />
              <stop offset="100%" stopColor="#4A00E0" />
            </linearGradient>
            <linearGradient id="textGloss" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F3E5F5" />
              <stop offset="100%" stopColor="#D1A3D8" />
            </linearGradient>
            <linearGradient id="goldS" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF1AA" />
              <stop offset="100%" stopColor="#F3A92A" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path d="M30 4 L54 18 L54 42 L30 56 L6 42 L6 18 Z" fill="url(#goldFrame)" />
          <path d="M30 8 L50 20 L50 40 L30 52 L10 40 L10 20 Z" fill="url(#purpleGem)" />
          <path d="M10 20 L30 8 L50 20 L30 28 Z" fill="white" fillOpacity="0.15" />
          <text x="30" y="38" fontFamily="sans-serif" fontWeight="900" fontSize="24" fill="url(#textGloss)" textAnchor="middle" letterSpacing="-1" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.6)' }}>ID</text>
          <path d="M18 45 C 24 58, 36 58, 42 45 C 36 52, 24 52, 18 45 Z" fill="url(#goldFrame)" />
          <path d="M22 43 L38 43 L34 54 L26 54 Z" fill="url(#goldFrame)" />
          <text x="30" y="52" fontFamily="sans-serif" fontWeight="900" fontSize="13" fill="url(#goldS)" textAnchor="middle" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>S</text>
          <path d="M 45 10 Q 48 10 48 7 Q 48 10 51 10 Q 48 10 48 13 Q 48 10 45 10 Z" fill="white" filter="url(#glow)"/>
          <path d="M 12 38 Q 14 38 14 36 Q 14 38 16 38 Q 14 38 14 40 Q 14 38 12 38 Z" fill="white" filter="url(#glow)"/>
        </svg>
      </div>
      <div className="absolute top-[1px] left-[15%] right-[15%] h-[40%] bg-gradient-to-b from-white/60 to-transparent rounded-full blur-[0.5px]" />
      <span className="relative z-10 text-[10px] font-bold text-white ml-1.5 tracking-[0.1em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {idNum}
      </span>
    </div>
  );
};

const SVGA_NormalIDTag = ({ displayID }: { displayID: string }) => (
  <span className="text-[12px] font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
    ID: {displayID}
  </span>
);

// ==================== GENDER CIRCLE ====================

const GenderCircle = ({ gender }: { gender: string | null | undefined }) => (
  <div className={cn(
    "h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm",
    gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
  )}>
    {gender === 'Female' ? '♀' : '♂'}
  </div>
);

// ==================== INTERFACES ====================

interface RoomProfileMainProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  isOwner: boolean;
  roomOwnerId: string;
  roomModeratorIds: string[];
  onSilence: (uid: string, current: boolean) => void;
  onKick: (uid: string, durationMinutes: number) => void;
  onLeaveSeat: (uid: string) => void;
  onToggleMod: (uid: string) => void;
  onOpenGiftPicker: (recipient: any) => void;
  onOpenChat?: (recipient: any) => void;
  onMention: (username: string) => void;
  isSilenced: boolean;
  isMe: boolean;
  isInSeat?: boolean;
}

interface RoomOwnerProfileProps {
  userId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isMe: boolean;
  isInSeat?: boolean;
  onLeaveSeat: (uid: string) => void;
  onOpenGiftPicker: (recipient: any) => void;
  onOpenChat?: (recipient: any) => void;
  onMention: (username: string) => void;
  onSilence: (uid: string, current: boolean) => void;
  onKick: (uid: string, durationMinutes: number) => void;
  canManage: boolean;
  isSilenced: boolean;
}

// ==================== ROOM OWNER PROFILE ====================

export function RoomOwnerProfile({
  userId,
  open,
  onOpenChange,
  isMe,
  isInSeat,
  onLeaveSeat,
  onOpenGiftPicker,
  onOpenChat,
  onMention,
  onSilence,
  onKick,
  canManage,
  isSilenced
}: RoomOwnerProfileProps) {
  const { userProfile: profile, isLoading } = useUserProfile(userId || undefined);
  const firestore = useFirestore();
  const medalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "medals"));
  }, [firestore]);
  const { data: firestoreMedals } = useCollection(medalsQuery);
  const { toast } = useToast();
  const router = useRouter();

  const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

  const fallbackID = React.useMemo(() => {
    if (userId === CREATOR_ID) return '0000';
    let hash = 0;
    const str = userId || 'fallback';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash % 900000) + 100000).toString();
  }, [userId]);

  if (!userId) return null;

  const isOfficial = profile?.tags?.includes('Official');
  const isSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t));
  const isCS = profile?.tags?.includes('Customer Service');
  const isCSLeader = profile?.tags?.includes('CS Leader');
  const isHost = profile?.tags?.includes('Host');
  const isBudget = profile?.isBudgetId;

  const currentDBId = profile?.accountNumber;
  const isCorrectFormat = /^\d{6}$/.test(String(currentDBId)) || (userId === CREATOR_ID && String(currentDBId) === '0000');
  const displayID = isCorrectFormat ? String(currentDBId) : fallbackID;

  const handleViewFullProfile = () => {
    onOpenChange(false);
    router.push(`/profile/${userId}`);
  };

  const handleCopyId = () => {
    const idToCopy = profile?.accountNumber || userId;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy).then(() => {
        toast({ title: 'ID Copied' });
      }).catch(() => {
        toast({ variant: 'destructive', title: 'Copy Failed' });
      });
    } else {
      toast({ variant: 'destructive', title: 'Clipboard Unavailable' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideOverlay={true}
        className="sm:max-w-[320px] mx-auto h-auto rounded-[2rem] border-0 p-0 overflow-visible shadow-2xl bg-white text-black font-sans animate-in slide-in-from-bottom duration-300 pb-6"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Room Owner Profile</SheetTitle>
          <SheetDescription>Owner Identity</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center">
            {/* Avatar - Circle, half outside half inside */}
            <div className="relative w-full flex justify-center -mt-12 mb-1 z-20">
              <div
                className="cursor-pointer active:scale-95 transition-transform"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewFullProfile();
                }}
              >
                <CompactVideoAvatarFrame 
                  frameMediaUrl={profile.inventory?.activeFrameMediaUrl} 
                  avatarSize={80}
                >
                  <AvatarFrame 
                    frameId={profile.inventory?.activeFrame || 'None'} 
                    frameMediaUrl={profile.inventory?.activeFrameMediaUrl}
                    size="xl"
                  >
                    <Avatar className="h-[80px] w-[80px] border-[4px] border-white shadow-xl ring-2 ring-gray-100 rounded-full">
                      <AvatarImage src={profile.avatarUrl || undefined} className="object-cover rounded-full" />
                      <AvatarFallback className="text-2xl bg-slate-100 text-slate-400 rounded-full">
                        {(profile.username || 'U').charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                  </AvatarFrame>
                </CompactVideoAvatarFrame>
              </div>
            </div>

            {/* Name + Gender + Country Flag - Compact */}
            <div className="flex flex-wrap justify-center items-center gap-1.5 px-4 mt-0.5">
              <h2 className="text-lg font-bold text-gray-900 tracking-tight truncate max-w-[160px]">
                {profile.username}
              </h2>
              <GenderCircle gender={profile.gender} />
              <div className="flex items-center gap-0.5 bg-gray-100/80 px-1.5 py-0.5 rounded-full border border-gray-200">
                <span className="text-[10px]">🇮🇳</span>
                <span className="text-[7px] font-black text-gray-600 uppercase">IND</span>
              </div>
            </div>

            {/* Tags Row - Compact */}
            <div className="flex flex-wrap justify-center items-center gap-1 mt-1.5 px-4">
              {isOfficial && <SVGA_OfficialTag />}
              {isHost && <SVGA_HostTag />}
              {isSeller && <SVGA_SellerTag />}
              {isCS && <SVGA_ServiceTag />}
              {isCSLeader && (
                <div className="relative inline-flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#17CFB8] via-[#10B9A4] to-[#0D9482] shadow-[0_2px_8px_rgba(23,207,184,0.3),inset_0_1px_2px_rgba(255,255,255,0.7)] px-2 border border-[#A7FFF1] ml-1 overflow-hidden">
                  <div className="absolute top-[1px] left-[5%] right-[5%] h-[45%] bg-gradient-to-b from-white/70 to-transparent rounded-full blur-[0.5px]" />
                  <div className="relative z-10 -ml-1 mr-1 flex items-center justify-center w-[14px] h-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                    <svg viewBox="0 0 40 40" className="w-full h-full">
                      <defs>
                        <linearGradient id="tealBubble2" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#43F3D8" />
                          <stop offset="100%" stopColor="#0ACAA8" />
                        </linearGradient>
                      </defs>
                      <path d="M20 6 C12.27 6 6 12.27 6 20 C6 23.5 7.3 26.7 9.4 29.2 C9.8 29.7 9.9 30.4 9.7 31.0 L8.5 34.5 L12.2 33.6 C12.8 33.4 13.5 33.6 14.1 33.9 C15.9 34.9 17.9 35.5 20 35.5 C27.73 35.5 34 29.23 34 21.5 C34 13.77 27.73 6 20 6 Z" fill="url(#tealBubble2)" />
                      <path d="M 13 21 Q 20 27 27 21" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  </div>
                  <span className="relative z-10 text-[9px] font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">CS Lead</span>
                </div>
              )}
            </div>

            {/* ID + Fans + Gift Box - Compact Single Row */}
            <div className="flex items-center justify-center gap-2 mt-2 px-4">
              <button onClick={handleCopyId} className="active:scale-95 transition-transform shrink-0">
                {isBudget ? (
                  <SVGA_GlossyID variant="gold" label={`ID:${displayID}`} />
                ) : (
                  <SVGA_NormalIDTag displayID={displayID} />
                )}
              </button>
              
              <span className="text-[10px] font-bold text-gray-400">|</span>
              
              <span className="text-[11px] font-bold text-gray-500">
                {profile.stats?.fans || 0} Fans
              </span>
              
              <span className="text-[10px] font-bold text-gray-400">|</span>
              
              <button
                onClick={() => {
                  onOpenChange(false);
                  onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' });
                }}
                className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform shrink-0"
              >
                <GiftIcon className="h-4 w-4 text-white fill-white" />
              </button>
            </div>

            {/* Action Buttons Row - Compact */}
            {!isMe && (
              <div className="flex items-center justify-center gap-4 mt-2.5 px-4">
                <button className="flex items-center gap-1 group active:scale-95 transition-transform">
                  <Heart className="h-5 w-5 text-pink-500 group-hover:fill-pink-500 transition-colors" strokeWidth={2} />
                </button>
                <button
                  onClick={() => onOpenChat?.(profile)}
                  className="flex items-center gap-1 group active:scale-95 transition-transform"
                >
                  <MessageSquare className="h-5 w-5 text-gray-700" strokeWidth={2} />
                </button>
                <button
                  onClick={() => {
                    onOpenChange(false);
                    if (typeof (window as any).triggerAiEcho === 'function') {
                      (window as any).triggerAiEcho(profile);
                    }
                  }}
                  className="flex items-center gap-1 group active:scale-95 transition-transform"
                >
                  <Sparkles className="h-5 w-5 text-purple-600" strokeWidth={2} />
                </button>
                <button
                  onClick={() => onMention(profile.username)}
                  className="p-1.5 text-gray-700 hover:bg-gray-50 rounded-full transition-colors active:scale-90"
                >
                  <AtSign className="h-5 w-5" strokeWidth={2.5} />
                </button>
              </div>
            )}

            {/* Seat Leave Button - Wide Full Width */}
            {isMe && isInSeat && (
              <div className="w-full px-5 mt-2.5">
                <button
                  onClick={() => onLeaveSeat(userId)}
                  className="w-full h-10 rounded-full bg-[#00E676] text-white flex items-center justify-center gap-2 font-bold uppercase text-sm shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                >
                  <Mic className="h-5 w-5 rotate-180" />
                  Seat leave
                </button>
              </div>
            )}

            {/* Mod Actions */}
            {canManage && !isMe && (
              <div className="w-full border-t border-gray-100 mt-3 pt-3 px-6">
                <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <button onClick={() => onSilence(userId, isSilenced)} className="hover:text-primary transition-colors">
                    {isSilenced ? 'Unmute' : 'Mute'}
                  </button>
                  <span className="opacity-20">|</span>
                  <button onClick={() => onLeaveSeat(userId)} className="hover:text-orange-600 transition-colors">Leave</button>
                  <span className="opacity-20">|</span>
                  <button onClick={() => onKick(userId, 10)} className="hover:text-red-600 transition-colors">Kick out</button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

// ==================== ROOM PROFILE MAIN (SQUARE SHEET + CIRCLE AVATAR) ====================

export function RoomProfileMain({
  userId,
  open,
  onOpenChange,
  canManage,
  isOwner: isRoomOwner,
  roomOwnerId,
  roomModeratorIds,
  onSilence,
  onKick,
  onLeaveSeat,
  onToggleMod,
  onOpenGiftPicker,
  onOpenChat,
  onMention,
  isSilenced,
  isMe,
  isInSeat
}: RoomProfileMainProps) {
  const { userProfile: profile, isLoading } = useUserProfile(userId || undefined);
  const firestore = useFirestore();
  const medalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "medals"));
  }, [firestore]);
  const { data: firestoreMedals } = useCollection(medalsQuery);
  const { toast } = useToast();
  const router = useRouter();
  const [showPropose, setShowPropose] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);

  const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

  const fallbackID = React.useMemo(() => {
    if (userId === CREATOR_ID) return '0000';
    let hash = 0;
    const str = userId || 'fallback';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash % 900000) + 100000).toString();
  }, [userId]);

  if (!userId) return null;

  const handleCopyId = () => {
    const idToCopy = profile?.accountNumber || userId;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy).then(() => {
        toast({ title: 'ID Copied' });
      }).catch(() => {
        toast({ variant: 'destructive', title: 'Copy Failed' });
      });
    } else {
      toast({ variant: 'destructive', title: 'Clipboard Unavailable' });
    }
  };

  const handleViewFullProfile = () => {
    onOpenChange(false);
    router.push(`/profile/${userId}`);
  };

  const isOfficial = profile?.tags?.includes('Official');
  const isSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t));
  const isCS = profile?.tags?.includes('Customer Service');
  const isCSLeader = profile?.tags?.includes('CS Leader');
  const isHost = profile?.tags?.includes('Host');
  const isBudget = profile?.isBudgetId;

  const currentDBId = profile?.accountNumber;
  const isCorrectFormat = /^\d{6}$/.test(String(currentDBId)) || (userId === CREATOR_ID && String(currentDBId) === '0000');
  const displayID = isCorrectFormat ? String(currentDBId) : fallbackID;

  const isRoomMod = roomModeratorIds.includes(userId || '');
  const idStatusVariant = (userId === roomOwnerId || isRoomMod)
    ? 'gold'
    : isOfficial
      ? 'diamond'
      : 'silver';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        hideOverlay={true}
        className="sm:max-w-[340px] mx-auto h-auto max-h-[70vh] border-0 p-0 rounded-[2.5rem] overflow-visible shadow-2xl bg-white text-black font-sans animate-in slide-in-from-bottom duration-500 pb-safe pb-6"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>User Profile</SheetTitle>
          <SheetDescription>Identity Sync</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="h-[350px] flex items-center justify-center">
            <Loader className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : profile ? (
          <div className="flex flex-col items-center">
            {/* Avatar - Circle, Half outside half inside square sheet */}
            <div
              className="mt-[-48px] mb-1 cursor-pointer active:scale-95 transition-transform relative z-[120]"
              onClick={(e) => {
                e.stopPropagation();
                handleViewFullProfile();
              }}
            >
              <CompactVideoAvatarFrame 
                frameMediaUrl={profile.inventory?.activeFrameMediaUrl} 
                avatarSize={80}
              >
                <AvatarFrame 
                  frameId={profile.inventory?.activeFrame || 'None'} 
                  frameMediaUrl={profile.inventory?.activeFrameMediaUrl}
                  size="xl"
                >
                  <Avatar className="h-[80px] w-[80px] border-[5px] border-white shadow-2xl rounded-full">
                    <AvatarImage src={profile.avatarUrl || undefined} className="object-cover rounded-full" />
                    <AvatarFallback className="text-3xl bg-slate-100 text-slate-400 rounded-full">
                      {(profile.username || 'U').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </AvatarFrame>
              </CompactVideoAvatarFrame>
            </div>

            {/* Name + Gender + Country */}
            <div className="text-center space-y-1 mb-1 w-full px-6">
              <div className="flex flex-wrap justify-center items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 tracking-tight leading-none truncate max-w-[180px]">
                  {profile.username}
                </h2>
                <GenderCircle gender={profile.gender} />

                <div className="flex items-center gap-1 bg-gray-100/80 px-2 py-0.5 rounded-full border border-gray-200">
                  <span className="text-[10px]">🇮🇳</span>
                  <span className="text-[8px] font-black text-gray-600 uppercase">IND</span>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap justify-center items-center gap-1.5 mt-1.5 px-4">
                {isOfficial && <SVGA_OfficialTag />}
                {isCSLeader && <SVGA_ServiceTag />}
                {isHost && <SVGA_HostTag />}
                {isSeller && <SVGA_SellerTag />}
                {isCS && <SVGA_ServiceTag />}

                {profile.relationship && profile.relationship.type !== 'None' && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full animate-in zoom-in duration-300">
                    <Heart className="h-3 w-3 text-rose-500 fill-current" />
                    <span className="text-[9px] font-black uppercase text-rose-500 tracking-tight">
                      {profile.relationship.type}: {profile.relationship.partnerName}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Medals */}
            {profile.medals && profile.medals.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-2 px-6">
                {profile.medals.map(medalId => {
                  const fsMedal = firestoreMedals?.find((m: any) => m.id === medalId);
                  const staticMedal = MEDAL_REGISTRY[medalId];
                  const medal: MedalConfig | null = fsMedal
                    ? { id: fsMedal.id, name: fsMedal.name, imageUrl: fsMedal.imageUrl, description: fsMedal.description || '', tier: fsMedal.tier || 'common' }
                    : staticMedal || null;
                  if (!medal) return null;
                  return (
                    <div key={medalId} className="group relative cursor-pointer">
                      <img
                        src={medal.imageUrl}
                        alt={medal.name}
                        className="h-10 w-10 object-contain drop-shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-1"
                      />
                      <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none border border-white/10">
                        {medal.name}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ID + Fans + Gift */}
            <div className="flex items-center gap-2.5 text-[11px] font-bold text-gray-400 uppercase tracking-tight mb-2">
              <div onClick={handleCopyId} className="cursor-pointer active:scale-95 transition-transform">
                {isBudget ? (
                  <SVGA_GlossyID variant={idStatusVariant} label={`ID:${displayID}`} />
                ) : (
                  <SVGA_NormalIDTag displayID={displayID} />
                )}
              </div>
              <span className="opacity-20 text-base">|</span>
              <div className="flex items-center gap-1">
                <span>{profile.stats?.fans || 0} Fans</span>
              </div>
              <span className="opacity-20 text-base">|</span>
              <button
                onClick={() => {
                  onOpenChange(false);
                  onOpenGiftPicker({ uid: profile.id, name: profile.username, avatarUrl: profile.avatarUrl || '' });
                }}
                className="relative h-9 w-9 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg active:scale-90 transition-transform shrink-0"
              >
                <GiftIcon className="h-4.5 w-4.5 text-white fill-white" />
              </button>
            </div>

            {/* Action Buttons */}
            {!isMe && (
              <div className="w-full flex items-center justify-between px-8 mb-3">
                <button className="flex items-center gap-1.5 group active:scale-95 transition-transform">
                  <Heart className="h-5 w-5 text-pink-500 group-hover:fill-pink-500 transition-colors" strokeWidth={2.5} />
                  <span className="font-bold text-[10px] uppercase text-pink-500">Follow</span>
                </button>
                <button
                  onClick={() => onOpenChat?.(profile)}
                  className="flex items-center gap-1.5 group active:scale-95 transition-transform"
                >
                  <MessageSquare className="h-5 w-5 text-gray-800" strokeWidth={2.5} />
                  <span className="font-bold text-[10px] uppercase text-gray-800">Chat</span>
                </button>
                <button
                  onClick={() => {
                    onOpenChange(false);
                    if (typeof (window as any).triggerAiEcho === 'function') {
                      (window as any).triggerAiEcho(profile);
                    }
                  }}
                  className="flex items-center gap-1.5 group active:scale-95 transition-transform"
                >
                  <Sparkles className="h-5 w-5 text-purple-600 animate-pulse" strokeWidth={2.5} />
                  <span className="font-bold text-[10px] uppercase text-purple-600">AI Echo</span>
                </button>
                <button
                  onClick={() => onMention(profile.username)}
                  className="p-1.5 text-gray-800 hover:bg-gray-50 rounded-full transition-colors active:scale-90"
                >
                  <AtSign className="h-5 w-5" strokeWidth={3} />
                </button>
                {(!profile.relationship || profile.relationship.type === 'None') && (
                  <button
                    onClick={() => setShowPropose(true)}
                    className="h-9 w-9 rounded-full bg-rose-100 flex items-center justify-center text-rose-500 active:scale-90 transition-transform"
                  >
                    <Zap className="h-4.5 w-4.5 fill-current" />
                  </button>
                )}
              </div>
            )}

            {/* Seat Leave Button */}
            {isMe && isInSeat && (
              <div className="w-full px-6 mt-1 mb-4">
                <button
                  onClick={() => onLeaveSeat(userId)}
                  className="w-full h-11 rounded-full bg-[#00E676] text-white flex items-center justify-center gap-2 font-bold uppercase text-sm shadow-lg shadow-green-500/20 active:scale-95 transition-all"
                >
                  <Mic className="h-5 w-5 rotate-180" />
                  Seat leave
                </button>
              </div>
            )}

            {/* Mod Controls */}
            {canManage && !isMe && (
              <div className="w-full border-t border-gray-50 py-4 px-6 animate-in fade-in duration-500">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  <button onClick={() => onSilence(userId, isSilenced)} className="hover:text-primary transition-colors">
                    {isSilenced ? 'Unmute' : 'Mute'}
                  </button>
                  <span className="opacity-20 text-base">|</span>
                  <button onClick={() => onLeaveSeat(userId)} className="hover:text-orange-600 transition-colors">Leave</button>
                  <span className="opacity-20 text-base">|</span>
                  <button onClick={() => { toast({ title: 'Slot Locked' }); onOpenChange(false); }} className="hover:text-indigo-600 transition-colors">Lock</button>
                  <span className="opacity-20 text-base">|</span>
                  <button onClick={() => onKick(userId, 10)} className="hover:text-red-600 transition-colors">Kick out</button>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </SheetContent>

      {profile && (
        <CPProposeDialog
          isOpen={showPropose}
          onClose={() => setShowPropose(false)}
          targetUser={{
            uid: profile.id,
            username: profile.username,
            avatarUrl: profile.avatarUrl
          }}
        />
      )}

      {profile && (
        <ReportUserDialog
          open={showReport}
          onOpenChange={setShowReport}
          targetUser={{
            uid: profile.id,
            username: profile.username,
            accountNumber: profile.accountNumber || undefined
          }}
        />
      )}
    </Sheet>
  );
                }
