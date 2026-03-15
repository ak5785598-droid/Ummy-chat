'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Trophy, 
  Users, 
  X,
  Maximize2,
  Menu,
  ChevronDown,
  Plus,
  Minus,
  LayoutGrid,
  Star as StarIcon,
  Wand2
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { GameResultOverlay } from '@/components/game-result-overlay';
import Image from 'next/image';

const SYMBOLS = [
  { id: 'lamp', emoji: '🪔', value: 100, label: 'Scatter' },
  { id: 'swords', emoji: '⚔️', value: 50 },
  { id: 'ring', emoji: '💍', value: 30 },
  { id: 'goblet', emoji: '🏆', value: 20 },
  { id: 'heart-gem', emoji: '💎', value: 40 },
  { id: 'a', char: 'A', value: 10 },
  { id: 'j', char: 'J', value: 5 },
  { id: 'helmet', emoji: '🕌', value: 500, label: 'Jackpot' },
];

export default function ChiragSlotPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [reels, setReels] = useState<number[][]>(
    Array(5).fill(null).map(() => [0, 1, 2])
  );
  const [isMuted, setIsMuted] = useState(false);
  const [jackpot, setJackpot] = useState(153820);
  const [isLaunching, setIsLaunching] = useState(true);
  const [lines, setLines] = useState(9);
  const [cost, setCost] = useState(1);
  const [winAmount, setWinAmount] = useState<number | null>(null);

  const gameDocRef = useMemoFirebase(() => !firestore ? null : doc(firestore, 'games', 'chirag-slot'), [firestore]);
  const { data: gameData } = useDoc(gameDocRef);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleSpin = async () => {
    if (gameState === 'spinning' || !currentUser || !userProfile) return;
    const totalBet = lines * cost;
    if ((userProfile.wallet?.coins || 0) < totalBet) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    setGameState('spinning');
    setWinAmount(null);

    const updateData = { 'wallet.coins': increment(-totalBet), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore!, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore!, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

    let iterations = 0;
    const interval = setInterval(() => {
      setReels(Array(5).fill(null).map(() => 
        Array(3).fill(null).map(() => Math.floor(Math.random() * SYMBOLS.length))
      ));
      iterations++;
      if (iterations >= 25) {
        clearInterval(interval);
        finalizeSpin();
      }
    }, 80);
  };

  const finalizeSpin = async () => {
    let forced = false;
    let forceWin = 0;

    if (firestore) {
      try {
        const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'chirag-slot'));
        if (oracleSnap.exists() && oracleSnap.data().isActive) {
          const result = oracleSnap.data().forcedResult;
          if (result === 'JACKPOT') {
            forceWin = 5000;
            forced = true;
          } else if (typeof result === 'number') {
            forceWin = result;
            forced = true;
          }
          updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'chirag-slot'), { isActive: false });
        }
      } catch (e) {}
    }

    const finalReels = Array(5).fill(null).map(() => 
      Array(3).fill(null).map(() => Math.floor(Math.random() * SYMBOLS.length))
    );
    
    if (forced && forceWin >= 5000) {
      finalReels.forEach(r => r[1] = SYMBOLS.findIndex(s => s.label === 'Jackpot'));
    }

    setReels(finalReels);

    const win = forced ? forceWin : (Math.random() > 0.8 ? Math.floor(Math.random() * 500) : 0);
    
    if (win > 0 && currentUser && firestore) {
      setWinAmount(win);
      const updateData = { 
        'wallet.coins': increment(win), 
        'stats.dailyGameWins': increment(win),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    }

    setGameState('result');
    setTimeout(() => setGameState('betting'), 4000);
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#1a0533] flex flex-col items-center justify-center space-y-6 font-headline">
        <div className="text-8xl animate-bounce">🪔</div>
        <h1 className="text-6xl font-black text-yellow-400 uppercase italic tracking-tighter drop-shadow-2xl">Chirag Slot</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Syncing Tribal Reels...</p>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#05051a] flex flex-col relative overflow-hidden font-headline text-white select-none animate-in fade-in duration-1000">
        <CompactRoomView />

        <div className="absolute inset-0 z-0">
           {gameData?.backgroundUrl ? (
             <Image key={gameData.backgroundUrl} src={gameData.backgroundUrl} alt="Theme" fill className="object-cover opacity-60 animate-in fade-in duration-1000" unoptimized />
           ) : (
             <>
               <div className="absolute inset-0 bg-gradient-to-b from-[#1a0533] via-[#05051a] to-[#0a0a2e]" />
               <div className="absolute top-0 left-0 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse" />
             </>
           )}
        </div>

        <header className="relative z-[110] flex items-center justify-between px-4 pt-32 pb-4">
           <div className="flex gap-1.5">
              <button className="bg-white/10 p-2 rounded-lg border border-white/5 backdrop-blur-md active:scale-90 transition-all"><Maximize2 className="h-4 w-4" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-2 rounded-lg border border-white/5 backdrop-blur-md active:scale-90 transition-all">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button className="bg-white/10 p-2 rounded-lg border border-white/5 backdrop-blur-md active:scale-90 transition-all"><HelpCircle className="h-4 w-4" /></button>
              <button className="bg-white/10 p-2 rounded-lg border border-white/5 backdrop-blur-md active:scale-90 transition-all"><LayoutGrid className="h-4 w-4" /></button>
           </div>
           
           <h1 className="text-3xl font-black italic tracking-tighter text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">Chirag Slot</h1>

           <div className="flex gap-1.5">
              <button className="bg-white/10 p-2 rounded-lg border border-white/5 backdrop-blur-md active:scale-90 transition-all"><Menu className="h-4 w-4" /></button>
              <button className="bg-white/10 p-2 rounded-lg border border-white/5 backdrop-blur-md active:scale-90 transition-all"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => router.back()} className="bg-white/10 p-2 rounded-lg border border-white/5 backdrop-blur-md active:scale-90 transition-all text-white"><X className="h-4 w-4" /></button>
           </div>
        </header>

        <div className="relative z-50 flex items-center justify-between px-6 mb-4">
           <div className="flex flex-col gap-1">
              <div className="bg-[#3d1a5a] border-2 border-purple-500/40 rounded-xl flex items-center gap-2 pl-2 pr-4 py-1.5 shadow-xl">
                 <GoldCoinIcon className="h-5 w-5 text-yellow-400" />
                 <span className="text-xl font-black italic text-white leading-none">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                 <button className="ml-2 bg-purple-600 rounded-lg p-0.5"><Plus className="h-3 w-3 text-white" /></button>
              </div>
           </div>

           <div className="flex flex-col items-center">
              <div className="text-yellow-400 font-black uppercase text-[10px] tracking-[0.3em] mb-1 drop-shadow-md flex items-center gap-2">
                 <StarIcon className="h-3 w-3 fill-current" /> JACKPOT <StarIcon className="h-3 w-3 fill-current" />
              </div>
              <div className="bg-gradient-to-b from-[#4c1d95] to-[#1e1b4b] border-[3px] border-[#a78bfa]/40 rounded-2xl px-6 py-2 shadow-[0_0_30px_rgba(167,139,250,0.3)]">
                 <span className="text-3xl font-black text-white italic tracking-widest tabular-nums">
                    {String(jackpot).padStart(7, '0')}
                 </span>
              </div>
           </div>

           <div className="flex flex-col items-end">
              <div className="relative group cursor-pointer active:scale-95 transition-all">
                 <Avatar className="h-14 w-14 border-2 border-yellow-400 shadow-xl">
                    <AvatarImage src={userProfile?.avatarUrl} className="object-cover" />
                    <AvatarFallback>U</AvatarFallback>
                 </Avatar>
                 <div className="absolute -top-2 -left-2 bg-yellow-400 text-black px-2 py-0.5 rounded-full font-black text-[8px] uppercase border border-white">Top 1</div>
              </div>
           </div>
        </div>

        <main className="flex-1 flex flex-col items-center justify-center px-4 relative z-10 pb-40">
           <div className="w-full max-w-sm relative p-2 bg-gradient-to-b from-[#7c3aed] to-[#4c1d95] rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.6)] border-4 border-purple-400/30">
              <div className="relative bg-[#05051a] rounded-[2rem] overflow-hidden border-2 border-purple-900/80 shadow-inner flex h-[300px] p-1 gap-1">
                 {reels.map((reel, rIdx) => (
                   <div key={rIdx} className="flex-1 flex flex-col gap-1 relative z-10">
                      {reel.map((symbolIdx, sIdx) => {
                        const symbol = SYMBOLS[symbolIdx];
                        return (
                          <div key={sIdx} className={cn(
                            "flex-1 bg-gradient-to-b from-white/5 to-white/10 rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all",
                            gameState === 'spinning' && "animate-pulse blur-[1px]"
                          )}>
                             <span className="text-5xl drop-shadow-lg relative z-10">
                                {symbol.emoji || symbol.char}
                             </span>
                             {symbol.label && (
                               <span className="absolute bottom-1 text-[8px] font-black uppercase text-purple-300 italic">
                                  {symbol.label}
                               </span>
                             )}
                          </div>
                        );
                      })}
                   </div>
                 ))}
              </div>
           </div>

           <div className="mt-8 w-full max-w-sm flex items-end justify-between px-2">
              <div className="flex gap-3">
                 <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black uppercase italic text-white/40">Lines</span>
                    <div className="bg-gradient-to-b from-purple-500 to-purple-800 rounded-xl p-1 border-2 border-white/10 shadow-lg flex items-center">
                       <button onClick={() => setLines(prev => Math.max(1, prev - 1))} className="p-1"><Minus className="h-3 w-3" /></button>
                       <div className="bg-black/40 rounded-lg px-4 py-1">
                          <span className="text-lg font-black italic">{lines}</span>
                       </div>
                       <button onClick={() => setLines(prev => Math.min(20, prev + 1))} className="p-1"><Plus className="h-3 w-3" /></button>
                    </div>
                 </div>

                 <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] font-black uppercase italic text-white/40">Cost</span>
                    <div className="bg-gradient-to-b from-purple-500 to-purple-800 rounded-xl p-1 border-2 border-white/10 shadow-lg flex items-center">
                       <button onClick={() => setCost(prev => Math.max(1, prev - 1))} className="p-1"><Minus className="h-3 w-3" /></button>
                       <div className="bg-black/40 rounded-lg px-4 py-1">
                          <span className="text-lg font-black italic">{cost}</span>
                       </div>
                       <button onClick={() => setCost(prev => prev + 1)} className="p-1"><Plus className="h-3 w-3" /></button>
                    </div>
                 </div>
              </div>

              <div className="flex flex-col items-center gap-2">
                 <div className="bg-black/60 rounded-full px-4 py-1 border border-white/10 shadow-inner">
                    <div className="flex items-center gap-1.5 text-yellow-400 font-black italic">
                       <GoldCoinIcon className="h-4 w-4" />
                       <span className="text-sm">{lines * cost}</span>
                    </div>
                 </div>
                 
                 <button 
                   onClick={handleSpin}
                   disabled={gameState === 'spinning'}
                   className={cn(
                     "relative h-20 w-44 rounded-2xl bg-gradient-to-b from-[#4ade80] to-[#166534] border-b-8 border-[#064e3b] shadow-2xl transition-all active:translate-y-2 active:border-b-0 overflow-hidden",
                     gameState === 'spinning' && "opacity-50 grayscale pointer-events-none"
                   )}
                 >
                    <div className="absolute inset-0 bg-white/20 -skew-x-12 -translate-x-[200%] animate-shine" />
                    <div className="flex flex-col items-center justify-center">
                       <span className="text-4xl font-black italic text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">Spin</span>
                       <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Hold for auto</span>
                    </div>
                 </button>
              </div>
           </div>
        </main>

        {gameState === 'result' && winAmount && winAmount > 0 && (
          <GameResultOverlay 
            winningSymbol="🪔" 
            winAmount={winAmount} 
            winners={[{ name: userProfile?.username || 'You', avatar: userProfile?.avatarUrl, win: winAmount }]} 
          />
        )}

        <footer className="fixed bottom-0 left-0 right-0 p-4 pb-10 bg-black/40 backdrop-blur-md border-t border-white/5">
           <div className="max-w-sm mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Global Frequency Active</span>
              </div>
              <button className="bg-white/10 px-6 py-1.5 rounded-full font-black uppercase italic text-[10px] border border-white/5 hover:bg-white/20 transition-all">Max bet</button>
           </div>
        </footer>

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}
