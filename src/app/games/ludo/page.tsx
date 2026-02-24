'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout/app-layout';
import { useRoomContext } from '@/components/room-provider';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
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
  Volume2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

/**
 * Full-Screen Ludo Game Page.
 * Implements immersive gameplay with background voice chat.
 */
export default function LudoGamePage() {
  const router = useRouter();
  const { activeRoom, setIsMinimized } = useRoomContext();
  const { user: currentUser } = useUser();
  const firestore = useFirestore();
  const [isLaunching, setIsLaunching] = useState(true);

  // Sync participants for voice indicators
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !activeRoom?.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', activeRoom.id, 'participants'));
  }, [firestore, activeRoom?.id, currentUser]);

  const { data: participants } = useCollection(participantsQuery);
  const currentUserParticipant = participants?.find(p => p.uid === currentUser?.uid);
  const activeSpeakers = participants?.filter(p => !p.isMuted && p.seatIndex > 0) || [];

  useEffect(() => {
    const timer = setTimeout(() => setIsLaunching(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleMic = () => {
    if (!firestore || !activeRoom?.id || !currentUser || !currentUserParticipant) return;
    if (currentUserParticipant.seatIndex === 0) return; // Must be in a seat to talk

    updateDocumentNonBlocking(
      doc(firestore, 'chatRooms', activeRoom.id, 'participants', currentUser.uid),
      { isMuted: !currentUserParticipant.isMuted }
    );
  };

  const handleExit = () => {
    if (activeRoom) {
      router.push(`/rooms/${activeRoom.id}`);
    } else {
      router.push('/games');
    }
  };

  if (isLaunching) {
    return (
      <div className="h-screen w-full bg-black flex flex-col items-center justify-center space-y-6">
        <div className="relative">
           <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-3xl animate-pulse" />
           <Gamepad2 className="h-20 w-20 text-yellow-500 relative z-10 animate-bounce" />
        </div>
        <div className="text-center space-y-2">
           <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter">Initializing Ludo</h1>
           <p className="text-muted-foreground text-xs font-black uppercase tracking-widest animate-pulse">Syncing with Frequency...</p>
        </div>
      </div>
    );
  }

  return (
    <AppLayout fullScreen>
      <div className="h-screen w-full bg-[#1a1a2e] flex flex-col relative overflow-hidden">
        
        {/* Immersive Game Header / Voice Controller */}
        <header className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
           <div className="flex items-center gap-3 pointer-events-auto">
              <button 
                onClick={handleExit}
                className="bg-black/40 backdrop-blur-md p-2 rounded-full border border-white/10 text-white hover:bg-black/60 transition-all"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-3">
                 <div className="flex -space-x-2">
                    {activeSpeakers.slice(0, 3).map(p => (
                      <Avatar key={p.uid} className="h-6 w-6 border-2 border-primary shadow-lg ring-2 ring-primary/20 animate-voice-wave">
                        <AvatarImage src={p.avatarUrl} />
                        <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ))}
                    {activeSpeakers.length > 3 && (
                      <div className="h-6 w-6 rounded-full bg-primary text-black text-[8px] font-black flex items-center justify-center border-2 border-black">
                        +{activeSpeakers.length - 3}
                      </div>
                    )}
                 </div>
                 <div className="hidden sm:block">
                    <p className="text-[8px] font-black text-primary uppercase tracking-widest leading-none">Voice Tribe</p>
                    <p className="text-[10px] font-black text-white uppercase truncate w-24 italic">{activeRoom?.title || 'Frequency'}</p>
                 </div>
              </div>
           </div>

           <div className="flex items-center gap-2 pointer-events-auto">
              <Button 
                onClick={handleToggleMic}
                variant="ghost"
                className={cn(
                  "rounded-full h-12 w-12 border-2 transition-all shadow-xl",
                  currentUserParticipant?.isMuted 
                    ? "bg-red-500/20 border-red-500/40 text-red-500" 
                    : "bg-primary border-primary text-black scale-110 shadow-primary/20"
                )}
              >
                {currentUserParticipant?.isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
              <Badge className="bg-green-500 text-white font-black italic uppercase text-[10px] hidden sm:flex">Live Multiplayer</Badge>
           </div>
        </header>

        {/* The Game Engine Embed */}
        <div className="flex-1 w-full h-full relative z-0 mt-4">
           <iframe
             src="https://playpager.com/embed/ludo/index.html"
             className="w-full h-full border-0 rounded-none shadow-2xl"
             allow="autoplay; encrypted-media"
             allowFullScreen
           />
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
           <Trophy className="h-[80vh] w-[80vh] text-white" />
        </div>

        {/* Footer Navigation Overlay */}
        <footer className="absolute bottom-6 left-0 right-0 z-50 px-6 flex justify-center pointer-events-none">
           <div className="bg-black/60 backdrop-blur-xl px-8 py-3 rounded-full border border-white/10 pointer-events-auto flex items-center gap-6 shadow-2xl">
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Server: Mumbai-01</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2 text-primary">
                 <Users className="h-4 w-4" />
                 <span className="text-[10px] font-black uppercase">{participants?.length || 0} In Frequency</span>
              </div>
           </div>
        </footer>

      </div>
    </AppLayout>
  );
}
