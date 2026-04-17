'use client';

import React, { useState, useRef, useEffect } from 'react';
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
 Zap,
 Bot,
 Gamepad2,
 Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RoomParticipant } from '@/lib/types';
import { useUser, useFirestore, useStorage, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useToast } from '@/hooks/use-toast';
import { useUserProfile } from '@/hooks/use-user-profile';
import { searchVideosAction } from '@/actions/get-videos';
import { useRoomContext } from './room-provider';

interface RoomPlayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants?: RoomParticipant[];
  roomId?: string;
  room?: any;
  isAIListening: boolean;
  onToggleAIListening: () => void;
  onOpenGames: () => void;
  onSelectGame?: (slug: string) => void;
  onPlayLocalMusic?: (file: File) => void;
  onClearChat?: () => void;
  onSyncSharedMusic?: (track: any) => void;
  onToggleMiniPlayer?: () => void;
  defaultView?: 'grid' | 'music';
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
  isAIListening,
  onToggleAIListening,
  onOpenGames,
  onSelectGame,
  onPlayLocalMusic,
  onClearChat,
  onSyncSharedMusic,
  onToggleMiniPlayer,
  defaultView = 'grid'
}: RoomPlayDialogProps) {
 const { roomPlaylist, setRoomPlaylist, isMusicEnabled, setIsMusicEnabled } = useRoomContext();
 const [view, setView] = useState<'grid' | 'selection' | 'rules' | 'music'>('grid');
 const [musicTab, setMusicTab] = useState<'online' | 'device'>('online');
 const [isClearingChat, setIsClearingChat] = useState(false);
 const [isUploading, setIsUploading] = useState(false);
 const [roomMusicLibrary, setRoomMusicLibrary] = useState<any[]>([]);
 
 const [musicSearch, setMusicSearch] = useState('');
 const [isSearchingMusic, setIsSearchingMusic] = useState(false);
 const [musicResults, setMusicResults] = useState<any[]>([]);
 const [trackToDelete, setTrackToDelete] = useState<any | null>(null);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
 const wasLongPressRef = useRef(false);

 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid || undefined);
 const firestore = useFirestore();
 const storage = useStorage();
 const { toast } = useToast();

 const isOwner = user?.uid === room?.ownerId;
 const isMod = room?.moderatorIds?.includes(user?.uid || '');
 const canManage = isOwner || isMod;
 const isChatMuted = room?.isChatMuted || false;

  useEffect(() => {
    if (open) {
      setView(defaultView);
      if (defaultView === 'music') {
        setMusicTab('device');
      }
    }
  }, [open, defaultView]);

 useEffect(() => {
  if (!firestore || !roomId) return;
  
  const musicRef = collection(firestore, 'chatRooms', roomId, 'music');
  const q = query(musicRef, orderBy('createdAt', 'desc'));
  
  const unsubscribe = onSnapshot(q, (snapshot) => {
   const tracks = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
   }));
   setRoomMusicLibrary(tracks);
  });
  
  return () => unsubscribe();
 }, [firestore, roomId]);

  const handleClearChat = async () => {
  if (!firestore || !roomId || !user) return;
  setIsClearingChat(true);
  
  try {
   const messagesRef = collection(firestore, 'chatRooms', roomId, 'messages');
   const snap = await getDocs(messagesRef);
   
   const batch = writeBatch(firestore);
   
   snap.docs.forEach(d => batch.delete(d.ref));
   
   const currentName = userProfile?.username || user.displayName || 'Admin';
   const systemMsgRef = doc(messagesRef);
   batch.set(systemMsgRef, {
     content: `${currentName} cleared the chat message`,
     type: 'system',
     timestamp: serverTimestamp(),
   });

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

  const handleToggleVoice = () => {
  if (!firestore || !roomId) return;
  const roomRef = doc(firestore, 'chatRooms', roomId);
  const current = room?.isVoiceMuted || false;
  updateDocumentNonBlocking(roomRef, {
   isVoiceMuted: !current,
   updatedAt: serverTimestamp()
  });
  toast({ 
   title: current ? 'Voice Restored' : 'Voice Restricted', 
   description: current ? 'Tribe members can now take mic.' : 'Only authorities can speak.' 
  });
  onOpenChange(false);
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
  toast({ 
    variant: 'destructive',
    title: 'YouTube Not Supported',
    description: 'Please upload an MP3/audio file to the Room Library instead.'
  });
 };

 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !storage || !firestore || !roomId || !user) return;
  
  if (!file.type.startsWith('audio/')) {
   toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a valid audio file.' });
   return;
  }
  
  setIsUploading(true);
  try {
   const timestamp = Date.now();
   const storagePath = `rooms/${roomId}/music/${timestamp}_${file.name}`;
   const storageRef = ref(storage, storagePath);
   const uploadResult = await uploadBytes(storageRef, file);
   const downloadUrl = await getDownloadURL(uploadResult.ref);
   
   const musicData = {
    name: file.name,
    url: downloadUrl,
    storagePath: storagePath,
    type: 'upload',
    size: file.size,
    uploadedBy: user.uid,
    uploaderName: userProfile?.username || user.displayName || 'User',
    createdAt: serverTimestamp()
   };
   
   await addDocumentNonBlocking(collection(firestore, 'chatRooms', roomId, 'music'), musicData);
   toast({ title: 'Track Uploaded', description: `${file.name} added to room library permanently.` });
  } catch (error: any) {
   console.error('Upload failed:', error);
   toast({ variant: 'destructive', title: 'Upload Failed', description: error.message });
  } finally {
   setIsUploading(false);
   if (fileInputRef.current) fileInputRef.current.value = '';
  }
 };

 const handleSyncSharedMusic = async (track: any) => {
  if (!firestore || !roomId || !user) return;
  
  const roomRef = doc(firestore, 'chatRooms', roomId);
  await updateDocumentNonBlocking(roomRef, {
   currentMusicUrl: track.url,
   currentMusicTitle: track.name || track.url?.split('/').pop()?.split('?')[0] || 'Unknown Song',
   currentMusicType: track.type || 'upload',
   currentMusicId: track.id,
   isMusicPlaying: true,
   musicStartedAt: serverTimestamp(),
   musicStartOffset: 0,
   musicUpdatedAt: serverTimestamp(),
   musicUpdatedBy: user.uid,
   updatedAt: serverTimestamp()
  });
  
  setIsMusicEnabled(true);
  toast({ title: '🎵 Music Broadcasting', description: `${track.name || 'Track'} is now playing for everyone.` });
  onOpenChange(false);
 };

 const handleDeleteTrack = async (track: any) => {
  if (!canManage) {
   toast({ variant: 'destructive', title: 'Unauthorized', description: 'Only room authorities can delete tracks.' });
   return;
  }
  if (!firestore || !storage || !roomId) return;
  
  try {
   if (track.storagePath) {
    const storageRef = ref(storage, track.storagePath);
    await deleteObject(storageRef).catch(() => {});
   }
   
   await deleteDocumentNonBlocking(doc(firestore, 'chatRooms', roomId, 'music', track.id));
   toast({ title: 'Track Deleted', description: `${track.name} removed from library.` });
  } catch (error: any) {
   console.error('Delete failed:', error);
   toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
  }
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

 const handlePressStart = (track: any) => {
   if (!canManage) return;
   wasLongPressRef.current = false;
   longPressTimerRef.current = setTimeout(() => {
     wasLongPressRef.current = true;
     setTrackToDelete(track);
     if (typeof navigator !== 'undefined' && navigator.vibrate) {
       navigator.vibrate(50);
     }
   }, 1500);
 };

 const handlePressEnd = () => {
   if (longPressTimerRef.current) {
     clearTimeout(longPressTimerRef.current);
     longPressTimerRef.current = null;
   }
 };

 const handleTrackClick = (track: any) => {
   if (wasLongPressRef.current) {
     wasLongPressRef.current = false;
     return;
   }
   handleSyncSharedMusic(track);
 };

 const handlePlayDeviceTrack = (file: File) => {
   setIsMusicEnabled(true);
   if (onPlayLocalMusic) {
    onPlayLocalMusic(file);
    toast({ title: 'Broadcasting Track', description: `Syncing ${file.name} to room.` });
   }
  };

  // ----------------------------------------------------
  // UPDATED GLOSSY UI: toggleOptions
  // ----------------------------------------------------
  const toggleOptions = [
    { 
      id: 'clean', 
      label: 'Clean', 
      onClick: handleClearChat, 
      active: isClearingChat,
      icon: <Trash2 className="h-7 w-7 text-white drop-shadow-md" />,
      // Glossy Red Dustbin
      color: 'bg-gradient-to-b from-red-400 to-red-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_10px_rgba(220,38,38,0.5)] border-red-400/50 text-white'
    },
    { 
      id: 'public-msg', 
      label: 'Public Msg', 
      onClick: handleToggleChatMute, 
      active: !isChatMuted,
      icon: isChatMuted ? <MessageSquareOff className="h-7 w-7 text-white/50" /> : <MessageSquare className="h-7 w-7 text-white drop-shadow-md" />,
      // Glossy Green Msg (Gray if muted)
      color: isChatMuted 
        ? 'bg-gradient-to-b from-slate-600 to-slate-800 shadow-inner border-slate-600' 
        : 'bg-gradient-to-b from-green-400 to-green-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_10px_rgba(34,197,94,0.5)] border-green-400/50 text-white' 
    },
    { 
      id: 'gift-effects', 
      label: 'Gift Effects', 
      onClick: () => toast({ title: 'Premium Feature', description: 'Gift effects are always active for Sovereign members! ✨' }), 
      active: true,
      icon: <Gift className="h-7 w-7 text-white drop-shadow-md" />,
      // Glossy Orange Gift
      color: 'bg-gradient-to-b from-orange-400 to-orange-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_10px_rgba(249,115,22,0.5)] border-orange-400/50 text-white' 
    }
  ];

  const handleGameSelect = (slug: string) => {
    if (onSelectGame) {
      onSelectGame(slug);
      onOpenChange(false);
    } else {
      toast({ title: 'Game Sync', description: 'Initializing frequency...' });
    }
  };

  // ----------------------------------------------------
  // UPDATED GLOSSY UI: gameGrid
  // ----------------------------------------------------
  const gameGrid = [
    { 
      id: 'game-selector', 
      label: 'Games', 
      icon: <Gamepad2 className="h-7 w-7 text-white drop-shadow-md" />, 
      // Glossy Golden Games
      color: 'from-yellow-400 to-amber-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_10px_rgba(245,158,11,0.5)] border border-yellow-400/50', 
      onClick: () => { onOpenGames(); onOpenChange(false); } 
    },
    { 
      id: 'music', 
      label: 'Music', 
      icon: <Music className="h-7 w-7 text-white drop-shadow-md" />, 
      // Glossy Blue Music
      color: 'from-cyan-400 to-blue-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_10px_rgba(59,130,246,0.5)] border border-cyan-400/50', 
      onClick: () => { setView('music'); onToggleMiniPlayer?.(); } 
    },
    { 
      id: 'ai-listening', 
      label: isAIListening ? 'AI Listening' : 'AI Listen', 
      icon: <Bot className="h-7 w-7 text-white drop-shadow-md" />, 
      // Glossy Purple AI Robot (Turns to Red/Rose when active)
      color: isAIListening 
        ? 'from-rose-400 to-red-600 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_10px_rgba(225,29,72,0.5)] border border-rose-400/50' 
        : 'from-fuchsia-400 to-purple-700 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6),0_4px_10px_rgba(168,85,247,0.5)] border border-fuchsia-400/50', 
      onClick: onToggleAIListening 
    },
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
            className="absolute inset-0 bg-black/40 pointer-events-auto"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
            className="relative w-full max-w-[500px] bg-[#121212] rounded-t-[2rem] border-t border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col mb-0"
            style={{ 
              height: view === 'grid' ? 'auto' : '75vh',
              maxHeight: view === 'grid' ? '65vh' : '75vh'
            }}
          >
            {/* Pull Bar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-4 mb-2 shrink-0" />

            {view === 'grid' && (
              <div className="p-4 pt-2 space-y-6 overflow-y-auto no-scrollbar">
                
                {/* Top Row: Quick Toggles (Now perfectly Glossy SVGA Style) */}
                <div className="flex items-center justify-around px-4 shrink-0 pb-2">
                  {toggleOptions.map(opt => (
                    <div key={opt.id} className="flex flex-col items-center gap-2">
                       <button 
                        onClick={opt.onClick}
                        className={cn(
                          "h-16 w-16 rounded-full flex items-center justify-center transition-all active:scale-95 relative overflow-hidden",
                          opt.color
                        )}
                      >
                        {/* Top glass reflection effect */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                        
                        <div className="relative z-10 flex items-center justify-center">
                          {opt.icon}
                        </div>

                        {opt.active && opt.id !== 'clean' && (
                          <div className="absolute top-2 right-2 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-black z-20" />
                        )}
                      </button>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{opt.label}</span>
                    </div>
                  ))}
                </div>

                {/* Feature/Game Grid - (Glossy 3D SVGA Style) */}
                <div className="grid grid-cols-4 gap-y-6 gap-x-2 px-2 pb-4">
                  {gameGrid.map(item => (
                    <button 
                      key={item.id} 
                      onClick={item.onClick}
                      className="flex flex-col items-center gap-2.5 group active:scale-90 transition-all"
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-[1.2rem] bg-gradient-to-b flex items-center justify-center relative overflow-hidden",
                        item.color
                      )}>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        {/* Top glass reflection effect for grid buttons */}
                        <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />
                        
                        <div className="group-hover:scale-110 transition-transform relative z-10">
                          {item.icon}
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-white/50 uppercase tracking-tight truncate w-full text-center">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {view === 'music' && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-full bg-slate-900/60 backdrop-blur-xl overflow-hidden">
                 <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="audio/*"
                  onChange={handleFileUpload}
                />
                 <header className="p-6 pb-2 flex items-center justify-between shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-3">
                    <button onClick={() => setView('grid')} className="p-1 hover:scale-110 transition-transform"><ChevronLeft className="h-6 w-6 text-white/60" /></button>
                    <h2 className="text-2xl font-bold text-white uppercase tracking-tight">Music Sync</h2>
                    </div>
                    {musicTab === 'device' && (
                     <Button 
                       onClick={() => fileInputRef.current?.click()} 
                       disabled={isUploading}
                       className="h-8 px-3 rounded-full bg-cyan-500 hover:bg-cyan-600 text-black font-bold text-[10px] uppercase shadow-lg active:scale-95 transition-all gap-1.5"
                     >
                       {isUploading ? <Loader className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                       Add +
                     </Button>
                    )}
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
                    Room Library ({roomMusicLibrary.length})
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
                     <div className="space-y-1">
                        {roomMusicLibrary.length === 0 && (
                        <div className="text-center py-12 text-white/40">
                            <Music className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p className="text-sm font-medium">No tracks in library</p>
                            <p className="text-xs mt-1">Add frequencies to the room sync.</p>
                        </div>
                        )}
                        {roomMusicLibrary.map((track) => (
                          <div 
                            key={track.id} 
                            onPointerDown={() => handlePressStart(track)}
                            onPointerUp={handlePressEnd}
                            onPointerLeave={handlePressEnd}
                            className="w-full flex items-center justify-between gap-3 py-3.5 border-b border-white/5 group active:bg-white/5 transition-colors px-1 select-none"
                          >
                            <button
                              onClick={() => handleTrackClick(track)}
                              className="flex-1 flex flex-col items-start gap-0.5 text-left min-w-0"
                            >
                              <p className="text-sm font-medium text-white/90 truncate w-full">{track.name}</p>
                              <p className="text-[11px] text-white/40 truncate w-full">{track.uploaderName} • {track.type === 'upload' ? 'Local Frequency' : 'External Sync'}</p>
                            </button>
                            
                            <div className="flex items-center gap-2 shrink-0 pr-1">
                              <button 
                                onClick={() => handleTrackClick(track)}
                                className="h-9 w-9 flex items-center justify-center text-white hover:text-cyan-400 transition-colors active:scale-90"
                              >
                                <Play className="h-5 w-5 fill-current" />
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                    )}
                </ScrollArea>
              </div>
            )}
            
            <AnimatePresence>
              {trackToDelete && (
                <div className="absolute inset-0 z-[110] flex items-center justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setTrackToDelete(null)}
                    className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                  />
                  
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative max-w-[300px] w-full rounded-[2.5rem] bg-white p-0 overflow-hidden text-black shadow-2xl flex flex-col items-center justify-center"
                  >
                    <div className="p-8 text-center space-y-7 w-full">
                      <p className="text-base font-bold text-slate-800 leading-tight px-2">
                        Are you sure to delete this song?
                      </p>
                      
                      <div className="flex gap-3 pt-2">
                        <Button 
                          variant="ghost" 
                          onClick={() => setTrackToDelete(null)}
                          className="flex-1 h-12 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-wider transition-all"
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            handleDeleteTrack(trackToDelete);
                            setTrackToDelete(null);
                          }}
                          className="flex-1 h-12 rounded-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold uppercase text-[10px] tracking-wider shadow-lg shadow-cyan-400/20 active:scale-95 transition-all"
                        >
                          Confirm
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
