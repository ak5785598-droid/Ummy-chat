'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  Volume2, 
  VolumeX, 
  HelpCircle, 
  Trophy, 
  RefreshCcw, 
  Maximize2,
  X,
  Menu,
  ChevronDown,
  Activity,
  Crown
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const CHIPS = [
  { value: 5, color: 'bg-[#00E5FF] border-[#00E5FF]/50' },
  { value: 10, color: 'bg-[#2196F3] border-[#2196F3]/50' },
  { value: 100, color: 'bg-[#4CAF50] border-[#4CAF50]/50' },
  { value: 1000, label: '1K', color: 'bg-[#1A237E] border-[#1A237E]/50' },
  { value: 5000, label: '5K', color: 'bg-[#F44336] border-[#F44336]/50' },
];

const SIDE_BETS = [
  { id: 'PAIR', label: 'PAIR', multiplier: '5x' },
  { id: 'COLOR', label: 'COLOR', multiplier: '10x' },
  { id: 'SEQUENCE', label: 'SEQUENCE', multiplier: '15x' },
  { id: 'PURE_SEQ', label: 'PURE SEQ', multiplier: '100x' },
  { id: 'SET', label: 'SET', multiplier: '100x' },
];

export default function PyramidBattlePage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'calculating' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(13);
  const [selectedChip, setSelectedChip] = useState(5);
  const [myBets, setMyBets] = useState<Record<string, number>>({ BLUE: 0, RED: 0, PAIR: 0, COLOR: 0, SEQUENCE: 0, PURE_SEQ: 0, SET: 0 });
  const [totalBets, setTotalBets] = useState<Record<string, number>>({ BLUE: 0, RED: 0, PAIR: 0, COLOR: 0, SEQUENCE: 0, PURE_SEQ: 0, SET: 0 });
  const [history, setHistory] = useState<('RED' | 'BLUE')[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winner, setWinner] = useState<'RED' | 'BLUE' | null>(null);

  const audioCtxRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioCtxRef.current && typeof window !== 'undefined') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current?.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playBetSound = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }, [isMuted, initAudioContext]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 2000);
    setHistory(Array.from({ length: 24 }).map(() => Math.random() > 0.5 ? 'RED' : 'BLUE'));
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isLaunching) return;
    const interval = setInterval(() => {
      if (gameState === 'betting') {
        if (timeLeft > 0) setTimeLeft(prev => prev - 1);
        else transitionToCalculation();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const transitionToCalculation = () => {
    setGameState('calculating');
    setTimeout(() => {
      const winId = Math.random() > 0.5 ? 'RED' : 'BLUE';
      showResult(winId);
    }, 3000);
  };

  const showResult = (winId: 'RED' | 'BLUE') => {
    setWinner(winId);
    setHistory(prev => [winId, ...prev.slice(0, 23)]);
    setGameState('result');

    const winAmount = (myBets[winId] || 0) * 1.95;
    if (winAmount > 0 && currentUser && firestore) {
      const updateData = { 
        'wallet.coins': increment(Math.floor(winAmount)), 
        'stats.dailyGameWins': increment(Math.floor(winAmount)),
        updatedAt: serverTimestamp() 
      };
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
      updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    }

    setTimeout(() => {
      setMyBets({ BLUE: 0, RED: 0, PAIR: 0, COLOR: 0, SEQUENCE: 0, PURE_SEQ: 0, SET: 0 });
      setTotalBets({ BLUE: 0, RED: 0, PAIR: 0, COLOR: 0, SEQUENCE: 0, PURE_SEQ: 0, SET: 0 });
      setWinner(null);
      setGameState('betting');
      setTimeLeft(13);
    }, 5000);
  };

  const handlePlaceBet = (id: string) => {
    if (gameState !== 'betting' || !currentUser || !userProfile) return;
    if ((userProfile.wallet?.coins || 0) < selectedChip) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }
    
    playBetSound();
    const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    
    setMyBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
    setTotalBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip + Math.floor(Math.random() * 50) }));
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#3d2b1f] flex flex-col items-center justify-center space-y-6 font-headline">
        <div className="text-8xl animate-bounce">🏺</div>
        <h1 className="text-5xl font-black text-[#ffcc00] uppercase italic tracking-tighter drop-shadow-2xl">Pyramid Battle</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Syncing Guardian Frequencies...</p>
      </div>
    );
  }

  const backgroundAsset = PlaceHolderImages.find(img => img.id === 'pyramid-bg');
  const anubisAsset = PlaceHolderImages.find(img => img.id === 'anubis-char');
  const horusAsset = PlaceHolderImages.find(img => img.id === 'horus-char');
  const cardAsset = PlaceHolderImages.find(img => img.id === 'egypt-card');

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-[#1a0a05] flex flex-col relative overflow-hidden font-headline text-white select-none">
        <CompactRoomView />

        {/* Dynamic Background Layer */}
        <div className="absolute inset-0 z-0">
           {backgroundAsset && (
             <img 
               src={backgroundAsset.imageUrl} 
               className="h-full w-full object-cover opacity-70" 
               alt="Pyramid Background" 
               data-ai-hint="egyptian pyramid"
             />
           )}
           <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90" />
        </div>

        {/* Top Navigation Header */}
        <div className="relative z-[110] flex items-center justify-between p-4 pt-32">
           <div className="flex gap-1.5">
              <button className="bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/30 transition-all"><Maximize2 className="h-4 w-4" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/30 transition-all">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
              <button className="bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/30 transition-all"><HelpCircle className="h-4 w-4" /></button>
              <button className="bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/30 transition-all"><Trophy className="h-4 w-4" /></button>
           </div>
           
           <div className="flex items-center gap-2">
              <div className="h-px w-8 bg-gradient-to-r from-transparent to-yellow-500" />
              <h1 className="text-3xl font-black uppercase italic tracking-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">Pyramid Battle</h1>
              <div className="h-px w-8 bg-gradient-to-l from-transparent to-yellow-500" />
           </div>

           <div className="flex gap-1.5">
              <button className="bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/30 transition-all"><Menu className="h-4 w-4" /></button>
              <button className="bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/30 transition-all"><ChevronDown className="h-4 w-4" /></button>
              <button onClick={() => router.back()} className="bg-white/20 p-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg hover:bg-white/30 transition-all"><X className="h-4 w-4" /></button>
           </div>
        </div>

        {/* Character Arena & Hand Comparison */}
        <div className="relative z-10 flex-1 flex flex-col mt-2">
           
           <div className="flex justify-between items-center px-4 relative h-48">
              {/* Anubis (Left) */}
              <div className="w-1/4 h-full relative">
                 {anubisAsset && (
                   <img 
                    src={anubisAsset.imageUrl} 
                    className={cn(
                      "h-full object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-700",
                      winner === 'BLUE' ? "scale-110 brightness-110" : "scale-100 opacity-90"
                    )} 
                    alt="Anubis" 
                    data-ai-hint="anubis character" 
                   />
                 )}
              </div>

              {/* Hand Comparison Display */}
              <div className="flex-1 flex flex-col items-center justify-center gap-2">
                 <div className="flex items-center gap-4">
                    {/* Left Hand (BLUE) */}
                    <div className="relative group">
                       {winner === 'BLUE' && (
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                            <Crown className="h-8 w-8 text-yellow-400 drop-shadow-xl fill-yellow-400" />
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-black px-1.5 rounded uppercase">Winner</div>
                         </div>
                       )}
                       <div className={cn(
                         "bg-[#2a1a15]/80 backdrop-blur-md p-1.5 rounded-xl border-2 transition-all duration-500 shadow-2xl",
                         winner === 'BLUE' ? "border-yellow-400 scale-105" : "border-white/10"
                       )}>
                          <div className="flex gap-1 mb-1">
                             {[1, 2, 3].map(i => (
                               <div key={i} className="w-12 h-16 rounded-md bg-[#1a0a05] border border-white/5 overflow-hidden shadow-inner">
                                  {cardAsset && <img src={cardAsset.imageUrl} className="w-full h-full object-cover" alt="Card" />}
                               </div>
                             ))}
                          </div>
                          <div className="bg-black/60 rounded-lg py-1 px-3 text-center border border-white/5">
                             <span className="text-sm font-black italic text-yellow-500 uppercase">High card</span>
                          </div>
                       </div>
                    </div>

                    <div className="relative">
                       <span className="text-2xl font-black italic tracking-tighter text-blue-400 drop-shadow-[0_0_15px_rgba(37,99,235,0.8)]">VS</span>
                       <div className="absolute inset-0 bg-blue-500/10 blur-2xl animate-pulse" />
                    </div>

                    {/* Right Hand (RED) */}
                    <div className="relative group">
                       {winner === 'RED' && (
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                            <Crown className="h-8 w-8 text-yellow-400 drop-shadow-xl fill-yellow-400" />
                            <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-black px-1.5 rounded uppercase">Winner</div>
                         </div>
                       )}
                       <div className={cn(
                         "bg-[#2a1a15]/80 backdrop-blur-md p-1.5 rounded-xl border-2 transition-all duration-500 shadow-2xl",
                         winner === 'RED' ? "border-yellow-400 scale-105" : "border-white/10"
                       )}>
                          <div className="flex gap-1 mb-1">
                             {[1, 2, 3].map(i => (
                               <div key={i} className="w-12 h-16 rounded-md bg-[#1a0a05] border border-white/5 overflow-hidden shadow-inner">
                                  {cardAsset && <img src={cardAsset.imageUrl} className="w-full h-full object-cover" alt="Card" />}
                               </div>
                             ))}
                          </div>
                          <div className="bg-black/60 rounded-lg py-1 px-3 text-center border border-white/5">
                             <span className="text-sm font-black italic text-yellow-500 uppercase">High card</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Central Circular Countdown */}
                 <div className="relative mt-4">
                    <div className="w-16 h-16 rounded-full border-4 border-yellow-500/20 flex items-center justify-center bg-black/60 backdrop-blur-md shadow-[0_0_30px_rgba(0,0,0,0.5)] overflow-hidden">
                       <div 
                         className="absolute inset-0 border-4 border-yellow-500 rounded-full transition-all duration-1000 shadow-[inset_0_0_10px_rgba(234,179,8,0.5)]" 
                         style={{ clipPath: `inset(0 0 ${100 - (timeLeft/13)*100}% 0)` }} 
                       />
                       <span className="relative z-10 text-2xl font-black text-white italic drop-shadow-md">{timeLeft}</span>
                    </div>
                 </div>
              </div>

              {/* Horus (Right) */}
              <div className="w-1/4 h-full relative flex justify-end">
                 {horusAsset && (
                   <img 
                    src={horusAsset.imageUrl} 
                    className={cn(
                      "h-full object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-700",
                      winner === 'RED' ? "scale-110 brightness-110" : "scale-100 opacity-90"
                    )} 
                    alt="Horus" 
                    data-ai-hint="horus character" 
                   />
                 )}
              </div>
           </div>

           {/* History Bar */}
           <div className="px-4 py-3">
              <div className="bg-black/50 backdrop-blur-xl rounded-full h-12 border border-white/10 flex items-center gap-2 px-6 overflow-hidden relative group shadow-2xl">
                 {history.map((type, i) => (
                   <div 
                    key={i} 
                    className={cn(
                      "h-3.5 w-3.5 rounded-full shrink-0 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-all",
                      type === 'RED' ? "bg-[#F44336] shadow-red-500/20" : "bg-[#2196F3] shadow-blue-500/20",
                      i === 0 && "ring-2 ring-white scale-125 animate-pulse"
                    )} 
                   />
                 ))}
                 <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                    <Activity className="h-4 w-4 text-yellow-500" />
                    <span className="text-[8px] font-black uppercase text-yellow-500/80">Trends</span>
                 </div>
              </div>
           </div>

           {/* High-Fidelity Betting Grid */}
           <div className="px-4 pb-24 mt-2 space-y-2 flex-1 flex flex-col justify-end">
              {/* Main Wagers: BLUE vs RED */}
              <div className="flex gap-2 h-36">
                 {/* Blue Bet Box */}
                 <button 
                   onClick={() => handlePlaceBet('BLUE')}
                   disabled={gameState !== 'betting'}
                   className={cn(
                     "flex-1 relative rounded-[2rem] border-4 transition-all duration-300 overflow-hidden group active:scale-95 shadow-2xl",
                     "bg-gradient-to-br from-[#2196F3]/80 to-[#0D47A1]/80 border-blue-400/20",
                     winner === 'BLUE' ? "border-yellow-400 ring-8 ring-yellow-400/10 scale-105 z-20" : "hover:border-white/20"
                   )}
                 >
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 text-center z-10">
                       <span className="text-[10px] font-black text-white/60 tracking-widest">{(myBets.BLUE || 0)} / {(totalBets.BLUE || 0)}</span>
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter mt-1 drop-shadow-lg">BLUE</h3>
                       <span className="text-xs font-black text-yellow-400 tracking-wider">1.95x</span>
                    </div>
                    {/* Coin Reveal Layer */}
                    <div className="absolute inset-0 flex flex-wrap items-center justify-center p-6 gap-1 pointer-events-none opacity-90 pt-16">
                       {Array.from({ length: Math.min(20, Math.ceil((totalBets.BLUE || 0) / 10)) }).map((_, i) => (
                         <GoldCoinIcon key={i} className="h-4 w-4 text-yellow-500 filter drop-shadow-md animate-in zoom-in slide-in-from-top-4" style={{ animationDelay: `${i * 0.02}s` }} />
                       ))}
                    </div>
                 </button>

                 {/* Red Bet Box */}
                 <button 
                   onClick={() => handlePlaceBet('RED')}
                   disabled={gameState !== 'betting'}
                   className={cn(
                     "flex-1 relative rounded-[2rem] border-4 transition-all duration-300 overflow-hidden group active:scale-95 shadow-2xl",
                     "bg-gradient-to-br from-[#F44336]/80 to-[#B71C1C]/80 border-red-400/20",
                     winner === 'RED' ? "border-yellow-400 ring-8 ring-yellow-400/10 scale-105 z-20" : "hover:border-white/20"
                   )}
                 >
                    <div className="absolute top-3 left-1/2 -translate-x-1/2 text-center z-10">
                       <span className="text-[10px] font-black text-white/60 tracking-widest">{(myBets.RED || 0)} / {(totalBets.RED || 0)}</span>
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter mt-1 drop-shadow-lg">RED</h3>
                       <span className="text-xs font-black text-yellow-400 tracking-wider">1.95x</span>
                    </div>
                    <div className="absolute inset-0 flex flex-wrap items-center justify-center p-6 gap-1 pointer-events-none opacity-90 pt-16">
                       {Array.from({ length: Math.min(20, Math.ceil((totalBets.RED || 0) / 10)) }).map((_, i) => (
                         <GoldCoinIcon key={i} className="h-4 w-4 text-yellow-500 filter drop-shadow-md animate-in zoom-in slide-in-from-top-4" style={{ animationDelay: `${i * 0.02}s` }} />
                       ))}
                    </div>
                 </button>
              </div>

              {/* Side Bets Grid */}
              <div className="flex gap-1.5 h-28">
                 {SIDE_BETS.map(sb => (
                   <button 
                     key={sb.id}
                     onClick={() => handlePlaceBet(sb.id)}
                     disabled={gameState !== 'betting'}
                     className={cn(
                       "flex-1 relative rounded-2xl border-2 transition-all duration-300 overflow-hidden group active:scale-95 bg-[#b88a44]/90 border-yellow-600/30",
                       "hover:border-white/20 flex flex-col items-center justify-center text-center p-2 shadow-xl"
                     )}
                   >
                      <span className="text-[8px] font-black text-black/60">{(myBets[sb.id] || 0)} / {(totalBets[sb.id] || 0)}</span>
                      <h4 className="text-[10px] font-black uppercase leading-tight mt-1 text-black drop-shadow-sm">{sb.label}</h4>
                      <span className="text-xs font-black text-yellow-900/60">{sb.multiplier}</span>
                      <div className="absolute inset-0 flex flex-wrap items-center justify-center p-2 pointer-events-none opacity-70">
                         {Array.from({ length: Math.min(8, Math.ceil((totalBets[sb.id] || 0) / 5)) }).map((_, i) => (
                           <GoldCoinIcon key={i} className="h-2.5 w-2.5 text-yellow-700 animate-in zoom-in" style={{ animationDelay: `${i * 0.05}s` }} />
                         ))}
                      </div>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        {/* Immersive Footer: Wager Controls & Tribe Presence */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 pb-10 bg-gradient-to-t from-[#2a1a15] via-[#2a1a15]/90 to-transparent z-[120]">
           <div className="max-w-2xl mx-auto flex flex-col gap-4">
              
              <div className="flex items-center justify-between">
                 <button className="bg-black/60 p-3.5 rounded-2xl border border-white/10 text-white shadow-xl hover:bg-black/80 transition-all active:scale-90"><Users className="h-6 w-6" /></button>
                 
                 <div className="bg-black/80 backdrop-blur-2xl border-2 border-yellow-500/20 rounded-full flex items-center gap-3 pl-4 pr-1.5 py-1.5 shadow-2xl">
                    <div className="bg-yellow-500/10 p-1 rounded-full"><GoldCoinIcon className="h-6 w-6 text-yellow-500" /></div>
                    <span className="text-lg font-black text-yellow-500 italic tracking-tighter">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                    <button className="bg-yellow-500 text-black rounded-full h-8 w-8 flex items-center justify-center ml-2 shadow-lg hover:rotate-180 transition-transform duration-500"><RefreshCcw className="h-4 w-4" /></button>
                 </div>
              </div>

              <div className="flex items-center gap-4">
                 <button className="bg-gradient-to-b from-[#f5f5f5] to-[#bdbdbd] px-8 h-14 rounded-3xl font-black uppercase italic text-sm text-black shadow-2xl active:translate-y-1 active:border-b-0 transition-all border-b-[6px] border-gray-500 group">
                    <span className="group-active:scale-95 block">Repeat</span>
                 </button>

                 <div className="flex-1 bg-black/60 backdrop-blur-3xl p-2 rounded-[2rem] border-2 border-white/5 flex items-center justify-around gap-2 overflow-x-auto no-scrollbar shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    {CHIPS.map(chip => (
                      <button 
                       key={chip.value} 
                       onClick={() => setSelectedChip(chip.value)} 
                       className={cn(
                         "h-12 w-12 rounded-full flex items-center justify-center transition-all border-4 shrink-0 shadow-2xl relative",
                         chip.color,
                         selectedChip === chip.value ? "scale-110 border-white ring-4 ring-white/20 z-10 -translate-y-1" : "opacity-60 grayscale-[0.2] border-black/20 hover:opacity-100 hover:scale-105"
                       )}
                      >
                         <span className="text-xs font-black text-white italic drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">{chip.label || chip.value}</span>
                         {selectedChip === chip.value && <div className="absolute inset-0 rounded-full animate-ping bg-white/20" />}
                      </button>
                    ))}
                 </div>
              </div>
           </div>
        </footer>

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}
