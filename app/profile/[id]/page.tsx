'use client';

import { useEffect, use } from 'react';
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
  Gamepad2,
  Heart,
  ShoppingBag,
  Activity,
  User
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';

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
  
  const { user: currentUser, isUserLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);

  useEffect(() => { 
    if (!isUserLoading && !currentUser) router.replace('/login'); 
  }, [currentUser, isUserLoading, router]);

  const isOwnProfile = currentUser?.uid === profileId;

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

  return (
    <AppLayout>
      <div className="min-h-full bg-[#f8f9fa] text-gray-900 font-headline relative flex flex-col pb-32 overflow-x-hidden animate-in fade-in duration-700">
        
        {/* Header Dimension - Modern White Roster */}
        <div className="bg-white px-6 pt-12 pb-8 flex flex-col items-center text-center space-y-4 border-b border-gray-50">
          <div className="relative">
            <AvatarFrame frameId={profile.inventory?.activeFrame || 'f5'} size="xl">
              <Avatar className="h-28 w-28 border-4 border-gray-50 shadow-inner">
                <AvatarImage src={profile.avatarUrl || undefined} />
                <AvatarFallback className="text-3xl font-black bg-slate-100">{(profile.username || 'U').charAt(0)}</AvatarFallback>
              </Avatar>
            </AvatarFrame>
            {isOwnProfile && (
              <button className="absolute bottom-1 right-1 bg-white p-1.5 rounded-full shadow-lg border border-gray-100 active:scale-90 transition-transform">
                <SettingsIcon className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-2xl font-black tracking-tighter uppercase">{profile.username}</h1>
              <div className="bg-blue-500 rounded-full h-4 w-4 flex items-center justify-center text-[10px] font-black text-white">♂</div>
              <span className="text-lg">🇮🇳</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 cursor-pointer" onClick={() => { navigator.clipboard.writeText(profile.specialId); toast({ title: 'ID Copied' }); }}>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">ID: {profile.specialId}</span>
              <Copy className="h-3 w-3 text-gray-300" />
            </div>
          </div>
        </div>

        {/* Stats Bar Dimension */}
        <div className="bg-white flex divide-x divide-gray-50 border-b border-gray-50 mb-4">
          <StatItem label="Friend" value={0} />
          <StatItem label="Following" value={0} />
          <StatItem label="Fans" value={profile.stats?.fans || 0} />
          <StatItem label="Visitors" value={0} hasNotification />
        </div>

        {/* Dual Visual Banners */}
        <div className="px-4 grid grid-cols-2 gap-3 mb-6">
          <div className="h-24 rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4 relative overflow-hidden shadow-lg group active:scale-95 transition-all cursor-pointer">
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

        {/* Sequential Menu List */}
        <div className="bg-white rounded-[2rem] mx-4 shadow-sm border border-gray-100 overflow-hidden mb-8">
          <MenuItem label="Invite Friends" icon={UserPlus} colorClass="bg-green-100 text-green-600" />
          <MenuItem label="Aristocracy" icon={Star} colorClass="bg-yellow-100 text-yellow-600" />
          <MenuItem label="Treasure Vault" icon={Gem} colorClass="bg-purple-100 text-purple-600" />
          <MenuItem label="CP Space" icon={Heart} colorClass="bg-pink-100 text-pink-600" />
          <MenuItem label="Store" icon={ShoppingBag} colorClass="bg-orange-100 text-orange-600" href="/store" />
          <MenuItem label="Bag" icon={Briefcase} colorClass="bg-amber-100 text-amber-600" />
        </div>

        <div className="bg-white rounded-[2rem] mx-4 shadow-sm border border-gray-100 overflow-hidden mb-12">
           <MenuItem label="Setting" icon={SettingsIcon} href="/settings" />
        </div>
      </div>
    </AppLayout>
  );
}
