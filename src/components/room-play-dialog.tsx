'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { 
  Swords, 
  Flame, 
  HelpCircle, 
  ChevronLeft, 
  Armchair, 
  Check, 
  X, 
  Star,
  Trash2,
  Loader,
  MessageSquare,
  MessageSquareOff,
  Volume2,
  VolumeX,
  Plus,
  Music,
  Search,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { RoomParticipant } from '@/lib/types';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { GameControllerIcon } from '@/components/icons';
import { searchVideosAction } from '@/actions/get-videos';

interface RoomPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants?: RoomParticipant[];
  roomId?: string;
  room?: any;
  isMutedLocal: boolean;
  setIsMutedLocal: (val: boolean) => void;
  onOpenGames: () => void;
}

/**
 * High-Fidelity Room Play Portal.
 * Re-engineered for absolute stability and interactive sync.
 * Removed "Reactions" from the play grid as per Sovereign request.
 */
export function RoomPlayDialog({ 
  open, 
  onOpenChange, 
  participants = [], 
  roomId, 
  room,
  isMutedLocal,
  setIsMutedLocal,
  onOpenGames
}: RoomPlayDialogProps) {
  const [view, setView] = useState<'grid' | 'battle' | 'selection' | 'rules' | 'music'>('grid');
  const [battleMode, setBattleMode] = useState<'Votes' | 'Coins'>('Votes');
  const [selectionSide, setSelectionSide] = useState<'BLUE' | 'RED'>('BLUE');
  const [isClearingChat, setIsClearingChat] = useState(false);
  
  const [musicSearch, setMusicSearch] = useState('');
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [musicResults, setMusicResults] = useState<any[]>([]);

  const [blueTeam, setBlueTeam] = useState<string[]>([]);
  const [redTeam, setRedTeam] = useState<string[]>([]);

  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const isOwner = user?.uid === room?.ownerId;
  const isMod = room?.moderatorIds?.includes(user?.uid || '');
  const canManage = isOwner || isMod;
  const isChatMuted = room?.isChatMuted || false;

  const handleClearChat = async () => {
    if (!firestore || !roomId) return;
    setIsClearingChat(true);
    
    try {
      const messagesRef = collection(firestore, 'chatRooms', roomId, 'messages');
      const snap = await getDocs(messagesRef);
      
      if (snap.empty) {
        toast({ title: 'Frequency Clean', description: 'No messages to clear.' });
        setIsClearingChat(false);
        return;
      }

      const batch = writeBatch(firestore);
      snap.docs.forEach(d => batch.delete(d.ref));
      
      await batch.commit();
      toast({ title: 'Frequency Purified', description: 'Chat history has been cleared.' });
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsClearingChat(false);
    }
  };

  const handleToggleChatMute = () => {
    if (!firestore || !roomId) return;
    const roomRef = doc(firestore, 'chatRooms', roomId);
    updateDocumentNonBlocking(roomRef, {
      isChatMuted: !isChatMuted,
      updatedAt: serverTimestamp()
    });
    toast({ 
      title: isChatMuted ? 'Messaging Restored' : 'Messaging Restricted', 
      description: isChatMuted ? 'Tribe members can now send messages.' : 'Only authorities can broadcast messages.' 
    });
    onOpenChange(false);
  };

  const handleSearchMusic = async () => {
    if (!musicSearch.trim()) return;
    setIsSearchingMusic(true);
    try {
      const result = await searchVideosAction(musicSearch);
      if (result.success) setMusicResults(result.data || []);
      else toast({ variant: 'destructive', title: 'Search Failed' });
    } finally {
      setIsSearchingMusic(false);
    }
  };

  const handleSyncMusic = (video: any) => {
    if (!firestore || !roomId) return;
    const roomRef = doc(firestore, 'chatRooms', roomId);
    updateDocumentNonBlocking(roomRef, {
      currentMusicUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
      updatedAt: serverTimestamp()
    });
    toast({ title: 'Music Synchronized', description: `${video.title} is now playing.` });
    onOpenChange(false);
  };

  const toggleSelection = (uid: string) => {
    if (selectionSide === 'BLUE') {
      setBlueTeam(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid].slice(0, 5));
    } else {
      setRedTeam(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid].slice(0, 5));
    }
  };

  const options = [
    { 
      id: 'volume', 
      label: isMutedLocal ? 'Unmute Room' : 'Mute Room', 
      onClick: () => {
        setIsMutedLocal(!isMutedLocal);
        toast({ title: isMutedLocal ? 'Room Audio Restored' : 'Room Audio Muted' });
      },
      icon: (
        <div className={cn(
          "relative w-16 h-16 rounded-full p-0.5 border-2 border-white/20 shadow-xl overflow-hidden",
          isMutedLocal ? "bg-gradient-to-br from-red-500 to-red-700" : "bg-gradient-to-br from-blue-500 to-blue-700"
        )}>
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              {isMutedLocal ? <VolumeX className="h-8 w-8 text-white drop-shadow-md" /> : <Volume2 className="h-8 w-8 text-white drop-shadow-md" />}
           </div>
        </div>
      )
    },
    { 
      id: 'music', 
      label: 'Music', 
      onClick: () => setView('music'),
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-indigo-700 p-0.5 border-2 border-white/20 shadow-xl overflow-hidden">
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              <Music className="h-8 w-8 text-white drop-shadow-md" />
           </div>
        </div>
      )
    },
    { 
      id: 'battle', 
      label: 'Battle', 
      onClick: () => setView('battle'),
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-red-500 p-0.5 border-2 border-white/20 shadow-xl overflow-hidden">
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              <Swords className="h-8 w-8 text-white drop-shadow-md animate-pulse" />
           </div>
        </div>
      )
    },
    { 
      id: 'games', 
      label: 'Games', 
      onClick: () => {
        onOpenGames();
        onOpenChange(false);
      },
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-700 p-0.5 border-2 border-yellow-200/50 shadow-xl overflow-hidden">
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              <GameControllerIcon className="h-8 w-8 text-white drop-shadow-md" />
           </div>
        </div>
      )
    }
  ];

  if (canManage) {
    options.push({
      id: 'mute-chat',
      label: isChatMuted ? 'Open Public Msg' : 'Close Public Msg',
      onClick: handleToggleChatMute,
      icon: (
        <div className={cn(
          "relative w-16 h-16 rounded-full p-0.5 border-2 border-white/20 shadow-xl overflow-hidden",
          isChatMuted ? "bg-gradient-to-br from-green-500 to-green-700" : "bg-gradient-to-br from-orange-500 to-orange-700"
        )}>
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              {isChatMuted ? <MessageSquare className="h-8 w-8 text-white" /> : <MessageSquareOff className="h-8 w-8 text-white" />}
           </div>
        </div>
      )
    });

    options.push({
      id: 'clear-chat',
      label: 'Clear Chat',
      onClick: handleClearChat,
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 p-0.5 border-2 border-white/20 shadow-xl overflow-hidden">
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              {isClearingChat ? <Loader className="h-8 w-8 text-white animate-spin" /> : <Trash2 className="h-8 w-8 text-white" />}
           </div>
        </div>
      )
    });
  }

  const handleClose = (openVal: boolean) => {
    if (!openVal) {
      setTimeout(() => setView('grid'), 300);
    }
    onOpenChange(openVal);
  };

  const seatedParticipants = (participants || []).filter(p => p.seatIndex > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="sr-only">
          <DialogTitle>Room Play Portal</DialogTitle>
          <DialogDescription>Interactive room tools and games frequency selection.</DialogDescription>
        </DialogHeader>

        {view === 'grid' && (
          <div className="animate-in fade-in duration-500">
            <header className="p-8 pb-4">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white/90">Room Play</h2>
            </header>
            <div className="p-8 pt-2 pb-16">
               <div className="grid grid-cols-3 gap-y-10 gap-x-4">
                  {options.map((opt) => (
                    <button key={opt.id} onClick={opt.onClick} className="flex flex-col items-center gap-3 active:scale-90 transition-transform">
                       <div className="relative p-1 bg-white/5 rounded-3xl border border-white/5 shadow-inner hover:bg-white/10 transition-colors">
                          {opt.icon}
                       </div>
                       <span className="text-[10px] font-black uppercase italic text-white/80 tracking-tight text-center w-full leading-tight">{opt.label}</span>
                    </button>
                  ))}
               </div>
            </div>
          </div>
        )}

        {view === 'music' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-[60vh]">
            <header className="p-6 pb-2 flex items-center justify-between shrink-0 border-b border-white/5">
               <div className="flex items-center gap-3">
                  <button onClick={() => setView('grid')} className="p-1 hover:scale-110 transition-transform"><ChevronLeft className="h-6 w-6 text-white/60" /></button>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Music Frequency</h2>
               </div>
            </header>
            <div className="p-6 space-y-4 shrink-0">
               <div className="flex gap-2">
                  <Input 
                    placeholder="Search tribe vibes..." 
                    className="flex-1 bg-white/5 border-white/10 h-12 rounded-2xl" 
                    value={musicSearch}
                    onChange={(e) => setMusicSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchMusic()}
                  />
                  <Button onClick={handleSearchMusic} className="h-12 w-12 rounded-2xl bg-primary text-black">
                     {isSearchingMusic ? <Loader className="animate-spin h-5 w-5" /> : <Search className="h-5 w-5" />}
                  </Button>
               </div>
            </div>
            <ScrollArea className="flex-1 px-6">
               <div className="space-y-3 pb-10">
                  {musicResults.length > 0 ? musicResults.map((video) => (
                    <button 
                      key={video.videoId} 
                      onClick={() => handleSyncMusic(video)}
                      className="w-full flex items-center gap-4 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left border border-white/5"
                    >
                       <div className="relative h-14 w-20 rounded-lg overflow-hidden shrink-0">
                          <img src={video.thumbnailUrl} className="h-full w-full object-cover" alt={video.title} />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Play className="h-4 w-4 text-white" /></div>
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase italic text-white truncate">{video.title}</p>
                          <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Global Frequency</p>
                       </div>
                    </button>
                  )) : (
                    <div className="py-20 text-center opacity-20 italic">
                       <Music className="h-12 w-12 mx-auto mb-4" />
                       <p className="text-sm font-bold">Search for your favorite tribal tracks.</p>
                    </div>
                  )}
               </div>
            </ScrollArea>
          </div>
        )}

        {view === 'battle' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="p-6 pb-2 flex items-center justify-between border-b border-white/5">
               <div className="flex items-center gap-3">
                  <button onClick={() => setView('grid')} className="p-1 hover:scale-110 transition-transform"><ChevronLeft className="h-6 w-6 text-white/60" /></button>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Battle</h2>
               </div>
               <button onClick={() => setView('rules')} className="p-1 hover:scale-110 transition-transform"><HelpCircle className="h-6 w-6 text-yellow-500" /></button>
            </header>
            <div className="p-6 space-y-8">
               <div className="space-y-4">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white/90">Select People</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="relative aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br from-[#004d40] via-[#006064] to-[#00acc1] border-2 border-cyan-400/20 shadow-2xl overflow-hidden group">
                        <SelectionPortal side="BLUE" team={blueTeam} onClick={() => { setSelectionSide('BLUE'); setView('selection'); }} participants={participants} />
                     </div>
                     <div className="relative aspect-[4/3] rounded-[1.5rem] bg-gradient-to-br from-[#4a0e0e] via-[#880e4f] to-[#b71c1c] border-2 border-red-400/20 shadow-2xl overflow-hidden group">
                        <SelectionPortal side="RED" team={redTeam} onClick={() => { setSelectionSide('RED'); setView('selection'); }} participants={participants} />
                     </div>
                  </div>
               </div>
               <div className="space-y-4"><h3 className="text-lg font-black uppercase tracking-tight text-white/90">Mode</h3><div className="flex gap-3">{['Votes', 'Coins'].map((m) => (<button key={m} onClick={() => setBattleMode(m as any)} className={cn("flex-1 h-12 rounded-2xl font-black uppercase italic text-sm transition-all border-2", battleMode === m ? "bg-emerald-600/80 border-emerald-400 text-white" : "bg-white/5 border-white/5 text-white/40")}>{m}</button>))}</div></div>
               <div className="pt-4 pb-10"><Button disabled={blueTeam.length === 0 || redTeam.length === 0} className="w-full h-16 rounded-[1.5rem] bg-emerald-800/80 text-emerald-400 font-black uppercase italic text-xl shadow-xl active:scale-95 transition-all">Start</Button></div>
            </div>
          </div>
        )}

        {view === 'selection' && (
          <div className={cn("animate-in fade-in slide-in-from-right-4 duration-500 min-h-[650px] relative flex flex-col", selectionSide === 'BLUE' ? "bg-gradient-to-b from-[#002b2b] via-[#004d4d] to-black" : "bg-gradient-to-b from-[#2d0a0a] via-[#4a0e0e] to-black")}>
            <header className="p-8 pb-4 flex items-center justify-between relative z-10 border-b border-white/5">
               <div className="flex items-center gap-4">
                  <button onClick={() => setView('battle')} className="p-1"><ChevronLeft className="h-8 w-8 text-white" /></button>
                  <div className="flex items-center gap-2">
                     <div className="bg-yellow-400 p-1.5 rounded-lg shadow-lg"><Star className="h-4 w-4 text-black fill-current" /></div>
                     <h2 className="text-4xl font-black text-white uppercase italic tracking-tighter">Select People</h2>
                  </div>
               </div>
               <button onClick={() => setView('battle')} className="bg-white/10 px-6 py-2 rounded-full font-black uppercase text-[10px] italic border border-white/20">Done</button>
            </header>

            <main className="flex-1 px-8 pb-10 relative z-10 flex flex-col gap-8">
               <div className="flex flex-col items-center justify-center gap-6 py-4">
                  <TeamSlot index={0} team={selectionSide === 'BLUE' ? blueTeam : redTeam} side={selectionSide} participants={participants} onRemove={(uid: string) => toggleSelection(uid)} />
                  <div className="flex justify-center gap-4">
                     {[1, 2, 3, 4].map(idx => (
                       <TeamSlot key={idx} index={idx} team={selectionSide === 'BLUE' ? blueTeam : redTeam} side={selectionSide} participants={participants} onRemove={(uid: string) => toggleSelection(uid)} />
                     ))}
                  </div>
               </div>

               <div className="flex-1 flex flex-col min-h-0">
                  <div className="flex items-center justify-between mb-4 px-2">
                     <h3 className="text-sm font-black uppercase tracking-widest text-white/60">Tribe on Mic</h3>
                     <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">{seatedParticipants.length} Synchronized</span>
                  </div>
                  <ScrollArea className="flex-1 bg-black/20 rounded-[2rem] border border-white/5 p-4 shadow-inner">
                    {seatedParticipants.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2">
                        {seatedParticipants.map((p) => {
                          const isSelected = (selectionSide === 'BLUE' ? blueTeam : redTeam).includes(p.uid);
                          const isOtherTeam = (selectionSide === 'BLUE' ? redTeam : blueTeam).includes(p.uid);
                          return (
                            <button 
                              key={p.uid} 
                              onClick={() => !isOtherTeam && toggleSelection(p.uid)} 
                              disabled={isOtherTeam}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-2xl transition-all border-2",
                                isSelected ? (selectionSide === 'BLUE' ? "bg-cyan-500/20 border-cyan-400" : "bg-red-500/20 border-red-400") : "bg-white/5 border-white/5 hover:bg-white/10",
                                isOtherTeam && "opacity-20 grayscale cursor-not-allowed"
                              )}
                            >
                               <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border border-white/10 shadow-md"><AvatarImage src={p.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
                                  <div className="text-left"><p className="font-black text-xs uppercase tracking-tight text-white">{p.name}</p></div>
                               </div>
                               {isSelected ? <Check className="h-4 w-4 text-white" /> : <Plus className="h-4 w-4 text-white/40" />}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-20 text-center space-y-4">
                         <Armchair className="h-12 w-12 text-white/10 mx-auto" />
                         <p className="opacity-20 italic font-medium">Nobody currently seated in frequency.</p>
                      </div>
                    )}
                  </ScrollArea>
               </div>
            </main>
          </div>
        )}

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </DialogContent>
    </Dialog>
  );
}

function TeamSlot({ index, team, side, participants, onRemove }: any) {
  const uid = team[index];
  const participant = participants.find((p: any) => p.uid === uid);
  return (
    <div className="flex flex-col items-center gap-1.5">
       <button 
         onClick={() => uid && onRemove(uid)}
         className={cn(
           "h-16 w-16 rounded-full flex items-center justify-center border-2 backdrop-blur-md transition-all shadow-xl",
           uid ? (side === 'BLUE' ? "border-cyan-400 bg-cyan-500/20" : "border-red-400 bg-red-500/20") : "border-white/10 bg-white/5"
         )}
       >
          {participant ? (
            <Avatar className="h-full w-full p-0.5"><AvatarImage src={participant.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>
          ) : (
            <Armchair className="h-6 w-6 text-white/20" />
          )}
       </button>
       <span className="text-[8px] font-black uppercase text-white/40 truncate w-16 text-center">{participant?.name || `Slot ${index + 1}`}</span>
    </div>
  );
}

function SelectionPortal({ side, team, onClick, participants }: any) {
  return (
    <button onClick={onClick} className="absolute inset-0 flex items-center justify-center active:scale-95 transition-transform group">
      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      {team.length > 0 ? (
        <div className="flex -space-x-3">
          {team.slice(0, 3).map((uid: string) => {
            const p = participants.find((part: any) => part.uid === uid);
            return <Avatar key={uid} className="h-12 w-12 border-2 border-white/40 shadow-xl"><AvatarImage src={p?.avatarUrl} /><AvatarFallback>U</AvatarFallback></Avatar>;
          })}
          {team.length > 3 && (
            <div className="h-12 w-12 rounded-full bg-black/60 border-2 border-white/40 flex items-center justify-center text-[10px] font-black text-white">+{team.length - 3}</div>
          )}
        </div>
      ) : (
        <div className="h-12 w-12 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border-2 border-white/20"><Plus className="h-6 w-6 text-white" /></div>
      )}
    </button>
  );
}
