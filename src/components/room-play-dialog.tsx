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
   
   // 2. Add System Message: "[Name] cleared the chat message"
   const systemMsgRef = doc(messagesRef);
   batch.set(systemMsgRef, {
     content: `${user.displayName || 'Admin'} cleared the chat message`,
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
      icon: <Trash2 className="h-6 w-6" />,
      color: 'bg-cyan-500'
    },
    { 
      id: 'public-msg', 
      label: 'Public Msg', 
      onClick: handleToggleChatMute, 
      active: !isChatMuted,
      icon: <MessageSquare className="h-6 w-6" />,
      color: isChatMuted ? 'bg-slate-700' : 'bg-cyan-500' 
    },
    { 
      id: 'gift-effects', 
      label: 'Gift Effects', 
      onClick: () => toast({ title: 'Premium Feature', description: 'Gift effects are always active for Sovereign members! ✨' }), 
      active: true,
      icon: <Zap className="h-6 w-6 text-yellow-300" />,
      color: 'bg-yellow-500/80' 
    }
  ];  const gameGrid = [
    { id: 'pk', label: 'Room PK', icon: 'PK', color: 'from-pink-500 to-rose-600', active: true },
    { id: 'battle', label: 'Battle', icon: '⚔️', color: 'from-blue-500 to-indigo-600' },
    { id: 'calculator', label: 'Calculator', icon: '🧮', color: 'from-yellow-500 to-orange-600' },
    { id: 'photo', label: 'Photo', icon: '🖼️', color: 'from-sky-500 to-blue-600' },
    { id: 'music', label: 'Music', icon: '🎵', color: 'from-blue-400 to-cyan-500', onClick: () => setView('music') },
    { id: 'magic-slot', label: 'Magic Slot', icon: '🎰', color: 'from-purple-500 to-fuchsia-600' },
    { id: 'candy-slot', label: 'Candy Slot', icon: '🍭', color: 'from-pink-400 to-rose-500' },
    { id: 'christmas-slot', label: 'Xmas Slot', icon: '🎄', color: 'from-green-500 to-emerald-600' },
    { id: 'jungle', label: 'Jungle', icon: '🦁', color: 'from-emerald-500 to-teal-600' },
    { id: 'halloween', label: 'Halloween', icon: '🎃', color: 'from-orange-500 to-red-600' },
    { id: 'lucky-wheel', label: 'Lucky Wheel', icon: '🎡', color: 'from-blue-500 to-cyan-600' },
    { id: 'lucky-coins', label: 'Coins', icon: '💰', color: 'from-amber-400 to-yellow-600' },
    { id: 'khazana', label: 'Khazana', icon: '💎', color: 'from-yellow-400 to-amber-600', onClick: () => { onOpenGames(); onOpenChange(false); } },
    { id: 'krazy-kards', label: 'Kards', icon: '🃏', color: 'from-blue-600 to-indigo-700' },
    { id: 'battle-royal', label: 'Battle', icon: '🏆', color: 'from-yellow-500 to-amber-700' },
    { id: 'carrom', label: 'Carrom', icon: '⚪', color: 'from-stone-400 to-stone-600' },
    { id: 'ludo', label: 'Ludo', icon: '🎲', color: 'from-red-500 to-red-700' },
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
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-[500px] bg-[#1a1a1a] rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden flex flex-col"
            style={{ height: view === 'grid' ? 'auto' : '80vh' }}
          >
            {/* Wafa-style Pull Bar */}
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-1 shrink-0" />

            {view === 'grid' && (
              <div className="p-6 pt-2 pb-10 space-y-8 overflow-y-auto no-scrollbar">
                {/* Top Row: Quick Toggles (Wafa Style) */}
                <div className="flex items-center justify-around px-2 shrink-0">
                  {toggleOptions.map(opt => (
                    <div key={opt.id} className="flex flex-col items-center gap-2">
                      <button 
                        onClick={opt.onClick}
                        className={cn(
                          "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all active:scale-90 border border-white/10 relative overflow-hidden",
                          opt.color
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                        {opt.active && opt.id !== 'clean' && (
                          <div className="absolute top-1 right-1 h-2 w-2 bg-green-400 rounded-full border border-black animate-pulse" />
                        )}
                        {opt.icon}
                      </button>
                      <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{opt.label}</span>
                    </div>
                  ))}
                </div>

                {/* Feature/Game Grid (Wafa Organized Style) */}
                <div className="grid grid-cols-4 gap-y-8 gap-x-2">
                  {gameGrid.map(item => (
                    <button 
                      key={item.id} 
                      onClick={item.onClick || (() => toast({ title: item.label, description: 'Game frequency syncing...' }))}
                      className="flex flex-col items-center gap-2 group active:scale-95 transition-all"
                    >
                      <div className={cn(
                        "h-14 w-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-md border border-white/5 relative overflow-hidden",
                        item.color
                      )}>
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        {typeof item.icon === 'string' ? (
                          <span className={cn(
                            "font-black italic drop-shadow-md",
                            item.icon === 'PK' ? "text-2xl text-white" : "text-3xl"
                          )}>
                            {item.icon}
                          </span>
                        ) : (
                          <div className="text-white drop-shadow-md">{item.icon}</div>
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-white/40 uppercase tracking-tighter truncate w-full text-center">
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
