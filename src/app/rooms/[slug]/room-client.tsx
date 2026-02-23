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
  Users,
  Swords,
  Crown,
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
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserProfile } from '@/firebase';
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
  arrayRemove,
  onSnapshot
} from 'firebase/firestore';

export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [entryMessage, setEntryMessage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();
  const { isUploading: isRoomImageUploading, uploadRoomImage } = useRoomImageUpload(room.id);

  const isOwner = currentUser?.uid === room.ownerId;
  const isAdmin = isOwner || room.moderatorIds?.includes(currentUser?.uid || '');

  // Participants Subcollection
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id, currentUser]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const onlineCount = participants?.length || 0;

  // Real-time Entry Notifications
  useEffect(() => {
    if (!firestore || !room.id || !currentUser) return;
    const unsub = onSnapshot(collection(firestore, 'chatRooms', room.id, 'participants'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const p = change.doc.data() as RoomParticipant;
          if (p.uid !== currentUser.uid) {
            setEntryMessage(`${p.name} joined the frequency!`);
            setTimeout(() => setEntryMessage(null), 3000);
          }
        }
      });
    });
    return () => unsub();
  }, [firestore, room.id, currentUser]);

  // Presence Synchronization
  useEffect(() => {
    if (!firestore || !room.id || !currentUser || !userProfile) return;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    
    setDoc(participantRef, {
      uid: currentUser.uid,
      name: userProfile.username || 'Guest',
      avatarUrl: userProfile.avatarUrl || '',
      activeFrame: userProfile.frame || 'None',
      joinedAt: serverTimestamp(),
      isMuted: true,
      seatIndex: 0,
    }, { merge: true }).catch(err => console.warn('Presence sync delayed', err));

    return () => { 
      deleteDoc(participantRef).catch(() => {}); 
    };
  }, [firestore, room.id, currentUser, userProfile]);

  // Messages Query
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'messages'), orderBy('timestamp', 'asc'), limit(50));
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
        senderName: userProfile.username || 'User',
        senderAvatar: userProfile.avatarUrl || '',
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
    updateDoc(participantRef, { seatIndex: index });
    toast({ title: `Joined Seat ${index}` });
  };

  const toggleSeatLock = async (index: number) => {
    if (!firestore || !room.id || !isAdmin) return;
    const roomRef = doc(firestore, 'chatRooms', room.id);
    const isLocked = room.lockedSeats?.includes(index);
    updateDoc(roomRef, { lockedSeats: isLocked ? arrayRemove(index) : arrayUnion(index) });
  };

  if (isUserLoading || !currentUser || isProfileLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <Loader className="animate-spin text-primary h-10 w-10" />
        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Initializing Social Grid...</p>
      </div>
    );
  }

  const hostParticipant = participants?.find(p => p.seatIndex === 1);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0f] overflow-hidden text-white font-headline rounded-3xl border border-white/5 relative">
      
      {entryMessage && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top duration-500">
           <div className="bg-primary/90 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-2xl flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-yellow-400" />
              <span className="text-xs font-black uppercase tracking-tighter">{entryMessage}</span>
           </div>
        </div>
      )}

      <header className="flex items-center justify-between p-4 bg-black/40 backdrop-blur-xl border-b border-white/5 shrink-0 z-50">
        <div className="flex items-center gap-4">
           <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-pulse group-hover:bg-primary/40" />
              <Avatar className="h-14 w-14 border-2 border-primary relative z-10 shadow-2xl">
                <AvatarImage 
                  src={room.coverUrl || `https://picsum.photos/seed/${room.id}/200`} 
                  alt={`${room.title} Cover Photo`}
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
                <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px] h-5">
                  <Users className="h-3 w-3 mr-1" /> {onlineCount}
                </Badge>
             </div>
             <p className="text-[10px] text-white/40 tracking-widest uppercase mt-1">
                {room.category} • ID: {room.id.substring(0, 8)}
             </p>
           </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="rounded-full bg-white/5 border border-white/10 text-primary h-10 w-10 p-0 shadow-lg" aria-label="Room Stats">
            <Swords className="h-5 w-5" />
          </Button>
          <Button size="icon" variant="destructive" asChild className="rounded-2xl h-11 w-11 shadow-2xl hover:scale-105 transition-transform">
            <a href="/rooms" aria-label="Exit Room"><PhoneOff className="h-5 w-5" /></a>
          </Button>
        </div>
      </header>

      <div className="px-4 py-1.5 bg-primary/5 border-b border-primary/5 shrink-0 overflow-hidden">
        <div className="flex items-center gap-3 text-[10px] font-bold tracking-widest uppercase">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 h-5 px-2">NOTICE</Badge>
          <div className="relative flex-1 overflow-hidden whitespace-nowrap">
            <span className="inline-block animate-marquee pl-full">{room.announcement || "Welcome to the Ummy Experience! Be respectful and vibe hard."}</span>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-10 space-y-12">
          
          <div className="flex justify-center">
             <div className="flex flex-col items-center gap-3 group">
                <div className="relative">
                   <div className="absolute -inset-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-pulse blur-sm opacity-50" />
                   <div 
                      onClick={() => !hostParticipant && takeSeat(1)}
                      className={cn(
                      "h-32 w-32 rounded-full flex items-center justify-center transition-all relative cursor-pointer border-4 bg-black/40",
                      hostParticipant ? "border-yellow-400" : "border-white/10 hover:border-primary/50"
                   )}>
                      {hostParticipant ? (
                         <div className="relative h-full w-full">
                            <Avatar className="h-full w-full rounded-full border-2 border-black">
                               <AvatarImage 
                                 src={hostParticipant.avatarUrl} 
                                 alt={`${hostParticipant.name} Host Avatar`} 
                               />
                               <AvatarFallback>{hostParticipant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-[8px] font-black px-2 py-0.5 rounded-full shadow-lg border border-black/10">HOST</div>
                         </div>
                      ) : (
                         <div className="flex flex-col items-center gap-1 opacity-20">
                            <Crown className="h-10 w-10" />
                            <span className="text-[8px] font-black">VACANT</span>
                         </div>
                      )}
                   </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/80">Room Manager</span>
             </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {Array.from({ length: 8 }).map((_, i) => {
              const seatIndex = i + 2; 
              const occupant = participants?.find(p => p.seatIndex === seatIndex);
              const isLocked = room.lockedSeats?.includes(seatIndex);

              return (
                <div key={seatIndex} className="flex flex-col items-center gap-3 group">
                  <div className="relative group/seat">
                    <div 
                      onClick={() => !occupant && !isLocked && takeSeat(seatIndex)}
                      className={cn(
                      "h-20 w-20 rounded-full flex items-center justify-center transition-all relative cursor-pointer bg-white/5 border-2 group-hover:scale-105",
                      isLocked ? "bg-black/80 border-destructive/20 opacity-60" : "border-white/10 hover:border-primary/40",
                      occupant && "ring-4 ring-primary/20 shadow-xl"
                    )}>
                      {isLocked ? (
                        <Lock className="h-6 w-6 text-destructive/40" />
                      ) : occupant ? (
                        <div className="relative h-full w-full p-1">
                          <Avatar className="h-full w-full rounded-full">
                            <AvatarImage src={occupant.avatarUrl} alt={`${occupant.name} Seat Avatar`} />
                            <AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          {isMicOn && occupant.uid === currentUser?.uid && (
                            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping pointer-events-none" />
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 opacity-10">
                           <Mic className="h-6 w-6" />
                           <span className="text-[8px] font-black">NO.{seatIndex}</span>
                        </div>
                      )}
                    </div>
                    
                    {isAdmin && (
                      <div className="absolute -top-1 -right-1 z-30 opacity-0 group-hover/seat:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/90 border border-white/10 text-white hover:bg-primary">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1a1a2e] border-white/5 text-white w-52 rounded-2xl shadow-2xl">
                            <DropdownMenuItem onClick={() => toggleSeatLock(seatIndex)} className="focus:bg-white/10 h-11 cursor-pointer rounded-xl mx-1 my-1">
                              {isLocked ? <Unlock className="mr-3 h-4 w-4 text-green-400" /> : <Lock className="mr-3 h-4 w-4 text-yellow-400" />}
                              <span className="font-bold text-xs uppercase tracking-widest">{isLocked ? 'Open Mic' : 'Lock Mic'}</span>
                            </DropdownMenuItem>
                            {occupant && (
                                <DropdownMenuItem onClick={() => {
                                    const pRef = doc(firestore!, 'chatRooms', room.id, 'participants', occupant.uid);
                                    updateDoc(pRef, { seatIndex: 0 });
                                }} className="text-destructive focus:bg-destructive/10 h-11 cursor-pointer rounded-xl mx-1 mb-1">
                                    <UserX className="mr-3 h-4 w-4" /> <span className="font-bold text-xs uppercase tracking-widest">Kick to Sofa</span>
                                </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[10px] font-black truncate max-w-[80px] uppercase tracking-wider",
                    isLocked ? "text-destructive/40" : occupant ? "text-primary" : "text-white/20"
                  )}>
                    {isLocked ? "CLOSED" : occupant ? occupant.name : `Slot ${seatIndex}`}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-12 mb-32 max-w-2xl mx-auto space-y-6 px-4">
            {activeMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 group/msg animate-in slide-in-from-bottom-2">
                <Avatar className="h-9 w-9 border border-white/5">
                  <AvatarImage src={msg.user.avatarUrl} alt={`${msg.user.name} Chat Avatar`} />
                  <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col items-start">
                  <span className="text-[10px] font-bold tracking-widest uppercase text-white/30 mb-1">{msg.user.name}</span>
                  <div className="bg-white/5 px-4 py-2.5 rounded-2xl rounded-tl-none border border-white/5 text-sm font-body leading-relaxed group-hover:bg-white/10 transition-colors shadow-lg">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      <footer className="shrink-0 bg-black/60 backdrop-blur-3xl border-t border-white/5 p-6 pb-10 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-5">
          <form className="flex-1 flex gap-3" onSubmit={handleSendMessage}>
            <div className="relative flex-1">
              <Input 
                placeholder="Type a vibe..." 
                className="bg-white/5 border-white/5 rounded-3xl h-14 px-6 focus:ring-primary/40 focus:bg-white/10 text-sm font-body placeholder:text-white/20"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={isSending}
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-primary transition-colors" aria-label="Add Emoji">
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
              className={cn("rounded-3xl h-14 w-14 shadow-2xl transition-all", isMicOn ? "bg-green-500 hover:bg-green-600 scale-110" : "bg-white/5 border border-white/10")}
              aria-label={isMicOn ? "Mute Mic" : "Unmute Mic"}
            >
              {isMicOn ? <Mic className="h-6 w-6"/> : <MicOff className="h-6 w-6 text-white/20"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-3xl h-14 w-14 bg-gradient-to-br from-primary to-accent border-none shadow-2xl hover:scale-110 transition-transform animate-pulse" aria-label="Send Gift">
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
