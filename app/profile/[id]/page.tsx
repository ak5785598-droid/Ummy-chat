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
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useMemoFirebase, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
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
import { SellerTransferDialog } from '@/components/seller-transfer-dialog';
import { doc, serverTimestamp } from 'firebase/firestore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

const StatItem = ({ label, value, hasNotification = false }: { label: string, value: number | string, hasNotification?: boolean }) => (
  <div className="flex flex-col items-center justify-center flex-1 py-4 relative">
    <span className="text-xl font-black text-gray-900 leading-none">{value}</span>
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mt-1">{label}</span>
    {hasNotification && (
      <div className="absolute top-3 right-4 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
    )}
  </div>
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
      <div className="absolute inset-0 w-1/2 h-full bg-white/40 skew-x-[-30deg] -translate-x-[200%] animate-shine pointer-events-none" />
      <span className="relative z-10 text-[10px] font-black text-white uppercase italic tracking-widest drop-shadow-sm">ID: {id}</span>
    </div>
  );
};

const CenterTag = ({ label, gradient, className }: { label: string, gradient: string, className?: string }) => (
  <div className={cn("px-3 py-0.5 rounded-full border border-white/30 shadow-lg animate-shimmer-gold relative overflow-hidden", gradient, className)}>
    <div className="absolute inset-0 bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
    <span className="text-[8px] font-black text-white uppercase italic tracking-tighter relative z-10">{label}</span>
  </div>
);

/**
 * Public Profile View.
 * Redesigned to match the high-fidelity white-theme blueprint from the reference image.
 */
const PublicProfileView = ({ profile, onBack }: { profile: any, onBack: () => void }) => {
  const { toast } = useToast();
  const firstLetter = (profile.username || 'U').charAt(0).toUpperCase();

  const handleCopyId = () => {
    const idToCopy = profile.specialId || profile.id;
    navigator.clipboard.writeText(idToCopy);
    toast({ title: 'ID Copied' });
  };

  const handleReport = () => {
    window.open('https://ajpep8qoykzh.jp.larksuite.com/wiki/KEQVw45e9iZVk1k2zI6jakXkpEg', '_blank');
  };

  return (
    <div className="min-h-full bg-[#f8f9fa] font-headline pb-32 animate-in fade-in duration-700">
      {/* Immersive Visual Header */}
      <div className="relative h-[45vh] w-full overflow-hidden">
        <div className="absolute inset-0 scale-110">
           <img 
             src={profile.avatarUrl || 'https://picsum.photos/seed/bg/800/800'} 
             className="w-full h-full object-cover blur-sm brightness-75"
             alt="Header Background"
           />
           <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#f8f9fa]" />
        </div>

        <div className="relative z-10 flex justify-between px-6 pt-12">
           <button onClick={onBack} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"><ChevronLeft className="h-6 w-6" /></button>
           <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-95 transition-transform"><MoreHorizontal className="h-6 w-6" /></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-white/5 text-white rounded-2xl p-2 w-48 shadow-2xl">
                 <DropdownMenuItem 
                   onClick={handleReport}
                   className="flex items-center gap-3 p-3 focus:bg-white/10 rounded-xl cursor-pointer text-red-400"
                 >
                    <Flag className="h-4 w-4" />
                    <span className="font-black uppercase text-[10px]">Report</span>
                 </DropdownMenuItem>
              </DropdownMenuContent>
           </DropdownMenu>
        </div>

        {/* Floating Profile Avatar Sync */}
        <div className="absolute bottom-10 left-6 z-20">
           <Avatar className="h-24 w-24 border-2 border-white shadow-2xl">
              <AvatarImage src={profile.avatarUrl} className="object-cover" />
              <AvatarFallback className="text-3xl bg-slate-100 text-slate-400">{firstLetter}</AvatarFallback>
           </Avatar>
        </div>
      </div>

      {/* Identity Card Dimension */}
      <div className="relative z-30 bg-white rounded-t-[2.5rem] -mt-10 p-6 space-y-8 min-h-screen">
         <div className="space-y-4">
            <div className="flex items-center gap-2">
               <Badge className="bg-[#00E5FF] text-white text-[10px] font-black uppercase px-2 h-5 border-none rounded-md">New</Badge>
               <h1 className="text-2xl font-black text-gray-900 tracking-tight">{profile.username}</h1>
               <div className="h-5 w-5 bg-[#ff4081] rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">♀</span>
               </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
               <div className="flex items-center gap-1 cursor-pointer active:opacity-60" onClick={handleCopyId}>
                  <span>ID:{profile.specialId || profile.id.slice(0, 8)}</span>
                  <Copy className="h-3 w-3" />
               </div>
               <span className="opacity-20">|</span>
               <span>{profile.stats?.fans || 149} Fans</span>
            </div>

            <div className="flex items-center gap-2">
               <div className="flex items-center gap-1 bg-gradient-to-r from-blue-400 to-blue-600 px-3 py-0.5 rounded-full border border-white/20 shadow-md">
                  <Star className="h-2 w-2 fill-white text-white" />
                  <span className="text-[9px] font-black text-white">{profile.level?.rich || 1}</span>
               </div>
               <div className="flex items-center gap-1 bg-gradient-to-r from-pink-400 to-pink-600 px-3 py-0.5 rounded-full border border-white/20 shadow-md">
                  <Sparkles className="h-2 w-2 fill-white text-white" />
                  <span className="text-[9px] font-black text-white">{profile.level?.charm || 0}</span>
               </div>
            </div>
         </div>

         {/* Top 3 User Contributions Dimension */}
         <div className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-[13px] font-black text-[#9333ea] uppercase tracking-tight">Top 3 User Contributions</h3>
               <div className="flex -space-x-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="relative">
                       <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 scale-75">
                          <Crown className={cn(
                            "h-5 w-5 fill-current",
                            i === 1 ? "text-yellow-500" : i === 2 ? "text-slate-300" : "text-orange-400"
                          )} />
                       </div>
                       <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                          <AvatarImage src={`https://picsum.photos/seed/contributor${i}/100`} />
                          <AvatarFallback><User className="h-4 w-4 text-gray-200" /></AvatarFallback>
                       </Avatar>
                    </div>
                  ))}
               </div>
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase italic">This Month</p>
         </div>

         {/* Moments Link Card */}
         <div className="bg-white rounded-3xl border border-gray-100 p-6 flex items-center justify-between group active:bg-gray-50 transition-all cursor-pointer">
            <span className="text-[13px] font-black text-[#9333ea] uppercase tracking-tight">Moments</span>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:translate-x-1 transition-transform" />
         </div>
      </div>

      {/* Bottom Sync Actions */}
      <div className="fixed bottom-0 left-0 right-0 p-6 pt-2 bg-gradient-to-t from-white via-white/95 to-transparent z-[100] flex gap-4">
         <button className="flex-1 h-14 rounded-full border-2 border-[#ff4081] bg-white text-[#ff4081] flex items-center justify-center gap-2 font-black uppercase text-lg shadow-xl shadow-pink-100 active:scale-95 transition-all">
            <Heart className="h-6 w-6" strokeWidth={2.5} />
            Follow
         </button>
         <DirectMessageDialog 
           recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl || '' }} 
           trigger={
             <button className="flex-1 h-14 rounded-full border-2 border-[#00E5FF] bg-white text-[#00E5FF] flex items-center justify-center gap-2 font-black uppercase text-lg shadow-xl shadow-cyan-50 active:scale-95 transition-all">
                <MessageCircle className="h-6 w-6 fill-current" />
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

  const [isProcessingFriend, setIsProcessingFriend] = useState(false);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);

  const friendRequestRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
    return doc(firestore, 'friend_requests', `${currentUser.uid}_${profileId}`);
  }, [firestore, currentUser, profileId]);
  const { data: friendRequest } = useDoc(friendRequestRef);

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
    const idToCopy = profile.specialId || profile.id;
    navigator.clipboard.writeText(idToCopy);
    toast({ title: 'ID Copied' });
  };

  const handleFriendRequest = async () => {
    if (!firestore || !currentUser || !profileId || isProcessingFriend) return;
    if (friendRequest) return;

    setIsProcessingFriend(true);
    const requestRef = doc(firestore, 'friend_requests', `${currentUser.uid}_${profileId}`);
    
    setDocumentNonBlocking(requestRef, {
      senderId: currentUser.uid,
      receiverId: profileId,
      status: 'pending',
      timestamp: serverTimestamp()
    }, { merge: true });

    toast({ title: 'Request Sent', description: 'Your friend request is synchronized.' });
    setIsProcessingFriend(false);
  };

  const handleFollow = async () => {
    if (!firestore || !currentUser || !profileId || isProcessingFollow) return;
    
    setIsProcessingFollow(true);
    const fRef = doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);

    if (followData) {
      deleteDocumentNonBlocking(fRef);
      toast({ title: 'Unfollowed' });
    } else {
      setDocumentNonBlocking(fRef, {
        followerId: currentUser.uid,
        followingId: profileId,
        timestamp: serverTimestamp()
      }, { merge: true });
      toast({ title: 'Following' });
    }
    setIsProcessingFollow(false);
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

    return (
      <AppLayout>
        <div className="min-h-full bg-[#f8f9fa] text-gray-900 font-headline relative flex flex-col pb-32 overflow-x-hidden animate-in fade-in duration-700">
          <div className="bg-white px-6 pt-12 pb-8 flex flex-col items-center text-center space-y-4 border-b border-gray-50 relative">
            {isOwnProfile && (
              <div className="absolute top-10 right-6">
                <EditProfileDialog profile={profile} trigger={
                  <button className="p-3 bg-secondary/50 rounded-full hover:bg-secondary transition-all shadow-sm active:scale-95 border border-gray-100">
                    <Pen className="h-5 w-5 text-gray-600" />
                  </button>
                } />
              </div>
            )}

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
                <div className="bg-blue-50 rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-black text-blue-500">♂</div>
                <span className="text-lg">🇮🇳</span>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1.5">
                  {profile.specialIdColor ? <SpecialIdBadge id={profile.specialId} color={profile.specialIdColor} onClick={handleCopyId} /> : (
                    <div className="flex items-center gap-1.5 cursor-pointer active:scale-95 transition-transform" onClick={handleCopyId}>
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ID: {profile.specialId || profile.id.slice(0, 6)}</span>
                      <Copy className="h-3 w-3 text-gray-300" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                   {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                   {profile.tags?.includes('Seller') && <SellerTag size="sm" className="-ml-6" />}
                   {profile.tags?.includes('Customer Service') && <CustomerServiceTag size="sm" className="-ml-1" />}
                   {profile.tags?.includes('Official center') && <CenterTag label="Official center" className="-ml-8" gradient="bg-gradient-to-r from-indigo-600 to-blue-800" />}
                   {profile.tags?.includes('Seller center') && <CenterTag label="Seller center" className="-ml-8" gradient="bg-gradient-to-r from-orange-600 to-red-800" />}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white flex divide-x divide-gray-50 border-b border-gray-50 mb-4">
            <StatItem label="Friend" value={0} />
            <StatItem label="Following" value={0} />
            <StatItem label="Fans" value={profile.stats?.fans || 0} />
            <StatItem label="Visitors" value={0} hasNotification />
          </div>

          <div className="px-4 grid grid-cols-2 gap-3 mb-6">
            <div className="h-24 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 relative overflow-hidden shadow-lg group active:scale-[0.98] transition-all cursor-pointer">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <span className="text-[13px] font-black text-yellow-500 uppercase tracking-tighter italic">SVIP Club</span>
                  <span className="text-[10px] text-white/60 font-bold uppercase">Distinguished</span>
               </div>
               <div className="absolute -bottom-2 -right-2 opacity-40 group-hover:scale-110 transition-transform">
                  <Crown className="h-16 w-16 text-yellow-500 fill-current" />
               </div>
            </div>

            <div onClick={() => router.push('/wallet')} className="h-24 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#0369a1] p-4 relative overflow-hidden shadow-lg group active:scale-95 transition-all cursor-pointer">
               <div className="relative z-10 flex flex-col h-full justify-between">
                  <span className="text-[13px] font-black text-white uppercase tracking-tighter italic">Wallet</span>
                  <div className="flex items-center gap-1">
                    <GoldCoinIcon className="h-3 w-3" />
                    <span className="text-[10px] text-white font-black">{(profile.wallet?.coins || 0).toLocaleString()}</span>
                  </div>
               </div>
               <div className="absolute -bottom-2 -right-2 opacity-40 group-hover:scale-110 transition-transform">
                  <Briefcase className="h-16 w-16 text-yellow-400 fill-current" />
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] mx-4 shadow-sm border border-gray-100 overflow-hidden mb-8">
            <MenuItem label="Invite Friends" icon={UserPlus} colorClass="bg-green-100 text-green-600" />
            <MenuItem label="CP Space" icon={Heart} colorClass="bg-pink-100 text-pink-600" href="/cp-house" />
            <MenuItem label="Store" icon={ShoppingBag} colorClass="bg-orange-100 text-orange-600" href="/store" />
            <MenuItem label="Bag" icon={Briefcase} colorClass="bg-amber-100 text-amber-600" />
            <MenuItem label="Official center" icon={ShieldCheck} colorClass="bg-indigo-100 text-indigo-600" />
            
            {isSeller && <SellerTransferDialog />}
          </div>

          <div className="bg-white rounded-[2rem] mx-4 shadow-sm border border-gray-100 overflow-hidden mb-12">
             <MenuItem label="Setting" icon={SettingsIcon} href="/settings" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideSidebarOnMobile>
       <PublicProfileView profile={profile} onBack={() => router.back()} />
    </AppLayout>
  );
}
