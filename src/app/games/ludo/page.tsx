'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useUserProfile } from '@/firebase';
import { 
  ChevronLeft, 
  Gamepad2, 
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  Plus,
  Star,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CompactRoomView } from '@/components/compact-room-view';

export default function LudoGamePage() {
  const router = useRouter();
  const { userProfile } = useUserProfile();
  const [isLaunching, setIsLaunching] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#0a1a4a] flex flex-col items-center justify-center space-y-6 font-headline">
        <Gamepad2 className="h-20 w-20 text-yellow-500 animate-bounce" />
        <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Ludo Quick</h1>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-black flex flex-col relative overflow-hidden font-headline">
        <CompactRoomView />

        <header className="relative z-40 p-3 pt-32 px-4 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent">
           <div className="flex gap-2">
              <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full text-white"><ChevronLeft className="h-4 w-4" /></button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-1.5 rounded-full text-white">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
           </div>
           <h1 className="text-lg font-black text-white uppercase italic">Ludo • Quick</h1>
           <div className="flex gap-2">
              <button className="bg-white/10 p-1.5 rounded-full text-white"><RefreshCw className="h-4 w-4" /></button>
              <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full text-white"><X className="h-4 w-4" /></button>
           </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-2 relative z-10 pb-24">
           <div 
             className="relative w-[min(90vw,90vh)] aspect-square bg-[#7cb342] rounded-[2rem] p-3 shadow-2xl border-b-[8px] border-[#558b2f]"
             style={{ 
               display: 'grid', 
               gridTemplateColumns: 'repeat(15, minmax(0, 1fr))', 
               gridTemplateRows: 'repeat(15, minmax(0, 1fr))',
               gap: '2px'
             }}
           >
              <div className="col-span-6 row-span-6 bg-[#d9534f] rounded-2xl shadow-inner" />
              <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 gap-0.5">
                 {Array.from({ length: 18 }).map((_, i) => <div key={i} className="rounded-sm bg-[#9ccc65] border border-black/5" />)}
              </div>
              <div className="col-span-6 row-span-6 bg-[#5cb85c] rounded-2xl shadow-inner" />
              <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 gap-0.5">
                 {Array.from({ length: 18 }).map((_, i) => <div key={i} className="rounded-sm bg-[#9ccc65] border border-black/5" />)}
              </div>
              <div className="col-span-3 row-span-3 bg-gradient-to-b from-[#ffeb3b] to-[#fbc02d] rounded-xl flex items-center justify-center p-1"><span className="text-white text-xs font-black italic uppercase">Play</span></div>
              <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 gap-0.5">
                 {Array.from({ length: 18 }).map((_, i) => <div key={i} className="rounded-sm bg-[#9ccc65] border border-black/5" />)}
              </div>
              <div className="col-span-6 row-span-6 bg-[#0275d8] rounded-2xl shadow-inner" />
              <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 gap-0.5">
                 {Array.from({ length: 18 }).map((_, i) => <div key={i} className="rounded-sm bg-[#9ccc65] border border-black/5" />)}
              </div>
              <div className="col-span-6 row-span-6 bg-[#fbc02d] rounded-2xl shadow-inner" />
           </div>

           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-[110]">
              <div className="bg-black/60 backdrop-blur-2xl p-3 rounded-full border border-white/10 flex items-center justify-between shadow-2xl">
                 <div className="flex items-center gap-2 pl-2">
                    <Avatar className="h-8 w-8 border-2 border-[#00E5FF]"><AvatarImage src={userProfile?.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
                    <span className="text-[10px] font-black text-white uppercase italic">{userProfile?.username || 'Tribe'}</span>
                 </div>
                 <button className="h-10 w-10 rounded-full bg-[#00E5FF] flex items-center justify-center"><Plus className="h-4 w-4 text-black" /></button>
                 <Badge className="bg-yellow-500 text-black font-black uppercase text-[8px] italic px-3 py-1 rounded-lg">Quick Mode</Badge>
              </div>
           </div>
        </main>
      </div>
    </AppLayout>
  );
}
