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
  User
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
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
import { SellerTransferDialog } from '@/components/seller-transfer-dialog';
import { SocialRelationsDialog } from '@/components/social-relations-dialog';
import { doc, serverTimestamp, increment, getDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * High-Fidelity Identity Signature Components
 */
const RichLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 to-blue-600 px-2.5 py-0.5 rounded-full border border-white/20 shadow-sm shrink-0">
    <Star className="h-2 w-2 fill-white text-white" />
    <span className="text-[9px] font-black text-white">{level}</span>
  </div>
);

const CharmLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-gradient-to-r from-pink-400 to-purple-500 px-2.5 py-0.5 rounded-full border border-white/20 shadow-sm shrink-0">
    <Sparkles className="h-2 w-2 fill-white text-white" />
    <span className="text-[9px] font-black text-white">{level}</span>
  </div>
);

const GenderCircle = ({ gender }: { gender: string | null | undefined }) => (
  <div className={cn(
    "h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm",
    gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
  )}>
    {gender === 'Female' ? '♀' : '♂'}
  </div>
);

const StatItem = ({ label, value, hasNotification = false, onClick }: { label: string, value: number | string, hasNotification?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center flex-1 py-4 relative active:bg-gray-50 transition-colors"
  >
    <span className="text-xl font-black text-gray-900 leading-none">{value}</span>
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mt-1">{label}</span>
    {hasNotification && (
      <div className="absolute top-3 right-4 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
    )}
  </button>
);

const MenuItem = ({ label, icon: Icon, extra, colorClass, onClick, href }: any) => {
  const router = useRouter();
  return (
    <button 
      type="button"
      onClick={() => onClick ? onClick() : href && router.push(href)}
      className="w-full flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0 text-left"
    >
      <div className="flex items-center gap-4">
        <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm", colorClass || "bg-gray-100")}>
          <Icon className="h-5 w-5 text-current" />
        </div>
        <span className="font-black text-[13px] uppercase text-gray-800 tracking-tight">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {extra && (
          <Badge className="bg-yellow-400 text-black text-[8px] font-black uppercase h-4 px-2 border-none">
            {extra}
          </Badge>
        )}
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
      </div>
    </button>
  );
};

const SpecialIdBadge = ({ id, color = 'red', onClick }: { id: string, color?: string | null, onClick?: () => void }) => {
  const theme = color === 'blue' 
    ? "from-blue-300 via-blue-500 to-blue-300 shadow-[0_0_12px_rgba(59,130,246,0.3)]"
    : "from-rose-300 via-rose-500 to-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]";

  return (
    <div 
      onClick={onClick}
      className={cn(
        "relative overflow-hidden px-3 py-0.5 rounded-full border border-white/30 group animate-in fade-in duration-500 w-fit bg-gradient-to-r cursor-pointer active:scale-95 transition-transform",
        theme
      )}
    >
      <div className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none z-20" />
      <span className="relative z-10 text-[10px] font-black text-white uppercase italic tracking-widest drop-shadow-sm leading-none">ID:{id}</span>
    </div>
  );
};

/**
 * Public Profile View.
 */
const PublicProfileView = ({ 
  profile, 
  onBack, 
  handleFollow, 
  followData, 
  isProcessingFollow,
  onOpenSocial,
  topContributors
}: { 
  profile: any, 
  onBack: () => void, 
  handleFollow: () => void, 
  followData: any, 
  isProcessingFollow: boolean,
  onOpenSocial: (tab: any) => void,
  topContributors: any[] | null
}) => {
  const { toast } = useToast();
  const firstLetter = (profile.username || 'U').charAt(0).toUpperCase();

  const handleCopyId = () => {
    const idToCopy = profile.specialId || profile.accountNumber || profile.id;
    navigator.clipboard.writeText(idToCopy);
    toast({ title: 'ID Copied' });
  };

  const isOfficial = profile.tags?.includes('Official');
  const isSeller = profile.tags?.includes('Seller') || profile.tags?.includes('Coin Seller');
  const isCS = profile.tags?.includes('Customer Service');
  const isCSLeader = profile.tags?.includes('CS Leader');

  const isNew = profile.createdAt ? (Date.now() - (profile.createdAt.toMillis?.() || 0)) < 7 * 24 * 60 * 60 * 1000 : false;

  return (
    <div className="min-h-screen bg-white font-headline pb-32 flex flex-col animate-in fade-in duration-700 relative">
      
      {/* High-Fidelity Identity Background (Ambient DP) */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
         {profile.avatarUrl && (
           <Image 
             src={profile.avatarUrl} 
             fill 
             className="object-cover blur-3xl opacity-30 scale-110" 
             alt="Ambient Backdrop" 
             unoptimized 
           />
         )}
      </div>

      <div className="relative h-[45vh] w-full shrink-0">
        <Image 
          src={profile.coverUrl || profile.avatarUrl || "https://images.unsplash.com/photo-1516589174184-c685266e430c?q=80&w=2000"} 
          alt="Cover" fill className="object-cover" 
          unoptimized
        />
        <div className="absolute top-12 left-6 right-6 flex justify-between z-10">
           <button onClick={onBack} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"><ChevronLeft className="h-6 w-6" /></button>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"><MoreHorizontal className="h-6 w-6" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-white rounded-2xl p-2 w-48 shadow-2xl">
                 <DropdownMenuItem onClick={() => window.open('https://ajpep8qoykzh.jp.larksuite.com/wiki/KEQVw45e9iZVk1k2zI6jakXkpEg', '_blank')} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer text-red-400">
                    <Flag className="h-4 w-4" />
                    <span className="font-black uppercase text-[10px]">Report</span>
                 </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 bg-white/95 backdrop-blur-md rounded-t-[2.5rem] -mt-10 relative z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 space-y-8">
         <div className="flex items-start gap-4">
            <div className="shrink-0 -mt-14 relative">
               <AvatarFrame frameId={profile.inventory?.activeFrame} size="lg">
                  <Avatar className="h-20 w-20 border-4 border-white shadow-xl bg-slate-50">
                     <AvatarImage src={profile.avatarUrl || undefined} className="object-cover" />
                     <AvatarFallback className="text-2xl bg-slate-100 text-slate-400">{firstLetter}</AvatarFallback>
                  </Avatar>
               </AvatarFrame>
            </div>
            
            <div className="flex-1 min-w-0">
               <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {isNew && <Badge className="bg-[#00A3FF] text-white text-[8px] font-black uppercase h-4 px-2 rounded-full border-none shrink-0">New</Badge>}
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate max-w-[150px]">{profile.username}</h1>
                  <span className="text-base leading-none shrink-0" title={profile.country || 'India'}>🇮🇳</span>
                  <GenderCircle gender={profile.gender} />
                  <RichLevelBadge level={profile.level?.rich || 1} />
                  <CharmLevelBadge level={profile.level?.charm || 1} />
               </div>
               
               <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  <div className="flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity" onClick={handleCopyId}>
                     {profile.specialId && profile.specialIdColor ? (
                       <SpecialIdBadge id={profile.specialId} color={profile.specialIdColor} />
                     ) : (
                       <span>ID:{profile.specialId || profile.accountNumber}</span>
                     )}
                     <Copy className="h-2.5 w-2.5 opacity-40" />
                  </div>
                  <span className="opacity-20 text-sm">|</span>
                  <button onClick={() => onOpenSocial('followers')} className="hover:text-gray-600 transition-colors">
                    {profile.stats?.fans || 0} Fans
                  </button>
               </div>

               <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {isOfficial && <OfficialTag size="sm" className="scale-75 origin-left" />}
                  {isCSLeader && <CsLeaderTag size="sm" className="scale-75 origin-left -ml-4" />}
                  {isSeller && <SellerTag size="sm" className="scale-75 origin-left -ml-4" />}
                  {isCS && <CustomerServiceTag size="sm" className="scale-75 origin-left -ml-4" />}
               </div>
            </div>
         </div>

         <div className="space-y-4">
            {/* Top Contributors Leaderboard Sync - ONLY IN PUBLIC VIEW */}
            <div className="p-4 rounded-3xl border-2 border-slate-50 bg-slate-50/30 flex items-center justify-between group active:scale-[0.98] transition-all">
               <div className="space-y-0.5">
                  <h3 className="text-sm font-black text-purple-600 uppercase italic tracking-tighter">Top 3 User Contributions</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Global Sync</p>
               </div>
               <div className="flex -space-x-3 pr-2">
                  {topContributors && topContributors.length > 0 ? (
                    topContributors.map((c: any, i: number) => (
                      <div key={c.id} className="relative">
                         <Avatar className={cn(
                           "h-10 w-10 border-2 border-white shadow-md",
                           i === 0 && "border-yellow-400",
                           i === 1 && "border-slate-300",
                           i === 2 && "border-orange-200"
                         )}>
                            <AvatarImage src={c.avatarUrl} className="object-cover" />
                            <AvatarFallback className="bg-slate-100 text-[10px] font-black">{i+1}</AvatarFallback>
                         </Avatar>
                         <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] drop-shadow-md">
                            {i === 0 ? '👑' : i === 1 ? '🥈' : '🥉'}
                         </div>
                      </div>
                    ))
                  ) : (
                    [1,2,3].map(i => (
                      <div key={i} className="relative opacity-20">
                         <div className="h-10 w-10 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-300" />
                         </div>
                      </div>
                    ))
                  )}
               </div>
            </div>

            <div className="p-5 rounded-3xl border-2 border-slate-50 bg-slate-50/30 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer">
               <span className="text-sm font-black text-purple-600 uppercase italic tracking-tighter">Moments</span>
               <ChevronRight className="h-5 w-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
            </div>

            <div className="px-2 pt-2">
               <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 ml-1">Signature Bio</h4>
               <p className="text-sm font-body italic text-gray-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {profile.bio || 'This member has not established a custom personality signature yet.'}
               </p>
            </div>
         </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent z-[100] flex gap-4">
         <button 
           onClick={handleFollow}
           disabled={isProcessingFollow}
           className={cn(
             "flex-1 h-14 rounded-full border-2 flex items-center justify-center gap-2 font-black uppercase text-lg shadow-xl active:scale-95 transition-all",
             followData ? "bg-white border-pink-500 text-pink-500" : "bg-white border-pink-500 text-pink-500"
           )}
         >
            {isProcessingFollow ? <Loader className="animate-spin h-6 w-6" /> : (
              <>
                <Heart className={cn("h-6 w-6", followData && "fill-current")} />
                {followData ? 'Following' : 'Follow'}
              </>
            )}
         </button>
         
         <DirectMessageDialog 
           recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl || '' }} 
           trigger={
             <button className="flex-1 h-14 rounded-full border-2 border-cyan-500 text-cyan-500 bg-white flex items-center justify-center gap-2 font-black uppercase text-lg shadow-xl active:scale-95 transition-all">
                <MessageCircle className="h-6 w-6" />
                Chat
             </button>
           }
         />
      </div>
    </div>
  );
};

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: profileId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);

  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialTab, setSocialTab] = useState<'followers' | 'following' | 'friends' | 'visitors'>('followers');

  const followRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
    return doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
  }, [firestore, currentUser, profileId]);
  const { data: followData } = useDoc(followRef);

  const visitorsQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'users', profileId, 'profileVisitors'), limit(100));
  }, [firestore, profileId]);
  const { data: visitorsData } = useCollection(visitorsQuery);

  // Top Contributors Ledger Sync
  const contributorsQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'users', profileId, 'topContributors'), orderBy('amount', 'desc'), limit(3));
  }, [firestore, profileId]);
  const { data: topContributors } = useCollection(contributorsQuery);

  useEffect(() => { 
    if (!isUserLoading && !currentUser) router.replace('/login'); 
  }, [currentUser, isUserLoading, router]);

  const isOwnProfile = currentUser?.uid === profileId;

  useEffect(() => {
    if (!firestore || !currentUser || !profileId || isOwnProfile) return;

    const recordVisit = async () => {
      const visitRef = doc(firestore, 'users', profileId, 'profileVisitors', currentUser.uid);
      setDocumentNonBlocking(visitRef, {
        visitorId: currentUser.uid,
        timestamp: serverTimestamp()
      }, { merge: true });
    };

    recordVisit();
  }, [firestore, currentUser, profileId, isOwnProfile]);

  const handleCopyId = () => {
    if (!profile) return;
    const idToCopy = profile.specialId || profile.accountNumber || profile.id;
    navigator.clipboard.writeText(idToCopy);
    toast({ title: 'ID Copied' });
  };

  const handleFollow = async () => {
    if (!firestore || !currentUser || !profileId || isProcessingFollow) return;
    setIsProcessingFollow(true);
    const fRef = doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
    const rRef = doc(firestore, 'followers', `${profileId}_${currentUser.uid}`);
    const currentUserSummaryRef = doc(firestore, 'users', currentUser.uid);
    const currentUserProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
    const targetUserSummaryRef = doc(firestore, 'users', profileId);
    const targetUserProfileRef = doc(firestore, 'users', profileId, 'profile', profileId);

    try {
      if (followData) {
        await deleteDocumentNonBlocking(fRef);
        const decStats = { 'stats.following': increment(-1), updatedAt: serverTimestamp() };
        const decFans = { 'stats.fans': increment(-1), updatedAt: serverTimestamp() };
        updateDocumentNonBlocking(currentUserSummaryRef, decStats);
        updateDocumentNonBlocking(currentUserProfileRef, decStats);
        updateDocumentNonBlocking(targetUserSummaryRef, decFans);
        updateDocumentNonBlocking(targetUserProfileRef, decFans);
        const reverseSnap = await getDoc(rRef);
        if (reverseSnap.exists()) {
          const decFriends = { 'stats.friends': increment(-1) };
          updateDocumentNonBlocking(currentUserSummaryRef, decFriends);
          updateDocumentNonBlocking(currentUserProfileRef, decFriends);
          updateDocumentNonBlocking(targetUserSummaryRef, decFriends);
          updateDocumentNonBlocking(targetUserProfileRef, decFriends);
        }
        toast({ title: 'Unfollowed' });
      } else {
        await setDocumentNonBlocking(fRef, { followerId: currentUser.uid, followingId: profileId, timestamp: serverTimestamp() }, { merge: true });
        const incStats = { 'stats.following': increment(1), updatedAt: serverTimestamp() };
        const incFans = { 'stats.fans': increment(1), updatedAt: serverTimestamp() };
        updateDocumentNonBlocking(currentUserSummaryRef, incStats);
        updateDocumentNonBlocking(currentUserProfileRef, incStats);
        updateDocumentNonBlocking(targetUserSummaryRef, incFans);
        updateDocumentNonBlocking(targetUserProfileRef, incFans);
        const reverseSnap = await getDoc(rRef);
        if (reverseSnap.exists()) {
          const incFriends = { 'stats.friends': increment(1) };
          updateDocumentNonBlocking(currentUserSummaryRef, incFriends);
          updateDocumentNonBlocking(currentUserProfileRef, incFriends);
          updateDocumentNonBlocking(targetUserSummaryRef, incFriends);
          updateDocumentNonBlocking(targetUserProfileRef, incFriends);
          toast({ title: 'New Friend Sync!' });
        } else { toast({ title: 'Following' }); }
      }
    } catch (e: any) { console.error(e); } finally { setIsProcessingFollow(false); }
  };

  const openSocial = (tab: any) => {
    setSocialTab(tab);
    setSocialOpen(true);
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <AppLayout>
        <div className="flex h-full w-full flex-col items-center justify-center bg-white space-y-4">
          <Loader className="animate-spin h-8 w-8 text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Syncing Identity...</p>
        </div>
      </AppLayout>
    );
  }
  
  if (!profile) return null;

  if (isOwnProfile) {
    const sellerTags = ['Seller', 'Seller center', 'Coin Seller'];
    const isSeller = profile.tags?.some(t => sellerTags.includes(t)) || profile.id === CREATOR_ID;
    const isCSLeader = profile.tags?.includes('CS Leader');

    return (
      <AppLayout>
        <div className="min-h-full bg-[#f8f9fa] text-gray-900 font-headline relative flex flex-col pb-32 overflow-x-hidden animate-in fade-in duration-700">
          
          {/* High-Fidelity Identity Background (Ambient DP) */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
             {profile.avatarUrl && (
               <Image 
                 src={profile.avatarUrl} 
                 fill 
                 className="object-cover blur-3xl opacity-20 scale-110" 
                 alt="Ambient Backdrop" 
                 unoptimized 
               />
             )}
          </div>

          <div className="bg-white/85 backdrop-blur-md px-6 pt-12 pb-8 flex flex-col items-center text-center space-y-4 border-b border-gray-50 relative">
            <div className="absolute top-10 right-6">
              <EditProfileDialog profile={profile} trigger={
                <button className="p-3 bg-secondary/50 rounded-full hover:bg-secondary transition-all shadow-sm active:scale-95 border border-gray-100">
                  <Pencil className="h-5 w-5 text-gray-600" />
                </button>
              } />
            </div>

            <div className="relative">
              <AvatarFrame frameId={profile.inventory?.activeFrame || 'f5'} size="xl">
                <Avatar className="h-28 w-28 border-4 border-gray-50 shadow-inner">
                  <AvatarImage src={profile.avatarUrl || undefined} />
                  <AvatarFallback className="text-3xl font-black bg-slate-100">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </AvatarFrame>
              <EditProfileDialog profile={profile} trigger={
                <button className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-lg border border-gray-100 active:scale-90 transition-transform">
                  <SettingsIcon className="h-4 w-4 text-gray-400" />
                </button>
              } />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <h1 className="text-2xl font-black tracking-tighter uppercase">{profile.username}</h1>
                <span className="text-base leading-none">🇮🇳</span>
                <GenderCircle gender={profile.gender} />
                <RichLevelBadge level={profile.level?.rich || 1} />
                <CharmLevelBadge level={profile.level?.charm || 1} />
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1.5">
                  {profile.specialId && profile.specialIdColor ? (
                    <SpecialIdBadge id={profile.specialId} color={profile.specialIdColor} onClick={handleCopyId} />
                  ) : (
                    <div className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform" onClick={handleCopyId}>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ID: {profile.specialId || profile.accountNumber}</span>
                      <Copy className="h-3 w-3 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                   {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                   {isCSLeader && <CsLeaderTag size="sm" className="ml-1" />}
                   {profile.tags?.includes('Seller') && <SellerTag size="sm" className="-ml-6" />}
                   {profile.tags?.includes('Customer Service') && <CustomerServiceTag size="sm" className="-ml-1" />}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-sm flex divide-x divide-gray-50 border-b border-gray-50 mb-4">
            <StatItem label="Friend" value={profile.stats?.friends || 0} onClick={() => openSocial('friends')} />
            <StatItem label="Following" value={profile.stats?.following || 0} onClick={() => openSocial('following')} />
            <StatItem label="Fans" value={profile.stats?.fans || 0} onClick={() => openSocial('followers')} />
            <StatItem label="Visitors" value={visitorsData?.length || 0} onClick={() => openSocial('visitors')} hasNotification />
          </div>

          <div className="px-4 grid grid-cols-2 gap-3 mb-6">
            <div className="h-24 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 relative overflow-hidden shadow-lg group active:scale-[0.98] transition-all cursor-pointer">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <span className="text-[13px] font-black text-yellow-500 uppercase tracking-tighter italic">SVIP Club</span>
                  <span className="text-[10px] text-white/60 font-bold uppercase">Distinguished</span>
               </div>
               <div className="absolute -bottom-2 -right-2 opacity-40 group-hover:scale-110 transition-transform"><Crown className="h-16 w-16 text-yellow-500 fill-current" /></div>
            </div>

            <div onClick={() => router.push('/wallet')} className="h-24 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] p-4 relative overflow-hidden shadow-lg group active:scale-95 transition-all cursor-pointer">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <span className="text-[13px] font-black text-white uppercase tracking-tighter italic">Wallet</span>
                  <div className="flex items-center gap-1">
                    <GoldCoinIcon className="h-3 w-3" />
                    <span className="text-[10px] text-white font-black">{(profile.wallet?.coins || 0).toLocaleString()}</span>
                  </div>
               </div>
               <div className="absolute -bottom-2 -right-2 opacity-40 group-hover:scale-110 transition-transform"><Briefcase className="h-16 w-16 text-yellow-400 fill-current" /></div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] mx-4 shadow-sm border border-gray-100 overflow-hidden mb-8">
            <MenuItem label="Invite Friends" icon={UserPlus} colorClass="bg-green-100 text-green-600" />
            <MenuItem label="CP Space" icon={Heart} colorClass="bg-pink-100 text-pink-600" href="/cp-house" />
            <MenuItem label="Level" icon={Star} colorClass="bg-blue-100 text-blue-600" href="/level" />
            <MenuItem label="Store" icon={ShoppingBag} colorClass="bg-orange-100 text-orange-600" href="/store" />
            <MenuItem label="Bag" icon={Briefcase} colorClass="bg-amber-100 text-amber-600" />
            <MenuItem label="Task center" icon={ClipboardList} colorClass="bg-amber-100 text-amber-600" href="/tasks" />
            
            {isSeller && <SellerTransferDialog />}
          </div>

          <div className="bg-white/80 backdrop-blur-md rounded-[2.5rem] mx-4 shadow-sm border border-gray-100 overflow-hidden mb-12">
             <MenuItem label="Setting" icon={SettingsIcon} href="/settings" />
             <MenuItem label="Help Center" icon={HelpCircle} href="/help-center" colorClass="bg-orange-100 text-orange-600" />
          </div>
        </div>

        <SocialRelationsDialog 
          open={socialOpen} 
          onOpenChange={setSocialOpen} 
          userId={profileId} 
          initialTab={socialTab} 
          username={profile.username}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout hideSidebarOnMobile>
       <PublicProfileView 
         profile={profile} 
         onBack={() => router.back()} 
         handleFollow={handleFollow}
         followData={followData}
         isProcessingFollow={isProcessingFollow}
         onOpenSocial={openSocial}
         topContributors={topContributors}
       />
       <SocialRelationsDialog 
          open={socialOpen} 
          onOpenChange={setSocialOpen} 
          userId={profileId} 
          initialTab={socialTab} 
          username={profile.username}
        />
    </AppLayout>
  );
}