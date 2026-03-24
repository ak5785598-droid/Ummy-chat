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
 Users,
 LayoutGrid,
 Move
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const CHIPS = [
 { value: 5, color: 'bg-[#00E5FF] border-[#00E5FF]/50 shadow-[0_0_15px_rgba(0,229,255,0.4)]' },
 { value: 10, color: 'bg-[#2196F3] border-[#2196F3]/50 shadow-[0_0_15px_rgba(33,150,243,0.4)]' },
 { value: 100, color: 'bg-[#4CAF50] border-[#4CAF50]/50 shadow-[0_0_15px_rgba(76,175,80,0.4)]' },
 { value: 1000, label: '1000', color: 'bg-[#1A237E] border-[#1A237E]/50 shadow-[0_0_15px_rgba(26,35,126,0.4)]' },
 { value: 5000, label: '5000', color: 'bg-[#F44336] border-[#F44336]/50 shadow-[0_0_15px_rgba(244,67,54,0.4)]' },
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
 const [timeLeft, setTimeLeft] = useState(17);
 const [selectedChip, setSelectedChip] = useState(5);
 const [myBets, setMyBets] = useState<Record<string, number>>({ BLUE: 0, RED: 0, PAIR: 0, COLOR: 0, SEQUENCE: 0, PURE_SEQ: 0, SET: 0 });
 const [totalBets, setTotalBets] = useState<Record<string, number>>({ BLUE: 0, RED: 1000, PAIR: 100, COLOR: 0, SEQUENCE: 0, PURE_SEQ: 0, SET: 0 });
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
   setTotalBets({ BLUE: 0, RED: 1000, PAIR: 100, COLOR: 0, SEQUENCE: 0, PURE_SEQ: 0, SET: 0 });
   setWinner(null);
   setGameState('betting');
   setTimeLeft(17);
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
  setTotalBets(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip }));
 };

 if (isLaunching) {
  return (
   <div className="h-screen w-full bg-[#3d2b1f] flex flex-col items-center justify-center space-y-6 font-sans">
    <div className="text-8xl animate-bounce">🏺</div>
    <h1 className="text-5xl font-bold text-[#ffcc00] uppercase tracking-tight drop-shadow-2xl">Pyramid Battle</h1>
    <p className="text-white/40 uppercase tracking-wider text-[10px] animate-pulse">Syncing Guardian Frequencies...</p>
   </div>
  );
 }

 const backgroundAsset = PlaceHolderImages.find(img => img.id === 'pyramid-bg');
 const anubisAsset = PlaceHolderImages.find(img => img.id === 'anubis-char');
 const horusAsset = PlaceHolderImages.find(img => img.id === 'horus-char');
 const cardAsset = PlaceHolderImages.find(img => img.id === 'egypt-card');

 return (
  <AppLayout fullScreen>
   <div className="h-[100dvh] w-full bg-[#1a0a05] flex flex-col relative overflow-hidden font-sans text-white select-none">
    <CompactRoomView />

    <div className="absolute inset-0 z-0">
      {backgroundAsset && (
       <img 
        src={backgroundAsset.imageUrl} 
        className="h-full w-full object-cover opacity-80" 
        alt="Pyramid Background" 
        data-ai-hint="egyptian pyramid sunset"
       />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80" />
    </div>

    <div className="relative z-[110] flex items-center justify-between p-4 pt-32">
      <div className="flex gap-1.5">
       <button className="bg-white/20 p-2 rounded-full backdrop-blur-md shadow-lg active:scale-90 transition-all border border-white/10"><Move className="h-4 w-4" /></button>
       <button onClick={() => setIsMuted(!isMuted)} className="bg-white/20 p-2 rounded-full backdrop-blur-md shadow-lg active:scale-90 transition-all border border-white/10">
        {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
       </button>
       <button className="bg-white/20 p-2 rounded-full backdrop-blur-md shadow-lg active:scale-90 transition-all border border-white/10"><HelpCircle className="h-4 w-4" /></button>
       <button className="bg-white/20 p-2 rounded-full backdrop-blur-md shadow-lg active:scale-90 transition-all border border-white/10"><LayoutGrid className="h-4 w-4" /></button>
      </div>
      
      <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-lg" style={{ fontFamily: 'serif' }}>Pyramid Battle</h1>

      <div className="flex gap-1.5">
       <button className="bg-white/20 p-2 rounded-full backdrop-blur-md shadow-lg active:scale-90 transition-all border border-white/10"><Menu className="h-4 w-4" /></button>
       <button className="bg-white/20 p-2 rounded-full backdrop-blur-md shadow-lg active:scale-90 transition-all border border-white/10"><ChevronDown className="h-4 w-4" /></button>
       <button onClick={() => router.back()} className="bg-white/20 p-2 rounded-full backdrop-blur-md shadow-lg active:scale-90 transition-all border border-white/10"><X className="h-4 w-4" /></button>
      </div>
    </div>

    <div className="relative z-10 flex flex-col mt-4">
      <div className="flex justify-between items-end px-4 relative h-44">
       <div className="w-1/4 h-full relative animate-float-guardian">
         {anubisAsset && (
          <img 
          src={anubisAsset.imageUrl} 
          className={cn(
           "h-full object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-700",
           winner === 'BLUE' ? "scale-110 brightness-110" : "scale-100 opacity-90"
          )} 
          alt="Anubis" 
          />
         )}
       </div>

       <div className="flex-1 flex flex-col items-center justify-center gap-2 mb-4">
         <div className="flex items-center gap-4 relative">
          <div className="relative">
            {winner === 'BLUE' && (
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-bounce">
              <img src="https://img.icons8.com/color/96/000000/crown.png" className="h-10 w-10 drop-shadow-xl" alt="Winner" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded uppercase ">WINNER</div>
             </div>
            )}
            <div className={cn(
             "bg-black/60 p-1 rounded-xl border-2 transition-all duration-500 shadow-2xl",
             winner === 'BLUE' ? "border-yellow-400 scale-105" : "border-white/10"
            )}>
             <div className="flex gap-0.5 mb-1">
               {[1, 2, 3].map(i => (
                <div key={i} className="w-11 h-14 rounded-md bg-[#1a0a05] border border-white/5 overflow-hidden">
                 {cardAsset && <img src={cardAsset.imageUrl} className="w-full h-full object-cover" alt="Card" />}
                </div>
               ))}
             </div>
             <div className="bg-black/80 rounded-md py-0.5 px-2 text-center">
               <span className="text-xs font-bold text-yellow-500 uppercase">High card</span>
             </div>
            </div>
          </div>

          <div className="relative flex flex-col items-center">
            <div className="text-xl font-bold flex items-center gap-1 drop-shadow-md">
             <span className="text-blue-400">V</span>
             <span className="text-red-400">S</span>
            </div>
            <div className="mt-2 w-12 h-12 rounded-full border-2 border-yellow-500/40 flex items-center justify-center bg-black/60 backdrop-blur-md shadow-2xl relative overflow-hidden">
             <div className="absolute inset-0 border-2 border-yellow-500 rounded-full transition-all duration-1000" style={{ clipPath: `inset(0 0 ${100 - (timeLeft/17)*100}% 0)` }} />
             <span className="relative z-10 text-lg font-bold text-white ">{timeLeft}</span>
            </div>
          </div>

          <div className="relative">
            {winner === 'RED' && (
             <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 animate-bounce">
              <img src="https://img.icons8.com/color/96/000000/crown.png" className="h-10 w-10 drop-shadow-xl" alt="Winner" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-bold px-1 rounded uppercase ">WINNER</div>
             </div>
            )}
            <div className={cn(
             "bg-black/60 p-1 rounded-xl border-2 transition-all duration-500 shadow-2xl",
             winner === 'RED' ? "border-yellow-400 scale-105" : "border-white/10"
            )}>
             <div className="flex gap-0.5 mb-1">
               {[1, 2, 3].map(i => (
                <div key={i} className="w-11 h-14 rounded-md bg-[#1a0a05] border border-white/5 overflow-hidden">
                 {cardAsset && <img src={cardAsset.imageUrl} className="w-full h-full object-cover" alt="Card" />}
                </div>
               ))}
             </div>
             <div className="bg-black/80 rounded-md py-0.5 px-2 text-center">
               <span className="text-xs font-bold text-yellow-500 uppercase">High card</span>
             </div>
            </div>
          </div>
         </div>
       </div>

       <div className="w-1/4 h-full relative flex justify-end animate-float-guardian" style={{ animationDelay: '0.5s' }}>
         {horusAsset && (
          <img 
          src={horusAsset.imageUrl} 
          className={cn(
           "h-full object-contain filter drop-shadow-[0_0_30px_rgba(0,0,0,0.8)] transition-all duration-700",
           winner === 'RED' ? "scale-110 brightness-110" : "scale-100 opacity-90"
          )} 
          alt="Horus" 
          />
         )}
       </div>
      </div>

      <div className="px-4 py-2">
       <div className="bg-black/50 backdrop-blur-xl rounded-full h-10 border border-white/10 flex items-center gap-1.5 px-4 overflow-hidden relative group shadow-inner">
         {history.map((type, i) => (
          <div 
          key={i} 
          className={cn(
           "h-3 w-3 rounded-full shrink-0 shadow-[0_0_5px_rgba(0,0,0,0.5)]",
           type === 'RED' ? "bg-red-600" : "bg-blue-600",
           i === 0 && "ring-1 ring-white animate-pulse"
          )} 
          />
         ))}
         <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-yellow-500/20 p-1 rounded-md border border-yellow-500/30">
          <LayoutGrid className="h-3 w-3 text-yellow-500" />
         </div>
       </div>
      </div>

      <div className="px-2 mt-2 space-y-1.5">
       <div className="relative rounded-2xl p-1.5 shadow-2xl overflow-hidden bg-black/40 border-[6px] border-[#b88a44] border-image-stripe">
         
         <div className="flex gap-1.5 h-36">
          <button 
           onClick={() => handlePlaceBet('BLUE')}
           disabled={gameState !== 'betting'}
           className={cn(
            "flex-1 relative rounded-tl-[1.5rem] rounded-tr-sm rounded-bl-sm rounded-br-sm border-2 transition-all duration-300 overflow-hidden group active:scale-95",
            "bg-gradient-to-br from-blue-600/80 to-blue-900/80 border-blue-400/20",
            winner === 'BLUE' && "border-yellow-400 ring-4 ring-yellow-400/20 z-20"
           )}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center z-10">
             <span className="text-[10px] font-bold text-white/80">{myBets.BLUE}/{totalBets.BLUE}</span>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <h2 className="text-3xl font-bold tracking-tight text-blue-200 drop-shadow-lg">BLUE</h2>
             <span className="text-xs font-bold text-blue-200/60 mt-1">1.95x</span>
            </div>
            <div className="absolute inset-0 flex flex-wrap items-center justify-center p-4 gap-0.5 opacity-90 pointer-events-none overflow-hidden">
             {Array.from({ length: Math.min(20, Math.ceil(totalBets.BLUE / 100)) }).map((_, i) => (
              <GoldCoinIcon key={i} className="h-4 w-4 text-yellow-500 drop-shadow-md animate-in zoom-in" style={{ animationDelay: `${i * 0.01}s` }} />
             ))}
            </div>
          </button>

          <button 
           onClick={() => handlePlaceBet('RED')}
           disabled={gameState !== 'betting'}
           className={cn(
            "flex-1 relative rounded-tr-[1.5rem] rounded-tl-sm rounded-bl-sm rounded-br-sm border-2 transition-all duration-300 overflow-hidden group active:scale-95",
            "bg-gradient-to-br from-red-600/80 to-red-900/80 border-red-400/20",
            winner === 'RED' && "border-yellow-400 ring-4 ring-yellow-400/20 z-20"
           )}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 text-center z-10">
             <span className="text-[10px] font-bold text-white/80">{myBets.RED}/{totalBets.RED}</span>
            </div>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <h2 className="text-3xl font-bold tracking-tight text-red-200 drop-shadow-lg">RED</h2>
             <span className="text-xs font-bold text-red-200/60 mt-1">1.95x</span>
            </div>
            <div className="absolute inset-0 flex flex-wrap items-center justify-center p-4 gap-0.5 opacity-90 pointer-events-none overflow-hidden">
             {Array.from({ length: Math.min(20, Math.ceil(totalBets.RED / 100)) }).map((_, i) => (
              <GoldCoinIcon key={i} className="h-4 w-4 text-yellow-500 drop-shadow-md animate-in zoom-in" style={{ animationDelay: `${i * 0.01}s` }} />
             ))}
            </div>
          </button>
         </div>

         <div className="flex gap-1 mt-1.5 h-24">
          {SIDE_BETS.map(sb => (
           <button 
            key={sb.id}
            onClick={() => handlePlaceBet(sb.id)}
            disabled={gameState !== 'betting'}
            className="flex-1 relative rounded-lg border-2 border-yellow-600/30 bg-[#b88a44]/80 flex flex-col items-center justify-center group active:scale-95 overflow-hidden"
           >
             <span className="text-[8px] font-bold text-black/60 mb-1">{myBets[sb.id]}/{totalBets[sb.id]}</span>
             <h4 className="text-[10px] font-bold uppercase text-black leading-none">{sb.label}</h4>
             <span className="text-[8px] font-bold text-yellow-900/60 mt-0.5">{sb.multiplier}</span>
             <div className="absolute inset-0 flex flex-wrap items-center justify-center p-1 pointer-events-none gap-px opacity-60">
              {Array.from({ length: Math.min(8, Math.ceil(totalBets[sb.id] / 50)) }).map((_, i) => (
               <GoldCoinIcon key={i} className="h-2 w-2 text-yellow-800" />
              ))}
             </div>
           </button>
          ))}
         </div>
       </div>
      </div>
    </div>

    <footer className="fixed bottom-0 left-0 right-0 p-4 pb-10 bg-gradient-to-t from-[#3d2b1f] to-transparent z-[120] font-sans">
      <div className="max-w-xl mx-auto space-y-4">
       <div className="flex items-center justify-between px-2">
         <button className="bg-black/60 p-2.5 rounded-2xl border border-white/10 text-white shadow-xl hover:bg-black/60 transition-all active:scale-90">
          <Users className="h-5 w-5" />
         </button>
         
         <div className="bg-black/60 border-2 border-yellow-500/20 rounded-full flex items-center gap-2 pl-3 pr-1 py-1 shadow-2xl">
          <GoldCoinIcon className="h-5 w-5 text-yellow-500" />
          <span className="text-sm font-bold text-yellow-500 ">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
          <button className="bg-yellow-500 text-black rounded-full h-6 w-6 flex items-center justify-center ml-1 shadow-lg hover:rotate-180 transition-transform duration-500">
            <RefreshCcw className="h-3 w-3" />
          </button>
         </div>
       </div>

       <div className="flex items-center gap-3 bg-[#3d2b1f]/90 p-2 rounded-full border-4 border-[#5d4037] shadow-2xl">
         <button onClick={() => {}} className="bg-[#dcdcdc] px-6 h-10 rounded-full font-bold uppercase text-[10px] text-black shadow-lg active:translate-y-0.5 transition-all border-b-2 border-gray-400">
          Repeat
         </button>

         <div className="flex-1 flex justify-around items-center gap-1.5">
          {CHIPS.map(chip => (
           <button 
            key={chip.value} 
            onClick={() => setSelectedChip(chip.value)} 
            className={cn(
             "h-11 w-11 rounded-full flex items-center justify-center transition-all border-2 shrink-0 shadow-xl relative",
             chip.color,
             selectedChip === chip.value ? "scale-110 border-white ring-2 ring-white/30 z-10 -translate-y-1" : "opacity-60 grayscale-[0.2] border-black/20 hover:opacity-100"
            )}
           >
             <span className="text-[10px] font-bold text-white drop-shadow-md">{chip.label || chip.value}</span>
             {selectedChip === chip.value && <div className="absolute inset-0 rounded-full animate-ping bg-white/10" />}
           </button>
          ))}
         </div>
       </div>
      </div>
    </footer>

    <style jsx global>{`
     .no-scrollbar::-webkit-scrollbar { display: none; }
     .border-image-stripe {
      border-image: repeating-linear-gradient(45deg, #b88a44, #b88a44 10px, #a67c3c 10px, #a67c3c 20px) 30;
     }
     @keyframes float-guardian {
      0%, 100% { transform: translateY(0) scale(1); }
      50% { transform: translateY(-10px) scale(1.02); }
     }
     .animate-float-guardian {
      animation: float-guardian 4s ease-in-out infinite;
     }
    `}</style>
   </div>
  </AppLayout>
 );
}
