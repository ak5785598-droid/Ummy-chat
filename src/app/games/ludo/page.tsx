'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useRoomContext } from '@/components/room-provider';
import { useUser, useFirestore, useUserProfile, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { doc, collection, query } from 'firebase/firestore';
import { 
  ChevronLeft, 
  Mic, 
  MicOff, 
  Users, 
  Trophy, 
  Gamepad2, 
  Loader,
  X,
  Volume2,
  VolumeX,
  RefreshCw,
  HelpCircle,
  ChevronDown,
  Maximize2,
  Plus,
  Star,
  Settings,
  CircleSlash
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CompactRoomView } from '@/components/compact-room-view';

export default function LudoGamePage() {
  const router = useRouter();
  const { activeRoom } = useRoomContext();
  const { user: currentUser } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const [isLaunching, setIsLaunching] = useState(true);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleMic = () => {
    if (!firestore || !activeRoom?.id || !currentUser) return;
    updateDocumentNonBlocking(
      doc(firestore, 'chatRooms', activeRoom.id, 'participants', currentUser.uid),
      { isMuted: !isMuted }
    );
    setIsMuted(!isMuted);
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-[#0a1a4a] flex flex-col items-center justify-center space-y-6 font-headline">
        <div className="relative">
           <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
           <Gamepad2 className="h-20 w-20 text-yellow-500 relative z-10 animate-bounce" />
        </div>
        <div className="text-center space-y-2">
           <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Ludo Quick</h1>
           <p className="text-muted-foreground text-xs font-black uppercase tracking-widest animate-pulse">Syncing Tribe Board...</p>
        </div>
      </div>
    );
  }

  const SafetySpot = ({ type, color }: { type: 'star' | 'slash', color?: string }) => (
    <div className="flex items-center justify-center w-full h-full relative">
       {type === 'star' ? (
         <Star className={cn("h-3 w-3 fill-current", color || "text-green-800/40")} />
       ) : (
         <div className="h-3 w-3 border border-white/40 rounded-full flex items-center justify-center">
            <div className="w-px h-full bg-white/40 rotate-45" />
         </div>
       )}
    </div>
  );

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-gradient-to-b from-[#0a1a4a] via-[#050c2a] to-[#000000] flex flex-col relative overflow-hidden font-headline">
        
        <CompactRoomView />

        <header className="relative z-40 p-3 px-4 flex items-center justify-between bg-black/20 border-b border-white/5">
           <div className="flex items-center gap-2">
              <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full text-white">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button onClick={() => setIsMuted(!isMuted)} className="bg-white/10 p-1.5 rounded-full text-white">
                {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
           </div>
           <h1 className="text-lg font-black text-white uppercase italic tracking-tight">Ludo • Quick</h1>
           <div className="flex items-center gap-2">
              <button className="bg-white/10 p-1.5 rounded-full text-white"><RefreshCw className="h-4 w-4" /></button>
              <button onClick={() => router.back()} className="bg-white/10 p-1.5 rounded-full text-white"><X className="h-4 w-4" /></button>
           </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-2 relative z-10 overflow-y-auto pb-24">
           
           <div className="relative w-[min(90vw,90vh)] aspect-square bg-[#7cb342] rounded-[2rem] p-3 shadow-2xl border-b-[8px] border-[#558b2f]">
              
              <button className="absolute -top-1 -left-1 h-10 w-10 bg-[#d9534f] rounded-full border-2 border-white/30 flex items-center justify-center shadow-xl z-20">
                 <Plus className="h-5 w-5 text-white/80" />
              </button>
              <button className="absolute -top-1 -right-1 h-10 w-10 bg-[#5cb85c] rounded-full border-2 border-white/30 flex items-center justify-center shadow-xl z-20">
                 <Plus className="h-5 w-5 text-white/80" />
              </button>
              <button className="absolute -bottom-1 -right-1 h-10 w-10 bg-[#f0ad4e] rounded-full border-2 border-white/30 flex items-center justify-center shadow-xl z-20">
                 <Plus className="h-5 w-5 text-white/80" />
              </button>

              <div className="grid grid-cols-15 grid-rows-15 h-full w-full gap-0.5">
                 
                 <div className="col-span-6 row-span-6 bg-[#d9534f] rounded-2xl grid grid-cols-2 grid-rows-2 gap-2 p-4 shadow-inner" />
                 <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 gap-0.5">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className={cn("rounded-sm border border-black/5", i >= 4 && i <= 16 && (i % 3 === 1) ? "bg-[#5cb85c]" : "bg-[#9ccc65]")}>
                        {i === 4 && <SafetySpot type="slash" />}
                        {i === 5 && <SafetySpot type="star" color="text-[#5cb85c]" />}
                      </div>
                    ))}
                 </div>
                 <div className="col-span-6 row-span-6 bg-[#5cb85c] rounded-2xl grid grid-cols-2 grid-rows-2 gap-2 p-4 shadow-inner" />

                 <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 gap-0.5">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className={cn("rounded-sm border border-black/5", i >= 7 && i <= 11 ? "bg-[#d9534f]" : "bg-[#9ccc65]")}>
                        {i === 1 && <SafetySpot type="star" color="text-[#d9534f]" />}
                        {i === 12 && <SafetySpot type="slash" />}
                      </div>
                    ))}
                 </div>
                 <div className="col-span-3 row-span-3 bg-gradient-to-b from-[#ffeb3b] to-[#fbc02d] rounded-xl flex items-center justify-center p-1">
                    <span className="text-white text-xs font-black italic uppercase">Play</span>
                 </div>
                 <div className="col-span-6 row-span-3 grid grid-cols-6 grid-rows-3 gap-0.5">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className={cn("rounded-sm border border-black/5", i >= 6 && i <= 10 ? "bg-[#f0ad4e]" : "bg-[#9ccc65]")}>
                        {i === 4 && <SafetySpot type="slash" />}
                        {i === 16 && <SafetySpot type="star" color="text-[#fbc02d]" />}
                      </div>
                    ))}
                 </div>

                 <div className="col-span-6 row-span-6 bg-[#0275d8] rounded-2xl grid grid-cols-2 grid-rows-2 gap-2 p-4 shadow-inner" />
                 <div className="col-span-3 row-span-6 grid grid-cols-3 grid-rows-6 gap-0.5">
                    {Array.from({ length: 18 }).map((_, i) => (
                      <div key={i} className={cn("rounded-sm border border-black/5", i >= 1 && i <= 13 && (i % 3 === 1) ? "bg-[#0275d8]" : "bg-[#9ccc65]")}>
                        {i === 12 && <SafetySpot type="star" color="text-[#0275d8]" />}
                        {i === 13 && <SafetySpot type="slash" />}
                      </div>
                    ))}
                 </div>
                 <div className="col-span-6 row-span-6 bg-[#fbc02d] rounded-2xl grid grid-cols-2 grid-rows-2 gap-2 p-4 shadow-inner" />

              </div>
           </div>

           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50">
              <div className="bg-black/60 backdrop-blur-2xl p-3 rounded-full border border-white/10 flex items-center justify-between shadow-2xl">
                 <div className="flex items-center gap-2 pl-2">
                    <Avatar className="h-8 w-8 border-2 border-[#00E5FF]">
                       <AvatarImage src={userProfile?.avatarUrl} />
                       <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-black text-white uppercase italic">{userProfile?.username || 'Tribe'}</span>
                 </div>
                 
                 <button 
                   onClick={handleToggleMic} 
                   className={cn(
                     "h-10 w-10 rounded-full flex items-center justify-center transition-all border-2",
                     isMuted ? "bg-rose-600 border-rose-400" : "bg-[#00E5FF] border-[#00E5FF] text-black"
                   )}
                 >
                   {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 animate-voice-wave" />}
                 </button>
                 
                 <Badge className="bg-yellow-500 text-black font-black uppercase text-[8px] italic px-3 py-1 rounded-lg mr-2">Quick Mode</Badge>
              </div>
           </div>

        </main>
      </div>
    </AppLayout>
  );
}
