'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, addDoc, collection, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, RefreshCw, History, Loader, ArrowRightLeft, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

/**
 * Tribal Vault - Economic Control Center.
 * Handles high-fidelity coin recharge and diamond-to-coin exchange frequencies.
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

  // Sync History Query
  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'diamondExchanges'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore, user]);

  const { data: exchangeHistory, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const handleExchange = async () => {
    if (!user || !firestore) return;
    const amount = parseInt(exchangeAmount);
    if (!amount || amount <= 0) return;
    if ((userProfile?.wallet?.diamonds || 0) < amount) {
      toast({ variant: 'destructive', title: 'Insufficient Diamonds' });
      return;
    }

    setIsProcessing(true);
    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      // Elite 25% Exchange Rate (4 Diamonds = 1 Gold Coin)
      const coinsGained = Math.floor(amount * 0.25);

      const updateData = {
        'wallet.diamonds': increment(-amount),
        'wallet.coins': increment(coinsGained),
        updatedAt: serverTimestamp()
      };

      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);

      // Log economic synchronization
      await addDoc(collection(firestore, 'users', user.uid, 'diamondExchanges'), {
        diamondAmount: amount,
        coinAmount: coinsGained,
        timestamp: serverTimestamp(),
        type: 'conversion'
      });

      toast({ title: 'Exchange Successful', description: `Converted ${amount} Diamonds to ${coinsGained} Gold Coins.` });
      setExchangeAmount('');
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Exchange Failed', description: e.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecharge = (pkg: any) => {
    if (!user || !firestore) return;
    setIsProcessing(true);
    // Simulate high-fidelity payment handshake
    setTimeout(() => {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      const totalGain = pkg.amount + (pkg.bonus || 0);
      const updateData = {
        'wallet.coins': increment(totalGain),
        updatedAt: serverTimestamp()
      };

      updateDocumentNonBlocking(userRef, updateData);
      updateDocumentNonBlocking(profileRef, updateData);
      
      toast({ title: 'Recharge Successful', description: `Added ${totalGain.toLocaleString()} Coins to your vault.` });
      setIsProcessing(false);
    }, 1000);
  };

  if (isLoading) return <AppLayout><div className="flex h-[50vh] items-center justify-center"><Loader className="animate-spin text-primary" /></div></AppLayout>;

  const packages = [
    { id: 1, amount: 1000, price: '₹90', bonus: 0 },
    { id: 2, amount: 5000, price: '₹450', bonus: 200 },
    { id: 3, amount: 10000, price: '₹900', bonus: 500 },
    { id: 4, amount: 50000, price: '₹4500', bonus: 3000 },
    { id: 5, amount: 100000, price: '₹9000', bonus: 10000 },
  ];

  // Real-time 25% Calculation
  const calculatedCoins = exchangeAmount ? Math.floor(parseInt(exchangeAmount) * 0.25) : 0;

  return (
    <AppLayout>
      <div className="min-h-full bg-[#f8f9fa] font-headline pb-32 animate-in fade-in duration-700">
        <header className="px-6 pt-10 pb-6 flex items-center gap-4 border-b border-gray-50 sticky top-0 bg-white/80 backdrop-blur-md z-50">
           <button onClick={() => router.back()} className="p-2 bg-secondary/50 rounded-full hover:bg-secondary transition-all">
              <ChevronLeft className="h-6 w-6 text-gray-800" />
           </button>
           <h1 className="text-3xl font-black uppercase italic tracking-tighter">Tribal Vault</h1>
        </header>

        <div className="p-6 space-y-8">
           {/* High-Density Balance Portals */}
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-green-500 to-green-700 p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                 <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase opacity-60 mb-1">Gold Coins</p>
                    <div className="flex items-center gap-2">
                       <GoldCoinIcon className="h-6 w-6" />
                       <span className="text-2xl font-black italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                    </div>
                 </div>
                 <div className="absolute -bottom-4 -right-4 opacity-10 rotate-12"><GoldCoinIcon className="h-24 w-24" /></div>
              </div>
              <div className="bg-gradient-to-br from-[#9d174d] to-[#701a75] p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                 <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase opacity-60 mb-1">Diamonds</p>
                    <div className="flex items-center gap-2">
                       <span className="text-xl">💎</span>
                       <span className="text-2xl font-black italic">{(userProfile?.wallet?.diamonds || 0).toLocaleString()}</span>
                    </div>
                 </div>
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
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black uppercase italic text-gray-400">Select Package</h3>
                    <button onClick={() => setActiveTab('records')} className="flex items-center gap-1 text-[10px] font-black uppercase text-primary hover:underline"><History className="h-3 w-3" /> Records</button>
                 </div>
                 <div className="space-y-3">
                    {packages.map(pkg => (
                      <Card key={pkg.id} className="rounded-3xl border-none shadow-sm overflow-hidden bg-white hover:bg-gray-50 transition-all active:scale-[0.98] cursor-pointer" onClick={() => handleRecharge(pkg)}>
                         <CardContent className="p-5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                               <div className="h-12 w-12 bg-yellow-50 rounded-2xl flex items-center justify-center"><GoldCoinIcon className="h-7 w-7" /></div>
                               <div>
                                  <p className="font-black text-lg italic">{pkg.amount.toLocaleString()} Coins</p>
                                  {pkg.bonus > 0 && <p className="text-[10px] font-black text-green-500 uppercase">+ {pkg.bonus.toLocaleString()} Extra</p>}
                               </div>
                            </div>
                            <Button className="rounded-full bg-primary text-white font-black px-6 shadow-lg shadow-primary/20">{pkg.price}</Button>
                         </CardContent>
                      </Card>
                    ))}
                 </div>
              </TabsContent>

              <TabsContent value="exchange" className="space-y-6">
                 <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-indigo-50 to-white">
                    <CardHeader>
                       <CardTitle className="text-xl font-black uppercase italic flex items-center gap-2">
                          <RefreshCw className="h-5 w-5 text-indigo-500" /> Diamond Sync
                       </CardTitle>
                       <CardDescription className="text-xs font-body italic">Convert earned Diamonds into Gold Coins at elite rates.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                       <div className="bg-white p-6 rounded-[2rem] border-2 border-dashed border-indigo-100 flex flex-col items-center gap-4">
                          <div className="flex items-center gap-8">
                             <div className="text-center"><span className="text-3xl">💎</span><p className="text-[8px] font-black text-gray-400 uppercase mt-1">Input</p></div>
                             <RefreshCw className="h-6 w-6 text-indigo-200 animate-spin-slow" />
                             <div className="text-center"><GoldCoinIcon className="h-10 w-10" /><p className="text-[8px] font-black text-gray-400 uppercase mt-1">Output</p></div>
                          </div>
                          <div className="text-center">
                             <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest italic">4 Diamonds = 1 Gold Coin (25% Rate)</p>
                             {calculatedCoins > 0 && (
                               <p className="text-lg font-black text-green-600 uppercase italic mt-2 animate-in zoom-in">
                                 You get +{calculatedCoins.toLocaleString()} Gold Coins
                               </p>
                             )}
                          </div>
                       </div>

                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-gray-400 ml-4">Sync Amount (Diamonds)</label>
                          <div className="relative">
                             <Input 
                                type="number" 
                                placeholder="0" 
                                value={exchangeAmount}
                                onChange={(e) => setExchangeAmount(e.target.value)}
                                className="h-16 rounded-2xl border-2 border-indigo-50 text-3xl font-black italic pl-6 focus:border-indigo-500"
                             />
                             <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                <button onClick={() => setExchangeAmount(String(userProfile?.wallet?.diamonds || 0))} className="text-[10px] font-black text-indigo-500 uppercase hover:underline">MAX</button>
                             </div>
                          </div>
                       </div>

                       <Button 
                          onClick={handleExchange}
                          disabled={isProcessing || !exchangeAmount || parseInt(exchangeAmount) <= 0}
                          className="w-full h-16 rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl uppercase italic shadow-xl shadow-indigo-500/20"
                       >
                          {isProcessing ? <Loader className="animate-spin h-6 w-6" /> : 'Synchronize Vault'}
                       </Button>
                    </CardContent>
                 </Card>
              </TabsContent>

              <TabsContent value="records" className="space-y-4">
                 <div className="flex items-center gap-2 px-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-black uppercase italic text-gray-400">Synchronization History</h3>
                 </div>
                 
                 <div className="space-y-3">
                    {isHistoryLoading ? (
                      <div className="flex justify-center py-10"><Loader className="animate-spin text-primary" /></div>
                    ) : !exchangeHistory || exchangeHistory.length === 0 ? (
                      <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                         <History className="h-12 w-12 text-gray-200 mx-auto mb-2" />
                         <p className="text-xs font-black uppercase text-gray-300">No records found in the frequency</p>
                      </div>
                    ) : (
                      exchangeHistory.map((record: any) => (
                        <Card key={record.id} className="rounded-3xl border-none shadow-sm overflow-hidden bg-white">
                           <CardContent className="p-5 flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                 <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <ArrowRightLeft className="h-5 w-5 text-indigo-500" />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">
                                       {record.timestamp ? format(record.timestamp.toDate(), 'MMM d, HH:mm') : 'Syncing...'}
                                    </p>
                                    <div className="flex items-center gap-2">
                                       <span className="text-sm font-black text-gray-800 italic">{record.diamondAmount} 💎</span>
                                       <span className="text-[10px] font-bold text-gray-300">➜</span>
                                       <div className="flex items-center gap-1">
                                          <GoldCoinIcon className="h-3 w-3" />
                                          <span className="text-sm font-black text-green-600 italic">{record.coinAmount}</span>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                              <div className="bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                 <span className="text-[8px] font-black text-green-600 uppercase">Success</span>
                              </div>
                           </CardContent>
                        </Card>
                      ))
                    )}
                 </div>
              </TabsContent>
           </Tabs>
        </div>
      </div>
      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AppLayout>
  );
}
