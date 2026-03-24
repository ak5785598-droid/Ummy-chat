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
  RefreshCcw
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { CompactRoomView } from '@/components/compact-room-view';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const ANIMALS = [
  { id: 'lion', emoji: '🦁', multiplier: 45, label: 'x45', pos: 'top-left' },
  { id: 'turtle', emoji: '🐢', multiplier: 5, label: 'x5', pos: 'top' },
  { id: 'rabbit', emoji: '🐰', multiplier: 5, label: 'x5', pos: 'top-right' },
  { id: 'sheep', emoji: '🐑', multiplier: 5, label: 'x5', pos: 'right' },
  { id: 'fox', emoji: '🦊', multiplier: 5, label: 'x5', pos: 'bottom-right' },
  { id: 'rhino', emoji: '🦏', multiplier: 10, label: 'x10', pos: 'bottom' },
  { id: 'elephant', emoji: '🐘', multiplier: 15, label: 'x15', pos: 'bottom-left' },
  { id: 'tiger', emoji: '🐯', multiplier: 25, label: 'x25', pos: 'left' },
];

const CHIPS = [
  { value: 100, label: '100', color: 'bg-blue-500' },
  { value: 1000, label: '1K', color: 'bg-green-500' },
  { value: 5000, label: '5K', color: 'bg-yellow-500' },
  { value: 50000, label: '50K', color: 'bg-orange-500' },
  { value: 100000, label: '100K', color: 'bg-red-500' },
  { value: 300000, label: '300K', color: 'bg-pink-500' },
  { value: 1000000, label: '1M', color: 'bg-purple-500' },
  { value: 10000000, label: '10M', color: 'bg-indigo-500' },
  { value: 100000000, label: '100M', color: 'bg-cyan-500' },
];

export default function WildPartyPage() {
  const router = useRouter();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();

  const [gameState, setGameState] = useState<'betting' | 'spinning' | 'result'>('betting');
  const [timeLeft, setTimeLeft] = useState(15);
  const [selectedChip, setSelectedChip] = useState(100);
  const [myBets, setMyBets] = useState<Record<string, number>>({});
  const [lastBets, setLastBets] = useState<Record<string, number>>({});
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isLaunching, setIsLaunching] = useState(true);
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

  const playTickSound = useCallback(() => {
    if (isMuted) return;
    const ctx = initAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1000, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.05);
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
        else startSpin();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameState, timeLeft, isLaunching]);

  const startSpin = () => {
    setGameState('spinning');
    const targetIdx = Math.floor(Math.random() * ANIMALS.length);
    
    let currentStep = 0;
    const totalSteps = 32 + targetIdx;
    let speed = 50;

    const runChase = () => {
      setHighlightIdx(currentStep % ANIMALS.length);
      playTickSound();
      currentStep++;
      if (currentStep < totalSteps) {
        if (totalSteps - currentStep < 10) speed += 30;
        setTimeout(runChase, speed);
      } else {
        setTimeout(() => showResult(ANIMALS[targetIdx].id), 800);
      }
    };
    runChase();
  };

  const showResult = (id: string) => {
    setHistory(prev => [id, ...prev].slice(0, 15));
    const winItem = ANIMALS.find(i => i.id === id);
    const winAmount = (myBets[id] || 0) * (winItem?.multiplier || 0);

    const sessionWinners = [];
import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { cn } from "@/lib/utils"; // Assuming you use this utility

// Mock Components - Replace with your actual imports
const AppLayout = ({ children }) => <div className="min-h-screen bg-[#1a0f0a] text-white">{children}</div>;
const GoldCoinIcon = ({ className }) => <div className={cn("rounded-full bg-yellow-500", className)} />;

const ANIMALS = [
  { id: 'rabbit', label: 'Win 5 times', emoji: '🐰', multiplier: 5, color: 'from-blue-400 to-blue-600' },
  { id: 'gazelle', label: 'Win 5 times', emoji: '🦌', multiplier: 5, color: 'from-orange-400 to-orange-600' },
  { id: 'dog', label: 'Win 5 times', emoji: '🐶', multiplier: 5, color: 'from-gray-400 to-gray-600' },
  { id: 'camel', label: 'Win 5 times', emoji: '🐫', multiplier: 5, color: 'from-orange-700 to-orange-900' },
  { id: 'hawk', label: 'Win 10 times', emoji: '🦅', multiplier: 10, color: 'from-yellow-600 to-yellow-800' },
  { id: 'leopard', label: 'Win 15 times', emoji: '🐆', multiplier: 15, color: 'from-yellow-400 to-yellow-600' },
  { id: 'tiger', label: 'Win 25 times', emoji: '🐯', multiplier: 25, color: 'from-orange-500 to-red-600' },
  { id: 'lion', label: 'Win 45 times', emoji: '🦁', multiplier: 45, color: 'from-yellow-300 to-yellow-500' },
];

const CHIPS = [
  { value: 100, label: '100', color: 'bg-blue-600' },
  { value: 1000, label: '1K', color: 'bg-green-600' },
  { value: 5000, label: '5K', color: 'bg-yellow-600' },
  { value: 50000, label: '50K', color: 'bg-red-600' },
];

export default function WildPartyGame() {
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedChip, setSelectedChip] = useState(100);
  const [bets, setBets] = useState({});
  const [userProfile, setUserProfile] = useState({ wallet: { coins: 322232250077 } });
  const [gameState, setGameState] = useState('betting'); // 'betting' or 'result'

  // Timer Logic
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setGameState('result');
      // Reset after 5 seconds of showing result
      setTimeout(() => {
        setTimeLeft(20);
        setGameState('betting');
        setBets({});
      }, 5000);
    }
  }, [timeLeft]);

  const handlePlaceBet = (animalId) => {
    if (gameState !== 'betting') return;
    
    const cost = selectedChip;
    if (userProfile.wallet.coins >= cost) {
      setBets(prev => ({
        ...prev,
        [animalId]: (prev[animalId] || 0) + cost
      }));
      setUserProfile(prev => ({
        ...prev,
        wallet: { coins: prev.wallet.coins - cost }
      }));
    }
  };

  return (
    <AppLayout>
      <div className="relative h-screen w-full flex flex-col overflow-hidden bg-[url('/bg-desert.jpg')] bg-cover bg-center">
        {/* Header */}
        <header className="p-4 flex justify-between items-center z-50">
           <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full border-2 border-yellow-500 overflow-hidden">
                <img src="/api/placeholder/40/40" alt="profile" />
              </div>
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-tighter">Pankaj</p>
                <p className="text-[10px] text-yellow-500">1 TRIBE</p>
              </div>
           </div>
           <h1 className="text-2xl font-black italic text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">WILD PARTY</h1>
           <div className="flex gap-2">
              <button className="h-8 w-8 bg-black/40 rounded-full flex items-center justify-center border border-white/20">?</button>
              <button className="h-8 w-8 bg-black/40 rounded-full flex items-center justify-center border border-white/20">X</button>
           </div>
        </header>

        {/* Game Area (The Circle) */}
        <main className="flex-1 relative flex items-center justify-center">
          <div className="relative w-[340px] h-[340px] flex items-center justify-center">
            
            {/* The Wooden Wheel Background */}
            <div className="absolute inset-0 rounded-full border-[12px] border-[#8d5d3e] shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black/20" />
            <div className="absolute inset-4 rounded-full border-4 border-[#5d4037]/50 flex items-center justify-center">
                {/* Center Timer Display */}
                <div className="bg-gradient-to-b from-[#ffefba] to-[#ffffff] w-32 h-32 rounded-full shadow-2xl flex flex-col items-center justify-center border-4 border-[#8d5d3e]">
                    <span className="text-black font-bold text-xs uppercase">Select Animal now</span>
                    <span className="text-5xl font-black text-black">{timeLeft}s</span>
                </div>
            </div>

            {/* Animal Buttons mapped in a circle */}
            {ANIMALS.map((animal, index) => {
              const angle = (index * (360 / ANIMALS.length)) - 90; // Start from top
              const radius = 135; // Distance from center
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;

              const betAmount = bets[animal.id] || 0;

              return (
                <div 
                  key={animal.id}
                  className="absolute transition-transform active:scale-95"
                  style={{ transform: `translate(${x}px, ${y}px)` }}
                >
                  {/* Floating Bet Badge */}
                  {betAmount > 0 && (
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 z-50 animate-bounce">
                      <div className="bg-gradient-to-b from-yellow-300 to-yellow-600 px-2 py-0.5 rounded-md border border-white shadow-lg flex items-center gap-1">
                        <GoldCoinIcon className="h-2 w-2" />
                        <span className="text-[10px] font-bold text-black">{betAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <button 
                    onClick={() => handlePlaceBet(animal.id)}
                    className="group relative flex flex-col items-center"
                  >
                    <div className={cn(
                      "h-20 w-20 rounded-full border-4 border-[#f3cc91] shadow-2xl flex items-center justify-center relative overflow-hidden transition-all",
                      `bg-gradient-to-br ${animal.color}`,
                      gameState === 'result' && "brightness-50" 
                    )}>
                      <span className="text-4xl z-10">{animal.emoji}</span>
                      <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                    </div>
                    <div className="mt-1 bg-black/60 px-2 py-0.5 rounded-full border border-white/20">
                      <span className="text-[9px] font-bold text-white whitespace-nowrap">{animal.label}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </main>

        {/* Footer Navigation */}
        <footer className="p-6 bg-gradient-to-t from-black to-transparent">
          <div className="max-w-md mx-auto space-y-4">
            {/* Wallet Info */}
            <div className="flex justify-between items-center">
                <div className="bg-black/60 px-4 py-1.5 rounded-full border border-yellow-600/50 flex items-center gap-2">
                    <GoldCoinIcon className="h-5 w-5" />
                    <span className="text-yellow-500 font-bold text-lg">{userProfile.wallet.coins.toLocaleString()}</span>
                    <button className="text-yellow-500 ml-2">🔄</button>
                </div>
                <button className="bg-black/60 p-2 rounded-full border border-white/10">
                    <Users className="h-5 w-5 text-yellow-500" />
                </button>
            </div>

            {/* Betting Controls */}
            <div className="bg-[#3e2723] p-3 rounded-[2rem] border-4 border-[#5d4037] flex items-center justify-between shadow-2xl">
              <div className="flex gap-2 overflow-x-auto no-scrollbar">
                {CHIPS.map(chip => (
                  <button
                    key={chip.value}
                    onClick={() => setSelectedChip(chip.value)}
                    className={cn(
                      "h-12 w-12 rounded-full border-4 flex items-center justify-center font-black text-[10px] transition-all",
                      chip.color,
                      selectedChip === chip.value ? "border-white scale-110 shadow-[0_0_15px_white]" : "border-black/40 opacity-70"
                    )}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
              <button className="bg-gradient-to-b from-orange-400 to-red-600 px-8 py-3 rounded-full font-bold uppercase text-sm border-b-4 border-black/20 active:border-b-0 active:translate-y-1 transition-all">
                Repeat
              </button>
            </div>
          </div>
        </footer>

        <style jsx global>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          @keyframes bounce {
            0%, 100% { transform: translate(-50%, 0); }
            50% { transform: translate(-50%, -5px); }
          }
          .animate-bounce { animation: bounce 1s infinite; }
        `}</style>
      </div>
    </AppLayout>
  );
}
