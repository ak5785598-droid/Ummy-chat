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
  VolumeX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RoomParticipant } from '@/lib/types';
import { useUser, useFirestore, errorEmitter, FirestorePermissionError, updateDocumentNonBlocking } from '@/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface RoomPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants?: RoomParticipant[];
  roomId?: string;
  room?: any;
  isMutedLocal: boolean;
  setIsMutedLocal: (val: boolean) => void;
}

/**
 * High-Fidelity Room Play Portal.
 * Features real-time participant selection, Battle setup, and Frequency Management.
 * Re-engineered with a 3-column grid to align management tools vertically.
 */
export function RoomPlayDialog({ 
  open, 
  onOpenChange, 
  participants = [], 
  roomId, 
  room,
  isMutedLocal,
  setIsMutedLocal
}: RoomPlayDialogProps) {
  const [view, setView] = useState<'grid' | 'battle' | 'selection' | 'rules'>('grid');
  const [battleMode, setBattleMode] = useState<'Votes' | 'Coins'>('Votes');
  const [selectionSide, setSelectionSide] = useState<'BLUE' | 'RED'>('BLUE');
  const [isClearingChat, setIsClearingChat] = useState(false);
  
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
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: `chatRooms/${roomId}/messages`,
        operation: 'delete',
      }));
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

  // RE-ORDERED OPTIONS: 0: Volume, 1: Battle, 2: Calculator, 3: Mute Chat, 4: Clear Chat
  // In a 3-column grid, index 3 (Mute Chat) will be directly below index 0 (Mute Room).
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
          "relative w-16 h-16 rounded-full p-0.5 border-2 border-white/20 shadow-xl overflow-hidden group",
          isMutedLocal ? "bg-gradient-to-br from-red-500 to-red-700" : "bg-gradient-to-br from-blue-500 to-blue-700"
        )}>
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              {isMutedLocal ? <VolumeX className="h-8 w-8 text-white drop-shadow-md" /> : <Volume2 className="h-8 w-8 text-white drop-shadow-md" />}
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    },
    { 
      id: 'battle', 
      label: 'Battle', 
      onClick: () => setView('battle'),
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-red-500 p-0.5 border-2 border-white/20 shadow-xl overflow-hidden group">
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              <Swords className="h-8 w-8 text-white drop-shadow-md animate-pulse" />
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    },
    { 
      id: 'calculator', 
      label: 'Calculator', 
      onClick: () => {},
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-b from-[#3d2b1f] to-black p-0.5 border-2 border-[#fbbf24] shadow-[0_0_15px_rgba(251,191,36,0.4)] overflow-hidden group">
           <div className="w-full h-full flex items-center justify-center rounded-full bg-black/40">
              <Flame className="h-8 w-8 text-orange-500 fill-current animate-reaction-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/10 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    }
  ];

  if (canManage) {
    // Index 3: Positioned below Mute Room in a 3-col grid
    options.push({
      id: 'mute-chat',
      label: isChatMuted ? 'Open Public Msg' : 'Close Public Msg',
      onClick: handleToggleChatMute,
      icon: (
        <div className={cn(
          "relative w-16 h-16 rounded-full p-0.5 border-2 border-white/20 shadow-xl overflow-hidden group",
          isChatMuted ? "bg-gradient-to-br from-green-500 to-green-700" : "bg-gradient-to-br from-orange-500 to-orange-700"
        )}>
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              {isChatMuted ? (
                <MessageSquare className="h-8 w-8 text-white drop-shadow-md" />
              ) : (
                <MessageSquareOff className="h-8 w-8 text-white drop-shadow-md" />
              )}
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    });

    // Index 4: Positioned below Battle in a 3-col grid
    options.push({
      id: 'clear-chat',
      label: 'Clear Chat',
      onClick: handleClearChat,
      icon: (
        <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 p-0.5 border-2 border-white/20 shadow-xl overflow-hidden group">
           <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
           <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-full">
              {isClearingChat ? <Loader className="h-8 w-8 text-white animate-spin" /> : <Trash2 className="h-8 w-8 text-white drop-shadow-md" />}
           </div>
           <div className="absolute inset-0 w-1/2 h-full bg-white/30 skew-x-[-30deg] -translate-x-[200%] animate-shine" />
        </div>
      )
    });
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      setTimeout(() => setView('grid'), 300);
    }
    onOpenChange(open);
  };

  const toggleSelection = (uid: string) => {
    const currentTeam = selectionSide === 'BLUE' ? blueTeam : redTeam;
    const setter = selectionSide === 'BLUE' ? setBlueTeam : setRedTeam;
    const otherTeam = selectionSide === 'BLUE' ? redTeam : blueTeam;
    if (otherTeam.includes(uid)) return;
    if (currentTeam.includes(uid)) setter(prev => prev.filter(id => id !== uid));
    else if (currentTeam.length < 5) setter(prev => [...prev, uid]);
  };

  const seatedParticipants = (participants || []).filter(p => p.seatIndex > 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a]/95 backdrop-blur-2xl border-none p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        
        {view === 'grid' && (
          <div className="animate-in fade-in duration-500">
            <DialogHeader className="p-8 pb-4">
              <DialogTitle className="text-2xl font-black uppercase italic tracking-tighter text-white/90">Room Play</DialogTitle>
              <DialogDescription className="sr-only">Choose a room game or tool frequency.</DialogDescription>
            </DialogHeader>
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

        {view === 'battle' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <header className="p-6 pb-2 flex items-center justify-between">
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

        {view === 'rules' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 min-h-[600px] bg-gradient-to-b from-[#064e3b] via-[#065f46] to-black relative overflow-hidden flex flex-col">
            <header className="p-6 flex items-center relative z-10">
               <button onClick={() => setView('battle')} className="h-10 w-10 rounded-full bg-[#064e3b]/40 border border-white/20 flex items-center justify-center"><ChevronLeft className="h-6 w-6 text-yellow-400" /></button>
               <h2 className="text-3xl font-black text-yellow-400 italic tracking-tighter text-center flex-1 pr-10">PK Rules</h2>
            </header>
            <ScrollArea className="flex-1 p-8 pt-2 relative z-10">
               <div className="space-y-10 pb-20">
                  <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white italic tracking-tight flex items-center gap-2">🎫 1 person 1 vote</h3>
                    <p className="text-sm font-medium text-white/80 leading-relaxed pl-8">Honor rankings are based on the total votes received from room participants during the PK window.</p>
                  </section>
                  <section className="space-y-4">
                    <h3 className="text-2xl font-black text-white italic tracking-tight flex items-center gap-2">🔥 Coins received</h3>
                    <p className="text-sm font-medium text-white/80 leading-relaxed pl-8">Charm rankings reflect the total value of Gold Coin gifts received during the live battle frequency.</p>
                  </section>
               </div>
            </ScrollArea>
          </div>
        )}

        {view === 'selection' && (
          <div className={cn("animate-in fade-in slide-in-from-right-4 duration-500 min-h-[650px] relative flex flex-col", selectionSide === 'BLUE' ? "bg-gradient-to-b from-[#002b2b] via-[#004d4d] to-black" : "bg-gradient-to-b from-[#2d0a0a] via-[#4a0e0e] to-black")}>
            <header className="p-8 pb-4 flex items-center justify-between relative z-10">
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
