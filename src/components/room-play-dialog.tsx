'use client';

import React, { useState, useRef } from 'react';
import { 
 Dialog, 
 DialogContent, 
 DialogHeader, 
 DialogTitle,
 DialogDescription
} from '@/components/ui/dialog';
import { 
 ChevronLeft, 
 Loader, 
 MessageSquare, 
 MessageSquareOff, 
 Volume2, 
 VolumeX, 
 Music, 
 Search, 
 Play, 
 Upload, 
 FileAudio, 
 Power,
 Trash2,
 Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RoomParticipant } from '@/lib/types';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { GameControllerIcon } from '@/components/icons';
import { searchVideosAction } from '@/actions/get-videos';
import { useRoomContext } from './room-provider';

interface RoomPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants?: RoomParticipant[];
  roomId?: string;
  room?: any;
  isMutedLocal: boolean;
  setIsMutedLocal: (val: boolean) => void;
  onOpenGames: () => void;
  onSelectGame?: (slug: string) => void;
  onPlayLocalMusic?: (file: File) => void;
  onClearChat?: () => void;
}

/**
 * High-Fidelity Room Play Portal.
 * Interactive tools for authorities and tribe members.
 */
export function RoomPlayDialog({ 
  open, 
  onOpenChange, 
  participants = [], 
  roomId, 
  room,
  isMutedLocal,
  setIsMutedLocal,
  onOpenGames,
  onSelectGame,
  onPlayLocalMusic,
  onClearChat
}: RoomPlayDialogProps) {
 const { roomPlaylist, setRoomPlaylist, isMusicEnabled, setIsMusicEnabled } = useRoomContext();
 const [view, setView] = useState<'grid' | 'selection' | 'rules' | 'music'>('grid');
 const [musicTab, setMusicTab] = useState<'online' | 'device'>('online');
 const [isClearingChat, setIsClearingChat] = useState(false);
 
 const [musicSearch, setMusicSearch] = useState('');
 const [isSearchingMusic, setIsSearchingMusic] = useState(false);
 const [musicResults, setMusicResults] = useState<any[]>([]);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid || undefined);
 const firestore = useFirestore();
 const { toast } = useToast();

 const isOwner = user?.uid === room?.ownerId;
 const isMod = room?.moderatorIds?.includes(user?.uid || '');
 const canManage = isOwner || isMod;
 const isChatMuted = room?.isChatMuted || false;

 const handleClearChat = async () => {
  if (!firestore || !roomId || !user) return;
  setIsClearingChat(true);
  
  try {
   const messagesRef = collection(firestore, 'chatRooms', roomId, 'messages');
   const snap = await getDocs(messagesRef);
   
   const batch = writeBatch(firestore);
   
   // 1. Delete all existing messages
   snap.docs.forEach(d => batch.delete(d.ref));
   
   // 2. Add System Message with LATEST Username
   const currentName = userProfile?.username || user.displayName || 'Admin';
   const systemMsgRef = doc(messagesRef);
   batch.set(systemMsgRef, {
     content: `${currentName} cleared the chat message`,
     type: 'system',
     timestamp: serverTimestamp(),
   });

   // 3. Update room document with clear timestamp
   const roomRef = doc(firestore, 'chatRooms', roomId);
   batch.update(roomRef, {
     chatClearedAt: serverTimestamp(),
     updatedAt: serverTimestamp()
   });
   
   await batch.commit();
    toast({ title: 'Frequency Purified', description: 'Chat history cleared.' });
    if (onClearChat) onClearChat();
   onOpenChange(false);
  } catch (e: any) {
   console.error(e);
   toast({ variant: 'destructive', title: 'Purification Failed' });
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
   description: isChatMuted ? 'Tribe members can now send messages.' : 'Only authorities can broadcast.' 
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

 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (file) {
   if (!file.type.startsWith('audio/')) {
    toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a valid audio frequency.' });
    return;
   }
   setRoomPlaylist(prev => [file, ...prev]);
   toast({ title: 'Track Added', description: `${file.name} synced to session.` });
  }
 };

 const handlePlayDeviceTrack = (file: File) => {
   setIsMusicEnabled(true);
   if (onPlayLocalMusic) {
    onPlayLocalMusic(file);
    toast({ title: 'Broadcasting Track', description: `Syncing ${file.name} to room.` });
   }
  };

  // Header Toggle Action
  const toggleOptions = [
    { 
      id: 'clean', 
      label: 'Clean', 
      onClick: handleClearChat, 
      active: isClearingChat,
      icon: <img src="https://img.icons8.com/color/120/broom.png" className="h-10 w-10" />,
      color: 'bg-white/5 border-white/10'
    },
    { 
      id: 'public-msg', 
      label: 'Public Msg', 
      onClick: handleToggleChatMute, 
      active: !isChatMuted,
      icon: <img src="https://img.icons8.com/color/120/message-square.png" className="h-10 w-10" />,
      color: 'bg-white/5 border-white/10' 
    },
    { 
      id: 'gift-effects', 
      label: 'Gift Effects', 
      onClick: () => toast({ title: 'Premium Feature', description: 'Gift effects are always active for Sovereign members! ✨' }), 
      active: true,
      icon: <img src="https://img.icons8.com/color/120/lightning-bolt.png" className="h-10 w-10" />,
      color: 'bg-white/5 border-white/10' 
    }
  ];

  // Feature/Game Action Handler
  const handleGameSelect = (slug: string) => {
    if (onSelectGame) {
      onSelectGame(slug);
      onOpenChange(false);
    } else {
      toast({ title: 'Game Sync', description: 'Initializing frequency...' });
    }
  };

  const gameGrid = [
    { id: 'pk', label: 'Room PK', icon: 'https://img.icons8.com/color/120/battle.png', color: 'from-pink-500/20 to-rose-600/20', onClick: () => handleGameSelect('pk') },
    { id: 'battle', label: 'Battle', icon: 'https://img.icons8.com/color/120/swords.png', color: 'from-blue-500/20 to-indigo-600/20', onClick: () => handleGameSelect('battle') },
    { id: 'calculator', label: 'Calculator', icon: 'https://img.icons8.com/color/120/calculator.png', color: 'from-orange-500/20 to-yellow-600/20', onClick: () => handleGameSelect('calculator') },
    { id: 'game-selector', label: 'Games', icon: 'https://img.icons8.com/color/120/nintendo-entertainment-system.png', color: 'from-green-500/20 to-emerald-600/20', onClick: () => { onOpenGames(); onOpenChange(false); } },
    { id: 'music', label: 'Music', icon: 'https://img.icons8.com/color/120/musical-notes.png', color: 'from-blue-400/20 to-cyan-500/20', onClick: () => setView('music') },
    { id: 'magic-slot', label: 'Magic Slot', icon: 'https://img.icons8.com/color/120/slot-machine.png', color: 'from-purple-500/20 to-fuchsia-600/20', onClick: () => handleGameSelect('magic-slot'), badge: 'New' },
    { id: 'candy-slot', label: 'Candy Slot', icon: 'https://img.icons8.com/color/120/candy.png', color: 'from-pink-400/20 to-rose-500/20', onClick: () => handleGameSelect('candy-slot') },
    { id: 'christmas-slot', label: 'Xmas Slot', icon: 'https://img.icons8.com/color/120/christmas-tree.png', color: 'from-green-500/20 to-emerald-600/20', onClick: () => handleGameSelect('christmas-slot'), badge: 'New' },
    { id: 'jungle', label: 'Jungle', icon: 'https://img.icons8.com/color/120/lion.png', color: 'from-emerald-500/20 to-teal-600/20', onClick: () => handleGameSelect('jungle'), badge: 'New' },
    { id: 'halloween', label: 'Halloween', icon: 'https://img.icons8.com/color/120/pumpkin.png', color: 'from-orange-500/20 to-red-600/20', onClick: () => handleGameSelect('halloween') },
    { id: 'lucky-wheel', label: 'Lucky Wheel', icon: 'https://img.icons8.com/color/120/roulette.png', color: 'from-blue-500/20 to-cyan-600/20', onClick: () => handleGameSelect('lucky-wheel') },
    { id: 'lucky-coins', label: 'Coins', icon: 'https://img.icons8.com/color/120/gold-pot.png', color: 'from-amber-400/20 to-yellow-600/20', onClick: () => handleGameSelect('lucky-coins'), badge: 'Hot' },
    { id: 'khazana', label: 'Khazana', icon: 'https://img.icons8.com/color/120/diamond.png', color: 'from-yellow-400/20 to-amber-600/20', onClick: () => handleGameSelect('fruit-party') },
    { id: 'krazy-kards', label: 'Kards', icon: 'https://img.icons8.com/color/120/cards.png', color: 'from-blue-600/20 to-indigo-700/20', onClick: () => handleGameSelect('krazy-kards') },
    { id: 'carrom', label: 'Carrom', icon: 'https://img.icons8.com/color/120/white-circle.png', color: 'from-stone-400/20 to-stone-600/20', onClick: () => handleGameSelect('carrom'), badge: 'New' },
    { id: 'ludo', label: 'Ludo', icon: 'https://img.icons8.com/color/120/dice.png', color: 'from-red-500/20 to-red-700/20', onClick: () => handleGameSelect('ludo'), badge: 'New' },
  ];

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/25 backdrop-blur-[2px] pointer-events-auto"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-[500px] bg-[#1a1a1a] rounded-t-[2.5rem] border-t border-white/5 shadow-2xl pointer-events-auto overflow-hidden flex flex-col"
            style={{ height: view === 'grid' ? 'auto' : '82vh' }}
          >
            {/* Wafa-style Pull Bar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-4 mb-2 shrink-0" />

            {view === 'grid' && (
              <div className="p-4 pt-4 pb-12 space-y-10 overflow-y-auto no-scrollbar">
                {/* Top Row: Quick Toggles (Glossy Circles) */}
                <div className="flex items-center justify-around px-2 shrink-0 gap-3">
                  {toggleOptions.map(opt => (
                    <div 
                      key={opt.id} 
                      onClick={opt.onClick}
                      className={cn(
                        "flex-1 flex flex-col items-center justify-center gap-2 p-3 rounded-[1.8rem] border border-white/10 transition-all active:scale-95 cursor-pointer",
                        opt.color
                      )}
                    >
                      <div className="relative">
                        {opt.icon}
                        {opt.id !== 'clean' && (
                          <div className={cn(
                            "absolute -top-1 -right-1 h-3 w-3 rounded-full border border-black",
                            opt.active ? "bg-cyan-400" : "bg-slate-500"
                          )} />
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-white/50 whitespace-nowrap">{opt.label}</span>
                      {opt.id !== 'clean' && (
                        <div className={cn(
                          "w-8 h-4 rounded-full relative transition-colors duration-300",
                          opt.active ? "bg-cyan-400/30" : "bg-white/10"
                        )}>
                          <div className={cn(
                            "absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300",
                            opt.active ? "left-[18px] bg-cyan-400" : "left-0.5 bg-white/20"
                          )} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Feature/Game Grid (Wafa Organized Style) */}
                <div className="grid grid-cols-4 gap-y-7 gap-x-2 px-1 pb-10">
                  {gameGrid.map(item => (
                    <button 
                      key={item.id} 
                      onClick={item.onClick}
                      className="flex flex-col items-center gap-1.5 group active:scale-90 transition-all"
                    >
                      <div className={cn(
                        "h-[68px] w-[68px] rounded-[1.4rem] bg-gradient-to-br flex items-center justify-center shadow-lg border border-white/5 relative overflow-hidden",
                        item.color
                      )}>
                        <div className="absolute inset-x-0 top-0 h-[40%] bg-white/5" />
                        <img 
                          src={item.icon} 
                          className="h-11 w-11 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform" 
                          alt={item.label} 
                        />
                        {item.badge && (
                          <div className={cn(
                            "absolute top-1 right-1 px-1.5 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter shadow-lg",
                            item.badge === 'New' ? "bg-orange-500 text-white" : "bg-red-500 text-white"
                          )}>
                            {item.badge}
                          </div>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-white/70 tracking-tight truncate w-full text-center">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === 'music' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                 <header className="p-6 pb-2 flex items-center justify-between shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-3">
                    <button onClick={() => setView('grid')} className="p-1 hover:scale-110 transition-transform"><ChevronLeft className="h-6 w-6 text-white/60" /></button>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Music Sync</h2>
                    </div>
                </header>
                
                <div className="p-4 px-6 shrink-0 space-y-4">
                    <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                    <div className="flex items-center gap-3">
                        <div className={cn("p-2 rounded-xl transition-colors", isMusicEnabled ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40")}>
                        <Power className="h-5 w-5" />
                        </div>
                        <div>
                        <p className="text-xs font-bold uppercase tracking-tight text-white/90">Music Power</p>
                        <p className="text-[8px] font-bold uppercase text-white/40 tracking-wider">{isMusicEnabled ? 'Frequency Active' : 'Offline'}</p>
                        </div>
                    </div>
                    <Switch checked={isMusicEnabled} onCheckedChange={setIsMusicEnabled} />
                    </div>

                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                    <button 
                    onClick={() => setMusicTab('online')}
                    className={cn(
                    "flex-1 py-2.5 rounded-xl font-bold uppercase text-[10px] transition-all",
                    musicTab === 'online' ? "bg-white/10 text-white shadow-lg" : "text-white/40"
                    )}
                    >
                    Online Sync
                    </button>
                    <button 
                    onClick={() => setMusicTab('device')}
                    className={cn(
                    "flex-1 py-2.5 rounded-xl font-bold uppercase text-[10px] transition-all",
                    musicTab === 'device' ? "bg-white/10 text-white shadow-lg" : "text-white/40"
                    )}
                    >
                    Playlist ({roomPlaylist.length})
                    </button>
                    </div>
                </div>

                <ScrollArea className="flex-1 px-6 pb-20 no-scrollbar">
                    {musicTab === 'online' ? (
                    <div className="space-y-4">
                        <div className="flex gap-2 mb-4">
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
                        {musicResults.map((video) => (
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
                            <p className="text-xs font-bold uppercase text-white truncate">{video.title}</p>
                        </div>
                        </button>
                        ))}
                    </div>
                    ) : (
                    <div className="space-y-3">
                        <button 
                        onClick={() => { setIsMusicEnabled(false); fileInputRef.current?.click(); }}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-white/10 shadow-xl flex items-center justify-center gap-3 font-bold uppercase text-sm active:scale-95 transition-all mb-4"
                        >
                        <Upload className="h-5 w-5" />
                        Add from Device
                        </button>
                        {roomPlaylist.map((file, idx) => (
                        <button 
                        key={idx} 
                        onClick={() => handlePlayDeviceTrack(file)}
                        className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left border border-white/5"
                        >
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <FileAudio className="h-5 w-5" />
                        </div>
                        <p className="flex-1 text-xs font-bold uppercase text-white truncate">{file.name}</p>
                        <Play className="h-4 w-4 text-white/40" />
                        </button>
                        ))}
                    </div>
                    )}
                </ScrollArea>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
