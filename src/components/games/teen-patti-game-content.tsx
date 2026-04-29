'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, increment, serverTimestamp, getDoc, collection, query, where, orderBy, limit } from 'firebase/firestore';
import {
  ChevronLeft,
  Volume2,
  VolumeX,
  X,
  Move,
  Plus,
  HelpCircle,
  Gift,
  Menu,
  ChevronDown
} from 'lucide-react';
import { CompactRoomView } from '@/components/compact-room-view';
import { GoldCoinIcon, UmmyLogoIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { GameResultOverlay, GameWinner } from '@/components/game-result-overlay';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

const CHIPS = [
 { value: 10000, label: '10k', color: 'bg-[#00E5FF] border-[#00E5FF]/50 shadow-[#00E5FF]/40' },
 { value: 100000, label: '100k', color: 'bg-[#2196F3] border-[#2196F3]/50 shadow-[#2196F3]/40' },
 { value: 300000, label: '300k', color: 'bg-[#9C27B0] border-[#9C27B0]/50 shadow-[#9C27B0]/40' },
 { value: 1000000, label: '1000k', color: 'bg-[#F44336] border-[#F44336]/50 shadow-[#F44336]/40' },
 { value: 2000000, label: '2000k', color: 'bg-[#795548] border-[#795548]/50 shadow-[#795548]/40' },
 { value: 5000000, label: '5000k', color: 'bg-[#FFD700] border-[#FFD700]/50 shadow-[#FFD700]/40' },
];

const FACTIONS = [
 { id: 'WOLF', label: 'BLUE', bannerUrl: 'https://img.icons8.com/color/144/game-of-thrones-stark.png' },
 { id: 'LION', label: 'RED', bannerUrl: 'https://img.icons8.com/color/144/game-of-thrones-lannister.png' },
 { id: 'FISH', label: 'PAIR', bannerUrl: 'https://img.icons8.com/color/144/game-of-thrones-tully.png' },
];

const CARDS = ['A', 'JOKER', 'B', 'K', 'Q', '10', '9'];

interface TeenPattiGameContentProps {
  isOverlay?: boolean;
  onClose?: () => void;
}

export function TeenPattiGameContent({ isOverlay = false, onClose }: TeenPattiGameContentProps) {
  const router = useRouter();
  const dragControls = useDragControls();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'reveal' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(10000);
  const [myBets, setMyBets] = useState<Record<string, number>>({ WOLF: 0, LION: 0, FISH: 0 });
  const [totalPots, setTotalPots] = useState<Record<string, number>>({ WOLF: 0, LION: 650000, FISH: 800000 });
  const [history, setHistory] = useState<string[]>(['WOLF', 'LION', 'FISH', 'WOLF', 'LION', 'WOLF', 'LION', 'FISH', 'WOLF', 'LION']);
  const [isMuted, setIsMuted] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [isLaunching, setIsLaunching] = useState(true);
  const [cardReveal, setCardReveal] = useState<Record<string, string[]>>({});
  const [winners, setWinners] = useState<GameWinner[]>([]);
  const [totalWinAmount, setTotalWinAmount] = useState(0);

  const winnersQuery = useMemoFirebase(() => {
     if (!firestore) return null;
     return query(
       collection(firestore, 'globalGameWins'),
       where('gameId', '==', 'teen-patti'),
       orderBy('timestamp', 'desc'),
       limit(5)
     );
   }, [firestore]);

   const { data: liveWins } = useCollection(winnersQuery);

  useEffect(() => { setTimeout(() => setIsLaunching(false), 1500); }, []);

  useEffect(() => {
   if (isLaunching) return;
   const interval = setInterval(() => {
    if (gameState === 'betting') {
     if (timeLeft > 0) setTimeLeft(prev => prev - 1);
     else startReveal();
    }
   }, 1000);
   return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startReveal = async () => {
   setGameState('reveal');
   const newCards: Record<string, string[]> = {};
   FACTIONS.forEach(f => { newCards[f.id] = [CARDS[Math.floor(Math.random() * CARDS.length)], CARDS[Math.floor(Math.random() * CARDS.length)], CARDS[Math.floor(Math.random() * CARDS.length)]]; });
   setCardReveal(newCards);

   let winId = FACTIONS[Math.floor(Math.random() * FACTIONS.length)].id;
   if (firestore) {
    try {
     const oracleSnap = await getDoc(doc(firestore, 'gameOracle', 'teen-patti'));
     if (oracleSnap.exists() && oracleSnap.data().isActive) {
      winId = oracleSnap.data().forcedResult;
      updateDocumentNonBlocking(doc(firestore, 'gameOracle', 'teen-patti'), { isActive: false });
     }
    } catch (e) {}
   }

   setTimeout(() => { finalizeRound(winId); }, 3000);
  };

  const finalizeRound = (winId: string) => {
   setWinnerId(winId); setHistory(prev => [winId,...prev.slice(0, 9)]); setGameState('result');
   const winAmount = (myBets[winId] || 0) * 1.95;
   setTotalWinAmount(winAmount);

   setWinners(liveWins?.map(w => ({
     name: w.username,
     win: w.amount,
     avatar: w.avatarUrl,
     isMe: w.userId === currentUser?.uid
   })) || []);

   if (winAmount > 0 && currentUser && firestore && userProfile) {
    const updateData = {
      'wallet.coins': increment(Math.floor(winAmount)),
      'stats.dailyGameWins': increment(Math.floor(winAmount)),
      updatedAt: serverTimestamp()
    };
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
    updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);

    addDocumentNonBlocking(collection(firestore, 'globalGameWins'), {
     gameId: 'teen-patti',
     userId: currentUser.uid,
     username: userProfile?.username || 'Guest',
     avatarUrl: userProfile?.avatarUrl || null,
     amount: Math.floor(winAmount),
     timestamp: serverTimestamp()
    });

    const questRef = doc(firestore, 'users', currentUser.uid, 'quests', 'win_game');
    updateDocumentNonBlocking(questRef, { current: increment(1), updatedAt: serverTimestamp() });
   }

   setTimeout(() => { setMyBets({ WOLF: 0, LION: 0, FISH: 0 }); setTotalPots({ WOLF: Math.floor(Math.random()*50000), LION: 650000, FISH: 800000 }); setWinnerId(null); setGameState('betting'); setTimeLeft(20); setCardReveal({}); }, 5000);
  };

  const handlePlaceBet = (id: string) => {
   if (gameState!== 'betting' ||!currentUser ||!userProfile) return;
   if ((userProfile.wallet?.coins || 0) < selectedChip) { toast({ variant: 'destructive', title: 'Insufficient Coins' }); return; }
   const updateData = { 'wallet.coins': increment(-selectedChip), updatedAt: serverTimestamp() };
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid), updateData);
   updateDocumentNonBlocking(doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid), updateData);
   setMyBets(prev => ({...prev, [id]: (prev[id] || 0) + selectedChip }));
   setTotalPots(prev => ({...prev, [id]: (prev[id] || 0) + selectedChip }));
  };

  const handleBack = () => {
    if (onClose) onClose();
    else router.back();
  };

  const winnerBanner = winnerId? FACTIONS.find(f => f.id === winnerId)?.bannerUrl : null;

  return (
   <motion.div
     drag
     dragControls={dragControls}
     dragListener={false}
     dragMomentum={false}
     initial={isOverlay? { y: '5%' } : {}}
     className={cn(
       "h-[95vh] w-full max-w-[420px] mx-auto flex flex-col relative overflow-hidden text-white select-none rounded-[24px] border-2 border-[#2a2e5a] shadow-2xl",
      !isOverlay && "min-h-screen"
     )}
     style={{background: '#0b0e2a'}}
   >
    {/* BG */}
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e2150_0%,_#0b0e2a_70%)]" />
      <div className="absolute inset-0 opacity-20" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}} />
    </div>

    {gameState === 'result' && winnerId && (
     <GameResultOverlay
      gameId="teen-patti"
      winningSymbol={<img src={winnerBanner || ''} className="h-16 w-16 object-contain" alt="Winner" />}
      winAmount={totalWinAmount}
      winners={winners}
     />
    )}

    {/* TOP BAR - Royal Battle */}
    <header className="relative z-50 flex items-center justify-between px-3 pt-3 pb-2">
      <div className="flex items-center gap-1.5">
        <button onPointerDown={(e) => dragControls.start(e)} className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center active:scale-90"><Move className="w-4 h-4" /></button>
        <button onClick={() => setIsMuted(!isMuted)} className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center active:scale-90">{isMuted? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}</button>
        <button className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"><HelpCircle className="w-4 h-4"/></button>
        <button className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"><Gift className="w-4 h-4"/></button>
      </div>

      <h1 className="text-[22px] font-extrabold tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" style={{fontFamily: 'system-ui', textShadow: '0 0 10px #6b5bff'}}>Royal Battle</h1>

      <div className="flex items-center gap-1.5">
        <button className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"><Menu className="w-4 h-4"/></button>
        <button className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center"><ChevronDown className="w-4 h-4"/></button>
        <button onClick={handleBack} className="w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center text-white/80"><X className="w-4 h-4"/></button>
      </div>
    </header>

    {/* KING - QUEEN - CARDS AREA */}
    <div className="relative z-10 px-3 mt-1">
      <div className="relative h-[145px] flex items-end justify-between">
        {/* LEFT KING - SVGA PLACEHOLDER */}
        <div className="relative w-[75px] h-[110px] -mb-2">
          {/* Yaha apni king.svga daal dena */}
          <img src="https://i.ibb.co/3y5Kq0D/king-cartoon.png" alt="king" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>

        {/* CARDS */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 flex items-center gap-1">
          {/* Blue side 3 cards */}
          <div className="flex gap-0.5">
            {[0,1,2].map(i => (
              <div key={`b${i}`} className="w-[48px] h-[68px] rounded-[4px] bg-[#c41e3a] border-2 border-[#ff3b5c] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute inset-[3px] bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.1)_3px,rgba(255,255,255,0.1)_6px)]" />
                {gameState!== 'betting' && (
                  <div className="absolute inset-0 bg-white flex items-center justify-center animate-[flip_0.6s]">
                    <span className="text-black font-bold text-lg">{cardReveal['WOLF']?.[i] || '?'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* VS CROWN */}
          <div className="relative mx-1 w-[70px] h-[75px] flex flex-col items-center justify-center">
            <img src="https://img.icons8.com/fluency/96/crown.png" className="w-14 h-14 absolute -top-1" alt="crown"/>
            <div className="mt-8 bg-gradient-to-b from-[#ffd700] to-[#ff8c00] px-3 py-0.5 rounded-md border-2 border-[#fff3a0] shadow-lg">
              <span className="text-[22px] font-black text-white drop-shadow-[0_2px_0_#b45309] italic" style={{fontFamily:'serif'}}>{gameState==='betting'? 'Start' : timeLeft}</span>
            </div>
          </div>

          {/* Red side 3 cards */}
          <div className="flex gap-0.5">
            {[0,1,2].map(i => (
              <div key={`r${i}`} className="w-[48px] h-[68px] rounded-[4px] bg-[#c41e3a] border-2 border-[#ff3b5c] shadow-[inset_0_0_10px_rgba(0,0,0,0.5)] relative overflow-hidden">
                <div className="absolute inset-[3px] bg-[repeating-linear-gradient(45deg,transparent,transparent_3px,rgba(255,255,255,0.1)_3px,rgba(255,255,255,0.1)_6px)]" />
                {gameState!== 'betting' && (
                  <div className="absolute inset-0 bg-white flex items-center justify-center">
                    <span className="text-black font-bold text-lg">{cardReveal['LION']?.[i] || '?'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT QUEEN - SVGA PLACEHOLDER */}
        <div className="relative w-[75px] h-[110px] -mb-2">
          <img src="https://i.ibb.co/7Y6K7Yd/queen-cartoon.png" alt="queen" className="w-full h-full object-contain drop-shadow-2xl" />
        </div>
      </div>

      {/* HISTORY DOTS */}
      <div className="mt-2 flex items-center gap-1.5 px-1">
        <div className="flex-1 flex gap-1 overflow-x-auto no-scrollbar">
          {history.slice(0,14).map((h,i)=>(
            <div key={i} className={cn("w-4 h-4 rounded-full border-2 border-[#1a1f4a] shrink-0", h==='WOLF'? 'bg-[#2563eb]' : h==='LION'? 'bg-[#dc2626]' : 'bg-[#16a34a]')} />
          ))}
        </div>
        <button className="w-12 h-7 rounded-md bg-[#ff5a1f] border-2 border-[#ff8a4c] flex items-center justify-center shadow-md">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/>
            <div className="w-1.5 h-1.5 bg-white rounded-full"/><div className="w-1.5 h-1.5 bg-white rounded-full"/>
          </div>
        </button>
      </div>
    </div>

    {/* BETTING AREA - EXACT LIKE IMAGE */}
    <main className="relative z-10 px-3 mt-3 flex-1">
      <div className="bg-[#f9d375] p-[3px] rounded-[18px] shadow-[0_0_20px_rgba(249,211,117,0.3)]">
        <div className="bg-[#0b0e2a] rounded-[15px] overflow-hidden">
          {/* BLUE RED TOP */}
          <div className="grid grid-cols-2 h-[110px]">
            <button onClick={()=>handlePlaceBet('WOLF')} disabled={gameState!=='betting'} className="relative bg-[#1e40af] hover:bg-[#1d4ed8] transition-all border-r-2 border-black/50 flex flex-col items-center justify-center active:scale-[0.98]">
              <div className="text-white/70 text-[13px] font-medium">{myBets.WOLF}/{totalPots.WOLF || 68930}</div>
              <div className="text-[28px] font-black text-[#0a0f2e] drop-shadow-[0_1px_0_rgba(255,255,255,0.3)] tracking-wider" style={{WebkitTextStroke:'1px rgba(0,0,0,0.2)'}}>BLUE</div>
              <div className="text-white/80 text-[13px] font-bold">1.95X</div>
              {winnerId==='WOLF' && <div className="absolute inset-0 border-4 border-[#ffd700] animate-pulse pointer-events-none"/>}
            </button>
            <button onClick={()=>handlePlaceBet('LION')} disabled={gameState!=='betting'} className="relative bg-[#b91c1c] hover:bg-[#dc2626] transition-all flex flex-col items-center justify-center active:scale-[0.98]">
              <div className="text-white/70 text-[13px] font-medium">{myBets.LION}/{totalPots.LION || 60470}</div>
              <div className="text-[28px] font-black text-[#2a0505] drop-shadow-[0_1px_0_rgba(255,255,255,0.2)] tracking-wider">RED</div>
              <div className="text-white/80 text-[13px] font-bold">1.95X</div>
              {winnerId==='LION' && <div className="absolute inset-0 border-4 border-[#ffd700] animate-pulse pointer-events-none"/>}
            </button>
          </div>
          {/* GREEN BOTTOM 5 */}
          <div className="grid grid-cols-5 h-[85px] border-t-2 border-black/50">
            {[
              {id:'FISH', label:'PAIR', mult:'3.5x', sub:'0/483600'},
              {id:'', label:'COLOR', mult:'10X', sub:'0/19410'},
              {id:'', label:'SEQUENCE', mult:'15X', sub:'0/21560'},
              {id:'', label:'PURE SEQ', mult:'100X', sub:'0/13340'},
              {id:'', label:'SET', mult:'100X', sub:'0/11240'},
            ].map((b,i)=>(
              <button key={i} onClick={()=> b.id? handlePlaceBet(b.id) : toast({title:`${b.label} coming soon`})} disabled={gameState!=='betting' &&!!b.id} className="relative bg-[#047857] hover:bg-[#059669] border-r border-black/40 last:border-0 flex flex-col items-center justify-center gap-0.5 active:scale-[0.97] transition-all">
                <div className="text-[10px] text-white/70">{b.id==='FISH'? `${myBets.FISH}/${totalPots.FISH}` : b.sub}</div>
                <div className="text-[13px] font-extrabold text-[#062e1f] leading-tight text-center">{b.label}</div>
                <div className="text-[11px] text-white/80 font-bold">{b.mult}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* LEFT WIN AMOUNT */}
      <div className="mt-2 flex items-center gap-2">
        <div>
          <div className="text-[#ffd700] font-bold text-[15px] leading-none">+117918</div>
          <div className="w-9 h-9 rounded-lg bg-[#1a1f4a] border-2 border-[#f9d375] flex items-center justify-center mt-0.5">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#f9d375"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>
          </div>
        </div>
      </div>
    </main>

    {/* BOTTOM CHIPS */}
    <footer className="relative z-50 px-3 pb-3 mt-auto">
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-10 h-10 rounded-lg bg-[#1a1f4a] border border-[#f9d375]/50 flex items-center justify-center">
            <GoldCoinIcon className="w-6 h-6" />
          </div>
          <div className="bg-black/60 backdrop-blur px-2 py-1 rounded-md border border-white/10">
            <div className="flex items-center gap-1">
              <span className="text-[#ffd700] font-bold text-sm">109</span>
              <button className="text-white/60"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></button>
            </div>
          </div>
        </div>

        <button className="px-3 py-1.5 bg-[#2a2e5a] rounded-md border border-white/10 text-[11px] font-bold text-white/70">REPEAT</button>

        <div className="flex items-center gap-1.5">
          {[
            {v:10, c1:'#1e3a8a', c2:'#3b82f6', label:'10'},
            {v:100, c1:'#065f46', c2:'#10b981', label:'100'},
            {v:500, c1:'#5b21b6', c2:'#8b5cf6', label:'500'},
            {v:1000, c1:'#1e40af', c2:'#60a5fa', label:'1000'},
            {v:10000, c1:'#a16207', c2:'#facc15', label:'10K'},
          ].map(chip=>(
            <button key={chip.v} onClick={()=>setSelectedChip(chip.v)} className={cn("w-11 h-11 rounded-full border-[3px] border-[#0b0e2a] shadow-[0_3px_0_#000, inset_0_2px_4px_rgba(255,255,255,0.3)] relative active:scale-90 transition-all", selectedChip===chip.v && "ring-2 ring-white scale-110")} style={{background:`conic-gradient(from 0deg, ${chip.c1}, ${chip.c2}, ${chip.c1})`}}>
              <span className="absolute inset-[3px] rounded-full bg-black/20 flex items-center justify-center text-[11px] font-black text-white drop-shadow">{chip.label}</span>
            </button>
          ))}
        </div>
      </div>
    </footer>

    <style jsx global>{`
     .no-scrollbar::-webkit-scrollbar { display: none; }
      @keyframes flip { from{transform:rotateY(90deg)} to{transform:rotateY(0)} }
    `}</style>
   </motion.div>
  );
      }
