
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Lock,
  Unlock,
  Sparkles,
  Loader,
  MoreVertical,
  UserX,
  Camera,
  Smile,
  Gift,
  Armchair,
  Users,
  Swords,
  Volume2,
} from 'lucide-react';
import type { Room, RoomParticipant } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRoomImageUpload } from '@/hooks/use-room-image-upload';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limit, 
  doc, 
  setDoc, 
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';

export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const { userProfile } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { isUploading: isRoomImageUploading, uploadRoomImage } = useRoomImageUpload(room.id);

  const isOwner = currentUser?.uid === room.ownerId;
  const isAdmin = isOwner || room.moderatorIds?.includes(currentUser?.uid || '');

  // Guard: Ensure we only list participants if we have an authenticated user
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id, currentUser]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const onlineCount = participants?.length || 0;

  useEffect(() => {
    if (!firestore || !room.id || !currentUser || !userProfile) return;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    
    // JOIN WITH REAL APP PROFILE DATA
    setDoc(participantRef, {
      uid: currentUser.uid,
      name: userProfile.username || currentUser.displayName || 'Guest',
      avatarUrl: userProfile.avatarUrl || currentUser.photoURL || '',
      joinedAt: serverTimestamp(),
      isMuted: true,
      seatIndex: 0,
    }, { merge: true });

    return () => { deleteDoc(participantRef); };
  }, [firestore, room.id, currentUser, userProfile]);

  // Guard: Ensure we only list messages if we have an authenticated user
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'messages'), orderBy('timestamp', 'asc'), limit(100));
  }, [firestore, room.id, currentUser]);

  const { data: firestoreMessages } = useCollection(messagesQuery);

  const activeMessages = useMemo(() => {
    return firestoreMessages?.map((m: any) => ({
      id: m.id,
      text: m.content,
      timestamp: m.timestamp?.toDate() ? new Date(m.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...',
      user: { id: m.senderId, name: m.senderName || 'User', avatarUrl: m.senderAvatar || '' }
    })) || [];
  }, [firestoreMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [activeMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || isSending || !userProfile) return;
    setIsSending(true);
    try {
      await addDoc(collection(firestore, 'chatRooms', room.id, 'messages'), {
        content: messageText,
        senderId: currentUser.uid,
        senderName: userProfile.username || currentUser.displayName || 'User',
        senderAvatar: userProfile.avatarUrl || currentUser.photoURL || '',
        chatRoomId: room.id, 
        timestamp: serverTimestamp(),
      });
      setMessageText('');
    } catch (e) { toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' }); }
    finally { setIsSending(false); }
  };

  const takeSeat = async (index: number) => {
    if (!firestore || !room.id || !currentUser) return;
    if (room.lockedSeats?.includes(index)) {
      toast({ variant: 'destructive', title: 'Seat Locked' });
      return;
    }
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    await updateDoc(participantRef, { seatIndex: index });
  };

  const toggleSeatLock = async (index: number) => {
    if (!firestore || !room.id || !isAdmin) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    const isLocked = room.lockedSeats?.includes(index);
    await updateDoc(roomRef, { lockedSeats: isLocked ? arrayRemove(index) : arrayUnion(index) });
  };

  if (isUserLoading) return <div className="flex h-screen items-center justify-center bg-[#1a1a2e]"><Loader className="animate-spin text-primary" /></div>;

  return (
    <div className="flex flex-col h-screen bg-[#11111e] overflow-hidden text-white font-headline">
      
      {/* PROFESSIONAL ROOM HEADER */}
      <header className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-xl border-b border-white/5 shrink-0 z-50">
        <div className="flex items-center gap-4">
           <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse group-hover:bg-primary/40" />
              <Avatar className="h-14 w-14 border-2 border-primary/50 relative z-10 shadow-2xl">
                <AvatarImage 
                  src={room.coverUrl || `https://picsum.photos/seed/${room.id}/200`} 
                  alt={room.title || "Room Cover"}
                />
                <AvatarFallback>UM</AvatarFallback>
              </Avatar>
              {isOwner && (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 z-20 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  {isRoomImageUploading ? <Loader className="h-4 w-4 animate-spin" /> : <Camera className="h-5 w-5" />}
                </div>
              )}
           </div>
           <div className="flex flex-col">
             <div className="flex items-center gap-2">
                <h1 className="font-black text-xl tracking-tight uppercase italic">{room.title}</h1>
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] animate-pulse h-5">
                  <Users className="h-3 w-3 mr-1" /> {onlineCount} LIVE
                </Badge>
             </div>
             <p className="text-[10px] text-white/40 tracking-widest font-mono uppercase mt-1 flex items-center gap-2">
                Room ID: {room.id.substring(0, 10)} <span className="text-primary/60">•</span> {room.category} Mode
             </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-full bg-white/5 border-white/10 hidden md:flex gap-2">
            <Swords className="h-4 w-4 text-primary" /> PK Battle
          </Button>
          <Button size="icon" variant="destructive" asChild className="rounded-2xl h-11 w-11 shadow-2xl hover:scale-105 transition-transform">
            <a href="/rooms"><PhoneOff className="h-5 w-5"/></a>
          </Button>
        </div>
      </header>

      {/* ANNOUNCEMENT TICKER */}
      <div className="px-4 py-2 bg-primary/10 border-b border-primary/5 shrink-0">
        <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase">
          <Sparkles className="h-4 w-4 text-yellow-400 animate-bounce" />
          <marquee className="text-primary/80 italic">{room.announcement || "Welcome to the Official Ummy Experience! Be respectful and vibe hard."}</marquee>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-y-10 gap-x-6 py-12 max-w-5xl mx-auto">
          {Array.from({ length: 10 }).map((_, i) => {
            const seatIndex = i + 1;
            const occupant = participants?.find(p => p.seatIndex === seatIndex);
            const isLocked = room.lockedSeats?.includes(seatIndex);

            return (
              <div key={seatIndex} className="flex flex-col items-center gap-3 group">
                <div className="relative group/seat">
                  <div 
                    onClick={() => !occupant && !isLocked && takeSeat(seatIndex)}
                    className={cn(
                    "h-24 w-24 rounded-full flex items-center justify-center transition-all relative cursor-pointer overflow-hidden bg-white/5 border border-white/10 group-hover:scale-105",
                    isLocked ? "bg-black/60 opacity-60 border-destructive/20" : "hover:bg-primary/10 hover:border-primary/20",
                    occupant && !isLocked && "ring-4 ring-primary ring-offset-4 ring-offset-[#11111e] shadow-[0_0_30px_rgba(255,107,107,0.3)]"
                  )}>
                    {isLocked ? (
                      <div className="flex flex-col items-center gap-1">
                        <Lock className="h-8 w-8 text-destructive/40" />
                        <span className="text-[8px] font-black text-destructive/40">LOCKED</span>
                      </div>
                    ) : occupant ? (
                      <div className="relative h-full w-full">
                        <Avatar className="h-full w-full rounded-none">
                          <AvatarImage src={occupant.avatarUrl} alt={occupant.name} />
                          <AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        {isMicOn && occupant.uid === currentUser?.uid && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Volume2 className="h-8 w-8 animate-ping text-white/50" />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 opacity-20">
                        <Armchair className="h-8 w-8" />
                        <span className="text-[8px] font-black">NO.{seatIndex}</span>
                      </div>
                    )}
                  </div>
                  
                  {isAdmin && (
                    <div className="absolute -top-1 -right-1 z-30 opacity-0 group-hover/seat:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-2xl bg-black/90 hover:bg-primary border border-white/10 shadow-2xl">
                            <MoreVertical className="h-4 w-4 text-white" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-[#1a1a2e] border-white/5 text-white w-56 p-1 rounded-2xl shadow-2xl">
                          <DropdownMenuItem onClick={() => toggleSeatLock(seatIndex)} className="focus:bg-white/10 h-12 cursor-pointer rounded-xl px-4">
                            {isLocked ? <Unlock className="mr-3 h-5 w-5 text-green-400" /> : <Lock className="mr-3 h-5 w-5 text-yellow-400" />}
                            <span className="font-bold tracking-tight">{isLocked ? 'Unlock Seat' : 'Lock Slot'}</span>
                          </DropdownMenuItem>
                          {occupant && (
                              <DropdownMenuItem onClick={() => {
                                  const pRef = doc(firestore!, 'chatRooms', room.id, 'participants', occupant.uid);
                                  updateDoc(pRef, { seatIndex: 0 });
                              }} className="text-destructive focus:bg-destructive/10 h-12 cursor-pointer rounded-xl px-4">
                                  <UserX className="mr-3 h-5 w-5" /> <span className="font-bold tracking-tight">Move to Sofa</span>
                              </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
                <span className={cn(
                  "text-[10px] font-black truncate max-w-[90px] uppercase tracking-widest px-2 py-0.5 rounded-full",
                  isLocked ? "bg-destructive/10 text-destructive/40" : occupant ? "bg-primary/10 text-primary" : "text-white/20"
                )}>
                  {isLocked ? "OFFICIAL" : occupant ? occupant.name : "VACANT"}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-12 mb-32 max-w-xl mx-auto space-y-6 px-4">
          {activeMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-4 group/msg animate-in slide-in-from-bottom-2">
              <Avatar className="h-10 w-10 border-2 border-white/5">
                <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} />
                <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 flex flex-col items-start">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black tracking-widest uppercase text-primary/80">{msg.user.name}</span>
                  <span className="text-[8px] text-white/10 font-mono">{msg.timestamp}</span>
                </div>
                <div className="bg-white/5 p-4 rounded-3xl rounded-tl-none border border-white/5 text-sm font-body leading-relaxed group-hover:bg-white/10 transition-colors shadow-xl">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <footer className="shrink-0 bg-black/60 backdrop-blur-3xl border-t border-white/5 p-6 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-5">
          <form className="flex-1 flex gap-3" onSubmit={handleSendMessage}>
            <div className="relative flex-1">
              <Input 
                placeholder="Message the room..." 
                className="bg-white/5 border-white/5 rounded-3xl h-14 px-6 focus:ring-primary/40 focus:bg-white/10 text-sm font-body placeholder:text-white/20"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={isSending}
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/10 hover:text-primary transition-colors">
                <Smile className="h-6 w-6" />
              </Button>
            </div>
            <Button type="submit" className="rounded-3xl h-14 w-14 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/20" disabled={isSending || !messageText.trim()}>
              {isSending ? <Loader className="animate-spin h-6 w-6" /> : <Send className="h-6 w-6" />}
            </Button>
          </form>
          
          <div className="flex items-center gap-3">
            <Button 
              variant={isMicOn ? "default" : "secondary"} 
              size="icon" 
              onClick={() => setIsMicOn(!isMicOn)}
              className={cn("rounded-3xl h-14 w-14 shadow-2xl transition-all", isMicOn ? "bg-green-500 hover:bg-green-600 scale-110" : "bg-white/5 hover:bg-white/10 border border-white/10")}
            >
              {isMicOn ? <Mic className="h-6 w-6"/> : <MicOff className="h-6 w-6 text-white/40"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-3xl h-14 w-14 bg-gradient-to-br from-primary to-accent border-none shadow-2xl hover:scale-110 transition-transform animate-pulse">
              <Gift className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>
      </footer>
      <input type="file" ref={fileInputRef} onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) uploadRoomImage(file);
      }} className="hidden" accept="image/*" />
    </div>
  );
}
