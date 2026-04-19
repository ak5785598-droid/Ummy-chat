'use client';

import { useEffect, use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
 Loader, 
 Copy,
 ChevronLeft,
 Settings as SettingsIcon,
 Crown,
 Briefcase,
 UserPlus,
 Star,
 Heart,
 ShoppingBag,
 MoreHorizontal,
 Pencil,
 MessageCircle,
 Plus,
 ShieldCheck,
 CheckCircle2,
 AlertTriangle,
 ClipboardList,
 HelpCircle,
 MapPin,
 ChevronRight,
 Flag,
 Sparkles,
 User,
 History,
 CreditCard,
 Target,
 Trophy,
 Mail,
 Gem,
 Info,
 LogOut,
 UserX,
 BadgeCheck,
 Trash2,
 Users
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { ProfileViewGlossy } from './profile-view-glossy';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, useAuth } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { DirectMessageDialog } from '@/components/direct-message-dialog';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { OfficialTag } from '@/components/official-tag';
import { SellerTag } from '@/components/seller-tag';
import { CustomerServiceTag } from '@/components/customer-service-tag';
import { CsLeaderTag } from '@/components/cs-leader-tag';
import { BudgetTag } from '@/components/budget-tag';
import { doc, serverTimestamp, increment, getDoc, collection, query, orderBy, limit, writeBatch, where } from 'firebase/firestore';
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SocialRelationsDialog } from '@/components/social-relations-dialog';
import { Card } from '@/components/ui/card';
import { signOut } from 'firebase/auth';
import { SellerTransferDialog } from '@/components/seller-transfer-dialog';
import { OfficialCenterDialog } from '@/components/official-center-dialog';
import { useTranslation } from '@/hooks/use-translation';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * High-Fidelity Identity Signature Components
 */
const RichLevelBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 px-2 py-0.5 rounded-full border border-white/30 shadow-sm relative overflow-hidden shrink-0">
  <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine" />
  <Star className="h-2 w-2 fill-white text-white drop-shadow-sm" />
  <span className="text-[9px] font-outfit font-black text-white leading-none drop-shadow-sm">Lv.{level}</span>
 </div>
);

const CharmLevelBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 px-2 py-0.5 rounded-full border border-white/30 shadow-sm relative overflow-hidden shrink-0">
  <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine" />
  <Sparkles className="h-2 w-2 fill-white text-white drop-shadow-sm" />
  <span className="text-[9px] font-outfit font-black text-white leading-none drop-shadow-sm">Lv.{level}</span>
 </div>
);

const GenderCircle = ({ gender }: { gender: string | null | undefined }) => (
 <div className={cn(
  "h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white shrink-0 shadow-sm",
  gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
 )}>
  {gender === 'Female' ? '♀' : '♂'}
 </div>
);

const StatItem = ({ label, value, onClick }: { label: string, value: number | string, onClick?: () => void }) => (
 <button 
  onClick={onClick}
  className="flex flex-col items-center justify-center flex-1 py-1.5 active-press group"
 >
  <span className="text-[22px] font-outfit font-black text-slate-900 leading-none group-hover:text-primary transition-colors">{value}</span>
  <span className="text-[9px] font-outfit font-black text-slate-400 tracking-[0.25em] uppercase mt-1.5">{label}</span>
 </button>
);

const IconButton = ({ icon: Icon, label, colorClass, onClick }: any) => (
 <button 
  onClick={onClick}
  className="flex flex-col items-center gap-2 group active:scale-90 transition-all"
 >
  <div className={cn("h-[58px] w-[58px] rounded-2xl flex items-center justify-center shadow-md transition-transform group-hover:-translate-y-0.5 border-2 border-white", colorClass)}>
   <Icon className="h-7 w-7 text-white" />
  </div>
  <span className="text-[10px] font-outfit font-black text-slate-400 uppercase tracking-widest">{label}</span>
 </button>
);

const ProfileMenuItem = ({ icon: Icon, label, extra, iconColor, onClick, destructive }: any) => (
  <button 
  onClick={onClick}
  className="w-full flex items-center justify-between py-3.5 border-b border-slate-50 last:border-0 px-4 hover:bg-slate-50 active:bg-slate-100 transition-all text-left group"
 >
  <div className="flex items-center gap-5">
   <div className={cn("p-2.5 rounded-xl transition-all shadow-sm group-hover:scale-110", iconColor || "bg-slate-100 text-slate-600")}>
    <Icon className="h-6 w-6" />
   </div>
   <span className={cn("font-outfit font-bold text-[17px] tracking-tight", destructive ? "text-red-500" : "text-gray-900")}>{label}</span>
  </div>
  <div className="flex items-center gap-3">
   {extra && <span className="text-[11px] font-outfit font-black text-gray-300 uppercase tracking-widest">{extra}</span>}
   <ChevronRight className="h-6 w-6 text-gray-200 group-hover:translate-x-1 transition-transform" />
  </div>
 </button>
);

const ContributorAvatar = ({ contributor, rank }: { contributor: any, rank: number }) => {
 const colors = [
  "border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.4)]", // Gold
  "border-slate-300 shadow-[0_0_15px_rgba(203,213,225,0.4)]", // Silver
  "border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.4)]", // Bronze
 ];
 const badges = ["🥇", "🥈", "🥉"];

 return (
  <div className="flex flex-col items-center gap-1">
   <div className="relative">
    <Avatar className={cn("h-10 w-10 border-2", colors[rank - 1])}>
     <AvatarImage src={contributor.avatarUrl || undefined} className="object-cover" />
     <AvatarFallback className="bg-slate-100 text-[10px] font-bold">{rank}</AvatarFallback>
    </Avatar>
    <div className="absolute -top-2 -right-1 text-sm drop-shadow-md">{badges[rank - 1]}</div>
   </div>
   <span className="text-[7px] font-bold uppercase text-gray-400 truncate w-12 text-center">{contributor.username || '...'}</span>
  </div>
 );
};

/**
 * Public Profile View - Updated for Stellar Pink Theme
 */
const PublicProfileView = ({ 
 profile, 
 onBack, 
 handleFollow, 
 followData, 
 isProcessingFollow,
 onOpenSocial,
 contributors,
 isContributorsLoading,
 stats,
 isOwnProfile,
 t
}: { 
 profile: any, 
 onBack: () => void, 
 handleFollow: () => void, 
 followData: any, 
 isProcessingFollow: boolean,
 onOpenSocial: (tab: any) => void,
 contributors: any[] | null,
 isContributorsLoading: boolean,
 stats: { fans: number, following: number, friends: number, visitors: number },
 isOwnProfile?: boolean,
 t: any
}) => {
 const { toast } = useToast();
 const firstLetter = (profile.username || 'U').charAt(0).toUpperCase();

 const handleCopyId = () => {
  const idToCopy = (!profile.accountNumber || profile.accountNumber === 'undefined' || profile.accountNumber === 'UNDEFINED') ? profile.id : profile.accountNumber;
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

 const isOfficial = profile.tags?.includes('Official');
 const isSeller = profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t));
 const isCS = profile.tags?.includes('Customer Service');
 const isCSLeader = profile.tags?.includes('CS Leader');

 return (
    <div className="h-[100dvh] bg-slate-50 font-sans flex flex-col animate-in fade-in duration-700 relative overflow-hidden">
      {/* 🏙️ PREMIUM HEADER BACKDROP */}
      <div 
        className="fixed top-0 left-0 right-0 h-[300px] z-0 transition-all duration-700" 
        style={{ background: 'var(--header-gradient)' }}
      />
      
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {profile.avatarUrl && (
          <Image src={profile.avatarUrl} fill className="object-cover blur-3xl opacity-30 scale-110" alt="Ambient Backdrop" unoptimized />
        )}
      </div>

      {/* STATIONARY TOP SECTION */}
      <div className="shrink-0 relative z-30 bg-white/95 backdrop-blur-md pb-4 shadow-sm">
        <div className="relative h-[25vh] w-full overflow-hidden">
          <Image src={profile.coverUrl || profile.avatarUrl || "https://images.unsplash.com/photo-1516589174184-c685266e430c?q=80&w=2000"} alt="Cover" fill className="object-cover" unoptimized />
          <div className="absolute top-0 left-6 right-6 flex justify-between z-10 pt-safe mt-4">
            <button onClick={onBack} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"><ChevronLeft className="h-5 w-5" /></button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"><MoreHorizontal className="h-5 w-5" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-white rounded-2xl p-2 w-48 shadow-2xl">
                <DropdownMenuItem onClick={() => window.open('https://ajpep8qoykzh.jp.larksuite.com/wiki/KEQVw45e9iZVk1k2zI6jakXkpEg', '_blank')} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer text-red-500">
                  <Flag className="h-4 w-4" />
                  <span className="font-bold uppercase text-[10px]">Report</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="px-5 -mt-10 relative z-40">
          <div className="flex items-start gap-3 mb-2">
            <div className="shrink-0 relative -mt-4">
              <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl bg-slate-50">
                  <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
                  <AvatarFallback className="text-xl bg-slate-100 text-slate-400 font-outfit font-black">{firstLetter}</AvatarFallback>
                </Avatar>
              </AvatarFrame>
            </div>
            
            <div className="flex-1 min-w-0 pt-4">
              {/* Row 1: Name, Flag, Gender - Stabilized */}
              <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                <h1 className="text-2xl font-outfit font-black text-slate-900 tracking-tighter leading-none truncate max-w-xs">{profile.username}</h1>
                <span className="text-base leading-none">🇮🇳</span>
                <GenderCircle gender={profile.gender} />
              </div>
              
              {/* Row 2: ID Badge with Copy Logic */}
              <div 
                onClick={handleCopyId}
                className="flex items-center gap-1 mb-1.5 cursor-pointer active:opacity-70 transition-all group"
              >
                <BudgetTag 
                  variant={profile.isAdmin ? 'gold' : profile.tags?.includes('Official') ? 'diamond' : 'silver'} 
                  label={(!profile.accountNumber || profile.accountNumber === 'undefined' || profile.accountNumber === 'UNDEFINED') ? "ID: Syncing..." : `ID: ${profile.accountNumber}`}
                  size="sm"
                />
                <div className="p-1 bg-slate-100 rounded-md group-hover:bg-slate-200 transition-colors">
                  <Copy className="h-2.5 w-2.5 text-slate-300" />
                </div>
              </div>

              {/* Row 3: Levels & Tags - Consolidated Horizontal */}
              <div className="flex flex-wrap items-center gap-1.5">
                <RichLevelBadge level={profile.level?.rich || 1} />
                <CharmLevelBadge level={profile.level?.charm || 1} />
                <div className="flex flex-wrap items-center gap-1">
                  {isOfficial && <OfficialTag size="sm" className="scale-[0.8] origin-left" />}
                  {isCSLeader && <CsLeaderTag size="sm" className="scale-[0.8] origin-left" />}
                  {isSeller && <SellerTag size="sm" className="scale-[0.8] origin-left" />}
                  {isCS && <CustomerServiceTag size="sm" className="scale-[0.8] origin-left" />}
                </div>
              </div>
            </div>
          </div>

          <div className="flex divide-x divide-gray-100 py-1 border-t border-gray-50">
            <StatItem label={t.profile.fans} value={stats.fans} onClick={() => onOpenSocial('followers')} />
            <StatItem label={t.profile.following} value={stats.following} onClick={() => onOpenSocial('following')} />
            <StatItem label="FRIENDS" value={stats.friends} onClick={() => onOpenSocial('friends')} />
            <StatItem label={t.profile.visitors} value={stats.visitors} onClick={() => onOpenSocial('visitors')} />
          </div>
        </div>
      </div>

      {/* SCROLLABLE BOTTOM SECTION */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-3 pb-40 px-5 space-y-4 relative z-10">
        <div className="px-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <h4 className="text-[10px] font-outfit font-black uppercase text-gray-400 tracking-[0.2em]">Top Contribution</h4>
            <ChevronRight className="h-3 w-3 text-gray-300" />
          </div>
          <div className="bg-white/50 rounded-2xl border border-white p-2.5 flex justify-around items-center shadow-sm">
            {isContributorsLoading ? (
              <div className="py-2 flex justify-center w-full"><Loader className="animate-spin h-3 w-3 text-primary/40" /></div>
            ) : contributors && contributors.length > 0 ? (
              contributors.map((c, i) => (
                <ContributorAvatar key={c.id} contributor={c} rank={i + 1} />
              ))
            ) : (
              <p className="text-[9px] font-outfit font-black text-gray-300 uppercase py-2">Awaiting Sync...</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="px-1">
            <h4 className="text-[10px] font-outfit font-black uppercase text-gray-400 tracking-wider mb-1 ml-1">Signature Bio</h4>
            <p className="text-xs font-sans text-gray-600 leading-relaxed bg-white/50 p-3 rounded-xl border border-white shadow-sm">
              {profile.bio || 'This member has not established a custom personality signature yet.'}
            </p>
          </div>
        </div>
      </div>

   {!isOwnProfile && (
     <div className="fixed bottom-0 left-0 right-0 p-4 pt-1 pb-safe bg-gradient-to-t from-white via-white/95 to-transparent z-[100] flex gap-3">
       <button 
        onClick={handleFollow}
        disabled={isProcessingFollow}
        className={cn(
         "flex-1 h-12 rounded-full border-2 flex items-center justify-center gap-2 font-bold uppercase text-base shadow-lg active:scale-95 transition-all text-pink-500 border-pink-500 bg-white"
        )}
       >
        {isProcessingFollow ? <Loader className="animate-spin h-5 w-5" /> : (
         <>
          <Heart className={cn("h-5 w-5", followData && "fill-current")} />
          {followData ? t.profile.following : t.profile.follow}
         </>
        )}
       </button>
       
       <DirectMessageDialog 
        recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl || '' }} 
        trigger={
         <button className="flex-1 h-12 rounded-full border-2 border-cyan-500 text-cyan-500 bg-white flex items-center justify-center gap-2 font-bold uppercase text-base shadow-lg active:scale-95 transition-all">
          <MessageCircle className="h-5 w-5" />
          {t.profile.chat}
         </button>
        }
       />
     </div>
   )}
  </div>
 );
};



export default function ProfileView({ profileId, mode = 'public' }: { profileId: string, mode?: 'public' | 'editable' }) {
 const router = useRouter();
 const { toast } = useToast();
 const firestore = useFirestore();
 const configRef = useMemo(() => firestore ? doc(firestore, 'appConfig', 'global') : null, [firestore]);
 const { data: config } = useDoc(configRef);
 const theme = config?.appTheme || 'CLASSIC';

 const auth = useAuth();
 const { t } = useTranslation();
 const { user: currentUser, isUserLoading } = useUser();
 const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);

 const [isProcessingFollow, setIsProcessingFollow] = useState(false);
 const [socialOpen, setSocialOpen] = useState(false);
 const [socialTab, setSocialTab] = useState<'followers' | 'following' | 'friends' | 'visitors'>('followers');

 const isOwnProfile = currentUser?.uid === profileId;

 // 🛡️ ATOMIC STABILIZATION: Generate random particles strictly on client state
 const [particles, setParticles] = useState<any[]>([]);
 useEffect(() => {
   const newParticles = Array.from({ length: 20 }).map(() => ({
     left: `${Math.random() * 100}%`,
     top: `${Math.random() * 100}%`,
     width: `${1 + Math.random() * 2}px`,
     height: `${1 + Math.random() * 2}px`,
     delay: `${Math.random() * 5}s`
   }));
   setParticles(newParticles);
 }, []);

 // Real-time Social Queries
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
  
  // Calculate Friends (Mutual Follows)
  const fanIds = new Set(fansData?.map(f => f.followerId) || []);
  const followingIds = followingData?.map(f => f.followingId) || [];
  const friends = followingIds.filter(id => fanIds.has(id)).length;

  return { fans, following, friends, visitors };
 }, [fansData, followingData, visitorsData]);

 // Record a visit if it's someone else's profile
 useEffect(() => {
  if (!firestore || !currentUser || !profileId || isOwnProfile) return;
  
  const recordVisit = async () => {
   try {
    const visitRef = doc(firestore, 'users', profileId, 'profileVisitors', currentUser.uid);
    await setDocumentNonBlocking(visitRef, {
     visitorId: currentUser.uid,
     timestamp: serverTimestamp()
    }, { merge: true });
   } catch (e) {
    console.error("[Social Sync] Visit recording failed:", e);
   }
  };

  recordVisit();
 }, [firestore, currentUser?.uid, profileId, isOwnProfile]);

 const followRef = useMemoFirebase(() => {
  if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
  return doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
 }, [firestore, currentUser, profileId]);
 const { data: followData } = useDoc(followRef);

 const contributorsQuery = useMemoFirebase(() => {
  if (!firestore || !profileId) return null;
  return query(
   collection(firestore, 'users', profileId, 'topContributors'),
   orderBy('amount', 'desc'),
   limit(3)
  );
 }, [firestore, profileId]);

 const { data: contributors, isLoading: isContributorsLoading } = useCollection(contributorsQuery);

 useEffect(() => { 
  if (!isUserLoading && !currentUser) router.replace('/login'); 
 }, [currentUser, isUserLoading, router]);

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
  } catch (e: any) { console.error(e); } finally { setIsProcessingFollow(false); }
 };

  const isAuthorizedAdmin = currentUser?.uid === CREATOR_ID || profile?.isAdmin === true;
  const isCertifiedSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) || isAuthorizedAdmin;
  
  const handleCopyId = () => {
    const idToCopy = (!profile?.accountNumber || profile?.accountNumber === 'undefined' || profile?.accountNumber === 'UNDEFINED') ? (profile?.id || '') : profile?.accountNumber;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
     navigator.clipboard.writeText(idToCopy).then(() => {
      toast({ title: 'ID Copied' });
     }).catch(() => {
      toast({ variant: 'destructive', title: 'Copy Failed' });
     });
    }
  };

  const isOfficial = profile?.tags?.includes('Official');
  const isSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t));
  const isCS = profile?.tags?.includes('Customer Service');
  const isCSLeader = profile?.tags?.includes('CS Leader');

 if (theme === 'GLOSSY') {
   return <ProfileViewGlossy profileId={profileId} mode={mode} />;
 }

 if (isUserLoading || isProfileLoading || !profile) return (
  <AppLayout>
  <div className="flex h-full w-full flex-col items-center justify-center bg-[#FF91B5] space-y-4">
    <Loader className="animate-spin h-8 w-8 text-white" />
    <p className="text-[10px] font-bold uppercase text-white/60">Syncing Identity...</p>
  </div>
  </AppLayout>
 );

  if (mode === 'editable' && isOwnProfile) {
  return (
   <AppLayout>
    <div className="h-full bg-slate-50 text-gray-900 font-sans relative flex flex-col overflow-hidden animate-in fade-in duration-1000">
      
      {/* 🏙️ PREMIUM HEADER BACKDROP (Pinned) */}
      <div 
        className="fixed top-0 left-0 right-0 h-[320px] z-0 transition-all duration-700" 
        style={{ background: 'var(--header-gradient)' }}
      />
     
     <div className="absolute inset-0 pointer-events-none opacity-40 z-0">
       {particles.map((pos, i) => (
        <div key={i} className="absolute bg-white rounded-full animate-pulse" style={{
         left: pos.left,
         top: pos.top,
         width: pos.width,
         height: pos.height,
         animationDelay: pos.delay
        }} />
       ))}
     </div>

      {/* 🚀 FIXED HEADER (Identity + Stats + Wallet + VIP) */}
      <div className="w-full bg-white/95 backdrop-blur-xl z-50 pt-safe pb-2 border-b border-black/5 shadow-sm sticky top-0 shrink-0">
        <div className="px-5 space-y-1">
          <header className="flex items-center gap-3 relative pt-1">
            <EditProfileDialog 
              profile={profile} 
              trigger={
                <button className="absolute -top-1 -right-1 p-2 bg-slate-900 rounded-full shadow-lg active:scale-95 transition-all z-[60] border border-slate-800">
                  <Pencil className="h-4 w-4 text-white" />
                </button>
              } 
            />

            <div 
              className="relative shrink-0 cursor-pointer active:scale-95 transition-transform"
              onClick={() => router.push(`/profile/${profileId}`)}
            >
              <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl relative z-10 transition-transform">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl font-outfit font-black bg-slate-50">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </AvatarFrame>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-gradient-to-r from-[#7c3aed] to-[#d946ef] p-1 rounded-lg border-2 border-white shadow-xl scale-75">
                  <Sparkles className="h-4 w-4 text-white fill-current" />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center min-w-0 pl-1 gap-1">
              {/* Row 1: Name, Flag, Gender */}
              <div className="flex items-center gap-1.5">
                <h1 className="text-[30px] font-outfit font-black text-slate-900 tracking-tighter leading-none truncate max-w-[150px]">{profile.username}</h1>
                <span className="text-base leading-none">🇮🇳</span>
                <GenderCircle gender={profile.gender} />
              </div>
              
              {/* Row 2: Levels */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <RichLevelBadge level={profile.level?.rich || 1} />
                <CharmLevelBadge level={profile.level?.charm || 1} />
              </div>

              {/* Row 3: ID + Tags (only actual tags) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={handleCopyId}
                  className="flex items-center gap-1 opacity-70 cursor-pointer active:opacity-40 transition-opacity"
                >
                  <span className="text-[11px] font-outfit font-black text-slate-400 uppercase tracking-tighter">ID: {profile.accountNumber || '...'}</span>
                  <Copy className="h-2.5 w-2.5 text-slate-300" />
                </button>
                {isOfficial && <OfficialTag size="sm" className="scale-[0.8] origin-left" />}
                {isSeller && <SellerTag size="sm" className="scale-[0.8] origin-left" />}
                {isCSLeader && <CsLeaderTag size="sm" className="scale-[0.8] origin-left" />}
                {isCS && <CustomerServiceTag size="sm" className="scale-[0.8] origin-left" />}
              </div>
            </div>
          </header>

          <div className="flex justify-between items-center border-t border-black/5 pt-1.5 pb-0.5">
            <StatItem label="FANS" value={stats.fans} onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
            <StatItem label="FOLLOWING" value={stats.following} onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
            <StatItem label="FRIENDS" value={stats.friends} onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
            <StatItem label="VISITORS" value={stats.visitors} onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
          </div>

          {/* WALLET CARDS - HIGH DENSITY COMPACT */}
          <div className="grid grid-cols-2 gap-2 w-full">
            <div 
              onClick={() => router.push('/wallet')} 
              className="h-14 rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-2.5 relative overflow-hidden shadow-sm active:scale-[0.98] transition-all group cursor-pointer border border-white/20"
            >
              <div className="relative z-30 flex items-center justify-between h-full">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-md p-1 rounded-xl"><GoldCoinIcon className="h-4 w-4 drop-shadow-md" /></div>
                  <div className="flex flex-col -space-y-1">
                    <span className="text-[7.5px] font-outfit font-black text-white/60 uppercase tracking-widest">{t.profile.coins}</span>
                    <span className="text-sm font-outfit font-black text-white tracking-tighter">{(profile.wallet?.coins || 0).toLocaleString()}</span>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-white/30" />
              </div>
            </div>

            <div 
              onClick={() => router.push('/wallet')} 
              className="h-14 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-blue-600 p-2.5 relative overflow-hidden shadow-sm active:scale-[0.98] transition-all group cursor-pointer border border-white/20"
            >
              <div className="relative z-30 flex items-center justify-between h-full">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 backdrop-blur-md p-1 rounded-xl"><Gem className="h-4 w-4 text-white fill-current drop-shadow-md" /></div>
                  <div className="flex flex-col -space-y-1">
                    <span className="text-[7.5px] font-outfit font-black text-white/60 uppercase tracking-widest">{t.profile.diamonds}</span>
                    <span className="text-sm font-outfit font-black text-white tracking-tighter">{(profile.wallet?.diamonds || 0).toLocaleString()}</span>
                  </div>
                </div>
                <ChevronRight className="h-3 w-3 text-white/30" />
              </div>
            </div>
          </div>

          {/* VIP CARD - SLIM SLICK */}
          <div 
            onClick={() => router.push('/vips')}
            className="h-12 rounded-2xl overflow-hidden group shadow-sm active:scale-[0.99] transition-all cursor-pointer bg-slate-900 border border-slate-800 flex items-center justify-between px-4"
          >
            <div className="flex items-center gap-3">
              <Crown className="h-4 w-4 text-amber-400 fill-current" />
              <div className="flex flex-col -space-y-0.5">
                <h2 className="text-[10px] font-outfit font-black text-amber-200 uppercase tracking-wider">{t.profile.vip}</h2>
                <span className="text-[7px] text-slate-500 font-outfit font-black uppercase tracking-widest">{t.profile.secretCard}</span>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg px-2 py-0.5 text-[7px] font-outfit font-black text-slate-500 uppercase tracking-widest border border-white/5">Rewards Inside</div>
          </div>
        </div>
      </div>

      {/* 📜 SCROLLABLE CONTENT SECTION (Icons + Menus) */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-2 pb-24 relative z-10 px-5 space-y-3">
        
        {/* ICON NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center px-1">
          <IconButton icon={Trophy} label={t.profile.level} colorClass="bg-orange-400" onClick={() => router.push('/level')} />
          <IconButton icon={ShoppingBag} label={t.profile.store} colorClass="bg-pink-400" onClick={() => router.push('/store')} />
          <IconButton icon={History} label={t.profile.budget || 'Budget'} colorClass="bg-blue-400" onClick={() => router.push('/wallet')} />
          <IconButton icon={ClipboardList} label={t.profile.task} colorClass="bg-green-400" onClick={() => router.push('/tasks')} />
        </div>

        {/* LIST SECTION */}
        <div className="space-y-2">
          <Card className="rounded-[1.2rem] border-none shadow-sm overflow-hidden bg-white px-1">
            <ProfileMenuItem 
              icon={UserPlus} 
              label={t.profile.invite} 
              iconColor="bg-blue-50 text-blue-500" 
              onClick={() => {
                if (typeof window !== 'undefined') {
                  const shareUrl = window.location.origin;
                  const text = encodeURIComponent(`Find your vibe, connect with your tribe! Join me on Ummy: ${shareUrl}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }
              }} 
            />
            <ProfileMenuItem icon={Users} label="Family" extra="Tribal Unity" iconColor="bg-indigo-50 text-indigo-500" onClick={() => router.push('/families')} />
            <ProfileMenuItem icon={ShoppingBag} label={t.profile.bag} extra={t.profile.inventory} iconColor="bg-purple-50 text-purple-500" onClick={() => router.push('/store')} />
            <ProfileMenuItem icon={Heart} label={t.profile.cp} iconColor="bg-pink-50 text-pink-500" onClick={() => router.push('/cp-house')} />
            {isCertifiedSeller && <SellerTransferDialog />}
            {isAuthorizedAdmin && <OfficialCenterDialog isAuthorized={true} />}
          </Card>

          <Card className="rounded-[1.2rem] border-none shadow-sm overflow-hidden bg-white px-1">
            <ProfileMenuItem icon={HelpCircle} label={t.profile.help} iconColor="bg-orange-50 text-orange-500" onClick={() => router.push('/help-center')} />
            <ProfileMenuItem icon={Info} label={t.profile.about} iconColor="bg-slate-50 text-slate-500" onClick={() => router.push('/about')} />
          </Card>

          <Card className="rounded-[1.2rem] border-none shadow-sm overflow-hidden bg-white px-1">
            <ProfileMenuItem icon={SettingsIcon} label={t.profile.settings} iconColor="bg-slate-100 text-slate-600" onClick={() => router.push('/settings')} />
          </Card>
        </div>
      </div>

    <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
   </div>
   </AppLayout>
  );
 }

 return (
  <AppLayout>
    <PublicProfileView 
     profile={profile} 
     onBack={() => router.back()} 
     handleFollow={handleFollow} 
     followData={followData} 
     isProcessingFollow={isProcessingFollow} 
     onOpenSocial={(tab: any) => { setSocialTab(tab); setSocialOpen(true); }} 
     contributors={contributors}
     isContributorsLoading={isContributorsLoading}
     stats={stats}
     isOwnProfile={isOwnProfile}
     t={t}
    />
    <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
  </AppLayout>
 );
}
