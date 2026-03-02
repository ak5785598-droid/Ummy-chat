'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useRouter } from 'next/navigation';
import { 
  Loader, 
  ChevronRight, 
  Copy,
  ChevronLeft,
  Gift,
  Crown,
  Trophy,
  Activity,
  Users,
  Settings as SettingsIcon,
  Shield as ShieldIcon,
  MessageCircle,
  UserPlus,
  Search
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useMemoFirebase, updateDocumentNonBlocking, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { doc, query, collection, where, limit, increment, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AvatarFrame } from '@/components/avatar-frame';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { SellerTransferDialog } from '@/components/seller-transfer-dialog';
import { SellerTag } from '@/components/seller-tag';
import { CustomerServiceTag } from '@/components/customer-service-tag';
import { DirectMessageDialog } from '@/components/direct-message-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import type { Gift as GiftType } from '@/lib/types';

const AVAILABLE_GIFTS: GiftType[] = [
  { id: 'rose', name: 'Rose', emoji: '🌹', price: 10, animationType: 'pulse' },
  { id: 'heart', name: 'Heart', emoji: '💖', price: 50, animationType: 'zoom' },
  { id: 'ring', name: 'Ring', emoji: '💍', price: 500, animationType: 'bounce' },
  { id: 'car', name: 'Luxury Car', emoji: '🏎️', price: 2000, animationType: 'bounce' },
  { id: 'jet', name: 'Private Jet', emoji: '🛩️', price: 5000, animationType: 'bounce' },
  { id: 'dragon', name: 'Dragon', emoji: '🐉', price: 10000, animationType: 'spin' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', price: 25000, animationType: 'zoom' },
  { id: 'castle', name: 'Castle', emoji: '🏰', price: 50000, animationType: 'bounce' },
  { id: 'galaxy', name: 'Galaxy', emoji: '🌌', price: 100000, animationType: 'zoom' },
  { id: 'supernova', name: 'Supernova', emoji: '💥', price: 250000, animationType: 'zoom' },
  { id: 'rolex', name: 'Rolex', emoji: '⌚', price: 500000, animationType: 'zoom' },
  { id: 'celebration', name: 'Celebration', emoji: '🥳', price: 1000000, animationType: 'zoom' },
];

function calculateRichLevel(spent: number = 0) {
  if (spent < 50000) return 1;
  if (spent < 100000) return 2;
  if (spent < 1000000) return 3;
  if (spent < 5000000) return 4;
  if (spent < 10000000) return Math.floor(5 + ((spent - 5000000) / 5000000) * 5);
  if (spent < 100000000) return Math.floor(10 + ((spent - 10000000) / 90000000) * 10);
  if (spent < 1000000000) return Math.floor(20 + ((spent - 100000000) / 900000000) * 10);
  if (spent < 5000000000) return Math.floor(30 + ((spent - 1000000000) / 4000000000) * 10);
  if (spent < 90000000000) return Math.floor(40 + ((spent - 5000000000) / 85000000000) * 10);
  return 50;
}

const SupporterIcon = ({ color, rank }: { color: string, rank: number }) => (
  <div className="relative group cursor-pointer active:scale-95 transition-transform shrink-0">
    <div className={cn(
      "h-16 w-16 rounded-full flex items-center justify-center border-4 shadow-xl relative overflow-hidden",
      color === 'gold' ? "border-[#fbbf24] bg-gradient-to-br from-[#4a3a1a] to-black" :
      color === 'silver' ? "border-[#94a3b8] bg-gradient-to-br from-[#1e293b] to-black" :
      "border-[#b45309] bg-gradient-to-br from-[#451a03] to-black"
    )}>
       <div className="absolute top-0 left-0 w-full h-full bg-white/5 pointer-events-none" />
       <svg viewBox="0 0 24 24" className="h-8 w-8 text-white/40 fill-current" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 13V5c0-1.1-.9-2-2-2H7c-1.1 0-2 .9-2 2v8H3v2h2v5h2v-5h10v5h2v-5h2v-2h-2zm-2-8v8H7V5h10z"/>
       </svg>
    </div>
    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
       <span className="text-2xl drop-shadow-md">👑</span>
    </div>
  </div>
);

const ToolTile = ({ label, icon: Icon, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 group flex-1">
    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shadow-md group-active:scale-95 transition-all bg-gradient-to-br from-yellow-300 to-yellow-500")}>
      <Icon className="h-6 w-6 text-white" />
    </div>
    <span className="text-[9px] font-black uppercase text-gray-500 tracking-tighter">{label}</span>
  </button>
);

const MenuItem = ({ label, extra, icon: Icon, onClick }: any) => (
  <div onClick={onClick} className="flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-4">
      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
        {Icon && <Icon className="h-4 w-4 text-blue-400" />}
      </div>
      <span className="font-black text-xs uppercase text-gray-800">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {extra && <span className="text-[10px] font-bold text-gray-400 uppercase">{extra}</span>}
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

export default function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: profileId } = use(params);
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const { user: currentUser, isUserLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);
  const { userProfile: senderProfile } = useUserProfile(currentUser?.uid);

  const [isGiftPickerOpen, setIsGiftPickerOpen] = useState(false);

  useEffect(() => { 
    if (!isUserLoading && !currentUser) router.replace('/login'); 
  }, [currentUser, isUserLoading, router]);

  const userRoomQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'chatRooms'), where('ownerId', '==', profileId), limit(1));
  }, [firestore, profileId]);
  
  const { data: rooms } = useCollection(userRoomQuery);
  const activeRoom = rooms?.[0];

  const isOwnProfile = currentUser?.uid === profileId;

  // Handshake verification - Ensure we wait for data if we have an ID
  const isWait = isUserLoading || isProfileLoading || (!!profileId && !profile && !isProfileLoading);

  const handleSendGift = async (gift: GiftType) => {
    if (!currentUser || !firestore || !senderProfile || !profile) return;
    
    if ((senderProfile.wallet?.coins || 0) < gift.price) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Head to the vault to recharge.' });
      return;
    }

    try {
      const senderRef = doc(firestore, 'users', currentUser.uid);
      const senderProfileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);
      const recipientRef = doc(firestore, 'users', profile.id);
      const recipientProfileRef = doc(firestore, 'users', profile.id, 'profile', profile.id);

      const diamondReturn = Math.floor(gift.price * 0.4);
      const newTotalSpent = (senderProfile.wallet?.totalSpent || 0) + gift.price;

      // Update Sender
      const senderUpdates = {
        'wallet.coins': increment(-gift.price),
        'wallet.totalSpent': increment(gift.price),
        'wallet.dailySpent': increment(gift.price),
        'level.rich': calculateRichLevel(newTotalSpent),
        updatedAt: serverTimestamp()
      };
      updateDocumentNonBlocking(senderRef, senderUpdates);
      updateDocumentNonBlocking(senderProfileRef, senderUpdates);

      // Update Recipient
      const recipientUpdates = {
        'stats.fans': increment(gift.price),
        'stats.dailyFans': increment(gift.price),
        'wallet.diamonds': increment(diamondReturn),
        updatedAt: serverTimestamp()
      };
      updateDocumentNonBlocking(recipientRef, recipientUpdates);
      updateDocumentNonBlocking(recipientProfileRef, recipientUpdates);

      // Log the gift in recipient's notifications
      addDocumentNonBlocking(collection(firestore, 'users', profile.id, 'notifications'), {
        title: 'Gift Received',
        content: `${senderProfile.username} sent you a ${gift.name} ${gift.emoji}!`,
        type: 'system',
        timestamp: serverTimestamp(),
        isRead: false
      });

      toast({ title: 'Gift Sent!', description: `Successfully synchronized ${gift.name} vibe.` });
      setIsGiftPickerOpen(false);
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Gift Failed', description: e.message });
    }
  };

  if (isWait) {
    return (
      <AppLayout>
        <div className="flex h-full w-full flex-col items-center justify-center bg-white space-y-4">
          <Loader className="animate-spin h-8 w-8 text-primary" />
          <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-gray-400">
            Syncing Tribal Identity...
          </p>
        </div>
      </AppLayout>
    );
  }
  
  if (!profile) { 
    notFound(); 
    return null; 
  }

  // OWN PROFILE VIEW (Misty Forest Dashboard)
  if (isOwnProfile) {
    return (
      <AppLayout>
        <div className="min-h-full bg-[#f8f9fa] text-gray-900 font-headline relative flex flex-col pb-24 overflow-x-hidden">
          <header className="relative h-[18vh] overflow-hidden shrink-0">
            <Image 
              src="https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2000" 
              alt="Misty Forest" 
              fill 
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-[#f8f9fa]" />
            <div className="absolute top-8 left-6 right-6 flex items-center justify-between z-50">
              <button onClick={() => router.back()} className="p-2 bg-white/40 backdrop-blur-md rounded-full text-gray-600 shadow-lg"><ChevronLeft className="h-5 w-5" /></button>
              <div className="flex gap-2">
                <EditProfileDialog profile={profile} />
              </div>
            </div>
          </header>

          <div className="relative z-30 px-6 -mt-10 space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <AvatarFrame frameId={profile?.inventory?.activeFrame || 'f5'} size="lg" className="w-24 h-24">
                  <div className="relative">
                    <Avatar className="h-full w-full border-2 border-white shadow-xl">
                      <AvatarImage src={profile?.avatarUrl || undefined} />
                      <AvatarFallback className="text-3xl font-black bg-slate-100">{(profile?.username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={cn(
                      "absolute bottom-1 right-1 h-5 w-5 rounded-full border-2 border-white shadow-lg",
                      profile?.isOnline ? "bg-green-500" : "bg-black"
                    )} />
                  </div>
                </AvatarFrame>
                <div className="flex flex-col -space-y-3.5 h-[48px] justify-start mt-1">
                  <SellerTag size="sm" />
                </div>
              </div>
              <div className="pt-2 space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-black tracking-tighter uppercase">{profile?.username}</h1>
                  <span className="text-xs">♂️ 🇮🇳</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase">ID: {profile?.specialId}</span>
                  <button onClick={() => { navigator.clipboard.writeText(profile?.specialId || ''); toast({ title: 'ID Copied' }); }} className="text-gray-300 hover:text-primary transition-colors"><Copy className="h-3 w-3" /></button>
                </div>
                <div className="flex items-center gap-1 mt-1 flex-wrap">
                  <Badge className="bg-orange-500 text-white text-[8px] h-4 font-black px-2 border-none">Sr.</Badge>
                  <Badge className="bg-blue-500 text-white text-[8px] h-4 font-black px-2 border-none">SVIP</Badge>
                  <Badge className="bg-cyan-500 text-white text-[8px] h-4 font-black px-2 border-none">CP</Badge>
                  <CustomerServiceTag size="sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-around items-center py-2 bg-transparent">
              <div className="flex flex-col items-center"><span className="text-sm font-black">0</span><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Friends</span></div>
              <div className="flex flex-col items-center"><span className="text-sm font-black">0</span><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Following</span></div>
              <div className="flex flex-col items-center"><span className="text-sm font-black">{profile?.stats?.followers || 0}</span><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Followers</span></div>
              <div className="flex flex-col items-center"><span className="text-sm font-black">0</span><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Visitors</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div 
                onClick={() => router.push('/wallet')}
                className="rounded-2xl p-3 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md flex items-center justify-between group active:scale-95 transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-white/20 rounded-full flex items-center justify-center"><GoldCoinIcon className="h-4 w-4" /></div>
                  <span className="text-[10px] font-black truncate w-16">{(profile?.wallet?.coins || 0).toLocaleString()}</span>
                </div>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </div>
              <div 
                onClick={() => router.push('/wallet')}
                className="rounded-2xl p-3 bg-gradient-to-r from-[#9d174d] to-[#701a75] text-white shadow-md flex items-center justify-between group active:scale-95 transition-transform cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 bg-white/20 rounded-full flex items-center justify-center text-xs">💎</div>
                  <span className="text-[10px] font-black truncate w-16">{(profile?.wallet?.diamonds || 0).toLocaleString()}</span>
                </div>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </div>
            </div>

            <div className="bg-white rounded-[1.5rem] p-4 shadow-sm border border-gray-100 flex justify-between gap-2">
              <ToolTile label="Level" icon={Trophy} />
              <ToolTile label="Store" icon={Crown} onClick={() => router.push('/store')} />
              <ToolTile label="Badge" icon={ShieldIcon} />
              <ToolTile label="Task" icon={Activity} onClick={() => router.push('/tasks')} />
            </div>

            <div className="space-y-3">
              <Card className="rounded-[1.5rem] border-none shadow-sm overflow-hidden bg-white">
                <MenuItem label="COMBINED CP 💕" icon={Activity} />
                <MenuItem label="Invite Friends" icon={Users} />
              </Card>

              <Card className="rounded-[1.5rem] border-none shadow-sm overflow-hidden bg-white">
                <MenuItem label="Network Test" icon={Activity} />
                <SellerTransferDialog />
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // OTHERS VIEW (Atmospheric Emerald)
  return (
    <AppLayout hideSidebarOnMobile>
      <div className="min-h-[100dvh] bg-[#051a05] text-white font-headline relative flex flex-col overflow-x-hidden">
        <div className="absolute top-0 left-0 w-full h-[65vh] z-0 overflow-hidden">
           <div className="absolute inset-0 bg-black/40 z-10" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#051a05]/80 to-[#051a05] z-20" />
           <div className="relative h-full w-full opacity-60 scale-110 blur-xl">
              <Image 
                src={profile.avatarUrl || 'https://picsum.photos/seed/bg/800/1200'} 
                alt="Banner Blur" 
                fill 
                className="object-cover"
              />
           </div>
           <div className="absolute top-0 left-0 w-full h-full opacity-40">
              <Image 
                src={profile.avatarUrl || 'https://picsum.photos/seed/ammy/800/1200'} 
                alt="Identity Banner" 
                fill 
                className="object-cover"
              />
           </div>
        </div>

        <header className="relative z-50 flex items-center justify-between p-6 pt-10">
           <button onClick={() => router.back()} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform shadow-lg"><ChevronLeft className="h-6 w-6" /></button>
           <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white shadow-lg"><ShieldIcon className="h-6 w-6" /></button>
        </header>

        <div className="relative z-30 flex flex-col items-center px-6 mt-[15vh] space-y-6 flex-1 pb-40">
           <div className="relative">
              <AvatarFrame frameId={profile.inventory?.activeFrame || 'f5'} size="xl">
                <div className="relative">
                  <div className="h-36 w-36 rounded-full border-4 border-white/20 p-1 shadow-2xl backdrop-blur-md bg-white/5">
                    <Avatar className="h-full w-full border-2 border-white shadow-inner">
                        <AvatarImage src={profile.avatarUrl || undefined} />
                        <AvatarFallback className="text-4xl font-black bg-slate-100 text-black">{(profile.username || 'A').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>
                  <div className={cn(
                    "absolute bottom-2 right-2 h-6 w-6 rounded-full border-4 border-[#051a05] shadow-lg",
                    profile.isOnline ? "bg-green-500" : "bg-black"
                  )} />
                </div>
              </AvatarFrame>
           </div>

           <div className="text-center space-y-2">
              <h1 className="text-4xl font-black tracking-tighter drop-shadow-lg">{profile.username}</h1>
              <div className="flex items-center justify-center gap-2">
                 <span className="text-xl">🇮🇳</span>
                 <div className="flex items-center gap-1.5 text-white/80 bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 shadow-xl">
                    <div className="h-4 w-4 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                       <span className="text-[8px] font-bold">♂</span>
                    </div>
                    <span className="text-[11px] font-black uppercase tracking-tight">ID:{profile.specialId}</span>
                    <button onClick={() => { navigator.clipboard.writeText(profile.specialId); toast({ title: 'ID Copied' }); }}><Copy className="h-3 w-3 text-white/40 hover:text-white" /></button>
                 </div>
              </div>
              
              <div className="flex items-center justify-center gap-3 mt-3">
                 <div className="bg-gradient-to-r from-blue-400 to-indigo-600 px-4 py-1 rounded-full flex items-center gap-1.5 shadow-xl border border-white/20">
                    <div className="h-3 w-3 bg-white/20 rounded-full flex items-center justify-center"><ShieldIcon className="h-2 w-2 text-white" /></div>
                    <span className="text-[10px] font-black uppercase italic">{profile.level?.rich || 1}</span>
                 </div>
                 <div className="bg-gradient-to-r from-[#10b981] to-[#059669] px-4 py-1 rounded-full flex items-center gap-1.5 shadow-xl border border-white/20">
                    <div className="h-3 w-3 bg-white/20 rounded-full flex items-center justify-center">💎</div>
                    <span className="text-[10px] font-black uppercase italic">{profile.level?.charm || 1}</span>
                 </div>
              </div>
           </div>

           {activeRoom && (
             <Link href={`/rooms/${activeRoom.id}`} className="w-full max-w-xs">
                <div className="bg-[#0a2e1a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-3 flex items-center justify-between group active:scale-[0.98] transition-transform shadow-2xl">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl overflow-hidden relative border border-white/10">
                         <Image src={activeRoom.coverUrl || 'https://picsum.photos/seed/room/200/200'} alt="Room" fill className="object-cover" />
                      </div>
                      <div>
                         <p className="text-xs font-black uppercase tracking-tight text-white">{activeRoom.title}</p>
                         <p className="text-[8px] font-black text-[#10b981] uppercase tracking-widest italic">My Room</p>
                      </div>
                   </div>
                   <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white transition-colors" />
                </div>
             </Link>
           )}

           <div className="w-full bg-black/20 backdrop-blur-sm rounded-3xl border border-white/5 p-6 flex justify-around items-center shadow-inner">
              <div className="flex flex-col items-center gap-1">
                 <span className="text-xl font-black">0</span>
                 <span className="text-[9px] font-black uppercase text-[#10b981] tracking-widest opacity-60">Friends</span>
              </div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col items-center gap-1">
                 <span className="text-xl font-black">0</span>
                 <span className="text-[9px] font-black uppercase text-[#10b981] tracking-widest opacity-60">Following</span>
              </div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col items-center gap-1">
                 <span className="text-xl font-black">{profile.stats?.followers || 0}</span>
                 <span className="text-[9px] font-black uppercase text-[#10b981] tracking-widest opacity-60">Followers</span>
              </div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col items-center gap-1">
                 <span className="text-xl font-black">0</span>
                 <span className="text-[9px] font-black uppercase text-[#10b981] tracking-widest opacity-60">Visitors</span>
              </div>
           </div>

           <section className="w-full space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-base font-black uppercase text-yellow-500 tracking-tighter italic">Supporter</h3>
                 <button className="flex items-center gap-1 text-[10px] font-black uppercase text-white/40 tracking-widest hover:text-white transition-colors">View list <ChevronRight className="h-3 w-3" /></button>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-6 flex gap-6 overflow-x-auto no-scrollbar border border-white/5 shadow-xl">
                 <SupporterIcon color="gold" rank={1} />
                 <SupporterIcon color="silver" rank={2} />
                 <SupporterIcon color="bronze" rank={3} />
              </div>
           </section>

           <section className="w-full space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-base font-black uppercase text-yellow-500 tracking-tighter italic">Gifts Received</h3>
                 <button className="flex items-center gap-1 text-[10px] font-black uppercase text-white/40 tracking-widest hover:text-white transition-colors">View list <ChevronRight className="h-3 w-3" /></button>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-6 flex gap-4 overflow-x-auto no-scrollbar border border-white/5 shadow-xl">
                 {['🌹', '💖', '💍', '🏎️', '🛩️', '🐉', '🚀', '🏰'].map((emoji, i) => (
                   <div key={i} className="h-16 w-16 rounded-2xl bg-black/40 flex items-center justify-center text-3xl border border-white/10 shrink-0 shadow-lg group active:scale-95 transition-transform">
                      <span className="drop-shadow-md group-hover:scale-110 transition-transform">{emoji}</span>
                   </div>
                 ))}
              </div>
           </section>
        </div>

        <footer className="fixed bottom-0 left-0 right-0 p-6 pt-10 bg-gradient-to-t from-[#051a05] via-[#051a05]/95 to-transparent z-[60] flex items-center justify-around gap-4 border-t border-white/5">
           <div className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-all">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#4ade80] to-[#16a34a] flex items-center justify-center shadow-[0_0_20px_rgba(22,163,74,0.4)] border border-white/20">
                 <UserPlus className="h-7 w-7 text-white" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">Follow</span>
           </div>

           <DirectMessageDialog 
             recipient={{ uid: profile.id, username: profile.username, avatarUrl: profile.avatarUrl }} 
             trigger={
               <div className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-all">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#0ea5e9] to-[#0284c7] flex items-center justify-center shadow-[0_0_20px_rgba(2,132,199,0.4)] border border-white/20">
                     <MessageCircle className="h-7 w-7 text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">Chat</span>
               </div>
             }
           />

           <div 
             onClick={() => setIsGiftPickerOpen(true)}
             className="flex flex-col items-center gap-1.5 group cursor-pointer active:scale-95 transition-all"
           >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#d946ef] via-[#a855f7] to-[#7c3aed] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] border border-white/20">
                 <Gift className="h-7 w-7 text-white fill-current" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-tighter text-white/80">Gift</span>
           </div>
        </footer>

        <Dialog open={isGiftPickerOpen} onOpenChange={setIsGiftPickerOpen}>
          <DialogContent className="sm:max-w-md bg-white text-black p-0 rounded-t-[3rem] border-none overflow-hidden animate-in slide-in-from-bottom-10 duration-500 font-headline">
            <DialogHeader className="p-8 pb-0 text-center">
              <DialogTitle className="text-3xl font-black uppercase tracking-tighter">Send Vibe</DialogTitle>
              <DialogDescription className="sr-only">Select a gift to send to {profile.username}</DialogDescription>
            </DialogHeader>
            <div className="p-8 pt-6 space-y-6">
              <div className="flex items-center justify-between bg-secondary/30 p-4 rounded-2xl border-2 border-dashed border-primary/20">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                    <AvatarImage src={profile.avatarUrl} />
                    <AvatarFallback>{profile.username?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[8px] font-black uppercase text-muted-foreground tracking-widest">Recipient</p>
                    <p className="text-sm font-black uppercase text-primary tracking-tighter">{profile.username}</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 max-h-[40vh] overflow-y-auto p-2 no-scrollbar">
                {AVAILABLE_GIFTS.map(g => (
                  <button 
                    key={g.id} 
                    onClick={() => handleSendGift(g)} 
                    className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-secondary/50 hover:bg-primary/20 transition-all border-2 border-transparent hover:border-primary group active:scale-90"
                  >
                    <span className="text-4xl group-hover:scale-125 transition-transform duration-300">{g.emoji}</span>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase truncate w-20 tracking-tighter">{g.name}</p>
                      <div className="flex items-center justify-center gap-1 text-[10px] font-black text-primary">
                        <GoldCoinIcon className="h-3 w-3" />
                        {g.price}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="bg-secondary/30 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                <span className="text-xs font-black uppercase opacity-60 tracking-widest">Your Balance</span>
                <div className="flex items-center gap-2 font-black text-primary text-xl">
                  <GoldCoinIcon className="h-5 w-5" />
                  {senderProfile?.wallet?.coins || 0}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </AppLayout>
  );
}