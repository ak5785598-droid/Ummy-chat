
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Volume2,
  VolumeX,
  History,
  HelpCircle,
  Trophy,
  Users,
  RefreshCcw,
  MessageCircle,
  Plus,
  Clock,
  LayoutGrid
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const CHIPS = [
  { value: 20, color: 'bg-[#00E5FF] shadow-[#00E5FF]/50' },
  { value: 100, color: 'bg-[#4CAF50] shadow-[#4CAF50]/50' },
  { value: 1000, label: '1K', color: 'bg-[#FF9800] shadow-[#FF9800]/50' },
  { value: 10000, label: '10K', color: 'bg-[#F44336] shadow-[#F44336]/50' },
  { value: 100000, label: '100K', color: 'bg-[#9C27B0] shadow-[#9C27B0]/50' },
];

const SECTIONS = [
  { id: 'A', label: 'A', characterId: 'tp-char-a', color: 'border-white/20' },
  { id: 'B', label: 'B', characterId: 'tp-char-b', color: 'border-yellow-500/40' },
  { id: 'C', label: 'C', characterId: 'tp-char-c', color: 'border-amber-700/40' },
];

export default function TeenPattiPalacePage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'calculating' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({ A: 0, B: 0, C: 0 });
  const [lastBets, setLastBets] = useState<Record<string, number>>({ A: 0, B: 0, C: 0 });
  const [totalPots, setTotalPots] = useState<Record<string, number>>({ A: 0, B: 0, C: 0 });
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
  const [winner, setWinner] = useState<string | null>(null);
  const [winners, setWinners] = useState<any[]>([]);

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
      const winId = SECTIONS[Math.floor(Math.random() * 3)].id;
      showResult(winId);
    }, 3000);
  };

  const showResult = (winId: string) => {
    setWinner(winId);
    const winAmount = (myBets[winId] || 0) * 2.95;
    const sessionWinners = [];

    if (winAmount > 0 && userProfile) {
      sessionWinners.push({ name: userProfile.username, win: Math.floor(winAmount), avatar: userProfile.avatarUrl, isMe: true });
    }

    setWinners(sessionWinners);
    setGameState('result');

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
      setLastBets(myBets);
      setMyBets({ A: 0, B: 0, C: 0 });
      setTotalPots({ A: 0, B: 0, C: 0 });
      setWinner(null);
      setWinners([]);
      setGameState('betting');
      setTimeLeft(15);
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
    setTotalPots(prev => ({ ...prev, [id]: (prev[id] || 0) + selectedChip + Math.floor(Math.random() * 500) }));
  };

  const handleRepeat = () => {
    if (gameState !== 'betting' || !currentUser || !userProfile) return;
    const totalCost = Object.values(lastBets).reduce((a, b) => a + b, 0);
    if (totalCost === 0) return;
    if ((userProfile.wallet?.coins || 0) < totalCost) {
      toast({ variant: 'destructive', title: 'Insufficient Coins' });
      return;
    }

    playBetSound();
    const updateData = { 'wallet.coins': increment(-totalCost), updatedAt: serverTimestamp() };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
    setMyBets(lastBets);
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#1a0a05] flex flex-col items-center justify-center space-y-6">
        <div className="text-8xl animate-bounce">🏰</div>
        <h1 className="text-4xl font-black text-yellow-500 uppercase italic tracking-tighter">Teen Patti Palace</h1>
        <p className="text-white/40 uppercase tracking-widest text-[10px] animate-pulse">Entering the Ballroom...</p>
      </div>
    );
  }

  const backgroundAsset = PlaceHolderImages.find(img => img.id === 'teen-patti-bg');

  return (
    <AppLayout fullScreen>
      <div className="h-[100dvh] w-full bg-black flex flex-col relative overflow-hidden font-headline text-white animate-in fade-in duration-1000">
        <CompactRoomView />

        {/* Backdrop Layer */}
        <div className="absolute inset-0 z-0">
           {backgroundAsset && (
             <img 
               src={backgroundAsset.imageUrl} 
               className="h-full w-full object-cover opacity-40 grayscale-[0.2]" 
               alt={backgroundAsset.description} 
               data-ai-hint={backgroundAsset.imageHint}
             />
           )}
           <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/95" />
        </div>

        {/* Top Header UI */}
        <div className="relative z-[110] flex items-center justify-between p-4 pt-32">
           <div className="flex gap-2">
              <button onClick={() => router.back()} className="bg-black/40 p-2 rounded-full border border-white/10 backdrop-blur-md"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-black/40 p-2 rounded-full border border-white/10 backdrop-blur-md">
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <button className="bg-black/40 p-2 rounded-full border border-white/10 backdrop-blur-md"><HelpCircle className="h-5 w-5" /></button>
           </div>
           <div className="flex gap-2">
              <button className="bg-black/40 p-2 rounded-full border border-white/10 backdrop-blur-md"><LayoutGrid className="h-5 w-5" /></button>
              <button className="bg-black/40 p-2 rounded-full border border-white/10 backdrop-blur-md"><Clock className="h-5 w-5" /></button>
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full flex items-center gap-2 pl-2 pr-1 py-1 shadow-xl">
                <GoldCoinIcon className="h-5 w-5" />
                <span className="text-sm font-black text-yellow-500 italic">{(userProfile?.wallet?.coins || 0).toLocaleString()}</span>
                <button className="bg-yellow-500 text-black rounded-full h-6 w-6 flex items-center justify-center ml-1"><Plus className="h-4 w-4" /></button>
              </div>
           </div>
        </div>

        {/* Game Title Logo */}
        <div className="relative z-10 text-center flex flex-col items-center mt-2">
           <div className="relative">
              <h1 className="text-4xl font-black uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-500 to-yellow-700 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                Teenpatti
              </h1>
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 h-px bg-gradient-to-r from-transparent via-yellow-500 to-transparent" />
           </div>
           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-yellow-500/60 mt-1">Palace Ball</p>
        </div>

        {/* Central Arena */}
        <main className="flex-1 relative z-10 flex flex-col items-center pt-6">
           
           {/* Cards Layout */}
           <div className="w-full flex justify-around px-4 mb-10">
              {SECTIONS.map(s => (
                <div key={s.id} className="flex flex-col items-center gap-2">
                   <div className="flex gap-0.5">
                      {[1, 2, 3].map(i => (
                        <div key={i} className={cn(
                          "w-11 h-16 rounded-md border border-yellow-500/30 transition-all duration-500 bg-[#2a1a15] flex items-center justify-center overflow-hidden shadow-lg",
                          winner === s.id && "bg-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.6)] scale-110 -translate-y-2 border-white"
                        )}>
                           <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30" />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-8 h-8 border-2 border-yellow-500/20 rounded-full flex items-center justify-center">
                                 <div className="w-4 h-4 bg-yellow-500/10 rounded-full animate-pulse" />
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>
                   <div className="flex items-center gap-3">
                      <span className="text-2xl italic font-serif font-black text-yellow-500 drop-shadow-md">{s.label}</span>
                      <span className="text-xs font-black text-white/60">2.95</span>
                   </div>
                </div>
              ))}
           </div>

           {/* Circular Timer Centerpiece */}
           <div className="relative mb-10">
              <div className="w-20 h-20 rounded-full border-4 border-white/5 flex items-center justify-center bg-black/60 backdrop-blur-xl shadow-2xl overflow-hidden group">
                 <div 
                   className="absolute inset-0 border-4 border-yellow-500 rounded-full transition-all duration-1000" 
                   style={{ clipPath: `inset(0 0 ${100 - (timeLeft/15)*100}% 0)` }} 
                 />
                 <div className="relative z-10 flex flex-col items-center">
                    <span className="text-2xl font-black italic tracking-tighter leading-none">{timeLeft}s</span>
                 </div>
                 {/* Inner Glow */}
                 <div className="absolute inset-0 bg-yellow-500/10 animate-pulse" />
              </div>
           </div>

           {/* Character & Betting Boxes Area */}
           <div className="flex-1 w-full flex items-end justify-between px-4 pb-28 relative">
              {SECTIONS.map((s, idx) => {
                const asset = PlaceHolderImages.find(img => img.id === s.characterId);
                return (
                  <div key={s.id} className="relative w-1/3 h-full flex flex-col justify-end group">
                     {/* 3D Character Visual Stand */}
                     <div className={cn(
                       "absolute bottom-24 left-1/2 -translate-x-1/2 w-56 h-80 transition-all duration-1000 pointer-events-none transform-gpu flex items-end justify-center",
                       winner === s.id ? "scale-115 z-20" : "scale-100 z-10 opacity-90 grayscale-[0.1]"
                     )}>
                        {asset && (
                          <img 
                            src={asset.imageUrl} 
                            className="w-full h-full object-contain filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.9)]" 
                            alt={s.label} 
                            data-ai-hint={asset.imageHint}
                          />
                        )}
                     </div>

                     {/* Glass Betting Box */}
                     <button 
                       onClick={() => handlePlaceBet(s.id)}
                       disabled={gameState !== 'betting'}
                       className={cn(
                         "relative h-32 rounded-2xl border-2 transition-all duration-300 p-3 bg-black/50 backdrop-blur-md flex flex-col justify-between overflow-hidden active:scale-95 active:bg-yellow-500/10 z-30 shadow-2xl",
                         s.color,
                         winner === s.id ? "border-yellow-500 ring-4 ring-yellow-500/20" : "hover:border-white/20"
                       )}
                     >
                        {/* Realistic Coin Scatter Simulation */}
                        <div className="absolute inset-0 flex flex-wrap items-end justify-center p-2 opacity-80 pointer-events-none gap-0.5 overflow-hidden">
                           {Array.from({ length: Math.min(25, Math.ceil((totalPots[s.id] || 0) / 100)) }).map((_, i) => (
                             <GoldCoinIcon 
                               key={i} 
                               className="h-3 w-3 text-yellow-500 filter drop-shadow-sm animate-in zoom-in slide-in-from-top-4" 
                               style={{ animationDelay: `${i * 0.05}s` }}
                             />
                           ))}
                        </div>

                        <div className="mt-auto relative z-40 text-center sm:text-left">
                           <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Pot: <span className="text-white">{totalPots[s.id].toLocaleString()}</span></p>
                           <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">You: <span className="text-yellow-500">{myBets[s.id].toLocaleString()}</span></p>
                        </div>
                     </button>
                  </div>
                );
              })}
           </div>
        </main>

        {/* Footer Navigation & Controls */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 pb-10 bg-gradient-to-t from-black via-black/90 to-transparent z-[120]">
           <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
              {/* Chip Selector Bar */}
              <div className="bg-black/60 backdrop-blur-2xl p-2 rounded-full border border-white/10 flex items-center gap-2 flex-1 overflow-x-auto no-scrollbar shadow-2xl">
                 {CHIPS.map(chip => (
                   <button 
                    key={chip.value} 
                    onClick={() => setSelectedChip(chip.value)} 
                    className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center transition-all border-2 border-white/10 shrink-0 shadow-lg relative group",
                      chip.color,
                      selectedChip === chip.value ? "scale-115 border-white ring-4 ring-white/30 z-10" : "opacity-60 hover:opacity-100"
                    )}
                   >
                      <span className="text-[11px] font-black text-white italic drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">{chip.label || chip.value}</span>
                      {selectedChip === chip.value && (
                        <div className="absolute -top-1 -right-1 bg-white rounded-full h-4 w-4 flex items-center justify-center shadow-md animate-in zoom-in">
                           <RefreshCcw className="h-2 w-2 text-black" />
                        </div>
                      )}
                   </button>
                 ))}
              </div>
              
              {/* Participant List Access */}
              <button className="bg-white/10 p-3.5 rounded-full border border-white/10 backdrop-blur-md text-white hover:bg-white/20 active:scale-90 transition-all">
                 <Users className="h-6 w-6" />
              </button>

              {/* Repeat Action */}
              <button 
                onClick={handleRepeat}
                className="bg-[#dcdcdc] px-8 h-12 rounded-full font-black uppercase italic text-sm text-black shadow-xl active:scale-95 transition-all border-b-4 border-gray-400 hover:brightness-110"
              >
                Repeat
              </button>
           </div>
        </footer>

        {/* Tribe Winner Overlay */}
        {gameState === 'result' && winners.length > 0 && (
          <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md animate-in zoom-in duration-500 p-6">
             <Trophy className="h-24 w-24 text-yellow-400 animate-bounce mb-6 filter drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
             <h2 className="text-6xl font-black text-white uppercase italic tracking-tighter text-center mb-8 drop-shadow-lg">Tribe Winner</h2>
             <div className="flex flex-col items-center gap-6 p-8 bg-white/5 rounded-[3rem] border-2 border-yellow-500/20 shadow-2xl">
                <Avatar className="h-32 w-32 border-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                   <AvatarImage src={winners[0].avatar} />
                   <AvatarFallback className="bg-slate-800 text-4xl">W</AvatarFallback>
                </Avatar>
                <div className="text-center space-y-2">
                   <p className="text-3xl font-black text-white uppercase italic tracking-tight">{winners[0].name}</p>
                   <p className="text-4xl font-black text-yellow-500 italic drop-shadow-sm">+{winners[0].win.toLocaleString()} Coins</p>
                </div>
             </div>
          </div>
        )}

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </div>
    </AppLayout>
  );
}
