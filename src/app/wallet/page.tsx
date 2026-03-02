'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, addDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, RefreshCw, History, Loader, ArrowRightLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

/**
 * Tribal Vault - Economic Control Center.
 * Synchronized with a 25% exchange rate (100 Diamonds = 25 Coins).
 */
export default function WalletPage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile, isLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [exchangeAmount, setExchangeAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('recharge');

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'diamondExchanges'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore, user]);

  const { data: exchangeHistory, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const handleExchange = () => {
    if (!user || !firestore) return;
    const amount = parseInt(exchangeAmount);
    if (!amount || amount <= 0) return;
    if ((userProfile?.wallet?.diamonds || 0) < amount) {
      toast({ variant: 'destructive', title: 'Insufficient Diamonds' });
      return;
    }

    setIsProcessing(true);
    const userRef = doc(firestore, 'users', user.uid);
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    
    const coinsGained = Math.floor(amount * 0.25);
    const updateData = {
      'wallet.diamonds': increment(-amount),
      'wallet.coins': increment(coinsGained),
      updatedAt: serverTimestamp()
    };

    updateDocumentNonBlocking(userRef, updateData);
    updateDocumentNonBlocking(profileRef, updateData);

    addDocumentNonBlocking(collection(firestore, 'users', user.uid, 'diamondExchanges'), {
      diamondAmount: amount,
      coinAmount: coinsGained,
      timestamp: serverTimestamp(),
      type: 'conversion'
    }).then(() => {
      toast({ title: 'Exchange Successful', description: `Converted ${amount} Diamonds to ${coinsGained} Gold Coins.` });
      setExchangeAmount('');
    }).finally(() => {
      setIsProcessing(false);
    });
  };

  const handleRecharge = (pkg: any) => {
    if (!user || !firestore) return;
    setIsProcessing(true);
    setTimeout(() => {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const totalGain = pkg.amount + (pkg.bonus || 0);
      updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(totalGain), updatedAt: serverTimestamp() });
      updateDocumentNonBlocking(profileRef, { 'wallet.coins': increment(totalGain), updatedAt: serverTimestamp() });
      toast({ title: 'Recharge Successful', description: `Added ${totalGain.toLocaleString()} Coins to your vault.` });
      setIsProcessing(false);
    }, 1000);
  };

  if (isLoading) return <AppLayout><div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin text-primary" /></div></AppLayout>;

  const calculatedCoins = exchangeAmount ? Math.floor(parseInt(exchangeAmount) * 0.25) : 0;

  return (
    <AppLayout>
      <div className="min-h-full bg-[#f8f9fa] font-headline pb-32 animate-in fade-in duration-700">
        <header className="px-6 pt-10 pb-6 flex items-center gap-4 border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-md z-50">
           <button onClick={() => router.back()} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-all"><ChevronLeft className="h-6 w-6 text-gray-800" /></button>
           <h1 className="text-3xl font-black uppercase italic tracking-tighter">Tribal Vault</h1>
        </header>

        <div className="p-6 space-y-8">
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                 <div className="relative z-10"><p className="text-[10px] font-black uppercase opacity-60 mb-1">Gold Coins</p><div className="flex items-center gap-2"><GoldCoinIcon className="h-6 w-6" /><span className="text-2xl font-black italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span></div></div>
                 <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12"><GoldCoinIcon className="h-24 w-24" /></div>
              </div>
              <div className="bg-gradient-to-br from-[#9d174d] to-[#701a75] p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                 <div className="relative z-10"><p className="text-[10px] font-black uppercase opacity-60 mb-1">Diamonds</p><div className="flex items-center gap-2"><span className="text-xl">💎</span><span className="text-2xl font-black italic">{(userProfile?.wallet?.diamonds || 0).toLocaleString()}</span></div></div>
                 <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12 text-6xl">💎</div>
              </div>
           </div>

           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="bg-secondary/50 p-1 h-14 rounded-full border border-gray-100 w-full mb-6">
                 <TabsTrigger value="recharge" className="flex-1 rounded-full font-black uppercase text-xs italic">Recharge</TabsTrigger>
                 <TabsTrigger value="exchange" className="flex-1 rounded-full font-black uppercase text-xs italic">Exchange</TabsTrigger>
                 <TabsTrigger value="records" className="flex-1 rounded-full font-black uppercase text-xs italic">Records</TabsTrigger>
              </TabsList>

              <TabsContent value="recharge" className="space-y-4">
                 {[1000, 5000, 10000].map(amt => (
                   <Card key={amt} className="rounded-3xl border-none shadow-sm overflow-hidden bg-white hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer" onClick={() => handleRecharge({ amount: amt, price: 'Handshake' })}>
                      <CardContent className="p-5 flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-12 w-12 bg-yellow-50 rounded-2xl flex items-center justify-center"><GoldCoinIcon className="h-7 w-7" /></div><div><p className="font-black text-lg italic">{amt.toLocaleString()} Coins</p></div></div><Button className="rounded-full bg-primary text-white font-black px-6 shadow-lg shadow-primary/20">Sync</Button></CardContent>
                   </Card>
                 ))}
              </TabsContent>

              <TabsContent value="exchange" className="space-y-6">
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-white">
                    <CardContent className="p-8 space-y-6">
                       <div className="flex flex-col items-center gap-4 text-center">
                          <div className="flex items-center gap-8"><div className="text-center"><span className="text-3xl">💎</span></div><RefreshCw className="h-6 w-6 text-indigo-200 animate-spin" style={{ animationDuration: '3s' }} /><div className="text-center"><GoldCoinIcon className="h-10 w-10" /></div></div>
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">4 Diamonds = 1 Gold Coin (25% Rate)</p>
                          {calculatedCoins > 0 && <p className="text-lg font-black text-green-600 uppercase italic mt-2 animate-in zoom-in">You get +{calculatedCoins.toLocaleString()} Gold Coins</p>}
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Sync Amount (Diamonds)</label>
                          <div className="relative">
                             <Input type="number" placeholder="0" value={exchangeAmount} onChange={(e) => setExchangeAmount(e.target.value)} className="h-16 rounded-2xl border-2 border-indigo-50 text-3xl font-black italic pl-6" />
                             <div className="absolute right-4 top-1/2 -translate-y-1/2"><button onClick={() => setExchangeAmount(String(userProfile?.wallet?.diamonds || 0))} className="text-[10px] font-black text-indigo-500 uppercase">MAX</button></div>
                          </div>
                       </div>
                       <Button onClick={handleExchange} disabled={isProcessing || !exchangeAmount || parseInt(exchangeAmount) <= 0} className="w-full h-16 rounded-[1.5rem] bg-indigo-600 text-white font-black text-xl uppercase italic shadow-xl">
                          {isProcessing ? <Loader className="animate-spin h-6 w-6" /> : 'Synchronize Vault'}
                       </Button>
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="records" className="space-y-4">
                 {isHistoryLoading ? <Loader className="animate-spin text-primary mx-auto" /> : exchangeHistory?.map((record: any) => (
                   <Card key={record.id} className="rounded-3xl border-none shadow-sm bg-white"><CardContent className="p-5 flex items-center justify-between"><div className="flex items-center gap-4"><div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center"><ArrowRightLeft className="h-5 w-5 text-indigo-500" /></div><div><p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">{record.timestamp ? format(record.timestamp.toDate(), 'MMM d, HH:mm') : 'Syncing...'}</p><div className="flex items-center gap-2"><span className="text-sm font-black text-gray-800 italic">{record.diamondAmount} 💎</span><span className="text-[10px] font-bold text-gray-300">➜</span><div className="flex items-center gap-1"><GoldCoinIcon className="h-3 w-3" /><span className="text-sm font-black text-green-600 italic">{record.coinAmount}</span></div></div></div></div></CardContent></Card>
                 ))}
              </TabsContent>
           </Tabs>
        </div>
      </div>
    </AppLayout>
  );
}
