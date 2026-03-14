
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
  Trash2
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useMemoFirebase, useDoc, useCollection, deleteDocumentNonBlocking, updateDocumentNonBlocking, setDocumentNonBlocking, useAuth } from '@/firebase';
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
import { doc, serverTimestamp, increment, getDoc, collection, query, orderBy, limit, writeBatch } from 'firebase/firestore';
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

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

/**
 * High-Fidelity Identity Signature Components
 */
const RichLevelBadge = ({ level }: { level: number }) => (
  <div className="flex items-center gap-1 bg-white/20 backdrop-blur-md px-2 py-0.5 rounded-full border border-white/30 shadow-sm shrink-0">
    <span className="text-[10px] font-black text-gray-600">Lv.{level}</span>
  </div>
);

const GenderCircle = ({ gender }: { gender: string | null | undefined }) => (
  <div className={cn(
    "h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-sm",
    gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
  )}>
    {gender === 'Female' ? '♀' : '♂'}
  </div>
);

const StatItem = ({ label, value, onClick }: { label: string, value: number | string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center flex-1 py-2 active:scale-95 transition-transform"
  >
    <span className="text-2xl font-black text-gray-900 leading-none">{value}</span>
    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-tight mt-1">{label}</span>
  </button>
);

const IconButton = ({ icon: Icon, label, colorClass, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-2 group active:scale-90 transition-all"
  >
    <div className={cn("h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-transform group-hover:-translate-y-1", colorClass)}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <span className="text-[11px] font-black text-gray-500 uppercase tracking-tight">{label}</span>
  </button>
);

const ProfileMenuItem = ({ icon: Icon, label, extra, iconColor, onClick, destructive }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between py-5 border-b border-gray-50 last:border-0 px-2 hover:bg-gray-50 active:bg-gray-100 transition-all text-left"
  >
    <div className="flex items-center gap-4">
      <div className={cn("p-2 rounded-2xl", iconColor || "bg-slate-100 text-slate-600")}>
        <Icon className="h-5 w-5" />
      </div>
      <span className={cn("font-black text-sm uppercase italic tracking-tight", destructive ? "text-red-500" : "text-gray-800")}>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {extra && <span className="text-[10px] font-black text-gray-400 italic uppercase">{extra}</span>}
      <ChevronRight className="h-4 w-4 text-gray-300" />
    </div>
  </button>
);

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
}: { 
  profile: any, 
  onBack: () => void, 
  handleFollow: () => void, 
  followData: any, 
  isProcessingFollow: boolean,
  onOpenSocial: (tab: any) => void,
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
    <div className="min-h-screen bg-white font-headline pb-32 flex flex-col animate-in fade-in duration-700 relative overflow-x-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
         {profile.avatarUrl && (
           <Image src={profile.avatarUrl} fill className="object-cover blur-3xl opacity-30 scale-110" alt="Ambient Backdrop" unoptimized />
         )}
      </div>

      <div className="relative h-[45vh] w-full shrink-0">
        <Image src={profile.coverUrl || profile.avatarUrl || "https://images.unsplash.com/photo-1516589174184-c685266e430c?q=80&w=2000"} alt="Cover" fill className="object-cover" unoptimized />
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
                  <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none truncate max-w-[150px]">{profile.username}</h1>
                  <RichLevelBadge level={profile.level?.rich || 1} />
               </div>
               
               <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                  <div className="flex items-center gap-1 cursor-pointer active:opacity-60 transition-opacity" onClick={handleCopyId}>
                     <span>ID:{profile.specialId || profile.accountNumber}</span>
                     <Copy className="h-2.5 w-2.5 opacity-40" />
                  </div>
               </div>

               <div className="flex items-center gap-2 mt-3 flex-wrap">
                  {isOfficial && <OfficialTag size="sm" className="scale-75 origin-left" />}
                  {isCSLeader && <CsLeaderTag size="sm" className="scale-75 origin-left ml-1" />}
                  {isSeller && <SellerTag size="sm" className="scale-75 origin-left -ml-6" />}
                  {isCS && <CustomerServiceTag size="sm" className="scale-75 origin-left -ml-6" />}
               </div>
            </div>
         </div>

         <div className="flex divide-x divide-gray-100 py-2">
            <StatItem label="Fans" value={profile.stats?.fans || 0} onClick={() => onOpenSocial('followers')} />
            <StatItem label="Following" value={profile.stats?.following || 0} onClick={() => onOpenSocial('following')} />
            <StatItem label="Friends" value={profile.stats?.friends || 0} onClick={() => onOpenSocial('friends')} />
            <StatItem label="Visitors" value="12K" onClick={() => onOpenSocial('visitors')} />
         </div>

         <div className="space-y-4">
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
  const auth = useAuth();
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

  useEffect(() => { 
    if (!isUserLoading && !currentUser) router.replace('/login'); 
  }, [currentUser, isUserLoading, router]);

  const isOwnProfile = currentUser?.uid === profileId;

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

  const isCertifiedSeller = profile?.tags?.some(t => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) || currentUser?.uid === CREATOR_ID;

  if (isUserLoading || isProfileLoading) return (
    <AppLayout><div className="flex h-full w-full flex-col items-center justify-center bg-white space-y-4"><Loader className="animate-spin h-8 w-8 text-primary" /><p className="text-[10px] font-black uppercase text-gray-400">Syncing Identity...</p></div></AppLayout>
  );
  
  if (!profile) return null;

  if (isOwnProfile) {
    return (
      <AppLayout>
        <div className="min-h-full bg-gradient-to-b from-[#f3e5f5] via-[#f3e5f5] to-[#ffffff] text-gray-900 font-headline relative flex flex-col pb-32 overflow-x-hidden animate-in fade-in duration-1000">
          
          {/* Ambient Stardust Layer */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
             {Array.from({ length: 20 }).map((_, i) => (
               <div key={i} className="absolute bg-white rounded-full animate-pulse" style={{
                 left: `${Math.random() * 100}%`,
                 top: `${Math.random() * 100}%`,
                 width: `${1 + Math.random() * 2}px`,
                 height: `${1 + Math.random() * 2}px`,
                 animationDelay: `${Math.random() * 5}s`
               }} />
             ))}
          </div>

          {/* Header Portal: Identity Editor & Settings Sync */}
          <header className="relative w-full px-6 pt-16 pb-8 flex flex-col items-center">
             <div className="absolute top-10 right-6 flex items-center gap-2">
                <EditProfileDialog 
                  profile={profile} 
                  trigger={
                    <button className="p-2 bg-white/40 backdrop-blur-md rounded-full shadow-sm active:scale-90 transition-transform">
                       <Pencil className="h-5 w-5 text-gray-600" />
                    </button>
                  } 
                />
             </div>

             {/* Identity Card Hub */}
             <div className="flex items-center gap-6 w-full mt-4">
                <div className="relative shrink-0">
                   <div className="absolute inset-0 bg-pink-400/20 blur-2xl rounded-full scale-125" />
                   <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                      <Avatar className="h-24 w-24 border-4 border-white shadow-2xl relative z-10">
                         <AvatarImage src={profile.avatarUrl || undefined} />
                         <AvatarFallback className="text-3xl font-black bg-slate-50">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                      </Avatar>
                   </AvatarFrame>
                   <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 z-20">
                      <div className="bg-gradient-to-r from-[#7c3aed] to-[#d946ef] p-1 rounded-lg border-2 border-white shadow-xl scale-75">
                         <Sparkles className="h-4 w-4 text-white fill-current" />
                      </div>
                   </div>
                </div>

                <div className="flex-1 space-y-2 min-w-0">
                   <div 
                     className="flex items-center justify-between cursor-pointer group active:opacity-60 transition-all"
                     onClick={() => router.push(`/profile/${profileId}/edit`)}
                   >
                      <h1 className="text-3xl font-black tracking-tighter text-gray-800 truncate pr-2">{profile.username}</h1>
                      <ChevronRight className="h-6 w-6 text-gray-300 group-hover:translate-x-1 transition-transform" />
                   </div>
                   <div className="flex items-center gap-2">
                      <RichLevelBadge level={profile.level?.rich || 1} />
                      <div className="flex gap-1">
                         {profile.tags?.includes('Official') && <Badge className="bg-[#ffcc00] text-black text-[8px] font-black uppercase border-none h-4 px-1.5">Official</Badge>}
                         <Badge className="bg-[#ba68c8] text-white text-[8px] font-black uppercase border-none h-4 px-1.5">VIP</Badge>
                         <Badge className="bg-[#ff7043] text-white text-[8px] font-black uppercase border-none h-4 px-1.5">Elite</Badge>
                      </div>
                   </div>
                </div>
             </div>
          </header>

          {/* Social Stats Dimension */}
          <div className="px-6 flex justify-around mb-8 gap-2">
             <StatItem label="Fans" value="3K" onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
             <StatItem label="Following" value="1K" onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
             <StatItem label="Friends" value="500" onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
             <StatItem label="Visitors" value="12K" onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
          </div>

          {/* Action Grid Portal */}
          <div className="px-6 grid grid-cols-2 gap-4 mb-10">
             <div onClick={() => router.push('/wallet')} className="h-28 rounded-3xl bg-gradient-to-br from-yellow-400 to-orange-500 p-5 relative overflow-hidden shadow-xl shadow-orange-200 active:scale-95 transition-transform group cursor-pointer">
                <div className="relative z-10 flex flex-col h-full justify-between">
                   <h3 className="text-xl font-black text-white italic tracking-tighter leading-none">Coins</h3>
                   <div className="flex items-center gap-1.5">
                      <GoldCoinIcon className="h-4 w-4" />
                      <span className="text-2xl font-black text-white italic">{(profile.wallet?.coins || 0).toLocaleString()}</span>
                   </div>
                </div>
                <div className="absolute -bottom-2 -right-2 opacity-30 group-hover:scale-110 transition-transform">
                   <GoldCoinIcon className="h-20 w-20" />
                </div>
             </div>

             <div onClick={() => router.push('/wallet')} className="h-28 rounded-3xl bg-gradient-to-br from-[#0ea5e9] via-[#38bdf8] to-[#0284c7] p-5 relative overflow-hidden shadow-xl shadow-blue-200 active:scale-95 transition-transform group cursor-pointer">
                <div className="relative z-10 flex flex-col h-full justify-between">
                   <h3 className="text-xl font-black text-white italic tracking-tighter leading-none">Diamonds</h3>
                   <div className="flex items-center gap-1.5">
                      <Gem className="h-4 w-4 text-white fill-current" />
                      <span className="text-2xl font-black text-white italic">
                         {(profile.wallet?.diamonds || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      </span>
                   </div>
                </div>
                <div className="absolute -bottom-2 -right-2 opacity-30 group-hover:scale-110 transition-transform">
                   <Gem className="h-20 w-20 text-white fill-current" />
                </div>
             </div>
          </div>

          {/* Utility Icon Dimension */}
          <div className="px-10 flex justify-between items-center mb-12">
             <IconButton icon={Trophy} label="Level" colorClass="bg-orange-400" onClick={() => router.push('/level')} />
             <IconButton icon={ShoppingBag} label="Store" colorClass="bg-pink-400" onClick={() => router.push('/store')} />
             <IconButton icon={History} label="Budget" colorClass="bg-blue-400" onClick={() => router.push('/wallet')} />
             <IconButton icon={ClipboardList} label="Task" colorClass="bg-green-400" onClick={() => router.push('/tasks')} />
          </div>

          {/* VIP Premium Promotional Portal */}
          <div className="px-6 space-y-4 mb-8">
             <div className="relative rounded-[2.5rem] overflow-hidden group shadow-2xl active:scale-[0.98] transition-all cursor-pointer">
                <div className="h-40 bg-gradient-to-br from-orange-300 via-pink-400 to-purple-500 p-8 flex flex-col justify-start relative">
                   <div className="flex items-center gap-3 relative z-10">
                      <div className="bg-yellow-400 p-2.5 rounded-xl shadow-lg border border-white/20"><Crown className="h-7 w-7 text-orange-800 fill-current" /></div>
                      <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter drop-shadow-md">Vip Premium™</h2>
                   </div>
                   <div className="absolute inset-0 bg-white/10 skew-x-[-30deg] -translate-x-[200%] group-hover:animate-shine pointer-events-none" />
                </div>
                
                {/* Secret Card Interaction Overlay */}
                <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md h-14 rounded-2xl flex items-center justify-between px-6 shadow-xl border border-white/50">
                   <span className="font-black text-sm text-gray-800 uppercase italic tracking-tight">Secret card get rewards</span>
                   <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
             </div>
          </div>

          {/* Tribal Menu Sections */}
          <div className="px-6 space-y-6 pb-24">
             {/* General Resources Card */}
             <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white px-4">
                <ProfileMenuItem icon={UserPlus} label="Invite friends" iconColor="bg-blue-50 text-blue-500" onClick={() => toast({ title: 'Sync Triggered', description: 'Referral link dispatched.' })} />
                <ProfileMenuItem icon={ShoppingBag} label="Bag" extra="Inventory" iconColor="bg-purple-50 text-purple-500" onClick={() => router.push('/store')} />
                <ProfileMenuItem icon={Heart} label="Cp/friends" iconColor="bg-pink-50 text-pink-500" onClick={() => router.push('/cp-house')} />
                {isCertifiedSeller && (
                  <SellerTransferDialog />
                )}
             </Card>

             {/* Support & About Card */}
             <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white px-4">
                <ProfileMenuItem icon={HelpCircle} label="Help center" iconColor="bg-orange-50 text-orange-500" onClick={() => router.push('/help-center')} />
                <ProfileMenuItem icon={Info} label="About" iconColor="bg-slate-50 text-slate-500" onClick={() => router.push('/help-center')} />
             </Card>

             {/* System & Security Card */}
             <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white px-4">
                <ProfileMenuItem icon={SettingsIcon} label="Setting" iconColor="bg-slate-100 text-slate-600" onClick={() => router.push('/settings')} />
             </Card>
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
       <PublicProfileView profile={profile} onBack={() => router.back()} handleFollow={handleFollow} followData={followData} isProcessingFollow={isProcessingFollow} onOpenSocial={(tab) => { setSocialTab(tab); setSocialOpen(true); }} />
       <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
    </AppLayout>
  );
}
