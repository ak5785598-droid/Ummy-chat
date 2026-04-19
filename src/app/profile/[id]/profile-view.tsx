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
 Gem
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
import { BudgetTag } from '@/components/budget-tag';
import { doc, serverTimestamp, collection, query, orderBy, limit, where } from 'firebase/firestore';
import { SocialRelationsDialog } from '@/components/social-relations-dialog';
import { signOut } from 'firebase/auth';
import { useTranslation } from '@/hooks/use-translation';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * Numerical Signature Formatting
 */
const formatCompactNumber = (num: number) => {
  if (!num || num === 0) return '0';
  const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  return formatter.format(num);
};

const RichLevelBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 pl-1 pr-2 py-0.5 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
  <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine"></div>
  <Star className="h-2 w-2 fill-white text-white" />
  <span className="text-[9px] font-outfit font-black text-white leading-none">Lv.{level}</span>
 </div>
);

const CharmLevelBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 pl-1 pr-2 py-0.5 rounded-full border border-white/20 shadow-sm relative overflow-hidden shrink-0">
  <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine"></div>
  <Sparkles className="h-2 w-2 fill-white text-white" />
  <span className="text-[9px] font-outfit font-black text-white leading-none">Lv.{level}</span>
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

const StatItem = ({ label, value, onClick }: { label: string, value: number, onClick?: () => void }) => (
 <button 
  onClick={onClick}
  className="flex flex-col items-center justify-center flex-1 py-1 active:scale-95 transition-transform"
 >
  <span className="text-[22px] font-outfit font-black text-slate-900 leading-none mb-1.5">{formatCompactNumber(value)}</span>
  <span className="text-[10px] font-outfit font-black text-slate-400 tracking-wider uppercase">{label}</span>
 </button>
);

const IconButton = ({ icon: Icon, label, colorClass, onClick }: { icon: any, label: string, colorClass: string, onClick: () => void }) => (
 <button 
  onClick={onClick}
  className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 group"
 >
  <div className={cn("h-[44px] w-[44px] rounded-2xl flex items-center justify-center shadow-lg transition-all group-hover:shadow-md", colorClass)}>
   <Icon className="h-4 w-4 text-white" />
  </div>
  <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
 </button>
);

const ProfileMenuItem = ({ icon: Icon, label, extra, iconColor, onClick, destructive, extraColor }: { icon: any, label: string, extra?: string, iconColor?: string, onClick: () => void, destructive?: boolean, extraColor?: string }) => (
 <button 
  onClick={onClick}
  className="w-full flex items-center justify-between py-2.5 px-4 hover:bg-slate-50/50 active:bg-slate-100/50 transition-all text-left group"
 >
  <div className="flex items-center gap-4">
   <div className={cn("p-2 rounded-xl transition-colors", iconColor || "bg-slate-100 text-slate-400")}>
    <Icon className="h-5 w-5" />
   </div>
   <span className={cn("font-outfit font-black text-[14px] tracking-tight", destructive ? "text-red-500" : "text-slate-700")}>{label}</span>
  </div>
  <div className="flex items-center gap-2">
   {extra && <span className={cn("text-[11px] font-outfit font-black uppercase tracking-wider", extraColor || "text-slate-300")}>{extra}</span>}
   <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
  </div>
 </button>
);

const PublicProfileView = ({ 
 profile, 
 onBack, 
 handleFollow, 
 followData, 
 isProcessingFollow,
 onOpenSocial,
 stats,
 t
}: any) => {
  const { toast } = useToast();
  const handleCopyId = () => {
    const idToCopy = (!profile.accountNumber || profile.accountNumber === 'undefined' || profile.accountNumber === 'UNDEFINED') ? profile.id : profile.accountNumber;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy).then(() => {
        toast({ title: 'ID Copied' });
      }).catch(() => {
        toast({ variant: 'destructive', title: 'Copy Failed' });
      });
    }
  };

   return (
    <div className="flex flex-col h-full overflow-hidden bg-white font-outfit text-[13px]">
       <header className="sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-xl px-6 pt-[calc(env(safe-area-inset-top)+4px)] pb-[2px] shrink-0">
          <div className="flex items-center justify-between max-w-lg mx-auto h-12">
            <button onClick={onBack} className="p-2 rounded-full text-slate-900 active:bg-slate-50 transition-colors">
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-outfit font-black uppercase tracking-tighter text-slate-900">Profile</h1>
            <button className="p-2 rounded-full text-slate-900 active:bg-slate-100 transition-colors">
              <MoreHorizontal className="h-6 w-6" />
            </button>
          </div>
       </header>

       <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-32">
          <div className="max-w-lg mx-auto px-6 pt-0 pb-4 space-y-1.5">
             {/* Identity Section (Public Mode) - 3 ROWS ONLY - FLUSH LAYOUT */}
             <div className="flex items-center gap-0 pt-0">
                <div className="shrink-0 scale-95 origin-top-left">
                  <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                    <Avatar className="h-32 w-32 border-4 border-white shadow-2xl rounded-full ring-1 ring-slate-100">
                      <AvatarImage src={profile.avatarUrl} className="object-cover" />
                      <AvatarFallback className="text-3xl bg-slate-100 font-outfit font-black text-slate-300">{profile.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </AvatarFrame>
                </div>

                <div className="flex-1 space-y-1 min-w-0 ml-[-2px]">
                   {/* Row 1: Name, Flag, Gender */}
                   <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-[19px] font-outfit font-black text-[#1a1c1e] tracking-tight leading-none truncate">{profile.username}</h2>
                      <span className="text-xl leading-none">🇮🇳</span>
                      <GenderCircle gender={profile.gender} />
                   </div>

                   {/* Row 2: Levels */}
                   <div className="flex items-center gap-2">
                      <RichLevelBadge level={profile.level?.rich || 1} />
                      <CharmLevelBadge level={profile.level?.charm || 1} />
                   </div>

                   {/* Row 3: ID & Professional Tags (CONSOLIDATED) */}
                   <div className="flex flex-wrap items-center gap-3">
                      <div onClick={handleCopyId} className="cursor-pointer active:opacity-60 transition-opacity">
                        <BudgetTag variant="silver" label={`ID: ${(!profile.accountNumber || profile.accountNumber === 'undefined' || profile.accountNumber === 'UNDEFINED') ? profile.id : profile.accountNumber}`} size="sm" />
                      </div>
                      {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                      {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SellerTag size="sm" />}
                   </div>
                </div>
             </div>

             {/* Stats Row */}
             <div className="flex justify-between items-center py-0 px-2">
                <StatItem label={t.profile.fans} value={stats.fans} onClick={() => onOpenSocial('followers')} />
                <StatItem label={t.profile.following} value={stats.following} onClick={() => onOpenSocial('following')} />
                <StatItem label={t.profile.friends || "Friends"} value={stats.friends} onClick={() => onOpenSocial('friends')} />
                <StatItem label={t.profile.visitors} value={stats.visitors} onClick={() => onOpenSocial('visitors')} />
             </div>
          </div>
       </div>

       <div className="fixed bottom-0 left-0 right-0 p-6 pb-12 bg-white/70 backdrop-blur-3xl z-[100] border-t border-white">
         <div className="max-w-lg mx-auto flex gap-4 w-full">
           <button onClick={handleFollow} disabled={isProcessingFollow} className="flex-2 h-16 bg-slate-900 text-white rounded-[1.5rem] font-outfit font-black uppercase text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 px-8">
              {isProcessingFollow ? <Loader className="animate-spin h-6 w-6" /> : (
                <>
                  <Heart className={cn("h-5.5 w-5.5", followData && "fill-current text-rose-500")} />
                  {followData ? "Joined" : "Join"}
                </>
              )}
           </button>
           <DirectMessageDialog recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl || '' }} trigger={
             <button className="flex-1 h-16 bg-white text-slate-900 border-2 border-slate-900 rounded-[1.5rem] font-outfit font-black uppercase text-sm active:scale-95 transition-all flex items-center justify-center gap-3">
               <MessageCircle className="h-5.5 w-5.5" />Vibe
             </button>
           }/>
         </div>
       </div>
    </div>
  );
};

export default function ProfileView({ profileId, mode = 'public' }: { profileId: string; mode?: 'public' | 'editable' }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { t } = useTranslation();
  const { auth } = useFirebase();
  const { user: currentUser, isUserLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);

  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialTab, setSocialTab] = useState<'followers' | 'following' | 'friends' | 'visitors'>('followers');

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

  const contributorsQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'users', profileId, 'topContributors'), orderBy('amount', 'desc'), limit(3));
  }, [firestore, profileId]);

  const { data: contributors } = useCollection(contributorsQuery);

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

  const handleCopyId = () => {
    const idToCopy = (!profile?.accountNumber || profile?.accountNumber === 'undefined' || profile?.accountNumber === 'UNDEFINED') ? (profile?.id || '') : profile?.accountNumber;
    
    if (!idToCopy) return;

    // Modern Clipboard API
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(idToCopy).then(() => {
        toast({ title: 'ID Copied', description: `${idToCopy} copied to clipboard.` });
      }).catch(() => {
        // Fallback to execCommand
        copyFallback(idToCopy);
      });
    } else {
      copyFallback(idToCopy);
    }
  };

  const copyFallback = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({ title: 'ID Copied', description: `${text} copied to clipboard.` });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Copy Failed' });
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

  if (mode === 'editable' && isOwnProfile) {
    return (
      <AppLayout>
        <div className="flex flex-col h-full overflow-hidden bg-white font-outfit text-[13px]">
          {/* Absolute Header - Floats over content without taking layout space */}
          <header className="absolute top-0 left-0 right-0 z-[100] bg-transparent px-6 pt-12 pb-0">
            <div className="flex items-center justify-end max-w-lg mx-auto">
               <EditProfileDialog profile={profile} trigger={
                 <button className="h-10 w-10 bg-slate-900/10 backdrop-blur-xl rounded-full flex items-center justify-center active:scale-90 transition-all shadow-sm border border-white/20">
                   <Pencil className="h-5 w-5 text-slate-800" strokeWidth={2.5} />
                 </button>
               }/>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-32 pt-8">
            <div className="max-w-lg mx-auto px-4 pb-4 space-y-1">
              {/* Identity Section - High & Clean (Safe from clipping) */}
              <div className="relative mx-0.5 mt-2">
                <div className="flex items-center gap-1 relative z-10 transition-all">
                  <div className="shrink-0 scale-95 origin-left">
                    <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                      <Avatar className="h-[108px] w-[108px] border-[6px] border-white shadow-xl rounded-full ring-1 ring-slate-100">
                        <AvatarImage src={profile.avatarUrl} className="object-cover" />
                        <AvatarFallback className="text-4xl font-black bg-slate-50 text-slate-300">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                    </AvatarFrame>
                  </div>
                  <div className="flex-1 min-w-0 -ml-2.5 pt-4">
                    {/* Row 1: Name, Flag, Gender (mt-0) */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h2 className="text-[21px] font-black text-slate-900 tracking-tight leading-none truncate">{profile.username}</h2>
                      <span className="text-lg leading-none">🇮🇳</span>
                      <GenderCircle gender={profile.gender} />
                    </div>

                    {/* Row 2: Levels (mt-1 for tight gap from name) */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <RichLevelBadge level={profile.level?.rich || 1} />
                      <CharmLevelBadge level={profile.level?.charm || 1} />
                    </div>

                    {/* Row 3: ID & Professional Tags (mt-0.5 for slight gap from levels) */}
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <div onClick={handleCopyId} className="cursor-pointer active:opacity-60 transition-opacity">
                        <BudgetTag variant="silver" label={`ID: ${(!profile.accountNumber || profile.accountNumber === 'undefined' || profile.accountNumber === 'UNDEFINED') ? profile.id.substring(0, 6) : profile.accountNumber}`} size="sm" />
                      </div>
                      {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                      {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SellerTag size="sm" />}
                    </div>
                  </div>
                </div>

                {/* Stats Row - Ultra Close to Identity */}
                <div className="flex justify-start items-center gap-8 mt-0 px-0.5 pb-1">
                  <StatItem label="Fans" value={stats.fans} onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
                  <StatItem label="Following" value={stats.following} onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
                  <StatItem label="Friends" value={stats.friends} onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
                  <StatItem label="Visitors" value={stats.visitors} onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
                </div>
              </div>

              {/* Wallet Section (Ultra Slim & Even Higher Position) */}
              <div className="grid grid-cols-2 gap-1.5 mx-[-2px] mt-[-28px]">
                <div onClick={() => router.push('/wallet')} className="h-[85px] bg-gradient-to-br from-[#FF9D2E] to-[#FFBB33] rounded-[1.4rem] p-4 shadow-xl shadow-orange-500/10 cursor-pointer relative overflow-hidden group border border-white/20 active:scale-95 transition-all">
                   {/* Bear Silhouette Watermark (SS3) */}
                   <div className="absolute -right-2 -bottom-4 opacity-[0.08] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                     <svg width="100" height="100" viewBox="0 0 100 100" fill="white">
                       <circle cx="25" cy="40" r="12" />
                       <circle cx="75" cy="40" r="12" />
                       <circle cx="50" cy="55" r="30" />
                     </svg>
                   </div>
                   <div className="flex items-center gap-2 relative z-10">
                      <div className="h-8 w-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <GoldCoinIcon className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-90">Coins</span>
                   </div>
                   <div className="absolute bottom-5 left-6 z-10">
                     <p className="font-black text-[24px] text-white tracking-tighter leading-none">
                      {profile.wallet?.coins?.toFixed(1) || '0.0'}
                     </p>
                   </div>
                </div>

                <div onClick={() => router.push('/wallet')} className="h-[85px] bg-gradient-to-br from-[#4AB9FF] to-[#2E86FF] rounded-[1.4rem] p-4 shadow-xl shadow-blue-500/10 cursor-pointer relative overflow-hidden group border border-white/20 active:scale-95 transition-all">
                   {/* Diamond Geometric Watermark (SS3) */}
                   <div className="absolute -right-4 -bottom-4 opacity-[0.08] pointer-events-none group-hover:scale-110 transition-transform duration-500">
                     <Gem className="w-24 h-24 text-white" />
                   </div>
                   <div className="flex items-center gap-2 relative z-10">
                      <div className="h-8 w-8 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                        <Gem className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-90">Diamonds</span>
                   </div>
                   <div className="absolute bottom-5 left-6 z-10">
                     <p className="font-black text-[24px] text-white tracking-tighter leading-none">
                      {profile.wallet?.diamonds?.toFixed(1) || '0.0'}
                     </p>
                   </div>
                </div>
              </div>

              {/* VIP Premium Card (Ultra Slim & High Position) */}
              <div onClick={() => router.push('/vips')} className="bg-[#0F1115] rounded-[1.4rem] p-4 pl-7 pr-6 shadow-2xl flex items-center justify-between cursor-pointer border border-[#1A1D23] active:scale-[0.98] transition-all group relative overflow-hidden mx-[-2px] min-h-[60px] mt-[-12px]">
                 <div className="flex items-center gap-5 relative z-10">
                    <div className="h-12 w-12 bg-gradient-to-br from-[#FFD700] to-[#FFA500] rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:scale-105">
                      <Crown className="h-6 w-6 text-black fill-current" />
                    </div>
                    <div className="flex flex-col">
                       <h3 className="text-[18px] font-black text-white uppercase tracking-tight leading-tight">VIP Premium™</h3>
                       <p className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mt-0.5">Secret card get rewards</p>
                    </div>
                 </div>
                 <div className="h-10 w-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 group-hover:bg-white/10 transition-colors">
                   <ChevronRight className="h-5 w-5 text-white/50 group-hover:text-white" />
                 </div>
              </div>

              {/* Action Bar (outside main blocks) */}
              <div className="flex justify-between items-center px-1 py-1">
                <IconButton icon={Trophy} label="Level" colorClass="bg-orange-400" onClick={() => router.push('/level')} />
                <IconButton icon={ShoppingBag} label="Store" colorClass="bg-pink-500" onClick={() => router.push('/store')} />
                <IconButton icon={History} label="Budget" colorClass="bg-blue-500" onClick={() => router.push('/wallet')} />
                <IconButton icon={ClipboardList} label="Task" colorClass="bg-green-500" onClick={() => router.push('/tasks')} />
              </div>

              <div className="space-y-3 pt-0 mt-[-4px]">
                <div className="bg-white rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100/50 overflow-hidden">
                  <ProfileMenuItem icon={UserPlus} label="Invite friends" iconColor="bg-blue-50 text-blue-500" onClick={() => {}}/>
                  <ProfileMenuItem icon={Users} label="Family" extra="TRIBAL UNITY" extraColor="text-indigo-500" iconColor="bg-indigo-50 text-indigo-500" onClick={() => router.push('/families')} />
                  <ProfileMenuItem icon={ShoppingBag} label="Bag" extra="INVENTORY" extraColor="text-purple-500" iconColor="bg-purple-50 text-purple-500" onClick={() => router.push('/store')} />
                  <ProfileMenuItem icon={Heart} label="Cp/friends" iconColor="bg-pink-50 text-pink-500" onClick={() => router.push('/cp-house')} />
                  {isCertifiedSeller && (
                    <ProfileMenuItem icon={Sparkles} label="Seller Center" extra="Transfer Portal" extraColor="text-emerald-500" iconColor="bg-emerald-50 text-emerald-500" onClick={() => router.push('/admin')} />
                  )}
                  {isAuthorizedAdmin && (
                    <ProfileMenuItem icon={Crown} label="Official Centre" extra="Supreme Authority" extraColor="text-blue-600" iconColor="bg-blue-50 text-blue-600" onClick={() => router.push('/admin')} />
                  )}
                </div>
                <div className="bg-white rounded-lg shadow-[0_4px_20px_rgb(0,0,0,0.02)] border border-slate-100/50 overflow-hidden">
                  <ProfileMenuItem icon={SettingsIcon} label="Settings" iconColor="bg-slate-50 text-slate-500" onClick={() => router.push('/settings')} />
                  <ProfileMenuItem icon={HelpCircle} label="Help center" iconColor="bg-orange-50 text-orange-500" onClick={() => router.push('/help-center')} />
                  <ProfileMenuItem icon={Info} label="About" iconColor="bg-slate-50 text-slate-500" onClick={() => {}} />
                </div>
              </div>
            </div>
          </div>
          <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <PublicProfileView profile={profile} onBack={() => router.back()} handleFollow={handleFollow} followData={followData} isProcessingFollow={isProcessingFollow} onOpenSocial={(tab: 'followers' | 'following' | 'friends' | 'visitors') => { setSocialTab(tab); setSocialOpen(true); }} stats={stats} t={t}/>
      <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
    </AppLayout>
  );
}
