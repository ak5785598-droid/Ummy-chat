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
import { useUser, useFirestore, useStorage, updateDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, getDocs, writeBatch, doc, serverTimestamp, query, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
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
  onSyncSharedMusic?: (track: any) => void;
  onToggleMiniPlayer?: () => void;
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
  onClearChat,
  onSyncSharedMusic,
  onToggleMiniPlayer
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
 const fileInputRef = useRef<HTMLInputElement>(null);

 const { user } = useUser();
 const { userProfile } = useUserProfile(user?.uid || undefined);
 const firestore = useFirestore();
 const storage = useStorage();
 const { toast } = useToast();

 const isOwner = user?.uid === room?.ownerId;
 const isMod = room?.moderatorIds?.includes(user?.uid || '');
 const canManage = isOwner || isMod;
 const isChatMuted = room?.isChatMuted || false;

 // Load room music library from Firestore
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
  // NOTE: YouTube URLs cannot be played by HTML <audio> element.
  // User must upload actual audio files to Room Library.
  toast({ 
    variant: 'destructive',
    title: 'YouTube Not Supported',
    description: 'Please upload an MP3/audio file to the Room Library instead.'
  });
 };

 // Upload file to Firebase Storage and save to room music library
 const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !storage || !firestore || !roomId || !user) return;
  
  if (!file.type.startsWith('audio/')) {
   toast({ variant: 'destructive', title: 'Invalid File', description: 'Please select a valid audio file.' });
   return;
  }
  
  setIsUploading(true);
  try {
   // Upload to Firebase Storage
   const timestamp = Date.now();
   const storagePath = `rooms/${roomId}/music/${timestamp}_${file.name}`;
   const storageRef = ref(storage, storagePath);
   const uploadResult = await uploadBytes(storageRef, file);
   const downloadUrl = await getDownloadURL(uploadResult.ref);
   
   // Save to room music library in Firestore
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

 // Sync track to room — ALL clients (including owner) will hear it via Firestore listener
 const handleSyncSharedMusic = async (track: any) => {
  if (!firestore || !roomId || !user) return;
  
  const roomRef = doc(firestore, 'chatRooms', roomId);
  await updateDocumentNonBlocking(roomRef, {
   currentMusicUrl: track.url,
   currentMusicTitle: track.name,
   currentMusicType: track.type || 'upload',
   currentMusicId: track.id,
   isMusicPlaying: true,
   musicStartedAt: serverTimestamp(), // Virtual Clock: starts NOW
   musicStartOffset: 0,              // from the beginning
   musicUpdatedAt: serverTimestamp(),
   musicUpdatedBy: user.uid,
   updatedAt: serverTimestamp()
  });
  
  // NOTE: Do NOT play locally here. The useEffect sync in room-client.tsx
  // will fire for ALL clients including the owner when Firestore updates.
  setIsMusicEnabled(true);
  toast({ title: '🎵 Music Broadcasting', description: `${track.name} is now playing for everyone.` });
  onOpenChange(false);
 };

 // Delete track from room library (owner/mod only)
 const handleDeleteTrack = async (track: any) => {
  if (!canManage) {
   toast({ variant: 'destructive', title: 'Unauthorized', description: 'Only room authorities can delete tracks.' });
   return;
  }
  if (!firestore || !storage || !roomId) return;
  
  try {
   // Delete from Storage
   if (track.storagePath) {
    const storageRef = ref(storage, track.storagePath);
    await deleteObject(storageRef).catch(() => {}); // Ignore if not found
   }
   
   // Delete from Firestore
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
      icon: <img src="https://img.icons8.com/clouds/100/trash.png" className="h-10 w-10" />,
      color: 'bg-cyan-500/20 text-cyan-400'
    },
    { 
      id: 'public-msg', 
      label: 'Public Msg', 
      onClick: handleToggleChatMute, 
      active: !isChatMuted,
      icon: <img src="https://img.icons8.com/clouds/100/comments.png" className="h-10 w-10" />,
      color: isChatMuted ? 'bg-slate-800 text-slate-500' : 'bg-blue-500/20 text-blue-400' 
    },
    { 
      id: 'gift-effects', 
      label: 'Gift Effects', 
      onClick: () => toast({ title: 'Premium Feature', description: 'Gift effects are always active for Sovereign members! ✨' }), 
      active: true,
      icon: <img src="https://img.icons8.com/clouds/100/lightning-bolt.png" className="h-10 w-10" />,
      color: 'bg-yellow-500/20 text-yellow-500' 
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
    { id: 'game-selector', label: 'Games', icon: '/images/premium_3d_game_controller_icon_1775544183875.png', color: 'from-green-500/20 to-emerald-600/20', onClick: () => { onOpenGames(); } },
    { id: 'music', label: 'Music', icon: '/images/premium_3d_music_notes_icon_1775544207576.png', color: 'from-blue-400/20 to-cyan-500/20', onClick: () => { setView('music'); onToggleMiniPlayer?.(); } },
    { id: 'speaker',  label: isMutedLocal ? 'Speaker Off' : 'Speaker On', icon: '/images/premium_3d_microphone_icon_1775544232062.png', color: isMutedLocal ? 'from-red-500/20 to-red-700/20' : 'from-green-500/20 to-emerald-600/20', onClick: () => setIsMutedLocal(!isMutedLocal) }, 
  ] ;
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
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="relative w-full max-w-[500px] bg-[#121212] rounded-t-[2rem] border-t border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col mb-0"
            style={{ 
              height: view === 'grid' ? 'auto' : '75vh',
              maxHeight: view === 'grid' ? '65vh' : '75vh'
            }}
          >
            {/* Wafa-style Pull Bar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-4 mb-2 shrink-0" />

            {view === 'grid' && (
              <div className="p-4 pt-2 space-y-6 overflow-y-auto no-scrollbar">
                {/* Top Row: Quick Toggles (Glossy Circles) */}
                <div className="flex items-center justify-around px-4 shrink-0 pb-2">
                  {toggleOptions.map(opt => (
                    <div key={opt.id} className="flex flex-col items-center gap-2">
                      <button 
                        onClick={opt.onClick}
                        className={cn(
                          "h-16 w-16 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95 border border-white/10 relative overflow-hidden",
                          opt.color
                        )}
                      >
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent" />
                        {opt.icon}
                        {opt.active && opt.id !== 'clean' && (
                          <div className="absolute top-2 right-2 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-black" />
                        )}
                      </button>
                      <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{opt.label}</span>
                    </div>
                  ))}
                </div>

                {/* Feature/Game Grid - Compact like Wafa */}
                <div className="grid grid-cols-4 gap-y-6 gap-x-2 px-2 pb-4">
                  {gameGrid.map(item => (
                    <button 
                      key={item.id} 
                      onClick={item.onClick}
                      className="flex flex-col items-center gap-2.5 group active:scale-90 transition-all"
                    >
                      <div className={cn(
                        "h-12 w-12 rounded-[1.2rem] bg-gradient-to-br flex items-center justify-center shadow-lg border border-white/5 relative overflow-hidden",
                        item.color
                      )}>
                        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <img 
                          src={item.icon} 
                          className="h-9 w-9 drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform" 
                          alt={item.label} 
                        />
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
                    <div className="space-y-3">
                        <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-white/10 shadow-xl flex items-center justify-center gap-3 font-bold uppercase text-sm active:scale-95 transition-all mb-4 disabled:opacity-50"
                        >
                        {isUploading ? <Loader className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                        {isUploading ? 'Uploading...' : 'Upload to Room Library'}
                        </button>
                        {roomMusicLibrary.length === 0 && (
                        <div className="text-center py-8 text-white/40">
                            <Music className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p className="text-sm">No tracks yet</p>
                            <p className="text-xs mt-1">Upload songs for everyone to enjoy!</p>
                        </div>
                        )}
                        {roomMusicLibrary.map((track) => (
                        <div 
                        key={track.id} 
                        className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group"
                        >
                        <button
                            onClick={() => handleSyncSharedMusic(track)}
                            className="flex-1 flex items-center gap-3 text-left"
                        >
                        <div className="h-10 w-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                            <FileAudio className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold uppercase text-white truncate">{track.name}</p>
                            <p className="text-[9px] text-white/40 truncate">by {track.uploaderName}</p>
                        </div>
                        <Play className="h-4 w-4 text-white/40 group-hover:text-white/70" />
                        </button>
                        {canManage && (
                        <button
                            onClick={() => handleDeleteTrack(track)}
                            className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 active:scale-95 transition-all"
                        >
                            <Trash2 className="h-4 w-4" />
                        </button>
                        )}
                        </div>
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
