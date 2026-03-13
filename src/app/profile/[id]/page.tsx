'use client';

import { useEffect, use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Loader, 
  ChevronRight, 
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
  Cake,
  Pencil,
  MessageCircle,
  Plus,
  User,
  Pen,
  ShieldCheck,
  BadgeCheck,
  Check,
  Flag,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ClipboardList,
  HelpCircle,
  MapPin
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useMemoFirebase, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
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
import { doc, serverTimestamp, increment, getDoc } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

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
  onOpenSocial 
}: { 
  profile: any, 
  onBack: () => void, 
  handleFollow: () => void, 
  followData: any, 
  isProcessingFollow: boolean,
  onOpenSocial: (tab: any) => void
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

  return (
    <div className="min-h-full bg-white font-headline pb-32 animate-in fade-in duration-700">
      <div className="relative bg-[#689f38] h-[40vh] flex flex-col pt-12">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
           <span className="text-[25rem] font-black text-white/20 select-none leading-none -mt-10">{firstLetter}</span>
        </div>

        <div className="relative z-10 flex justify-between px-6 mb-8">
           <button onClick={onBack} className="p-1 text-white active:scale-90 transition-transform"><ChevronLeft className="h-8 w-8" /></button>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <button className="p-1 text-white active:scale-95 transition-transform"><MoreHorizontal className="h-8 w-8" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-white rounded-2xl p-2 w-48 shadow-2xl">
                 <DropdownMenuItem onClick={() => window.open('https://ajpep8qoykzh.jp.larksuite.com/wiki/KEQVw45e9iZVk1k2zI6jakXkpEg', '_blank')} className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer text-red-400">
                    <Flag className="h-4 w-4" />
                    <span className="font-black uppercase text-[10px]">Report</span>
                 </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>

        <div className="relative z-10 px-6 mt-auto pb-10">
           <div className="flex items-end gap-4">
              <Avatar className="h-20 w-20 border-[3px] border-white/40 shadow-xl">
                 <AvatarImage src={profile.avatarUrl || undefined} />
                 <AvatarFallback className="text-2xl bg-white/20 text-white">{firstLetter}</AvatarFallback>
              </Avatar>
              <div className="flex-1 pb-1">
                 <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl font-black text-white tracking-tight leading-none">{profile.username}</h1>
                 </div>
                 <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                    <div className="flex items-center gap-2">
                       <span className="text-lg">🇮🇳</span>
                       <div className="flex items-center gap-1">
                          {profile.specialId ? (
                            <SpecialIdBadge id={profile.specialId} color={profile.specialIdColor} onClick={handleCopyId} />
                          ) : (
                            <div className="flex items-center gap-1 cursor-pointer" onClick={handleCopyId}>
                               <span className="text-[11px] font-bold text-white/80 uppercase tracking-widest">ID: {profile.accountNumber}</span>
                               <Copy className="h-3 w-3 text-white/40" />
                            </div>
                          )}
                       </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                       <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 to-blue-600 px-3 py-0.5 rounded-full border border-white/20 shadow-md">
                          <Star className="h-2 w-2 fill-white text-white" />
                          <span className="text-[9px] font-black text-white">{profile.level?.rich || 0}</span>
                       </div>
                       {isOfficial && <OfficialTag size="sm" className="ml-1" />}
                       {isCSLeader && <CsLeaderTag size="sm" className="ml-1" />}
                       {isSeller && <SellerTag size="sm" className="-ml-6" />}
                       {isCS && <CustomerServiceTag size="sm" className="-ml-6" />}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      <div className="relative z-20 bg-white rounded-t-[2.5rem] -mt-6 p-6 space-y-8">
         <div className="flex justify-between items-center px-2">
            <button onClick={() => onOpenSocial('followers')} className="flex items-baseline gap-1.5 active:bg-gray-50 px-2 py-1 rounded-xl transition-colors">
              <span className="text-lg font-black">{profile.stats?.fans || 0}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Fans</span>
            </button>
            <button onClick={() => onOpenSocial('following')} className="flex items-baseline gap-1.5 active:bg-gray-50 px-2 py-1 rounded-xl transition-colors">
              <span className="text-lg font-black">{profile.stats?.following || 0}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Following</span>
            </button>
            <button onClick={() => onOpenSocial('friends')} className="flex items-baseline gap-1.5 active:bg-gray-50 px-2 py-1 rounded-xl transition-colors">
              <span className="text-lg font-black">{profile.stats?.friends || 0}</span>
              <span className="text-[10px] font-bold text-gray-400 uppercase">Friend</span>
            </button>
         </div>

         <div className="space-y-4">
            <h3 className="font-black text-lg uppercase tracking-tight">Profile</h3>
            <div className="space-y-4">
               <div className="flex items-center gap-4 text-gray-400">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm font-bold">{profile.country || 'India'}</span>
               </div>
               <div className="flex items-center gap-4 text-gray-400">
                  <Pencil className="h-5 w-5" />
                  <span className="text-sm font-bold">{profile.bio || 'Hey'}</span>
               </div>
            </div>
         </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent z-[100] flex gap-4">
         <DirectMessageDialog 
           recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl || '' }} 
           trigger={
             <button className="flex-1 h-14 rounded-full bg-[#42a5f5] text-white flex items-center justify-center gap-2 font-black uppercase text-lg shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                <MessageCircle className="h-6 w-6 fill-current" />
                Chat
             </button>
           }
         />
         <button 
           onClick={handleFollow}
           disabled={isProcessingFollow}
           className={cn(
             "flex-1 h-14 rounded-full flex items-center justify-center gap-2 font-black uppercase text-lg shadow-xl active:scale-95 transition-all",
             followData ? "bg-red-500 text-white shadow-red-500/20" : "bg-[#ffb300] text-white shadow-orange-500/20"
           )}
         >
            {isProcessingFollow ? <Loader className="animate-spin h-6 w-6" /> : (
              <>
                {followData ? <CheckCircle2 className="h-6 w-6" /> : <Plus className="h-6 w-6" strokeWidth={3} />}
                {followData ? 'Following' : 'Follow'}
              </>
            )}
         </button>
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
  const [socialTab, setSocialTab] = useState<'followers' | 'following' | 'friends'>('followers');

  const followRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
    return doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
  }, [firestore, currentUser, profileId]);
  const { data: followData } = useDoc(followRef);

  useEffect(() => { 
    if (!isUserLoading && !currentUser) router.replace('/login'); 
  }, [currentUser, isUserLoading, router]);

  const isOwnProfile = currentUser?.uid === profileId;

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
          <div className="bg-white px-6 pt-12 pb-8 flex flex-col items-center text-center space-y-4 border-b border-gray-50 relative">
            <div className="absolute top-10 right-6">
              <EditProfileDialog profile={profile} trigger={
                <button className="p-3 bg-secondary/50 rounded-full hover:bg-secondary transition-all shadow-sm active:scale-95 border border-gray-100">
                  <Pen className="h-5 w-5 text-gray-600" />
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
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl font-black tracking-tighter uppercase">{profile.username}</h1>
                <div className="flex items-center gap-1.5 ml-1">
                   <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 to-blue-600 px-2.5 py-0.5 rounded-full border border-white/20 shadow-sm shrink-0">
                      <Star className="h-2 w-2 fill-white text-white" />
                      <span className="text-[8px] font-black text-white">{profile.level?.rich || 1}</span>
                   </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1.5">
                  {profile.specialId ? (
                    <SpecialIdBadge id={profile.specialId} color={profile.specialIdColor} onClick={handleCopyId} />
                  ) : (
                    <div className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform" onClick={handleCopyId}>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ID: {profile.accountNumber}</span>
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

          <div className="bg-white flex divide-x divide-gray-50 border-b border-gray-50 mb-4">
            <StatItem label="Friend" value={profile.stats?.friends || 0} onClick={() => openSocial('friends')} />
            <StatItem label="Following" value={profile.stats?.following || 0} onClick={() => openSocial('following')} />
            <StatItem label="Fans" value={profile.stats?.fans || 0} onClick={() => openSocial('followers')} />
            <StatItem label="Visitors" value={0} hasNotification />
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

          <div className="bg-white rounded-[2rem] mx-4 shadow-sm border border-gray-100 overflow-hidden mb-8">
            <MenuItem label="Invite Friends" icon={UserPlus} colorClass="bg-green-100 text-green-600" />
            <MenuItem label="CP Space" icon={Heart} colorClass="bg-pink-100 text-pink-600" href="/cp-house" />
            <MenuItem label="Level" icon={Star} colorClass="bg-blue-100 text-blue-600" href="/level" />
            <MenuItem label="Store" icon={ShoppingBag} colorClass="bg-orange-100 text-orange-600" href="/store" />
            <MenuItem label="Bag" icon={Briefcase} colorClass="bg-amber-100 text-amber-600" />
            <MenuItem label="Task center" icon={ClipboardList} colorClass="bg-amber-100 text-amber-600" href="/tasks" />
            
            {isSeller && <SellerTransferDialog />}
          </div>

          <div className="bg-white rounded-[2rem] mx-4 shadow-sm border border-gray-100 overflow-hidden mb-12">
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
