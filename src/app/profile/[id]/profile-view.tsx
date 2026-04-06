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
  <Star className="h-2.5 w-2.5 fill-white text-white drop-shadow-sm" />
  <span className="text-[9px] font-bold text-white leading-none drop-shadow-sm">Lv.{level}</span>
 </div>
);

const CharmLevelBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 px-2 py-0.5 rounded-full border border-white/30 shadow-sm relative overflow-hidden shrink-0">
  <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine" />
  <Sparkles className="h-2.5 w-2.5 fill-white text-white drop-shadow-sm" />
  <span className="text-[9px] font-bold text-white leading-none drop-shadow-sm">Lv.{level}</span>
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
  className="flex flex-col items-center justify-center flex-1 py-1 active-press group"
 >
  <span className="text-2xl font-black text-slate-800 leading-none group-hover:text-primary transition-colors">{value}</span>
  <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mt-1.5">{label}</span>
 </button>
);

const IconButton = ({ icon: Icon, label, colorClass, onClick }: any) => (
 <button 
  onClick={onClick}
  className="flex flex-col items-center gap-1.5 group active:scale-90 transition-all"
 >
  <div className={cn("h-11 w-11 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:-translate-y-1", colorClass)}>
   <Icon className="h-4 w-4 text-white" />
  </div>
  <span className="text-[10px] font-semibold text-gray-600 tracking-wide">{label}</span>
 </button>
);

const ProfileMenuItem = ({ icon: Icon, label, extra, iconColor, onClick, destructive }: any) => (
 <button 
  onClick={onClick}
  className="w-full flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0 px-2 hover:bg-gray-50 active:bg-gray-100 transition-all text-left"
 >
  <div className="flex items-center gap-3">
   <div className={cn("p-1.5 rounded-xl", iconColor || "bg-slate-100 text-slate-600")}>
    <Icon className="h-4 w-4" />
   </div>
   <span className={cn("font-medium text-sm tracking-tight", destructive ? "text-red-500" : "text-gray-800")}>{label}</span>
  </div>
  <div className="flex items-center gap-2">
   {extra && <span className="text-[10px] font-medium text-gray-400 uppercase">{extra}</span>}
   <ChevronRight className="h-4 w-4 text-gray-300" />
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
 * Public Profile View - Updated for Stellat Pink Theme
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
 t: any
}) => {
 const { toast } = useToast();
 const firstLetter = (profile.username || 'U').charAt(0).toUpperCase();

 const handleCopyId = () => {
  const idToCopy = profile.accountNumber || profile.id;
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
  <div className="min-h-screen bg-slate-50 font-sans pb-24 flex flex-col animate-in fade-in duration-700 relative overflow-x-hidden">
    {/* 🏙️ PREMIUM HEADER BACKDROP (Pinned) */}
    <div 
      className="fixed top-0 left-0 right-0 h-[300px] z-0 transition-all duration-700 border-b border-white/10" 
      style={{ background: 'var(--header-gradient)' }}
    />
   <div className="absolute inset-0 -z-10 overflow-hidden">
     {profile.avatarUrl && (
      <Image src={profile.avatarUrl} fill className="object-cover blur-3xl opacity-30 scale-110" alt="Ambient Backdrop" unoptimized />
     )}
   </div>

   <div className="relative h-[35vh] w-full shrink-0">
    <Image src={profile.coverUrl || profile.avatarUrl || "https://images.unsplash.com/photo-1516589174184-c685266e430c?q=80&w=2000"} alt="Cover" fill className="object-cover" unoptimized />
    <div className="absolute top-0 left-6 right-6 flex justify-between z-10 pt-safe mt-8">
      <button onClick={onBack} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"><ChevronLeft className="h-5 w-5" /></button>
      <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"><MoreHorizontal className="h-5 w-5" /></button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-white rounded-2xl p-2 w-48 shadow-2xl">
         <DropdownMenuItem onClick={() => window.open('https://ajpep8qoykzh.jp.larksuite.com/wiki/KEQVw45e9iZVk1k2zI6jakXkpEg', '_blank')} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer text-red-400">
          <Flag className="h-4 w-4" />
          <span className="font-bold uppercase text-[10px]">Report</span>
         </DropdownMenuItem>
       </DropdownMenuContent>
      </DropdownMenu>
    </div>
   </div>

   <div className="flex-1 bg-white/95 backdrop-blur-md rounded-t-[2.5rem] -mt-8 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 space-y-6">
     <div className="flex items-start gap-4">
      <div className="shrink-0 -mt-12 relative">
        <AvatarFrame frameId={profile.inventory?.activeFrame} size="lg">
         <Avatar className="h-20 w-20 border-4 border-white shadow-xl bg-slate-50">
           <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
           <AvatarFallback className="text-xl bg-slate-100 text-slate-400">{firstLetter}</AvatarFallback>
         </Avatar>
        </AvatarFrame>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
         <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none truncate max-w-[200px]">{profile.username}</h1>
         <span className="text-sm leading-none">🇮🇳</span>
         <GenderCircle gender={profile.gender} />
         <RichLevelBadge level={profile.level?.rich || 1} />
         <CharmLevelBadge level={profile.level?.charm || 1} />
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
         <div className="flex items-center gap-2" onClick={handleCopyId}>
           <span className={cn(
               "text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity",
               profile.idColor === 'red' ? 'text-red-500' : 
               profile.idColor === 'blue' ? 'text-blue-500' : 
               profile.idColor === 'purple' ? 'text-purple-600' : 
               'text-gray-400'
             )}>ID:{profile.accountNumber} <Copy className="h-2.5 w-2.5 opacity-40" />{profile.isBudgetId && (<Badge className="ml-1 bg-amber-500 h-3 text-[7px] px-1 text-white border-none shrink-0 pointer-events-none uppercase">BUDGET</Badge>)}</span>
         </div>
         {isOfficial && <OfficialTag size="sm" className="scale-[0.65] origin-left" />}
         {isCSLeader && <CsLeaderTag size="sm" className="scale-[0.65] origin-left ml-1" />}
         {isSeller && <SellerTag size="sm" className="scale-[0.65] origin-left ml-1" />}
         {isCS && <CustomerServiceTag size="sm" className="scale-[0.65] origin-left ml-1" />}
        </div>
      </div>
     </div>

     <div className="relative z-50 flex divide-x divide-gray-100 py-1">
      <StatItem label={t.profile.fans} value={stats.fans} onClick={() => onOpenSocial('followers')} />
      <StatItem label={t.profile.following} value={stats.following} onClick={() => onOpenSocial('following')} />
      <StatItem label={t.profile.friends} value={stats.friends} onClick={() => onOpenSocial('friends')} />
      <StatItem label={t.profile.visitors} value={stats.visitors} onClick={() => onOpenSocial('visitors')} />
     </div>

     <div className="px-1 pt-1">
      <div className="flex items-center justify-between mb-3 px-1">
        <h4 className="text-[9px] font-bold uppercase text-gray-400 tracking-[0.2em] ">Top Contribution</h4>
        <ChevronRight className="h-3 w-3 text-gray-300" />
      </div>
      <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-3 flex justify-around items-center">
        {isContributorsLoading ? (
         <div className="py-2 flex justify-center w-full"><Loader className="animate-spin h-3 w-3 text-primary/40" /></div>
        ) : contributors && contributors.length > 0 ? (
         contributors.map((c, i) => (
          <ContributorAvatar key={c.id} contributor={c} rank={i + 1} />
         ))
        ) : (
         <p className="text-[9px] font-bold text-gray-300 uppercase py-2">Awaiting Sync...</p>
        )}
      </div>
     </div>

     <div className="space-y-3">
      <div className="px-1 pt-1">
        <h4 className="text-[9px] font-bold uppercase text-gray-400 tracking-wider mb-1.5 ml-1">Signature Bio</h4>
        <p className="text-xs font-body text-gray-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
         {profile.bio || 'This member has not established a custom personality signature yet.'}
        </p>
      </div>
     </div>
   </div>

   <div className="fixed bottom-0 left-0 right-0 p-4 pt-1 pb-safe bg-gradient-to-t from-white via-white/95 to-transparent z-[100] flex gap-3">
     <button 
      onClick={handleFollow}
      disabled={isProcessingFollow}
      className={cn(
       "flex-1 h-12 rounded-full border-2 flex items-center justify-center gap-2 font-bold uppercase text-base shadow-lg active:scale-95 transition-all",
       followData ? "bg-white border-pink-500 text-pink-500" : "bg-white border-pink-500 text-pink-500"
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
  </div>
 );
};

export default function ProfileView({ profileId }: { profileId: string }) {
 const router = useRouter();
 const { toast } = useToast();
 const firestore = useFirestore();
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
  const isOfficialCenter = profile?.tags?.some((t: string) => ['Official center', 'Admin', 'Official Center'].includes(t)) || isAuthorizedAdmin;

 const isOfficial = profile?.tags?.includes('Official');
 const isCS = profile?.tags?.includes('Customer Service');
 const isCSLeader = profile?.tags?.includes('CS Leader');
 const isSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t));

 if (isUserLoading || isProfileLoading || !profile) return (
  <AppLayout>
  <div className="flex h-full w-full flex-col items-center justify-center bg-[#FF91B5] space-y-4">
    <Loader className="animate-spin h-8 w-8 text-white" />
    <p className="text-[10px] font-bold uppercase text-white/60">Syncing Identity...</p>
  </div>
  </AppLayout>
 );

 if (isOwnProfile) {
  return (
   <AppLayout>
    <div className="h-full bg-slate-50 text-gray-900 font-sans relative flex flex-col overflow-hidden animate-in fade-in duration-1000">
      
      {/* 🏙️ PREMIUM HEADER BACKDROP (Pinned) */}
      <div 
        className="fixed top-0 left-0 right-0 h-[320px] z-0 transition-all duration-700" 
        style={{ background: 'var(--header-gradient)' }}
      />
     
     <div className="absolute inset-0 pointer-events-none opacity-40">
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

      {/* 🚀 FIXED IDENTITY SHELL (Pinned at Top) */}
      <div className="w-full bg-white/10 backdrop-blur-sm z-50 pt-safe pb-4 border-b border-white/10">
        <div className="px-5">
          <header className="flex items-center gap-5 relative">
            <EditProfileDialog 
              profile={profile} 
              trigger={
                <button className="absolute -top-1 -right-1 p-2 bg-white/40 backdrop-blur-md rounded-full shadow-sm active:scale-95 transition-transform z-[60]">
                  <Pencil className="h-4 w-4 text-gray-600" />
                </button>
              } 
            />

            <div className="relative shrink-0">
              <div className="absolute inset-0 bg-pink-400/20 blur-2xl rounded-full scale-125" />
              <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                <Avatar className="h-24 w-24 border-4 border-white shadow-2xl relative z-10">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="text-2xl font-bold bg-slate-50">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </AvatarFrame>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20">
                <div className="bg-gradient-to-r from-[#7c3aed] to-[#d946ef] p-1 rounded-lg border-2 border-white shadow-xl scale-75">
                  <Sparkles className="h-4 w-4 text-white fill-current" />
                </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-center min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate max-w-[140px] md:max-w-none">{profile.username}</h1>
                <span className="text-base leading-none">🇮🇳</span>
                <GenderCircle gender={profile.gender} />
              </div>
              
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <RichLevelBadge level={profile.level?.rich || 1} />
                <CharmLevelBadge level={profile.level?.charm || 1} />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn(
                    "text-[10px] font-bold uppercase tracking-tight flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity",
                    profile.idColor === 'red' ? 'text-red-500' : 
                    profile.idColor === 'blue' ? 'text-blue-500' : 
                    profile.idColor === 'purple' ? 'text-purple-600' : 
                    'text-gray-400'
                  )} 
                  onClick={() => { if (typeof navigator !== 'undefined' && navigator.clipboard) { navigator.clipboard.writeText((profile as any).accountNumber).then(() => toast({title: 'ID Copied'})); } }}
                >
                  {t.profile.id}:{profile.accountNumber} <Copy className="h-2.5 w-2.5 opacity-40" />
                </p>
                {isOfficial && <OfficialTag size="sm" className="scale-[0.7] origin-left" />}
                {isCSLeader && <CsLeaderTag size="sm" className="scale-[0.7] origin-left" />}
                {isSeller && <SellerTag size="sm" className="scale-[0.7] origin-left" />}
              </div>
            </div>
          </header>

          <div className="flex justify-between items-center mt-6 mb-2 border-t border-black/5 pt-4">
            <StatItem label={t.profile.fans} value={stats.fans} onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
            <StatItem label={t.profile.following} value={stats.following} onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
            <StatItem label={t.profile.friends} value={stats.friends} onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
            <StatItem label={t.profile.visitors} value={stats.visitors} onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
          </div>
        </div>
      </div>

      {/* 📜 SCROLLABLE CONTENT SECTION */}
      <div className="flex-1 overflow-y-auto no-scrollbar pt-4 pb-20 relative z-10 px-5 space-y-5">
        
        {/* WALLET CARDS - Matched Widths */}
        <div className="grid grid-cols-2 gap-3 w-full">
          <div 
            onClick={() => router.push('/wallet')} 
            className="h-24 rounded-[1.5rem] bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-4 relative overflow-hidden shadow-lg active:scale-95 group cursor-pointer border border-white/20"
          >
            <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none" style={{ animationDuration: '3s' }} />
            <div className="relative z-30 flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/30 backdrop-blur-md p-1.5 rounded-full border border-white/40"><GoldCoinIcon className="h-4 w-4 drop-shadow-md" /></div>
                <h3 className="text-[9px] font-black text-white/95 tracking-widest uppercase">{t.profile.coins}</h3>
              </div>
              <div className="flex items-baseline"><span className="text-xl font-black text-white tracking-tighter">{(profile.wallet?.coins || 0).toLocaleString()}</span></div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20 rotate-12 group-hover:rotate-45 transition-transform"><GoldCoinIcon className="w-full h-full" /></div>
          </div>

          <div 
            onClick={() => router.push('/wallet')} 
            className="h-24 rounded-[1.5rem] bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-500 p-4 relative overflow-hidden shadow-lg active:scale-95 group cursor-pointer border border-white/20"
          >
            <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] -translate-x-[200%] animate-shine pointer-events-none" style={{ animationDuration: '3.5s' }} />
            <div className="relative z-30 flex flex-col h-full justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-white/30 backdrop-blur-md p-1.5 rounded-full border border-white/40"><Gem className="h-4 w-4 text-white fill-current drop-shadow-md" /></div>
                <h3 className="text-[9px] font-black text-white/95 tracking-widest uppercase">{t.profile.diamonds}</h3>
              </div>
              <div className="flex items-baseline"><span className="text-xl font-black text-white tracking-tighter">{(profile.wallet?.diamonds || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</span></div>
            </div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20 -rotate-12 group-hover:rotate-[-45deg] transition-transform"><Gem className="w-full h-full text-white fill-current" /></div>
          </div>
        </div>

        {/* VIP PREMIUM - Matched Width */}
        <div 
          onClick={() => router.push('/vips')}
          className="relative rounded-[1.5rem] overflow-hidden group shadow-lg active:scale-[0.98] transition-all cursor-pointer bg-gradient-to-r from-gray-900 via-gray-800 to-black p-5 flex items-center justify-between border border-gray-700/50"
        >
          <div className="flex items-center gap-4 relative z-10 w-full">
            <div className="bg-gradient-to-br from-amber-200 to-yellow-500 p-3 text-yellow-900 rounded-full shadow-inner"><Crown className="h-5 w-5 fill-current" /></div>
            <div className="flex flex-col flex-1">
              <h2 className="text-base font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400 tracking-wide uppercase">{t.profile.vip}</h2>
              <span className="text-[10px] text-gray-400 font-medium tracking-tight whitespace-nowrap">{t.profile.secretCard}</span>
            </div>
            <div className="bg-white/10 rounded-full p-2"><ChevronRight className="h-5 w-5 text-gray-300" /></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-[30deg] -translate-x-[200%] group-hover:animate-shine pointer-events-none" style={{ animationDuration: '3s' }} />
        </div>

        {/* ICON NAVIGATION BUTTONS */}
        <div className="flex justify-between items-center px-2 py-1">
          <IconButton icon={Trophy} label={t.profile.level} colorClass="bg-orange-400" onClick={() => router.push('/level')} />
          <IconButton icon={ShoppingBag} label={t.profile.store} colorClass="bg-pink-400" onClick={() => router.push('/store')} />
          <IconButton icon={History} label={t.profile.budget || 'Budget'} colorClass="bg-blue-400" onClick={() => router.push('/wallet')} />
          <IconButton icon={ClipboardList} label={t.profile.task} colorClass="bg-green-400" onClick={() => router.push('/tasks')} />
        </div>

        {/* LIST SECTION */}
        <div className="space-y-4">
          <Card className="rounded-[1.5rem] border-none shadow-sm overflow-hidden bg-white px-2">
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

          <Card className="rounded-[1.5rem] border-none shadow-sm overflow-hidden bg-white px-2">
            <ProfileMenuItem icon={HelpCircle} label={t.profile.help} iconColor="bg-orange-50 text-orange-500" onClick={() => router.push('/help-center')} />
            <ProfileMenuItem icon={Info} label={t.profile.about} iconColor="bg-slate-50 text-slate-500" onClick={() => router.push('/about')} />
          </Card>

          <Card className="rounded-[1.5rem] border-none shadow-sm overflow-hidden bg-white px-2">
            <ProfileMenuItem icon={SettingsIcon} label={t.profile.settings} iconColor="bg-slate-100 text-slate-600" onClick={() => router.push('/settings')} />
          </Card>
        </div>
      </div>
    </div>

    <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
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
     onOpenSocial={(tab) => { setSocialTab(tab); setSocialOpen(true); }} 
     contributors={contributors}
     isContributorsLoading={isContributorsLoading}
     stats={stats}
     t={t}
    />
    <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
  </AppLayout>
 );
}
