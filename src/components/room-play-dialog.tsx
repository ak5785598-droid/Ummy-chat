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
  Trash2
} from 'lucide-react';
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
  onPlayLocalMusic
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
      toast({ title: 'Frequency Purified', description: 'Chat history cleared.' });
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
    }
  ];

  if (canManage) {
    options.push(
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
      }
    );
  }

  options.push({ 
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
  });

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-[#0a0a0a]/80 backdrop-blur-md border-t border-white/10 p-0 rounded-t-[3rem] overflow-hidden text-white font-headline shadow-2xl animate-in slide-in-from-bottom-full duration-500">
        <DialogHeader className="sr-only">
          <DialogTitle>Room Play Portal</DialogTitle>
          <DialogDescription>Interactive room tools and games frequency selection.</DialogDescription>
        </DialogHeader>

        <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileChange} />

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
          <div className="animate-in fade-in slide-in-from-right-4 duration-500 flex flex-col h-[65vh]">
            <header className="p-6 pb-2 flex items-center justify-between shrink-0 border-b border-white/5">
               <div className="flex items-center gap-3">
                  <button onClick={() => setView('grid')} className="p-1 hover:scale-110 transition-transform"><ChevronLeft className="h-6 w-6 text-white/60" /></button>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Music Frequency</h2>
               </div>
            </header>
            
            <div className="p-4 px-6 shrink-0 space-y-4">
               <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10 shadow-inner">
                  <div className="flex items-center gap-3">
                     <div className={cn("p-2 rounded-xl transition-colors", isMusicEnabled ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/40")}>
                        <Power className="h-5 w-5" />
                     </div>
                     <div>
                        <p className="text-xs font-black uppercase tracking-tight text-white/90">Music Power</p>
                        <p className="text-[8px] font-bold uppercase text-white/40 tracking-widest">{isMusicEnabled ? 'Frequency Active' : 'Offline'}</p>
                     </div>
                  </div>
                  <Switch checked={isMusicEnabled} onCheckedChange={setIsMusicEnabled} />
               </div>

               <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                  <button 
                    onClick={() => setMusicTab('online')}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-black uppercase italic text-[10px] transition-all",
                      musicTab === 'online' ? "bg-white/10 text-white shadow-lg" : "text-white/40"
                    )}
                  >
                    Online Sync
                  </button>
                  <button 
                    onClick={() => setMusicTab('device')}
                    className={cn(
                      "flex-1 py-2.5 rounded-xl font-black uppercase italic text-[10px] transition-all",
                      musicTab === 'device' ? "bg-white/10 text-white shadow-lg" : "text-white/40"
                    )}
                  >
                    Playlist ({roomPlaylist.length})
                  </button>
               </div>
            </div>

            {musicTab === 'online' ? (
              <>
                <div className="p-6 pt-2 space-y-4 shrink-0">
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
              </>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden">
                 <div className="p-6 pt-2 shrink-0">
                    <button 
                      onClick={() => { setIsMusicEnabled(false); fileInputRef.current?.click(); }}
                      className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 border-2 border-white/10 shadow-xl flex items-center justify-center gap-3 font-black uppercase italic text-sm active:scale-95 transition-all"
                    >
                       <Upload className="h-5 w-5" />
                       Add from Device
                    </button>
                 </div>
                 
                 <ScrollArea className="flex-1 px-6">
                    <div className="space-y-3 pb-10">
                       {roomPlaylist.length > 0 ? roomPlaylist.map((file, idx) => (
                         <button 
                           key={idx} 
                           onClick={() => handlePlayDeviceTrack(file)}
                           className="w-full flex items-center gap-4 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left border border-white/5 group"
                         >
                            <div className="h-12 w-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                               <FileAudio className="h-6 w-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                               <p className="text-xs font-black uppercase italic text-white truncate">{file.name}</p>
                               <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Persistent Sync</span>
                                  <div className="h-1 w-1 rounded-full bg-white/20" />
                                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{(file.size / (1024 * 1024)).toFixed(1)} MB</span>
                               </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                               <Play className="h-4 w-4 text-white" />
                            </div>
                         </button>
                       )) : (
                         <div className="py-20 text-center opacity-20 italic">
                            <Upload className="h-12 w-12 mx-auto mb-4" />
                            <p className="text-sm font-bold">Pick music from your mobile storage.</p>
                         </div>
                       )}
                    </div>
                 </ScrollArea>
              </div>
            )}
          </div>
        )}

        <style jsx global>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      </DialogContent>
    </Dialog>
  );
}
