'use client';

import { useEffect, use, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
 Loader, 
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
import { motion, AnimatePresence } from 'framer-motion';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * High-Fidelity Identity Signature Components
 */
const RichLevelBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 via-cyan-500 to-blue-400 px-2 py-0.5 rounded-full border border-white/30 shadow-sm relative overflow-hidden shrink-0">
  <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine" />
  <Star className="h-2.5 w-2.5 fill-white text-white drop-shadow-sm" />
  <span className="text-[9px] font-black text-white leading-none drop-shadow-sm">Lv.{level}</span>
 </div>
);

const CharmLevelBadge = ({ level }: { level: number }) => (
 <div className="flex items-center gap-1 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-400 px-2 py-0.5 rounded-full border border-white/30 shadow-sm relative overflow-hidden shrink-0">
  <div className="absolute inset-0 bg-white/20 -skew-x-[30deg] animate-shine" />
  <Sparkles className="h-2.5 w-2.5 fill-white text-white drop-shadow-sm" />
  <span className="text-[9px] font-black text-white leading-none drop-shadow-sm">Lv.{level}</span>
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
  <span className="text-2xl font-black text-slate-900 leading-none group-hover:text-primary transition-colors">{value}</span>
  <span className="text-[9px] font-black text-slate-400 tracking-[0.2em] uppercase mt-2">{label}</span>
 </button>
);

const IconButton = ({ icon: Icon, label, colorClass, onClick }: any) => (
 <button 
  onClick={onClick}
  className="flex flex-col items-center gap-2.5 group active:scale-90 transition-all"
 >
  <div className={cn("h-14 w-14 rounded-[1.2rem] flex items-center justify-center shadow-lg transition-transform group-hover:-translate-y-1 border-2 border-white", colorClass)}>
   <Icon className="h-6 w-6 text-white" />
  </div>
  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
 </button>
);

const ProfileMenuItem = ({ icon: Icon, label, extra, iconColor, onClick, destructive }: any) => (
 <button 
  onClick={onClick}
  className="w-full flex items-center justify-between py-4 border-b border-slate-50 last:border-0 px-3 hover:bg-slate-50 active:bg-slate-100 transition-all text-left group"
 >
  <div className="flex items-center gap-4">
   <div className={cn("p-2 rounded-xl transition-colors", iconColor || "bg-slate-100 text-slate-400 group-hover:bg-slate-900 group-hover:text-white")}>
    <Icon className="h-4 w-4" />
   </div>
   <span className={cn("font-black text-sm uppercase tracking-tight", destructive ? "text-red-500" : "text-slate-800")}>{label}</span>
  </div>
  <div className="flex items-center gap-2">
   {extra && <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{extra}</span>}
   <ChevronRight className="h-4 w-4 text-slate-200" />
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
 contributors,
 isContributorsLoading,
 stats,
 t
}: any) => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F7FE] font-sans">
       <header className="sticky top-0 z-[100] w-full bg-white/70 backdrop-blur-3xl border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] px-6 py-5 shrink-0">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <button onClick={onBack} className="p-2 bg-slate-100/80 rounded-full text-slate-900 active:scale-90 transition-all"><ChevronLeft className="h-5 w-5" /></button>
            <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">Profile</h1>
            <div className="w-9" />
          </div>
       </header>
       <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-32">
          <div className="max-w-lg mx-auto p-4 space-y-6 mt-2">
            <div className="bg-white rounded-[3rem] p-8 shadow-xl border border-white relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
               <div className="flex flex-col items-center gap-5 relative z-10">
                  <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-2xl rounded-[2rem]">
                      <AvatarImage src={profile.avatarUrl} className="object-cover" />
                      <AvatarFallback className="text-3xl bg-slate-100 font-black text-slate-200">{profile.username?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </AvatarFrame>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-1 flex-wrap">
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight">{profile.username}</h2>
                        <span className="text-lg leading-none">🇮🇳</span>
                        <GenderCircle gender={profile.gender} />
                      </div>
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <RichLevelBadge level={profile.level?.rich || 1} />
                        <CharmLevelBadge level={profile.level?.charm || 1} />
                      </div>
                      
                      {/* ID & Tag Row */}
                      <div className="flex flex-col items-center gap-1.5">
                        <BudgetTag 
                          variant={profile.isAdmin ? 'gold' : profile.tags?.includes('Official') ? 'diamond' : 'silver'} 
                          label={`ID: ${profile.accountNumber}`}
                          size="sm"
                        />
                        <div className="flex flex-wrap justify-center items-center gap-1.5">
                          {profile.tags?.includes('Official') && <OfficialTag size="sm" className="scale-75 origin-center" />}
                          {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SellerTag size="sm" className="scale-75 origin-center" />}
                          {profile.tags?.includes('CS Leader') && <CsLeaderTag size="sm" className="scale-75 origin-center" />}
                          {profile.tags?.includes('Customer Service') && <CustomerServiceTag size="sm" className="scale-75 origin-center" />}
                        </div>
                      </div>
                    </div>
               </div>
            </div>

            <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border border-white">
              <div className="flex justify-between items-center">
                <StatItem label={t.profile.fans} value={stats.fans} onClick={() => onOpenSocial('followers')} />
                <StatItem label={t.profile.following} value={stats.following} onClick={() => onOpenSocial('following')} />
                <StatItem label={t.profile.friends} value={stats.friends} onClick={() => onOpenSocial('friends')} />
                <StatItem label={t.profile.visitors} value={stats.visitors} onClick={() => onOpenSocial('visitors')} />
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-white space-y-4">
              <div className="flex items-center justify-between px-2">
                  <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em] ">Signature Bio</h4>
              </div>
              <p className="text-[13px] font-medium text-slate-600 leading-relaxed px-2">
                {profile.bio || "In the frequency of discovery."}
              </p>
            </div>
          </div>
       </div>

       <div className="fixed bottom-0 left-0 right-0 p-6 pb-12 bg-white/70 backdrop-blur-3xl z-[100] flex gap-4 max-w-lg mx-auto w-full">
         <button onClick={handleFollow} className="flex-1 h-14 bg-slate-900 text-white rounded-2xl font-black uppercase text-sm shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3">
            <Heart className={cn("h-5 w-5", followData && "fill-current")} />
            {followData ? "Following" : "Follow"}
         </button>
         <button className="flex-1 h-14 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl font-black uppercase text-sm shadow-sm active:scale-95 transition-all flex items-center justify-center gap-3">
            <MessageCircle className="h-5 w-5" />
            Vibe
         </button>
       </div>
    </div>
  );
};

export function ProfileViewGlossy({ profileId }: { profileId: string }) {
 const router = useRouter();
 const { toast } = useToast();
 const firestore = useFirestore();
 const { t } = useTranslation();
 const { user: currentUser, isUserLoading } = useUser();
 const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);

 const [isProcessingFollow, setIsProcessingFollow] = useState(false);
 const [socialOpen, setSocialOpen] = useState(false);
 const [socialTab, setSocialTab] = useState<'followers' | 'following' | 'friends' | 'visitors'>('followers');

 const isOwnProfile = currentUser?.uid === profileId;

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
  const fanIds = new Set(fansData?.map(f => f.followerId) || []);
  const followingIds = followingData?.map(f => f.followingId) || [];
  const friends = followingIds.filter(id => fanIds.has(id)).length;
  return { fans, following, friends, visitors };
 }, [fansData, followingData, visitorsData]);

  const isAuthorizedAdmin = currentUser?.uid === CREATOR_ID || profile?.isAdmin === true;
  const isCertifiedSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) || isAuthorizedAdmin;
  const isOfficialCenter = profile?.tags?.some((t: string) => ['Official center', 'Admin', 'Official Center'].includes(t)) || isAuthorizedAdmin;

  const followRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
    return doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
  }, [firestore, currentUser, profileId]);
  const { data: followData } = useDoc(followRef);

  const contributorsQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'users', profileId, 'topContributors'), orderBy('amount', 'desc'), limit(3));
  }, [firestore, profileId]);
  const { data: contributors, isLoading: isContributorsLoading } = useCollection(contributorsQuery);

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

 if (isUserLoading || isProfileLoading || !profile) return (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-white space-y-4">
    <Loader className="animate-spin h-10 w-10 text-slate-300" />
    <p className="text-[10px] font-black uppercase text-slate-400">Syncing Identity...</p>
  </div>
 );

 if (isOwnProfile) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F7FE] font-sans">
      
      {/* FIXED GLOSSY HEADER */}
      <header className="sticky top-0 z-[100] w-full bg-white/70 backdrop-blur-3xl border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] px-6 py-5 shrink-0">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
             <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
             <h1 className="text-xl font-black uppercase tracking-tighter text-slate-900">ME</h1>
          </div>
          <div className="flex gap-2">
             <button onClick={() => router.push('/settings')} className="p-2 bg-white/40 rounded-2xl border border-white active:scale-95 transition-all"><SettingsIcon className="h-5 w-5 text-slate-900" /></button>
          </div>
        </div>
      </header>

      {/* SCROLLABLE AREA */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-32">
        <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
          
          {/* PROFILE CARD */}
          <div className="bg-white rounded-[3rem] p-6 shadow-xl border border-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-1000" />
            
            <header className="flex items-center gap-5 relative z-10">
              <div className="relative shrink-0">
                <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                  <Avatar className="h-24 w-24 border-4 border-white shadow-xl rounded-[2rem]">
                    <AvatarImage src={profile.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-2xl font-black bg-slate-100 text-slate-200">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                  </Avatar>
                </AvatarFrame>
                <EditProfileDialog 
                  profile={profile} 
                  trigger={
                    <button className="absolute -bottom-1 -right-1 p-2.5 bg-slate-900 rounded-2xl shadow-lg active:scale-90 transition-all border border-slate-800">
                      <Pencil className="h-4 w-4 text-white" />
                    </button>
                  } 
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none truncate">{profile.username}</h2>
                  <span className="text-lg leading-none">🇮🇳</span>
                  <GenderCircle gender={profile.gender} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                   <RichLevelBadge level={profile.level?.rich || 1} />
                   <CharmLevelBadge level={profile.level?.charm || 1} />
                </div>
                
                {/* ID & Tag Row */}
                <div className="flex flex-col items-start gap-1.5 mt-1">
                  <BudgetTag 
                    variant={profile.isAdmin ? 'gold' : profile.tags?.includes('Official') ? 'diamond' : 'silver'} 
                    label={`ID: ${profile.accountNumber}`}
                    size="sm"
                  />
                  <div className="flex flex-wrap items-center gap-1.5">
                    {profile.tags?.includes('Official') && <OfficialTag size="sm" className="scale-75 origin-center" />}
                    {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SellerTag size="sm" className="scale-75 origin-center" />}
                    {profile.tags?.includes('CS Leader') && <CsLeaderTag size="sm" className="scale-75 origin-center" />}
                    {profile.tags?.includes('Customer Service') && <CustomerServiceTag size="sm" className="scale-75 origin-center" />}
                  </div>
                </div>
              </div>
            </header>

            <div className="mt-8 flex justify-between items-center border-t border-slate-50 pt-5">
              <StatItem label="Fans" value={stats.fans} onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
              <StatItem label="Following" value={stats.following} onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
              <StatItem label="Friends" value={stats.friends} onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
              <StatItem label="Visitors" value={stats.visitors} onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
            </div>
          </div>

          {/* WALLET SECTION */}
          <div className="grid grid-cols-2 gap-4">
            <div onClick={() => router.push('/wallet')} className="bg-white rounded-[2.5rem] p-5 shadow-xl border border-white active:scale-[0.98] transition-all cursor-pointer group">
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-amber-50 rounded-2xl flex items-center justify-center border border-amber-100"><GoldCoinIcon className="h-5 w-5" /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Coins</span>
               </div>
               <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-black text-slate-900 tracking-tighter">{(profile.wallet?.coins || 0).toLocaleString()}</span>
               </div>
            </div>
            <div onClick={() => router.push('/wallet')} className="bg-white rounded-[2.5rem] p-5 shadow-xl border border-white active:scale-[0.98] transition-all cursor-pointer group">
               <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 bg-cyan-50 rounded-2xl flex items-center justify-center border border-cyan-100"><Gem className="h-5 w-5 text-cyan-600 fill-current" /></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Diamonds</span>
               </div>
               <div className="flex items-baseline gap-1">
                 <span className="text-2xl font-black text-slate-900 tracking-tighter">{(profile.wallet?.diamonds || 0).toLocaleString()}</span>
               </div>
            </div>
          </div>

          <div onClick={() => router.push('/vips')} className="bg-slate-900 rounded-[2.5rem] p-6 shadow-xl flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer">
             <div className="flex items-center gap-5">
                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center shadow-lg"><Crown className="h-6 w-6 text-slate-900 fill-current" /></div>
                <div>
                   <h3 className="text-[15px] font-black text-white uppercase tracking-tight">VIP Subscription</h3>
                   <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Access Premium Frequencies</p>
                </div>
             </div>
             <ChevronRight className="h-5 w-5 text-white/20 group-hover:translate-x-1 transition-all" />
          </div>

          {/* ICON NAV */}
          <div className="flex justify-between items-center px-2">
            <IconButton icon={Trophy} label="Level" colorClass="bg-orange-500" onClick={() => router.push('/level')} />
            <IconButton icon={ShoppingBag} label="Store" colorClass="bg-pink-500" onClick={() => router.push('/store')} />
            <IconButton icon={ClipboardList} label="Tasks" colorClass="bg-green-500" onClick={() => router.push('/tasks')} />
            <IconButton icon={Sparkles} label="Style" colorClass="bg-purple-500" onClick={() => router.push('/store')} />
          </div>

          {/* MENU SECTIONS */}
          <div className="space-y-4">
            <Card className="rounded-[2.5rem] border-white shadow-xl overflow-hidden bg-white p-3">
              <ProfileMenuItem icon={UserPlus} label="Invite Friends" extra="Reward Unlocked" iconColor="bg-blue-50 text-blue-500" onClick={() => {}} />
              <ProfileMenuItem icon={Users} label="Family" extra="Tribal Unity" iconColor="bg-indigo-50 text-indigo-500" onClick={() => router.push('/families')} />
              <ProfileMenuItem icon={Heart} label="Relationship" extra="Bond Hub" iconColor="bg-pink-50 text-pink-500" onClick={() => router.push('/cp-house')} />
              {isCertifiedSeller && <SellerTransferDialog />}
              {isAuthorizedAdmin && <OfficialCenterDialog isAuthorized={true} />}
            </Card>

            <Card className="rounded-[2.5rem] border-white shadow-xl overflow-hidden bg-white p-3">
              <ProfileMenuItem icon={HelpCircle} label="Help & Support" iconColor="bg-orange-50 text-orange-500" onClick={() => router.push('/help-center')} />
              <ProfileMenuItem icon={SettingsIcon} label="Account Settings" iconColor="bg-slate-100 text-slate-400" onClick={() => router.push('/settings')} />
            </Card>
          </div>
        </div>
      </div>
      <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
    </div>
  );
 }

  return (
    <>
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
       t={t}
      />
      <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
    </>
  );
}

export default ProfileViewGlossy;
