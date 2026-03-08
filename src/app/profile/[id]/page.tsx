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
  Gem,
  Heart,
  ShoppingBag,
  MoreHorizontal,
  Cake,
  Pencil,
  MessageCircle,
  Plus,
  User,
  Pen,
  UserCheck,
  Check
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
import { doc, serverTimestamp } from 'firebase/firestore';

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
    <div 
      onClick={() => onClick ? onClick() : href && router.push(href)}
      className="flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0"
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

  // Check Friend Request Status
  const friendRequestRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
    return doc(firestore, 'friend_requests', `${currentUser.uid}_${profileId}`);
  }, [firestore, currentUser, profileId]);
  const { data: friendRequest } = useDoc(friendRequestRef);

  // Check Follow Status
  const followRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
    return doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
  }, [firestore, currentUser, profileId]);
  const { data: followData } = useDoc(followRef);

  useEffect(() => { 
    if (!isUserLoading && !currentUser) router.replace('/login'); 
  }, [currentUser, isUserLoading, router]);

  const isOwnProfile = currentUser?.uid === profileId;

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

  const firstLetter = (profile.username || 'U').charAt(0).toUpperCase();

  return (
    <AppLayout hideSidebarOnMobile>
      <div className="min-h-full bg-white font-headline pb-32 animate-in fade-in duration-700">
        <div className={cn("relative h-[40vh] flex flex-col pt-12", isOwnProfile ? "bg-white" : "bg-[#689f38]")}>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
             <span className={cn("text-[25rem] font-black select-none leading-none -mt-10", isOwnProfile ? "text-gray-50" : "text-white/20")}>{firstLetter}</span>
          </div>

          <div className="relative z-10 flex justify-between px-6 mb-8">
             <button onClick={() => router.back()} className={cn("p-1", isOwnProfile ? "text-gray-800" : "text-white")}><ChevronLeft className="h-8 w-8" /></button>
             <button className={cn("p-1", isOwnProfile ? "text-gray-800" : "text-white")}><MoreHorizontal className="h-8 w-8" /></button>
          </div>

          <div className="relative z-10 px-6 mt-auto pb-10">
             <div className="flex items-end gap-4">
                <Avatar className="h-24 w-24 border-[4px] border-white shadow-xl">
                   <AvatarImage src={profile.avatarUrl || undefined} />
                   <AvatarFallback className="text-3xl bg-slate-100">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 pb-1">
                   <div className="flex items-center gap-2 mb-2">
                      <h1 className={cn("text-2xl font-black tracking-tight leading-none", isOwnProfile ? "text-gray-900" : "text-white")}>{profile.username}</h1>
                      {profile.tags?.includes('Official') && <OfficialTag size="sm" />}
                   </div>
                   <div className="flex items-center gap-2">
                      <div className="bg-pink-400 rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-black text-white">♀</div>
                      <span className="text-lg">🇮🇳</span>
                      <div className="flex items-center gap-1 cursor-pointer" onClick={() => { navigator.clipboard.writeText(profile.specialId); toast({ title: 'ID Copied' }); }}>
                         <span className={cn("text-[11px] font-bold uppercase tracking-widest", isOwnProfile ? "text-gray-400" : "text-white/80")}>ID:{profile.specialId}</span>
                         <Copy className={cn("h-3 w-3", isOwnProfile ? "text-gray-300" : "text-white/40")} />
                      </div>
                   </div>
                </div>
                {isOwnProfile && (
                  <div className="pb-1">
                    <EditProfileDialog profile={profile} trigger={
                      <button className="p-3 bg-secondary/50 rounded-full hover:bg-secondary transition-all shadow-sm active:scale-95 border border-gray-100">
                        <Pen className="h-5 w-5 text-gray-600" />
                      </button>
                    } />
                  </div>
                )}
             </div>
          </div>
        </div>

        <div className="relative z-20 bg-white rounded-t-[2.5rem] -mt-6 p-6 space-y-8">
           <div className="bg-white flex divide-x divide-gray-50 border-b border-gray-50 -mx-6 mb-4">
              <StatItem label="Friend" value={0} />
              <StatItem label="Following" value={0} />
              <StatItem label="Fans" value={profile.stats?.followers || 0} />
              <StatItem label="Visitors" value={0} hasNotification={isOwnProfile} />
           </div>

           {!isOwnProfile && (
             <div className="flex gap-4">
                <Button 
                  onClick={handleFriendRequest}
                  disabled={!!friendRequest || isProcessingFriend}
                  className={cn(
                    "flex-1 h-14 rounded-full font-black uppercase text-lg shadow-xl active:scale-95 transition-all",
                    friendRequest ? "bg-green-100 text-green-600 border-2 border-green-200 shadow-none" : "bg-[#ffb300] text-white shadow-orange-500/20"
                  )}
                >
                   {friendRequest ? <><Check className="mr-2 h-6 w-6" /> Request Sent</> : <><UserPlus className="mr-2 h-6 w-6" /> Add Friend</>}
                </Button>
                <Button 
                  onClick={handleFollow}
                  disabled={isProcessingFollow}
                  className={cn(
                    "flex-1 h-14 rounded-full font-black uppercase text-lg shadow-xl active:scale-95 transition-all",
                    followData ? "bg-blue-100 text-blue-600 border-2 border-blue-200 shadow-none" : "bg-[#42a5f5] text-white shadow-blue-500/20"
                  )}
                >
                   {followData ? <><UserCheck className="mr-2 h-6 w-6" /> Following</> : <><Plus className="mr-2 h-6 w-6" /> Follow</>}
                </Button>
             </div>
           )}

           <div className="space-y-4">
              <h3 className="font-black text-lg uppercase tracking-tight">Identity Profile</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-4 text-gray-400">
                    <Cake className="h-5 w-5" />
                    <span className="text-sm font-bold">1990-06-18</span>
                 </div>
                 <div className="flex items-center gap-4 text-gray-400">
                    <Pencil className="h-5 w-5" />
                    <span className="text-sm font-bold">{profile.bio || 'Hey'}</span>
                 </div>
              </div>
           </div>

           {isOwnProfile && (
             <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
                <MenuItem label="Ummy Boutique" icon={ShoppingBag} colorClass="bg-orange-100 text-orange-600" href="/store" />
                <MenuItem label="Aristocracy" icon={Star} colorClass="bg-yellow-100 text-yellow-600" />
                <MenuItem label="Treasure Vault" icon={Gem} colorClass="bg-purple-100 text-purple-600" />
                <MenuItem label="CP Space" icon={Heart} colorClass="bg-pink-100 text-pink-600" href="/cp-house" />
                <MenuItem label="Setting" icon={SettingsIcon} href="/settings" />
             </div>
           )}
        </div>
      </div>
    </AppLayout>
  );
}
