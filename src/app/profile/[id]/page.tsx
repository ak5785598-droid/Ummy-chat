'use client';

import { useRef, useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { notFound, useParams, useRouter } from 'next/navigation';
import { 
  Loader, 
  Camera, 
  ChevronRight, 
  Copy,
  Pen,
  ChevronLeft,
  ArrowRightLeft,
  Settings as SettingsIcon,
  ShieldCheck,
  UserPlus,
  Share2,
  Trophy,
  Activity,
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useAuth, updateDocumentNonBlocking, useFirestore } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { cn } from '@/lib/utils';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { AvatarFrame } from '@/components/avatar-frame';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/**
 * High-Fidelity Maroon Diamond Icon.
 */
const DiamondIcon = ({ className }: { className?: string }) => (
  <div className={cn("bg-[#880e4f] rounded-full p-1.5 flex items-center justify-center", className)}>
    <span className="text-sm">💎</span>
  </div>
);

/**
 * Diamond to Coin Exchange Dialog.
 * Implements 25% yield frequency: 100 Diamonds = 25 Coins.
 */
function ExchangeDiamondsDialog({ balance, onExchange, open, setOpen }: { balance: number, onExchange: (amount: number) => void, open: boolean, setOpen: (o: boolean) => void }) {
  const [amount, setAmount] = useState<string>('');
  
  const diamonds = parseInt(amount) || 0;
  const expectedCoins = Math.floor(diamonds * 0.25);

  const handleConfirm = () => {
    if (diamonds > 0 && diamonds <= balance) {
      onExchange(diamonds);
      setOpen(false);
      setAmount('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[3rem] overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-0 text-center">
          <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Exchange Center</DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
            Exchange Rate: 25% (100 Diamonds = 25 Coins)
          </DialogDescription>
        </DialogHeader>
        <div className="p-8 space-y-6">
          <div className="bg-secondary/30 p-4 rounded-2xl flex justify-between items-center">
             <span className="text-[10px] font-black uppercase text-muted-foreground">Available Diamonds</span>
             <span className="font-black text-pink-600 italic">{balance.toLocaleString()}</span>
          </div>
          
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Diamonds to Exchange</Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">💎</span>
                <Input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                  className="h-14 pl-12 rounded-2xl border-2 focus:border-pink-500 text-xl font-black italic"
                />
              </div>
            </div>

            <div className="flex justify-center py-2">
               <ArrowRightLeft className="h-6 w-6 text-gray-300" />
            </div>

            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Gold Coins Received</Label>
              <div className="relative">
                <GoldCoinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" />
                <Input 
                  readOnly 
                  value={expectedCoins.toLocaleString()}
                  className="h-14 pl-12 rounded-2xl border-2 bg-gray-50 text-xl font-black italic text-yellow-600"
                />
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="p-8 pt-0">
          <Button 
            onClick={handleConfirm}
            disabled={diamonds <= 0 || diamonds > balance}
            className="w-full h-16 text-xl font-black uppercase italic rounded-3xl shadow-xl shadow-pink-500/20 bg-pink-600 hover:bg-pink-500"
          >
            Commit Exchange
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const StatItem = ({ label, count, showBorder = true }: { label: string, count: number, showBorder?: boolean }) => (
  <div className={cn("flex-1 flex flex-col items-center", showBorder && "border-r border-gray-100")}>
    <span className="text-xl font-bold text-gray-900">{count}</span>
    <span className="text-[10px] font-bold text-gray-400 uppercase">{label}</span>
  </div>
);

const ActionIcon = ({ icon: Icon, label, color, onClick }: any) => (
  <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={onClick}>
    <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-active:scale-95", color)}>
      <Icon className="h-8 w-8 text-white" />
    </div>
    <span className="text-xs font-bold text-gray-600">{label}</span>
  </div>
);

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthLoading && !currentUser) router.replace('/login');
  }, [currentUser, isAuthLoading, router]);

  if (isAuthLoading || isProfileLoading) {
    return (
      <AppLayout>
        <div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4">
          <Loader className="animate-spin text-primary h-10 w-10" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Identity...</p>
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    notFound();
    return null;
  }

  const isOwnProfile = currentUser?.uid === profileId;

  return (
    <AppLayout hideSidebarOnMobile>
      <div className="min-h-screen bg-[#f8f9fa] font-headline pb-32">
        {/* Header Background */}
        <div className="relative h-64 w-full">
          <Image 
            src="https://picsum.photos/seed/ummy-bg/1200/600" 
            alt="Mountain Header" 
            fill 
            className="object-cover opacity-20"
            data-ai-hint="mountain landscape"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f8f9fa]" />
          
          <div className="absolute top-6 left-4 flex items-center gap-4">
             <button onClick={() => router.back()} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-gray-800">
                <ChevronLeft className="h-6 w-6" />
             </button>
          </div>

          <div className="absolute top-6 right-4">
             {isOwnProfile && (
               <EditProfileDialog profile={profile} />
             )}
          </div>
        </div>

        {/* Profile Card */}
        <div className="px-6 -mt-32 relative z-10 space-y-6">
          <div className="flex items-end gap-4">
            <div className="relative shrink-0">
              <AvatarFrame frameId={profile.inventory?.activeFrame} size="xl">
                <Avatar className="h-24 w-24 border-4 border-white shadow-xl">
                  <AvatarImage key={profile.avatarUrl} src={localAvatarPreview || profile.avatarUrl} />
                  <AvatarFallback className="text-4xl font-black bg-slate-100">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
              </AvatarFrame>
              {isOwnProfile && (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-lg border border-gray-100 text-gray-600"
                >
                  <Camera className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="pb-2 flex-1 space-y-1">
               <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-black text-gray-900 uppercase italic tracking-tight">{profile.username}</h1>
                  <span className="text-lg">🇨🇦 ♂️ 🇮🇳</span>
               </div>
               <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-xs font-bold">ID:{profile.specialId || '563021252'}</span>
                  <button onClick={() => { navigator.clipboard.writeText(profile.specialId); toast({ title: 'ID Copied' }); }}>
                    <Copy className="h-3 w-3" />
                  </button>
               </div>
               <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-orange-400 to-orange-600 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                     <span className="text-[8px] font-black text-white italic">🛡️ {profile.level?.rich || 4}</span>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                     <span className="text-[8px] font-black text-white italic">💎 {profile.level?.charm || 4}</span>
                  </div>
               </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center justify-between py-4 bg-white/50 backdrop-blur-sm rounded-3xl">
             <StatItem label="Friends" count={2} />
             <StatItem label="Following" count={3} />
             <StatItem label="Followers" count={profile.stats?.followers || 56} />
             <StatItem label="Visitors" count={0} showBorder={false} />
          </div>

          {/* SVIP Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#004d40] to-[#1b5e20] p-4 border-[3px] border-[#ffd700]/30 shadow-xl group">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/mandala.png')] opacity-10" />
             <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                   <div className="h-12 w-12 rounded-full border-2 border-yellow-500 overflow-hidden bg-black/40">
                      <Image src="https://picsum.photos/seed/dragon/100/100" alt="Dragon" width={48} height={48} className="object-cover" />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-white italic">SVIP Club <span className="text-yellow-400">.</span></h3>
                      <p className="text-[10px] text-white/60 font-bold uppercase italic">Enjoy distinguished privileges</p>
                   </div>
                </div>
                <Button className="bg-gradient-to-b from-yellow-300 to-yellow-600 text-black font-black uppercase italic text-[10px] h-8 rounded-full px-4 shadow-lg border-b-2 border-yellow-800">
                   Get SVIP
                </Button>
             </div>
          </div>

          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-gradient-to-br from-[#43a047] to-[#2e7d32] rounded-3xl p-4 flex items-center justify-between group cursor-pointer shadow-xl active:scale-95 transition-transform relative overflow-hidden border border-white/20">
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
                
                <div className="flex items-center gap-3 relative z-10">
                   <div className="bg-yellow-400 rounded-full p-1.5 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse">
                      <GoldCoinIcon className="h-5 w-5 text-green-900" />
                   </div>
                   <span className="text-xl font-black text-white italic drop-shadow-lg">{(profile.wallet?.coins || 0).toLocaleString()}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/60 relative z-10" />
             </div>
             
             <div 
               onClick={() => isOwnProfile && setIsExchangeOpen(true)}
               className="bg-gradient-to-br from-[#ad1457] to-[#880e4f] rounded-3xl p-4 flex items-center justify-between group cursor-pointer shadow-xl active:scale-95 transition-transform relative overflow-hidden border border-white/20"
             >
                <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
                <div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" />

                <div className="flex items-center gap-3 relative z-10">
                   <DiamondIcon className="h-8 w-8 shadow-[0_0_15px_rgba(236,72,153,0.5)]" />
                   <span className="text-xl font-black text-white italic drop-shadow-lg">{(profile.wallet?.diamonds || 0).toLocaleString()}</span>
                </div>
                <ChevronRight className="h-4 w-4 text-white/60 relative z-10" />
             </div>
          </div>

          {/* Action Grid */}
          <Card className="border-none shadow-sm rounded-3xl p-6 bg-white">
             <div className="grid grid-cols-4 gap-4">
                <ActionIcon icon={Trophy} label="Level" color="bg-gradient-to-b from-gray-200 to-gray-400" onClick={() => router.push('/leaderboard')} />
                <ActionIcon icon={GoldCoinIcon} label="Store" color="bg-gradient-to-b from-yellow-400 to-yellow-600" onClick={() => router.push('/store')} />
                <ActionIcon icon={ShieldCheck} label="Badge" color="bg-gradient-to-b from-orange-400 to-orange-600" onClick={() => router.push('/store')} />
                <ActionIcon icon={Activity} label="Task" color="bg-gradient-to-b from-yellow-300 to-yellow-500" onClick={() => router.push('/tasks')} />
             </div>
          </Card>

          {/* List Menu */}
          <div className="space-y-4">
             <Card className="border-none shadow-sm rounded-3xl p-4 bg-white divide-y divide-gray-50">
                <div className="flex items-center justify-between py-3 cursor-pointer group">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                         <Activity className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-gray-800">COMBINED CP 💕</span>
                   </div>
                   <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
                <div className="flex items-center justify-between py-3 cursor-pointer group">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                         <UserPlus className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-gray-800">Invite Friends</span>
                   </div>
                   <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
             </Card>

             <Card className="border-none shadow-sm rounded-3xl p-4 bg-white divide-y divide-gray-50">
                <div className="flex items-center justify-between py-3 cursor-pointer group">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600">
                         <Activity className="h-5 w-5" />
                      </div>
                      <span className="font-bold text-gray-800">Network Test</span>
                   </div>
                   <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
             </Card>
          </div>
        </div>
      </div>
      
      {isOwnProfile && (
        <ExchangeDiamondsDialog 
          balance={profile.wallet?.diamonds || 0} 
          onExchange={(amt) => {
            const coinsToAdd = Math.floor(amt * 0.25);
            const userRef = doc(firestore!, 'users', currentUser!.uid);
            const profileRef = doc(firestore!, 'users', currentUser!.uid, 'profile', currentUser!.uid);
            const updateData = {
              'wallet.diamonds': increment(-amt),
              'wallet.coins': increment(coinsToAdd),
              updatedAt: serverTimestamp()
            };
            updateDocumentNonBlocking(userRef, updateData);
            updateDocumentNonBlocking(profileRef, updateData);
            toast({ title: 'Exchange Successful', description: `Received ${coinsToAdd.toLocaleString()} Gold Coins.` });
          }} 
          open={isExchangeOpen}
          setOpen={setIsExchangeOpen}
        />
      )}

      <input type="file" ref={fileInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          setLocalAvatarPreview(URL.createObjectURL(file));
          uploadProfilePicture(file);
        }
      }} className="hidden" accept="image/*" />
    </AppLayout>
  );
}
