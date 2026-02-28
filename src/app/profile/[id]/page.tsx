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
  CreditCard,
  Smartphone,
  Wallet,
  Check,
  ShieldAlert,
  X,
  History,
  TrendingDown,
  Landmark,
  CreditCard as CardIcon,
  Headset,
  LogOut,
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useAuth, updateDocumentNonBlocking, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useProfilePictureUpload } from '@/hooks/use-profile-picture-upload';
import { cn } from '@/lib/utils';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { doc, increment, serverTimestamp, query, collection, orderBy, limit } from 'firebase/firestore';
import { AvatarFrame } from '@/components/avatar-frame';
import { OfficialTag } from '@/components/official-tag';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';

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

const DiamondIcon = ({ className }: { className?: string }) => (
  <div className={cn("bg-[#880e4f] rounded-full p-1.5 flex items-center justify-center", className)}>
    <span className="text-sm">💎</span>
  </div>
);

function RichLevelDialog({ open, setOpen }: { open: boolean, setOpen: (o: boolean) => void }) {
  const levels = [
    { lvl: '1 🏆', coins: '50,000' },
    { lvl: '2 🏆', coins: '1,00,000' },
    { lvl: '3 🏆', coins: '10,00,000' },
    { lvl: '4 🏆', coins: '50,00,000' },
    { lvl: '5-10 🏆', coins: '100,00,00,000' },
    { lvl: '10-20 🏆', coins: '100,00,00,00,000' },
    { lvl: '20-30 🏆', coins: '100,00,00,00,00,00' },
    { lvl: '30-40 🏆', coins: '500,00,00,00,00,000' },
    { lvl: '40-50 🏆', coins: '900,00,00,00,00,0000' },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[3rem] overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-4 text-center">
          <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Rich Level Guide</DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
            Spend Gold Coins on gifts to ascend the throne
          </DialogDescription>
        </DialogHeader>
        <div className="px-8 pb-8 space-y-6 h-[60vh] overflow-y-auto no-scrollbar">
           <div className="bg-primary/10 p-4 rounded-2xl border-2 border-primary/20 flex items-center gap-3">
              <Trophy className="h-6 w-6 text-primary shrink-0" />
              <p className="text-xs font-bold text-primary leading-relaxed">
                By spending Gold Coins on gifts, you increase your Rich Level and status within the social graph.
              </p>
           </div>
           <div className="rounded-[2rem] border-2 border-gray-100 overflow-hidden bg-white">
              <table className="w-full text-sm">
                 <thead>
                    <tr className="bg-gray-50 border-b-2 border-gray-100 text-[10px] font-black uppercase text-gray-400">
                       <th className="py-3 px-4 text-left">Level</th>
                       <th className="py-3 px-4 text-right">Required Coins</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                    {levels.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                         <td className="py-3 px-4 font-black italic text-gray-700">{item.lvl}</td>
                         <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1 font-black text-yellow-600 italic">
                               {item.coins}
                               <GoldCoinIcon className="h-3 w-3" />
                            </div>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
        </div>
        <footer className="p-6 bg-gray-50 text-center border-t border-gray-100">
           <p className="text-[8px] text-muted-foreground uppercase font-black tracking-widest">
              Levels are calculated in real-time based on spending frequencies.
           </p>
        </footer>
      </DialogContent>
    </Dialog>
  );
}

function PurchaseCoinsDialog({ open, setOpen }: { open: boolean, setOpen: (o: boolean) => void }) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState<'select' | 'gateway'>('select');
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState('');

  const packages = [
    { id: 1, amount: 1000, price: '₹99' },
    { id: 2, amount: 5000, price: '₹450' },
    { id: 3, amount: 10000, price: '₹850' },
    { id: 4, amount: 50000, price: '₹4000' },
  ];

  const methods = [
    { id: 'Paytm', label: 'Paytm', color: 'bg-blue-600', icon: Smartphone },
    { id: 'PhonePe', label: 'PhonePe', color: 'bg-purple-600', icon: Smartphone },
    { id: 'GPay', label: 'G Pay', color: 'bg-green-600', icon: Smartphone },
    { id: 'Card', label: 'Card', color: 'bg-slate-800', icon: CardIcon },
    { id: 'NetBanking', label: 'Banking', color: 'bg-indigo-700', icon: Landmark },
  ];

  const handlePaymentSuccess = async () => {
    if (!user || !firestore || selectedPkg === null) return;
    const pkg = packages.find(p => p.id === selectedPkg);
    if (!pkg) return;
    setIsProcessing(true);
    setTimeout(() => {
      const updateData = { 'wallet.coins': increment(pkg.amount), updatedAt: serverTimestamp() };
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', user.uid, 'profile', user.uid), updateData);
      toast({ title: 'Payment Confirmed', description: `Synced ${pkg.amount.toLocaleString()} Gold Coins.` });
      setIsProcessing(false);
      resetDialog();
    }, 2000);
  };

  const resetDialog = () => {
    setOpen(false);
    setTimeout(() => { setPaymentStep('select'); setSelectedPkg(null); setSelectedMethod(null); setIsProcessing(false); setUpiId(''); }, 300);
  };

  const currentPkg = packages.find(p => p.id === selectedPkg);
  const currentMethod = methods.find(m => m.id === selectedMethod);

  return (
    <Dialog open={open} onOpenChange={(val) => !isProcessing && setOpen(val)}>
      <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[3rem] overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 pb-0 text-center">
          <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">
            {paymentStep === 'select' ? 'Gold Recharge' : `${selectedMethod} Gateway`}
          </DialogTitle>
          <DialogDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1">
            {paymentStep === 'select' ? 'Official Ummy Real-Time Payment Portal' : 'Verifying transaction with your bank frequency...'}
          </DialogDescription>
        </DialogHeader>
        {paymentStep === 'select' ? (
          <>
            <div className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-3">
                {packages.map((pkg) => (
                  <button key={pkg.id} onClick={() => setSelectedPkg(pkg.id)} className={cn("flex flex-col items-center gap-1 p-4 bg-gray-50 border-2 rounded-2xl transition-all active:scale-95", selectedPkg === pkg.id ? "border-primary bg-primary/5 shadow-lg" : "border-transparent hover:border-gray-200")}>
                    <div className="flex items-center gap-1 text-primary font-black italic"><GoldCoinIcon className="h-4 w-4" />{pkg.amount.toLocaleString()}</div>
                    <span className="text-[10px] font-black text-gray-400">{pkg.price}</span>
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Real-Time Payment Options</p>
                <div className="grid grid-cols-3 gap-2">
                  {methods.map((m) => (
                    <button key={m.id} onClick={() => setSelectedMethod(m.id)} className={cn("flex flex-col items-center gap-2 p-3 bg-white border-2 rounded-2xl transition-all group", selectedMethod === m.id ? "border-primary bg-primary/5 shadow-md" : "border-gray-100 hover:border-gray-300")}>
                      <div className={cn("h-10 w-full rounded-lg flex items-center justify-center text-[8px] text-white font-black italic", m.color)}><m.icon className="h-4 w-4" /></div>
                      <span className="text-[8px] font-bold uppercase opacity-40 group-hover:opacity-100">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter className="p-8 pt-0">
              <Button onClick={() => setPaymentStep('gateway')} disabled={!selectedPkg || !selectedMethod} className="w-full h-16 text-xl font-black uppercase italic rounded-3xl shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"><Wallet className="h-6 w-6 mr-2" />Initialize Sync</Button>
            </DialogFooter>
          </>
        ) : (
          <div className="p-8 space-y-8 animate-in slide-in-from-right-4 duration-300">
            <div className="flex flex-col items-center text-center space-y-4">
               <div className={cn("h-20 w-20 rounded-full flex items-center justify-center shadow-2xl text-white", currentMethod?.color)}>{currentMethod && <currentMethod.icon className="h-10 w-10" />}</div>
            </div>
            {(selectedMethod === 'Paytm' || selectedMethod === 'PhonePe' || selectedMethod === 'GPay') && (
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Manual UPI ID Sync</Label>
                <Input placeholder="tribe@upi" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="h-12 rounded-xl border-2 focus:border-primary font-black italic" />
              </div>
            )}
            <div className="bg-gray-50 rounded-3xl p-6 border-2 border-dashed border-gray-200">
               <div className="flex justify-between items-center mb-4"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Order Amount</span><span className="text-xl font-black italic">{currentPkg?.price}</span></div>
               <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Coins to Credit</span><div className="flex items-center gap-1 text-primary font-black italic"><GoldCoinIcon className="h-4 w-4" />{currentPkg?.amount.toLocaleString()}</div></div>
            </div>
            <div className="space-y-3">
               <div className="flex items-center gap-2 justify-center text-[10px] font-bold text-muted-foreground uppercase mb-4"><ShieldCheck className="h-4 w-4 text-green-500" /><span>256-Bit SSL Secured Frequency</span></div>
               <Button onClick={handlePaymentSuccess} disabled={isProcessing} className={cn("w-full h-16 text-xl font-black uppercase italic rounded-3xl shadow-xl", currentMethod?.color, "hover:brightness-110")}>{isProcessing ? <Loader className="animate-spin h-6 w-6 mr-2" /> : <Check className="h-6 w-6 mr-2" />}{isProcessing ? 'Synchronizing...' : 'Confirm Paid'}</Button>
               <button onClick={() => { toast({ variant: 'destructive', title: 'Payment Discarded' }); resetDialog(); }} disabled={isProcessing} className="w-full py-2 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 hover:text-red-500 transition-colors">Discard Transaction</button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ExchangeDiamondsDialog({ balance, onExchange, open, setOpen, userId }: { balance: number, onExchange: (amount: number) => void, open: boolean, setOpen: (o: boolean) => void, userId: string }) {
  const [amount, setAmount] = useState<string>('');
  const firestore = useFirestore();
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !userId) return null;
    return query(collection(firestore, 'users', userId, 'diamondExchanges'), orderBy('timestamp', 'desc'), limit(20));
  }, [firestore, userId]);
  const { data: historyItems, isLoading: isHistoryLoading } = useCollection(historyQuery);
  const diamonds = parseInt(amount) || 0;
  const expectedCoins = Math.floor(diamonds * 0.25);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white text-black p-0 rounded-t-[3rem] overflow-hidden border-none shadow-2xl">
        <Tabs defaultValue="exchange" className="w-full">
          <DialogHeader className="p-8 pb-0 text-center">
            <DialogTitle className="font-headline text-3xl uppercase italic tracking-tighter">Exchange Center</DialogTitle>
            <DialogDescription className="sr-only">Convert Blue Diamonds into Gold Coins and view transaction history.</DialogDescription>
            <TabsList className="bg-secondary/50 p-1 h-10 rounded-full mt-4 flex justify-center w-fit mx-auto">
              <TabsTrigger value="exchange" className="rounded-full px-6 font-black uppercase text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">Exchange</TabsTrigger>
              <TabsTrigger value="history" className="rounded-full px-6 font-black uppercase text-[10px] data-[state=active]:bg-white data-[state=active]:shadow-sm">History</TabsTrigger>
            </TabsList>
          </DialogHeader>
          <TabsContent value="exchange" className="p-8 pt-6 space-y-6 m-0 animate-in fade-in duration-300">
            <div className="bg-secondary/30 p-4 rounded-2xl flex justify-between items-center border border-gray-100"><span className="text-[10px] font-black uppercase text-muted-foreground">Available Diamonds</span><span className="font-black text-pink-600 italic">{balance.toLocaleString()}</span></div>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Diamonds to Exchange</Label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">💎</span><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="h-14 pl-12 rounded-2xl border-2 focus:border-pink-500 text-xl font-black italic shadow-inner" /></div>
              </div>
              <div className="flex justify-center py-2"><ArrowRightLeft className="h-6 w-6 text-gray-300" /></div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Gold Coins Received</Label>
                <div className="relative"><GoldCoinIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5" /><Input readOnly value={expectedCoins.toLocaleString()} className="h-14 pl-12 rounded-2xl border-2 bg-gray-50 text-xl font-black italic text-yellow-600" /></div>
              </div>
            </div>
            <Button onClick={() => { onExchange(diamonds); setAmount(''); }} disabled={diamonds <= 0 || diamonds > balance} className="w-full h-16 text-xl font-black uppercase italic rounded-3xl shadow-xl shadow-pink-500/20 bg-pink-600 hover:bg-pink-500 transition-all active:scale-95">Commit Exchange</Button>
          </TabsContent>
          <TabsContent value="history" className="p-8 pt-4 m-0 h-[450px] animate-in fade-in duration-300">
            <ScrollArea className="h-full pr-2">
               {isHistoryLoading ? <div className="flex flex-col items-center justify-center py-20 gap-2 opacity-40"><Loader className="animate-spin h-6 w-6" /><span className="text-[10px] font-black uppercase italic">Syncing Ledger...</span></div> : !historyItems || historyItems.length === 0 ? <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-20 italic"><TrendingDown className="h-12 w-12" /><p className="text-sm font-black uppercase tracking-widest">No Exchanges Found</p></div> : <div className="space-y-3">{historyItems.map((item: any) => (<div key={item.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all"><div className="flex flex-col gap-1"><div className="flex items-center gap-2"><span className="text-xs font-black text-pink-600 italic">-{item.diamondAmount.toLocaleString()} 💎</span><ArrowRightLeft className="h-3 w-3 text-gray-300" /><span className="text-xs font-black text-yellow-600 italic">+{item.coinAmount.toLocaleString()} 🪙</span></div><span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{item.timestamp ? format(item.timestamp.toDate(), 'MMM d, HH:mm') : 'Just now'}</span></div><Check className="h-4 w-4 text-green-500 opacity-40" /></div>))}</div>}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

const StatItem = ({ label, count, showBorder = true }: { label: string, count: number, showBorder?: boolean }) => (
  <div className={cn("flex-1 flex flex-col items-center", showBorder && "border-r border-gray-100")}>
    <span className="text-lg sm:text-xl font-black text-gray-900 leading-tight">{count}</span>
    <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{label}</span>
  </div>
);

const ActionIcon = ({ icon: Icon, label, color, onClick }: any) => (
  <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={onClick}>
    <div className={cn("h-12 sm:h-14 w-12 sm:w-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-active:scale-95", color)}>
      <Icon className="h-6 sm:h-8 w-6 sm:w-8 text-white" />
    </div>
    <span className="text-[10px] font-black uppercase italic tracking-tighter text-gray-600 truncate w-full text-center px-1">{label}</span>
  </div>
);

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const firestore = useFirestore();
  const auth = useAuth();
  const { toast } = useToast();
  const profileId = Array.isArray(params?.id) ? params.id[0] : params?.id as string;
  const { user: currentUser, isLoading: isAuthLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId);
  const { isUploading, uploadProfilePicture } = useProfilePictureUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExchangeOpen, setIsExchangeOpen] = useState(false);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [isRichLevelOpen, setIsRichLevelOpen] = useState(false);
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null);

  useEffect(() => { if (!isAuthLoading && !currentUser) router.replace('/login'); }, [currentUser, isAuthLoading, router]);

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      window.location.href = '/login';
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Logout Failed', description: e.message });
    }
  };

  if (isAuthLoading || isProfileLoading) return <AppLayout><div className="flex h-[60vh] w-full flex-col items-center justify-center space-y-4"><Loader className="animate-spin text-primary h-10 w-10" /><p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Synchronizing Identity...</p></div></AppLayout>;
  if (!profile) { notFound(); return null; }

  const isOwnProfile = currentUser?.uid === profileId;
  const richLevel = calculateRichLevel(profile.wallet?.totalSpent || 0);
  const isOfficial = profile.tags?.includes('Admin') || profile.tags?.includes('Official');

  return (
    <AppLayout>
      <div className="flex flex-col min-h-full bg-[#f8f9fa] font-headline pb-32">
        <div className="relative h-48 sm:h-64 w-full shrink-0">
          <Image src="https://picsum.photos/seed/ummy-bg/1200/600" alt="Mountain Header" fill className="object-cover opacity-20" data-ai-hint="mountain landscape" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#f8f9fa]" />
          <div className="absolute top-6 left-4 flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-gray-800">
              <ChevronLeft className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute top-6 right-4 flex items-center gap-2">
            {isOwnProfile && (
              <Link href="/settings" className="p-2 bg-white/20 backdrop-blur-md rounded-full text-gray-800 hover:bg-white/40 transition-all">
                <SettingsIcon className="h-6 w-6" />
              </Link>
            )}
          </div>
        </div>
        <div className="flex-1 px-6 -mt-24 sm:-mt-32 relative z-10 space-y-6">
          <div className="flex items-end gap-4">
            <div className="relative shrink-0"><AvatarFrame frameId={profile.inventory?.activeFrame} size="xl"><Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-4 border-white shadow-xl"><AvatarImage src={localAvatarPreview || profile.avatarUrl} /><AvatarFallback className="text-4xl font-black bg-slate-100">{(profile.username || 'U').charAt(0)}</AvatarFallback></Avatar></AvatarFrame>{isOwnProfile && <div className="absolute bottom-0 right-0"><EditProfileDialog profile={profile} /></div>}</div>
            <div className="pb-2 flex-1 space-y-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 uppercase italic tracking-tight truncate">{profile.username}</h1>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground"><span className="text-[10px] sm:text-xs font-bold">ID:{profile.specialId || '563021252'}</span><button onClick={() => { navigator.clipboard.writeText(profile.specialId); toast({ title: 'ID Copied' }); }}><Copy className="h-3 w-3" /></button></div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-gradient-to-r from-orange-400 to-orange-600 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm shrink-0">
                  <span className="text-[10px] font-black text-white italic">🛡️ {richLevel}</span>
                </div>
                <div className="bg-gradient-to-r from-cyan-400 to-cyan-600 px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm shrink-0">
                  <span className="text-[10px] font-black text-white italic">💎 {profile.level?.charm || 1}</span>
                </div>
                {isOfficial && <OfficialTag size="sm" />}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-4 bg-white/50 backdrop-blur-sm rounded-[2rem] shadow-sm"><StatItem label="Friends" count={2} /><StatItem label="Following" count={3} /><StatItem label="Followers" count={profile.stats?.followers || 56} /><StatItem label="Visitors" count={0} showBorder={false} /></div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
             <div onClick={() => isOwnProfile && setIsPurchaseOpen(true)} className="bg-gradient-to-br from-[#43a047] to-[#2e7d32] rounded-[2rem] p-3 sm:p-4 flex items-center justify-between group cursor-pointer shadow-xl active:scale-95 transition-transform relative overflow-hidden border border-white/20"><div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" /><div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" /><div className="flex items-center gap-2 relative z-10 min-w-0 flex-1"><div className="bg-yellow-400 rounded-full p-1 shadow-[0_0_15px_rgba(250,204,21,0.5)] animate-pulse shrink-0"><GoldCoinIcon className="h-4 sm:h-5 w-4 sm:w-5 text-green-900" /></div><span className="text-base sm:text-xl font-black text-white italic drop-shadow-lg truncate">{(profile.wallet?.coins || 0).toLocaleString()}</span></div><ChevronRight className="h-4 w-4 text-white/60 relative z-10 shrink-0" /></div>
             <div onClick={() => isOwnProfile && setIsExchangeOpen(true)} className="bg-gradient-to-br from-[#ad1457] to-[#880e4f] rounded-[2rem] p-3 sm:p-4 flex items-center justify-between group cursor-pointer shadow-xl active:scale-95 transition-transform relative overflow-hidden border border-white/20"><div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" /><div className="absolute inset-0 w-1/2 h-full bg-white/20 skew-x-[-30deg] -translate-x-[200%] animate-shine" /><div className="flex items-center gap-2 relative z-10 min-w-0 flex-1"><DiamondIcon className="h-6 w-6 sm:h-8 sm:w-8 shadow-[0_0_15px_rgba(236,72,153,0.5)] shrink-0" /><span className="text-base sm:text-xl font-black text-white italic drop-shadow-lg truncate">{(profile.wallet?.diamonds || 0).toLocaleString()}</span></div><ChevronRight className="h-4 w-4 text-white/60 relative z-10 shrink-0" /></div>
          </div>
          <Card className="border-none shadow-sm rounded-[2rem] p-4 sm:p-6 bg-white"><div className="grid grid-cols-4 gap-2 sm:gap-4"><ActionIcon icon={Trophy} label="Level" color="bg-gradient-to-br from-[#ffd700] via-[#ffa500] to-[#ff4500]" onClick={() => setIsRichLevelOpen(true)} /><ActionIcon icon={GoldCoinIcon} label="Store" color="bg-gradient-to-b from-yellow-400 to-yellow-600" onClick={() => router.push('/store')} /><ActionIcon icon={ShieldCheck} label="Badge" color="bg-gradient-to-b from-orange-400 to-orange-600" onClick={() => router.push('/store')} /><ActionIcon icon={Activity} label="Task" color="bg-gradient-to-b from-yellow-300 to-yellow-500" onClick={() => router.push('/tasks')} /></div></Card>
          <div className="space-y-4">
             <Card className="border-none shadow-sm rounded-[2rem] p-4 bg-white divide-y divide-gray-50">
                <div className="flex items-center justify-between py-3 cursor-pointer group">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600"><Activity className="h-5 w-5" /></div>
                      <span className="font-black text-gray-800 uppercase italic text-[10px] sm:text-xs">COMBINED CP 💕</span>
                   </div>
                   <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
                <div onClick={() => router.push('/help-center')} className="flex items-center justify-between py-3 cursor-pointer group">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600"><UserPlus className="h-5 w-5" /></div>
                      <span className="font-black text-gray-800 uppercase italic text-[10px] sm:text-xs">Invite Friends</span>
                   </div>
                   <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
             </Card>
             <Card className="border-none shadow-sm rounded-[2rem] p-4 bg-white divide-y divide-gray-50">
                <div className="flex items-center justify-between py-3 cursor-pointer group">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600"><Activity className="h-5 w-5" /></div>
                      <span className="font-black text-gray-800 uppercase italic text-[10px] sm:text-xs">Network Test</span>
                   </div>
                   <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
                <div onClick={() => router.push('/help-center')} className="flex items-center justify-between py-3 cursor-pointer group">
                   <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600"><Headset className="h-5 w-5" /></div>
                      <span className="font-black text-gray-800 uppercase italic text-[10px] sm:text-xs">Customer Support</span>
                   </div>
                   <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
             </Card>

             {isOwnProfile && (
               <Card className="border-none shadow-sm rounded-[2rem] p-4 bg-white mt-4">
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between py-3 group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-red-50 rounded-2xl flex items-center justify-center text-red-500"><LogOut className="h-5 w-5" /></div>
                      <span className="font-black text-red-600 uppercase italic text-[10px] sm:text-xs">Exit Frequency (Logout)</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                  </button>
               </Card>
             )}
          </div>
        </div>
      </div>
      {isOwnProfile && (
        <>
          <PurchaseCoinsDialog open={isPurchaseOpen} setOpen={setIsPurchaseOpen} />
          <ExchangeDiamondsDialog balance={profile.wallet?.diamonds || 0} userId={currentUser!.uid} onExchange={(amt) => {
              const coinsToAdd = Math.floor(amt * 0.25);
              const userRef = doc(firestore!, 'users', currentUser!.uid);
              const profileRef = doc(firestore!, 'users', currentUser!.uid, 'profile', currentUser!.uid);
              const historyRef = collection(firestore!, 'users', currentUser!.uid, 'diamondExchanges');
              const updateData = { 'wallet.diamonds': increment(-amt), 'wallet.coins': increment(coinsToAdd), updatedAt: serverTimestamp() };
              updateDocumentNonBlocking(userRef, updateData);
              updateDocumentNonBlocking(profileRef, updateData);
              addDocumentNonBlocking(historyRef, { diamondAmount: amt, coinAmount: coinsToAdd, timestamp: serverTimestamp(), type: 'exchange' });
              toast({ title: 'Exchange Successful', description: `Received ${coinsToAdd.toLocaleString()} Gold Coins.` });
              setIsExchangeOpen(false);
            }} open={isExchangeOpen} setOpen={setIsExchangeOpen} />
          <RichLevelDialog open={isRichLevelOpen} setOpen={setIsRichLevelOpen} />
        </>
      )}
      <input type="file" ref={fileInputRef} onChange={(e) => { const file = e.target.files?.[0]; if (file) { setLocalAvatarPreview(URL.createObjectURL(file)); uploadProfilePicture(file); } }} className="hidden" accept="image/*" />
    </AppLayout>
  );
}
