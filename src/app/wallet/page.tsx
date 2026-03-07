'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { GoldCoinIcon } from '@/components/icons';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Loader, Gem } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const COIN_PACKAGES = [
  { id: 'p1', amount: '50,000', price: '10 INR', bonus: null },
  { id: 'p2', amount: '500,000', price: '100 INR', bonus: null },
  { id: 'p3', amount: '2,500,000', price: '500 INR', bonus: '+250000' },
  { id: 'p4', amount: '5,000,000', price: '1000 INR', bonus: '+750000' },
  { id: 'p5', amount: '12,500,000', price: '2500 INR', bonus: '+2500000' },
  { id: 'p6', amount: '50,000,000', price: '10000 INR', bonus: '+13500000' },
];

/**
 * Tribal Vault - Re-engineered for compact high-fidelity display.
 */
export default function WalletPage() {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'Coins' | 'Diamonds'>('Coins');
  const [showRecords, setShowRecords] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState('p1');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/login');
    }
  }, [user, isUserLoading, router]);

  const historyQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'diamondExchanges'),
      orderBy('timestamp', 'desc'),
      limit(20)
    );
  }, [firestore, user]);

  const { data: exchangeHistory, isLoading: isHistoryLoading } = useCollection(historyQuery);

  const handleRechargeNow = () => {
    if (!user || !firestore) return;
    const pkg = COIN_PACKAGES.find(p => p.id === selectedPackageId);
    if (!pkg) return;

    setIsProcessing(true);
    setTimeout(() => {
      const amountValue = parseInt(pkg.amount.replace(/,/g, ''));
      const bonusValue = pkg.bonus ? parseInt(pkg.bonus.replace('+', '')) : 0;
      const totalGain = amountValue + bonusValue;

      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(totalGain), updatedAt: serverTimestamp() });
      updateDocumentNonBlocking(profileRef, { 'wallet.coins': increment(totalGain), updatedAt: serverTimestamp() });
      
      toast({ title: 'Recharge Successful', description: `Synchronized ${totalGain.toLocaleString()} Coins.` });
      setIsProcessing(false);
    }, 1500);
  };

  if (isUserLoading || isProfileLoading) {
    return (
      <AppLayout hideSidebarOnMobile hideBottomNav>
        <div className="flex h-[80vh] items-center justify-center bg-white">
          <Loader className="animate-spin text-primary h-8 w-8" />
        </div>
      </AppLayout>
    );
  }

  if (!user) return null;

  return (
    <AppLayout hideSidebarOnMobile hideBottomNav>
      <div className="min-h-full bg-white font-headline flex flex-col animate-in fade-in duration-700">
        
        {/* Header Protocol - Compact */}
        <header className="px-6 pt-8 pb-3 flex items-center justify-between bg-white sticky top-0 z-50 border-b border-gray-50">
           <button onClick={() => router.back()} className="p-1.5 -ml-1.5 hover:bg-gray-50 rounded-full transition-all">
              <ChevronLeft className="h-5 w-5 text-gray-800" />
           </button>
           <h1 className="text-lg font-black uppercase tracking-tight">Wallet</h1>
           <button onClick={() => setShowRecords(!showRecords)} className="text-gray-400 font-bold uppercase text-xs tracking-tight px-2 active:scale-95 transition-transform">
              {showRecords ? 'Close' : 'Record'}
           </button>
        </header>

        {showRecords ? (
          <div className="flex-1 p-4 space-y-3 animate-in slide-in-from-right duration-300 overflow-y-auto no-scrollbar">
             <h2 className="text-[10px] font-black uppercase text-gray-400 mb-4 px-2">Exchange History</h2>
             {isHistoryLoading ? (
               <div className="flex justify-center pt-10">
                 <Loader className="animate-spin text-primary h-6 w-6" />
               </div>
             ) : !exchangeHistory || exchangeHistory.length === 0 ? (
               <div className="py-20 text-center opacity-20 italic uppercase font-black text-[10px]">No Records Found</div>
             ) : (
               exchangeHistory.map((record: any) => (
                 <div key={record.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-between shadow-sm">
                    <div className="space-y-0.5">
                      <p className="text-[8px] font-black text-gray-400 uppercase">{record.timestamp ? format(record.timestamp.toDate(), 'MMM d, HH:mm') : 'Syncing...'}</p>
                      <p className="font-black text-xs uppercase italic text-gray-800">{record.type === 'exchange' ? 'Diamond Exchange' : 'Package Purchase'}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="font-black text-green-600 text-xs">+{record.coinAmount?.toLocaleString()}</span>
                        <GoldCoinIcon className="h-3 w-3" />
                      </div>
                    </div>
                 </div>
               ))
             )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category Frequencies - Compact */}
            <div className="flex justify-around border-b border-gray-50 bg-white shrink-0">
               <button 
                 onClick={() => setActiveTab('Coins')}
                 className={cn(
                   "py-3 px-6 text-sm font-black uppercase italic tracking-tighter relative transition-all",
                   activeTab === 'Coins' ? "text-gray-900" : "text-gray-300"
                 )}
               >
                  Coins
                  {activeTab === 'Coins' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-yellow-400 rounded-full" />}
               </button>
               <button 
                 onClick={() => setActiveTab('Diamonds')}
                 className={cn(
                   "py-3 px-6 text-sm font-black uppercase italic tracking-tighter relative transition-all",
                   activeTab === 'Diamonds' ? "text-gray-900" : "text-gray-300"
                 )}
               >
                  Diamonds
                  {activeTab === 'Diamonds' && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-yellow-400 rounded-full" />}
               </button>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24">
               
               {activeTab === 'Coins' ? (
                 <>
                   {/* Main Balance Card - Compact (h-36 instead of h-48) */}
                   <div className="relative h-36 w-full rounded-[1.5rem] bg-gradient-to-br from-[#ff9d2f] via-[#ffa726] to-[#ffc107] p-6 text-white shadow-xl overflow-hidden mb-4 group active:scale-[0.98] transition-all">
                      <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold uppercase tracking-tight opacity-90">My Coins</p>
                            <button onClick={() => setShowRecords(true)} className="bg-white/20 backdrop-blur-md pl-3 pr-1 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-white/10">
                               History <ChevronRight className="h-2 w-2" />
                            </button>
                         </div>
                         <h2 className="text-4xl font-black italic tracking-tighter drop-shadow-md">
                            {(userProfile?.wallet?.coins || 0).toLocaleString()}
                         </h2>
                      </div>
                      <div className="absolute -top-4 -right-10 w-44 h-44 opacity-30 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                         <GoldCoinIcon className="w-full h-full" />
                      </div>
                   </div>

                   {/* Promotional Broadcast - Compact (h-16 instead of h-20) */}
                   <div className="relative h-16 w-full rounded-xl overflow-hidden mb-4 shadow-sm border border-red-100">
                      <img 
                        src="https://images.unsplash.com/photo-1514525253361-bee8718a300a?q=80&w=1000" 
                        className="w-full h-full object-cover brightness-75" 
                        alt="Promo"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600/80 to-transparent flex items-center px-4">
                         <div className="flex flex-col">
                            <span className="text-white font-black uppercase italic text-sm tracking-tighter">$1 = 800,000 coins</span>
                            <span className="text-[7px] text-white/80 font-bold uppercase tracking-widest">Promotion Frequency Live</span>
                         </div>
                      </div>
                   </div>

                   {/* Recharge Package Grid - Compact (h-32 instead of h-44) */}
                   <div className="grid grid-cols-3 gap-2 mb-6">
                      {COIN_PACKAGES.map((pkg) => (
                        <button 
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={cn(
                            "relative flex flex-col items-center justify-between rounded-xl border-2 transition-all p-2 h-32 group",
                            selectedPackageId === pkg.id 
                              ? "bg-[#fffde7] border-yellow-400 shadow-md scale-[1.02]" 
                              : "bg-white border-gray-100 hover:border-gray-200"
                          )}
                        >
                           <div className="w-10 h-10 mb-1 drop-shadow-sm group-hover:scale-110 transition-transform">
                              <GoldCoinIcon className="w-full h-full" />
                           </div>
                           
                           <div className="text-center flex-1 flex flex-col justify-center">
                              <p className="font-black text-xs tracking-tight leading-none text-gray-900">{pkg.amount}</p>
                              {pkg.bonus && (
                                <p className="text-[8px] font-bold text-[#ff9800] mt-0.5">{pkg.bonus}</p>
                              )}
                           </div>

                           <div className={cn(
                             "w-full py-1 rounded-lg text-[8px] font-black uppercase italic transition-all",
                             selectedPackageId === pkg.id ? "bg-yellow-400 text-black" : "bg-gray-100 text-gray-400"
                           )}>
                              {pkg.price}
                           </div>
                        </button>
                      ))}
                   </div>
                 </>
               ) : (
                 <div className="space-y-4 animate-in fade-in duration-500">
                   {/* Diamonds Balance Card - Compact */}
                   <div className="relative h-36 w-full rounded-[1.5rem] bg-gradient-to-br from-[#0ea5e9] via-[#38bdf8] to-[#0284c7] p-6 text-white shadow-xl overflow-hidden group active:scale-[0.98] transition-all">
                      <div className="relative z-10 flex flex-col h-full justify-between">
                         <div className="flex justify-between items-start">
                            <p className="text-[10px] font-bold uppercase tracking-tight opacity-90">My Diamonds</p>
                            <button onClick={() => setShowRecords(true)} className="bg-white/20 backdrop-blur-md pl-3 pr-1 py-0.5 rounded-full text-[8px] font-black uppercase flex items-center gap-1 border border-white/10">
                               History <ChevronRight className="h-2 w-2" />
                            </button>
                         </div>
                         <h2 className="text-4xl font-black italic tracking-tighter drop-shadow-md">
                            {(userProfile?.wallet?.diamonds || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                         </h2>
                      </div>
                      <div className="absolute -top-4 -right-10 w-44 h-44 opacity-30 rotate-12 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                         <Gem className="w-full h-full text-white fill-current" />
                      </div>
                   </div>

                   {/* Exchange Interaction Portal - Compact */}
                   <div className="p-0.5">
                      <button 
                        className="w-full bg-[#fffef0] border border-orange-100 rounded-2xl p-4 flex items-center justify-between shadow-sm group active:scale-[0.98] transition-all"
                        onClick={() => router.push('/wallet/exchange')}
                      >
                         <div className="flex items-center gap-3">
                            <div className="relative h-10 w-10">
                               <div className="absolute inset-0 bg-yellow-400/20 blur-lg rounded-full" />
                               <GoldCoinIcon className="h-full w-full relative z-10" />
                            </div>
                            <span className="font-black text-xs uppercase italic text-orange-900 tracking-tight">Exchange diamonds</span>
                         </div>
                         <ChevronRight className="h-4 w-4 text-orange-200 group-hover:translate-x-1 transition-transform" />
                      </button>
                   </div>

                   <div className="px-1 space-y-2 opacity-40">
                      <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400 text-center">
                        Rate: 1 Diamond = 100 Gold Coins
                      </p>
                   </div>
                 </div>
               )}

               {/* Help Link Dimension - Compact */}
               <div className="space-y-2 px-1 mt-4">
                  <p className="text-[9px] text-gray-400 font-bold leading-relaxed">
                    If your recharge can not be completed, please click here for help
                  </p>
                  <button onClick={() => router.push('/help-center')} className="text-yellow-500 font-black text-xs uppercase italic flex items-center gap-1">
                     Help Center <ChevronRight className="h-3 w-3" />
                  </button>
               </div>
            </div>

            {/* Bottom Sovereign Portal - Compact */}
            {!showRecords && (
              <footer className="p-4 bg-white border-t border-gray-50 fixed bottom-0 left-0 right-0 z-50 md:relative">
                 <Button 
                   onClick={handleRechargeNow}
                   disabled={isProcessing !== false}
                   className="w-full h-12 rounded-full bg-[#ffcc00] hover:bg-[#ffb300] text-black font-black uppercase italic text-lg shadow-lg active:scale-[0.98] transition-all"
                 >
                    {isProcessing !== false ? <Loader className="animate-spin mr-2 h-4 w-4" /> : activeTab === 'Coins' ? 'Recharge Now' : 'Withdrawal'}
                 </Button>
              </footer>
            )}
          </div>
        )}
      </div>
      <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </AppLayout>
  );
}
