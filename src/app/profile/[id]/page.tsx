'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useParams, useRouter } from 'next/navigation';
import { 
  Loader, 
  ChevronRight, 
  Copy,
  ChevronLeft,
  Gift,
  Plus,
  Settings as SettingsIcon,
  Crown,
  Trophy,
  Activity,
  Users,
  MessageCircle,
  Share2,
  Pen
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { doc, query, collection, where, limit } from 'firebase/firestore';
import { useCollection } from '@/firebase';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { AvatarFrame } from '@/components/avatar-frame';
import { EditProfileDialog } from '@/components/edit-profile-dialog';

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

const ToolTile = ({ label, icon: Icon, color, onClick }: any) => (
  <button onClick={onClick} className="flex flex-col items-center gap-2 group flex-1">
    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg group-active:scale-95 transition-all bg-gradient-to-br from-yellow-300 to-yellow-500")}>
      <Icon className="h-7 w-7 text-white" />
    </div>
    <span className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">{label}</span>
  </button>
);

const MenuItem = ({ label, extra, icon: Icon, onClick }: any) => (
  <div onClick={onClick} className="flex items-center justify-between p-5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer group border-b border-gray-50 last:border-0">
    <div className="flex items-center gap-4">
      <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
        {Icon && <Icon className="h-4 w-4 text-blue-400" />}
      </div>
      <span className="font-black text-xs uppercase italic text-gray-800">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {extra && <span className="text-[10px] font-bold text-gray-400 uppercase italic">{extra}</span>}
      <ChevronRight className="h-4 w-4 text-gray-300 group-hover:translate-x-1 transition-transform" />
    </div>
  </div>
);

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId);

  useEffect(() => { 
    if (!isAuthLoading && !currentUser) router.replace('/login'); 
  }, [currentUser, isAuthLoading, router]);

  const userRoomQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'chatRooms'), where('ownerId', '==', profileId), limit(1));
  }, [firestore, profileId]);
  
  const { data: rooms } = useCollection(userRoomQuery);
  const activeRoom = rooms?.[0];

  if (isAuthLoading || isProfileLoading) return <AppLayout><div className="flex h-full w-full flex-col items-center justify-center bg-white space-y-4"><Loader className="animate-spin h-8 w-8 text-primary" /><p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-gray-400">Syncing Tribal Identity...</p></div></AppLayout>;
  if (!profile) { notFound(); return null; }

  const isOwnProfile = currentUser?.uid === profileId;

  // OWN PROFILE VIEW (Misty Forest Dashboard - Exact Match to Screenshot)
  if (isOwnProfile) {
    return (
      <AppLayout>
        <div className="min-h-full bg-[#f8f9fa] text-gray-900 font-headline relative flex flex-col pb-32 overflow-x-hidden">
          {/* Header with Forest Background */}
          <header className="relative h-[22vh] overflow-hidden shrink-0">
            <Image 
              src="https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=2000" 
              alt="Misty Forest" 
              fill 
              className="object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-[#f8f9fa]" />
            <div className="absolute top-10 left-6 right-6 flex items-center justify-between z-50">
              <button onClick={() => router.back()} className="p-2 bg-white/40 backdrop-blur-md rounded-full text-gray-600 shadow-xl"><ChevronLeft className="h-5 w-5" /></button>
              <div className="flex gap-2">
                <EditProfileDialog profile={profile} />
              </div>
            </div>
          </header>

          <div className="relative z-30 px-6 -mt-12 space-y-6">
            {/* Identity Info */}
            <div className="flex items-center gap-4">
              <AvatarFrame frameId={profile.inventory?.activeFrame || 'f5'} size="xl" className="w-28 h-28">
                <Avatar className="h-full w-full border-2 border-white shadow-2xl">
                  <AvatarImage src={profile.avatarUrl} />
                  <AvatarFallback className="text-4xl font-black bg-slate-100">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </AvatarFrame>
              <div className="pt-4 space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black italic tracking-tighter uppercase">{profile.username}</h1>
                  <span className="text-sm">🇨🇦 ♂️ 🇮🇳</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-gray-400 uppercase italic">ID: {profile.specialId}</span>
                  <button onClick={() => { navigator.clipboard.writeText(profile.specialId); toast({ title: 'ID Copied' }); }} className="text-gray-300 hover:text-primary transition-colors"><Copy className="h-3 w-3" /></button>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <Badge className="bg-orange-500 text-white text-[8px] h-4 font-black italic px-2 border-none">32</Badge>
                  <Badge className="bg-cyan-500 text-white text-[8px] h-4 font-black italic px-2 border-none">2</Badge>
                </div>
              </div>
            </div>

            {/* Social Stats */}
            <div className="flex justify-around items-center py-4 bg-transparent">
              <div className="flex flex-col items-center"><span className="text-base font-black italic">2</span><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Friends</span></div>
              <div className="flex flex-col items-center"><span className="text-base font-black italic">3</span><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Following</span></div>
              <div className="flex flex-col items-center"><span className="text-base font-black italic">{profile.stats?.followers || 56}</span><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Followers</span></div>
              <div className="flex flex-col items-center"><span className="text-base font-black italic">0</span><span className="text-[8px] font-black uppercase text-gray-400 tracking-widest">Visitors</span></div>
            </div>

            {/* Wallet Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl p-4 bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg flex items-center justify-between group active:scale-95 transition-transform cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center"><GoldCoinIcon className="h-5 w-5" /></div>
                  <span className="text-xs font-black italic truncate w-20">{(profile.wallet?.coins || 5855748436).toLocaleString()}</span>
                </div>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </div>
              <div className="rounded-3xl p-4 bg-gradient-to-r from-[#9d174d] to-[#701a75] text-white shadow-lg flex items-center justify-between group active:scale-95 transition-transform cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center text-lg">💎</div>
                  <span className="text-xs font-black italic truncate w-20">{(profile.wallet?.diamonds || 11883900).toLocaleString()}</span>
                </div>
                <ChevronRight className="h-3 w-3 opacity-60" />
              </div>
            </div>

            {/* Tool Tiles */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex justify-between gap-4">
              <ToolTile label="Level" icon={Trophy} />
              <ToolTile label="Store" icon={Crown} />
              <ToolTile label="Badge" icon={ShieldIcon} />
              <ToolTile label="Task" icon={Activity} />
            </div>

            {/* Menu Sections */}
            <div className="space-y-4">
              <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
                <MenuItem label="COMBINED CP 💕" icon={Activity} />
                <MenuItem label="Invite Friends" icon={Users} />
              </Card>

              <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
                <MenuItem label="Network Test" icon={Activity} />
              </Card>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // OTHERS VIEW (Atmospheric Emerald - Remained same as requested previously)
  return (
    <AppLayout>
      <div className="min-h-full bg-[#051a05] text-white font-headline relative flex flex-col overflow-x-hidden pb-32">
        <div className="absolute top-0 left-0 w-full h-[60vh] z-0 overflow-hidden">
           <div className="absolute inset-0 bg-black/40 z-10" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#051a05]/80 to-[#051a05] z-20" />
           <Image 
             src={profile.avatarUrl || 'https://picsum.photos/seed/bg/800/1200'} 
             alt="Blurred Background" 
             fill 
             className="object-cover blur-3xl scale-125 opacity-60"
           />
           <div className="relative h-full w-full">
              <Image 
                src={profile.avatarUrl || 'https://picsum.photos/seed/ammy/800/1200'} 
                alt="Identity Banner" 
                fill 
                className="object-cover"
              />
           </div>
        </div>

        <header className="relative z-50 flex items-center justify-between p-6 pt-10">
           <button onClick={() => router.back()} className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white active:scale-90 transition-transform"><ChevronLeft className="h-6 w-6" /></button>
           <button className="p-2 bg-black/20 backdrop-blur-md rounded-full text-white"><SettingsIcon className="h-6 w-6" /></button>
        </header>

        <div className="relative z-30 flex flex-col items-center px-6 mt-[20vh] space-y-6">
           <div className="relative">
              <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                <div className="h-32 w-32 rounded-full border-4 border-white/20 p-1 shadow-2xl backdrop-blur-md bg-white/5">
                   <Avatar className="h-full w-full border-2 border-white">
                      <AvatarImage src={profile.avatarUrl} />
                      <AvatarFallback className="text-4xl font-black bg-slate-100 text-black">{(profile.username || 'A').charAt(0)}</AvatarFallback>
                   </Avatar>
                </div>
              </AvatarFrame>
           </div>

           <div className="text-center space-y-2">
              <h1 className="text-4xl font-black italic tracking-tighter drop-shadow-lg">{profile.username}</h1>
              <div className="flex items-center justify-center gap-2">
                 <span className="text-xl">🇮🇳</span>
                 <div className="flex items-center gap-1.5 text-white/80 bg-black/20 backdrop-blur-md px-3 py-0.5 rounded-full border border-white/10">
                    <span className="text-xs font-black uppercase tracking-tight italic">ID:{profile.specialId}</span>
                    <button onClick={() => { navigator.clipboard.writeText(profile.specialId); toast({ title: 'ID Copied' }); }}><Copy className="h-3 w-3 text-white/40" /></button>
                 </div>
              </div>
              <div className="flex items-center justify-center gap-3 mt-2">
                 <div className="bg-gradient-to-r from-blue-400 to-indigo-600 px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xl border border-white/20"><span className="text-[10px] font-black italic">🛡️ {profile.level?.rich || 1}</span></div>
                 <div className="bg-gradient-to-r from-[#10b981] to-[#059669] px-3 py-0.5 rounded-full flex items-center gap-1 shadow-xl border border-white/20"><span className="text-[10px] font-black italic">💎 {profile.level?.charm || 1}</span></div>
              </div>
           </div>

           {activeRoom && (
             <Link href={`/rooms/${activeRoom.id}`} className="w-full max-w-xs">
                <div className="bg-[#0a2e1a]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-3 flex items-center justify-between group active:scale-95 transition-transform shadow-lg">
                   <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl overflow-hidden relative border border-white/10"><Image src={activeRoom.coverUrl || 'https://picsum.photos/seed/room/200/200'} alt="Room" fill className="object-cover" /></div>
                      <div><p className="text-xs font-black uppercase italic tracking-tight">{activeRoom.name}</p><p className="text-[8px] font-black text-white/40 uppercase tracking-widest">My Frequency</p></div>
                   </div>
                   <ChevronRight className="h-4 w-4 text-white/20 group-hover:text-white transition-colors" />
                </div>
             </Link>
           )}

           <div className="w-full bg-black/30 backdrop-blur-md rounded-3xl border border-white/5 p-6 flex justify-around items-center shadow-inner">
              <div className="flex flex-col items-center gap-1"><span className="text-xl font-black italic">0</span><span className="text-[9px] font-black uppercase text-[#10b981] tracking-widest">Friends</span></div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col items-center gap-1"><span className="text-xl font-black italic">0</span><span className="text-[9px] font-black uppercase text-[#10b981] tracking-widest">Following</span></div>
              <div className="h-8 w-px bg-white/5" />
              <div className="flex flex-col items-center gap-1"><span className="text-xl font-black italic">{profile.stats?.followers || 0}</span><span className="text-[9px] font-black uppercase text-[#10b981] tracking-widest">Followers</span></div>
           </div>

           <section className="w-full space-y-4">
              <div className="flex items-center justify-between px-2">
                 <h3 className="text-sm font-black uppercase italic text-yellow-500 tracking-widest">Supporter</h3>
                 <button className="flex items-center gap-1 text-[9px] font-black uppercase text-white/40 tracking-widest">View list <ChevronRight className="h-3 w-3" /></button>
              </div>
              <div className="bg-black/20 backdrop-blur-sm rounded-3xl p-6 flex gap-6 overflow-x-auto no-scrollbar border border-white/5">
                 <SupporterIcon color="gold" rank={1} />
                 <SupporterIcon color="silver" rank={2} />
                 <SupporterIcon color="bronze" rank={3} />
              </div>
           </section>

           <div className="w-full flex justify-center pt-10">
              <div className="flex flex-col items-center gap-1 group cursor-pointer active:scale-90 transition-transform">
                <div className="h-16 w-16 rounded-3xl bg-gradient-to-br from-[#d946ef] via-[#a855f7] to-[#7c3aed] flex items-center justify-center shadow-[0_0_20px_rgba(168,85,247,0.4)] border-2 border-white/20">
                   <div className="p-2 bg-white/20 rounded-xl"><Gift className="h-8 w-8 text-white fill-current" /></div>
                </div>
                <span className="text-[10px] font-black uppercase italic tracking-tighter">Gift</span>
              </div>
           </div>
        </div>
      </div>
    </AppLayout>
  );
}

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
    </svg>
  );
}