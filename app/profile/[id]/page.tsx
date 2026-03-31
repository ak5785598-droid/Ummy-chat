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
  CircleHelp,
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
  ShieldAlert
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
import { useTranslation } from '@/hooks/use-translation';

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

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
    "h-4 w-4 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0 shadow-sm",
    gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
  )}>
    {gender === 'Female' ? '♀' : '♂'}
  </div>
);

const StatItem = ({ label, value, onClick }: { label: string, value: number | string, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center justify-center flex-1 py-0.5 active:scale-95 transition-transform"
  >
    <span className="text-xl font-black text-gray-900 leading-none">{value}</span>
    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{label}</span>
  </button>
);

const IconButton = ({ icon: Icon, label, colorClass, onClick }: any) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-1 group active:scale-90 transition-all"
  >
    <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shadow-md transition-transform group-hover:-translate-y-1", colorClass)}>
      <Icon className="h-4 w-4 text-white" />
    </div>
    <span className="text-[9px] font-black text-gray-500 uppercase tracking-tight">{label}</span>
  </button>
);

const ProfileMenuItem = ({ icon: Icon, label, extra, iconColor, onClick, destructive }: any) => (
  <button 
    onClick={onClick}
    className="w-full flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 px-2 hover:bg-gray-50 active:bg-gray-100 transition-all text-left"
  >
    <div className="flex items-center gap-3">
      <div className={cn("p-1.5 rounded-xl", iconColor || "bg-slate-100 text-slate-600")}>
        <Icon className="h-4 w-4" />
      </div>
      <span className={cn("font-black text-xs uppercase italic tracking-tight", destructive ? "text-red-500" : "text-gray-800")}>{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {extra && <span className="text-[9px] font-black text-gray-400 italic uppercase">{extra}</span>}
      <ChevronRight className="h-3 w-3 text-gray-300" />
    </div>
  </button>
);

const SpecialIdBadge = ({ id }: { id: string }) => {
  const { toast } = useToast();
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id).then(() => { toast({ title: 'ID Copied' }); });
    }
  };
  return <span onClick={handleCopy} className="text-[9px] font-black uppercase italic tracking-widest text-slate-500 leading-none cursor-pointer hover:text-slate-700 transition-colors px-1">ID: {id}</span>;
};

const ContributorAvatar = ({ contributor, rank }: { contributor: any, rank: number }) => {
  const colors = ["border-yellow-400 shadow-[0_0_15px_#facc1566]", "border-slate-300 shadow-[0_0_15px_#cbd5e166]", "border-orange-400 shadow-[0_0_15px_#fb923c66]"];
  const badges = ["🥇", "🥈", "🥉"];
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <Avatar className={cn("h-10 w-10 border-2", colors[rank - 1])}><AvatarImage src={contributor.avatarUrl || undefined} className="object-cover" /><AvatarFallback className="bg-slate-100 text-[10px] font-black">{rank}</AvatarFallback></Avatar>
        <div className="absolute -top-2 -right-1 text-sm drop-shadow-md">{badges[rank - 1]}</div>
      </div>
      <span className="text-[7px] font-black uppercase text-gray-400 truncate w-12 text-center">{contributor.username || '...'}</span>
    </div>
  );
};

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: profileId } = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const auth = useAuth();
  const { t } = useTranslation();
  const { user: currentUser, isUserLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);

  const [socialOpen, setSocialOpen] = useState(false);
  const [socialTab, setSocialTab] = useState<'followers' | 'following' | 'friends' | 'visitors'>('followers');

  const isOwnProfile = currentUser?.uid === profileId;

  const fansQuery = useMemoFirebase(() => !firestore || !profileId ? null : query(collection(firestore, 'followers'), where('followingId', '==', profileId)), [firestore, profileId]);
  const followingQuery = useMemoFirebase(() => !firestore || !profileId ? null : query(collection(firestore, 'followers'), where('followerId', '==', profileId)), [firestore, profileId]);
  const visitorsQuery = useMemoFirebase(() => !firestore || !profileId ? null : query(collection(firestore, 'users', profileId, 'profileVisitors'), orderBy('timestamp', 'desc')), [firestore, profileId]);

  const { data: fansData } = useCollection(fansQuery);
  const { data: followingData } = useCollection(followingQuery);
  const { data: visitorsData } = useCollection(visitorsQuery);

  const stats = useMemo(() => {
    const fans = fansData?.length || 0;
    const following = followingData?.length || 0;
    const visitors = visitorsData?.length || 0;
    const fanIds = new Set(fansData?.map(f => f.followerId) || []);
    const friends = (followingData || []).filter(f => fanIds.has(f.followingId)).length;
    return { fans, following, friends, visitors };
  }, [fansData, followingData, visitorsData]);

  const contributorsQuery = useMemoFirebase(() => !firestore || !profileId ? null : query(collection(firestore, 'users', profileId, 'topContributors'), orderBy('amount', 'desc'), limit(3)), [firestore, profileId]);
  const { data: contributors, isLoading: isContributorsLoading } = useCollection(contributorsQuery);

  useEffect(() => { if (!isUserLoading && !currentUser) router.replace('/login'); }, [currentUser, isUserLoading, router]);

  const handleFollow = async () => {
    if (!firestore || !currentUser || !profileId) return;
    const fRef = doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
    const existing = await getDoc(fRef);
    if (existing.exists()) {
      deleteDocumentNonBlocking(fRef);
      toast({ title: 'Unfollowed' });
    } else {
      setDocumentNonBlocking(fRef, { followerId: currentUser.uid, followingId: profileId, timestamp: serverTimestamp() }, { merge: true });
      toast({ title: 'Following' });
    }
  };

  if (isUserLoading || isProfileLoading) return <AppLayout hideSidebarOnMobile><div className="flex h-full w-full flex-col items-center justify-center bg-white space-y-4"><Loader className="animate-spin h-8 w-8 text-primary" /><p className="text-[10px] font-black uppercase text-gray-400">Syncing Identity...</p></div></AppLayout>;
  if (!profile) return null;

  const isOfficial = profile.tags?.includes('Official');
  const isSeller = profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t));
  const isCSLeader = profile.tags?.includes('CS Leader');
  const isCS = profile.tags?.includes('Customer Service');
  const isCertifiedSeller = isSeller || currentUser?.uid === CREATOR_ID;
  const hasAdminAccess = profile.tags?.some((t: string) => ['Official', 'Super Admin', 'Admin Management'].includes(t));

  if (isOwnProfile) {
    return (
      <AppLayout hideSidebarOnMobile>
        <div className="min-h-full bg-gradient-to-b from-[#f3e5f5] via-[#f3e5f5] to-[#ffffff] text-gray-900 font-headline relative flex flex-col pb-20 overflow-x-hidden animate-in fade-in duration-1000">
          <header className="relative w-full px-6 pt-6 pb-2 flex flex-col items-center">
             <div className="absolute top-6 right-6 flex items-center gap-2">
                <EditProfileDialog profile={profile} trigger={<button className="p-1.5 bg-white/40 backdrop-blur-md rounded-full shadow-sm active:scale-90 transition-transform"><Pencil className="h-4 w-4 text-gray-600" /></button>} />
             </div>
             <div className="flex flex-col items-center w-full mt-2 gap-3">
                <div className="relative shrink-0">
                   <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                      <Avatar className="h-24 w-24 border-4 border-white shadow-2xl relative z-10"><AvatarImage src={profile.avatarUrl || undefined} /><AvatarFallback className="text-2xl font-black bg-slate-50">{(profile.username || 'U').charAt(0)}</AvatarFallback></Avatar>
                   </AvatarFrame>
                </div>
                <div className="w-full text-center space-y-1.5">
                   <div className="flex items-center justify-center gap-1.5 mb-0.5 flex-wrap">
                      <h1 className="text-base font-black text-gray-800 tracking-tighter truncate leading-none">{profile.username}</h1>
                      <span className="text-sm leading-none">🇮🇳</span>
                      <GenderCircle gender={profile.gender} />
                      <RichLevelBadge level={profile.level?.rich || 1} />
                      <CharmLevelBadge level={profile.level?.charm || 1} />
                   </div>
                   <div className="flex items-center justify-center gap-1.5 flex-wrap">
                      {profile.specialId ? <SpecialIdBadge id={profile.specialId} /> : <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight cursor-pointer" onClick={() => { navigator.clipboard.writeText(profile.accountNumber); toast({ title: 'ID Copied' }); }}>{t.profile.id}:{profile.accountNumber} <Copy className="h-2.5 w-2.5 opacity-40" /></p>}
                      {isOfficial && <OfficialTag size="sm" className="scale-[0.65] origin-left" />}
                      {isCSLeader && <CsLeaderTag size="sm" className="scale-[0.65] origin-left ml-1" />}
                      {isSeller && <SellerTag size="sm" className="scale-[0.65] origin-left ml-1" />}
                      {isCS && <CustomerServiceTag size="sm" className="scale-[0.65] origin-left ml-1" />}
                   </div>
                </div>
             </div>
          </header>
          <div className="px-6 flex justify-around mb-2 gap-2">
             <StatItem label={t.profile.fans} value={stats.fans} onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
             <StatItem label={t.profile.following} value={stats.following} onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
             <StatItem label={t.profile.friends} value={stats.friends} onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
             <StatItem label={t.profile.visitors} value={stats.visitors} onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
          </div>
          <div className="px-3 grid grid-cols-2 gap-2 mb-3">
             <div onClick={() => router.push('/wallet')} className="h-24 rounded-[1.25rem] bg-gradient-to-br from-[#ffd700] via-[#ff9800] to-[#f57c00] p-3 relative overflow-hidden shadow-md active:scale-95 transition-all group cursor-pointer border-2 border-white/20">
                <div className="absolute inset-0 bg-white/30 -skew-x-[30deg] -translate-x-[200%] animate-shine" />
                <div className="relative z-30 flex flex-col h-full justify-between"><div className="flex items-center gap-1.5 text-white italic text-[8px] font-black"><div className="bg-white/20 p-0.5 rounded"><GoldCoinIcon className="h-2.5 w-2.5" /></div>{t.profile.coins}</div><span className="text-base font-black text-white">{(profile.wallet?.coins || 0).toLocaleString()}</span></div>
             </div>
             <div onClick={() => router.push('/wallet')} className="h-24 rounded-[1.25rem] bg-gradient-to-br from-[#00e5ff] via-[#0284c7] to-[#01579b] p-3 relative overflow-hidden shadow-md active:scale-95 transition-all group cursor-pointer border-2 border-white/20">
                <div className="absolute inset-0 bg-white/30 -skew-x-[30deg] -translate-x-[200%] animate-shine" />
                <div className="relative z-30 flex flex-col h-full justify-between"><div className="flex items-center gap-1.5 text-white italic text-[8px] font-black"><div className="bg-white/20 p-0.5 rounded"><Gem className="h-2.5 w-2.5 fill-current" /></div>{t.profile.diamonds}</div><span className="text-base font-black text-white">{(profile.wallet?.diamonds || 0).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span></div>
             </div>
          </div>
          <div className="px-6 flex justify-between items-center mb-4">
             <IconButton icon={Trophy} label={t.profile.level} colorClass="bg-orange-400" onClick={() => router.push('/level')} />
             <IconButton icon={ShoppingBag} label={t.profile.store} colorClass="bg-pink-400" onClick={() => router.push('/store')} />
             <IconButton icon={ClipboardList} label={t.profile.task} colorClass="bg-green-400" onClick={() => router.push('/tasks')} />
          </div>
          <div className="px-3 space-y-3 pb-20">
             <Card className="rounded-[1.25rem] border-none shadow-sm overflow-hidden bg-white px-2">
                <ProfileMenuItem icon={UserPlus} label={t.profile.invite} iconColor="bg-blue-50 text-blue-500" onClick={() => { const text = encodeURIComponent(`Find your vibe, connect with your tribe! Join me on Ummy: ${window.location.origin}`); window.open(`https://wa.me/?text=${text}`, '_blank'); }} />
                <ProfileMenuItem icon={ShoppingBag} label={t.profile.bag} extra={t.profile.inventory} iconColor="bg-purple-50 text-purple-500" onClick={() => router.push('/store')} />
                <ProfileMenuItem icon={Heart} label={t.profile.cp} iconColor="bg-pink-50 text-pink-500" onClick={() => router.push('/cp-house')} />
                {hasAdminAccess && <ProfileMenuItem icon={ShieldAlert} label="Admin Command" iconColor="bg-indigo-50 text-indigo-600" onClick={() => router.push('/admin')} />}
                {isCertifiedSeller && <SellerTransferDialog />}
             </Card>
             <Card className="rounded-[1.25rem] border-none shadow-sm overflow-hidden bg-white px-2">
                <ProfileMenuItem icon={CircleHelp} label={t.profile.help} iconColor="bg-orange-50 text-orange-500" onClick={() => router.push('/help-center')} />
                <ProfileMenuItem icon={Info} label={t.profile.about} iconColor="bg-slate-50 text-slate-500" onClick={() => router.push('/about')} />
             </Card>
             <Card className="rounded-[1.25rem] border-none shadow-sm overflow-hidden bg-white px-2">
                <ProfileMenuItem icon={SettingsIcon} label={t.profile.settings} iconColor="bg-slate-100 text-slate-600" onClick={() => router.push('/settings')} />
             </Card>
          </div>
        </div>
        <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
      </AppLayout>
    );
  }

  return (
    <AppLayout hideSidebarOnMobile>
       <PublicProfileView profile={profile} onBack={() => router.back()} handleFollow={handleFollow} followData={null} isProcessingFollow={false} onOpenSocial={(tab) => { setSocialTab(tab); setSocialOpen(true); }} contributors={contributors} isContributorsLoading={isContributorsLoading} stats={stats} t={t} />
       <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
    </AppLayout>
  );
}
