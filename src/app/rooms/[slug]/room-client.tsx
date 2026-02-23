
'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Lock,
  Unlock,
  Loader,
  MoreVertical,
  UserX,
  Gift,
  Users,
  Crown,
  Settings,
  Share2,
  Volume2,
  Trash2,
  LogOut,
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
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase, useUserProfile } from '@/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  limitToLast, 
  doc, 
  setDoc, 
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  getDocs,
} from 'firebase/firestore';

export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(currentUser?.uid);
  const firestore = useFirestore();

  const isOwner = currentUser?.uid === room.ownerId;
  const isAdmin = isOwner || room.moderatorIds?.includes(currentUser?.uid || '');

  // Participants Subcollection
  const participantsQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(collection(firestore, 'chatRooms', room.id, 'participants'));
  }, [firestore, room.id, currentUser]);

  const { data: participants } = useCollection<RoomParticipant>(participantsQuery);
  const onlineCount = participants?.length || 0;

  // Presence Synchronization
  useEffect(() => {
    if (!firestore || !room.id || !currentUser || !userProfile) return;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    
    // Initial Join
    setDoc(participantRef, {
      uid: currentUser.uid,
      name: userProfile.username || 'Guest',
      avatarUrl: userProfile.avatarUrl || '',
      activeFrame: userProfile.frame || 'None',
      joinedAt: serverTimestamp(),
      isMuted: !isMicOn,
      seatIndex: 0, // Default to audience
    }, { merge: true }).catch(err => console.warn('Presence sync delayed', err));

    return () => { 
      // Cleanup on unmount
      deleteDoc(participantRef).catch(() => {}); 
    };
  }, [firestore, room.id, currentUser?.uid, userProfile?.username, userProfile?.avatarUrl]);

  // Sync Mic State with Firestore
  useEffect(() => {
    if (!firestore || !room.id || !currentUser) return;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    updateDoc(participantRef, { isMuted: !isMicOn }).catch(() => {});
  }, [isMicOn, firestore, room.id, currentUser]);

  // Messages Query
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(
      collection(firestore, 'chatRooms', room.id, 'messages'), 
      orderBy('timestamp', 'asc'), 
      limitToLast(50)
    );
  }, [firestore, room.id, currentUser]);

  const { data: firestoreMessages } = useCollection(messagesQuery);

  const activeMessages = useMemo(() => {
    return firestoreMessages?.map((m: any) => ({
      id: m.id,
      text: m.content,
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
    } catch (e) { 
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' }); 
    } finally { 
      setIsSending(false); 
    }
  };

  const handleSendGift = async () => {
    if (!currentUser || !firestore || !userProfile) return;
    
    const giftCost = 100;
    if ((userProfile.wallet?.coins || 0) < giftCost) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Recharge to send gifts!' });
      return;
    }

    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      const profileRef = doc(firestore, 'users', currentUser.uid, 'profile', currentUser.uid);

      const updateData = {
        'wallet.coins': increment(-giftCost),
        'wallet.totalSpent': increment(giftCost),
        'updatedAt': serverTimestamp()
      };

      await Promise.all([
        updateDoc(userRef, updateData),
        updateDoc(profileRef, updateData)
      ]);

      toast({ title: 'Gift Sent!', description: `You sent a 100 coin gift! Your Rich ranking has increased.` });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Gift Error', description: 'Failed to send gift.' });
    }
  };

  const handleClearChat = async () => {
    if (!isAdmin || !firestore || !room.id) return;
    
    try {
      const messagesRef = collection(firestore, 'chatRooms', room.id, 'messages');
      const snapshot = await getDocs(messagesRef);
      
      if (snapshot.empty) {
        toast({ title: 'Chat is already clear' });
        return;
      }

      const batch = writeBatch(firestore);
      snapshot.docs.forEach((d) => {
        batch.delete(d.ref);
      });
      
      await batch.commit();
      toast({ title: 'Chat Cleared', description: 'All room messages have been removed.' });
    } catch (e) {
      toast({ variant: 'destructive', title: 'Action Failed', description: 'Could not clear chat history.' });
    }
  };

  const takeSeat = async (index: number) => {
    if (!firestore || !room.id || !currentUser) return;
    if (room.lockedSeats?.includes(index)) {
      toast({ variant: 'destructive', title: 'Seat Locked' });
      return;
    }
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    updateDoc(participantRef, { seatIndex: index });
  };

  const leaveSeat = async () => {
    if (!firestore || !room.id || !currentUser) return;
    const participantRef = doc(firestore, 'chatRooms', room.id, 'participants', currentUser.uid);
    updateDoc(participantRef, { seatIndex: 0 });
    toast({ title: 'Seat Left', description: 'You are now in the audience.' });
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
        <p className="text-xs text-muted-foreground uppercase font-black tracking-widest">Syncing Room Data...</p>
      </div>
    );
  }

  const hostParticipant = participants?.find(p => p.seatIndex === 1);

  return (
    <div className="relative flex flex-col h-full bg-black overflow-hidden text-white font-headline rounded-[2.5rem] shadow-2xl border border-white/5">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/40 via-blue-900/40 to-black z-10" />
        <img 
          src="https://images.unsplash.com/photo-1464802686167-b939a67e06a1?q=80&w=2070&auto=format&fit=crop" 
          alt="Galaxy nebula space background" 
          className="h-full w-full object-cover opacity-60 scale-110"
        />
      </div>

      <header className="relative z-50 flex items-center justify-between p-6 bg-transparent">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 rounded-xl border-2 border-primary/50 shadow-[0_0_15px_rgba(255,107,107,0.3)]">
            <AvatarImage src={`https://picsum.photos/seed/${room.id}/200`} alt={`${room.title} icon`} />
            <AvatarFallback>UM</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <h1 className="font-black text-xl tracking-tight uppercase italic drop-shadow-lg">{room.title}</h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/60 tracking-widest uppercase">
              <span>ID: {room.id.substring(0, 8)}</span>
              <div className="flex items-center gap-1 text-pink-400">
                <Users className="h-3 w-3" />
                <span>{onlineCount}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white/80 hover:text-white" aria-label="Room Settings">
                <Settings className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-slate-900 border-white/10 text-white">
              <DropdownMenuLabel className="text-xs uppercase tracking-widest text-white/40">Management</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              {isAdmin && (
                <DropdownMenuItem onClick={handleClearChat} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  <span>Clear Chat History</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem className="focus:bg-white/5">
                <Users className="mr-2 h-4 w-4" />
                <span>Participant List</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="focus:bg-white/5">
                <Volume2 className="mr-2 h-4 w-4" />
                <span>Audio Settings</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white" aria-label="Share Frequency">
            <Share2 className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white/80 hover:text-white" asChild>
            <a href="/rooms" aria-label="Exit Room">
              <PhoneOff className="h-6 w-6" />
            </a>
          </Button>
        </div>
      </header>

      <ScrollArea className="relative z-10 flex-1 px-4" ref={scrollRef}>
        <div className="max-w-4xl mx-auto py-6 space-y-12">
          
          {/* Main Host Seat */}
          <div className="flex justify-center">
             <div className="flex flex-col items-center gap-3">
                <div className="relative">
                   <div className="absolute -inset-4 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                   {hostParticipant?.uid === currentUser.uid ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="h-28 w-28 rounded-full flex items-center justify-center transition-all relative cursor-pointer border-2 bg-black/40 backdrop-blur-md border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                            <Avatar className="h-full w-full rounded-full border-2 border-black">
                               <AvatarImage src={hostParticipant.avatarUrl} alt={hostParticipant.name} />
                               <AvatarFallback>{hostParticipant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-white/10 text-white">
                           <DropdownMenuItem onClick={leaveSeat} className="text-destructive">
                              <LogOut className="mr-2 h-4 w-4" />
                              <span>Leave Seat</span>
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                   ) : (
                     <div 
                        onClick={() => !hostParticipant && takeSeat(1)}
                        className={cn(
                          "h-28 w-28 rounded-full flex items-center justify-center transition-all relative cursor-pointer border-2 bg-black/40 backdrop-blur-md",
                          hostParticipant ? "border-blue-400 shadow-[0_0_30px_rgba(59,130,246,0.5)]" : "border-white/10 hover:border-blue-400/50"
                        )}
                     >
                        {hostParticipant ? (
                          <Avatar className="h-full w-full rounded-full border-2 border-black">
                             <AvatarImage src={hostParticipant.avatarUrl} alt={hostParticipant.name} />
                             <AvatarFallback>{hostParticipant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <Crown className="h-10 w-10 text-white/10" />
                        )}
                     </div>
                   )}
                </div>
                <Badge variant="secondary" className="bg-blue-500 text-white border-none text-[10px] uppercase font-black px-3">Room Master</Badge>
             </div>
          </div>

          {/* Seat Grid */}
          <div className="grid grid-cols-4 gap-x-4 gap-y-10">
            {Array.from({ length: 12 }).map((_, i) => {
              const seatIndex = i + 2; 
              const occupant = participants?.find(p => p.seatIndex === seatIndex);
              const isLocked = room.lockedSeats?.includes(seatIndex);

              return (
                <div key={seatIndex} className="flex flex-col items-center gap-2">
                  <div className="relative group/seat">
                    {occupant?.uid === currentUser.uid ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <div className="h-16 w-16 rounded-full flex items-center justify-center transition-all relative cursor-pointer bg-black/30 backdrop-blur-lg border-2 border-primary shadow-[0_0_20px_rgba(255,107,107,0.3)] ring-2 ring-white/5">
                            <Avatar className="h-full w-full rounded-full p-0.5">
                              <AvatarImage src={occupant.avatarUrl} alt={occupant.name} />
                              <AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {!occupant.isMuted && (
                              <div className="absolute -inset-1 rounded-full border-2 border-primary animate-ping" />
                            )}
                          </div>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-slate-900 border-white/10 text-white">
                           <DropdownMenuItem onClick={leaveSeat} className="text-destructive">
                              <LogOut className="mr-2 h-4 w-4" />
                              <span>Leave Seat</span>
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div 
                        onClick={() => !occupant && !isLocked && takeSeat(seatIndex)}
                        className={cn(
                          "h-16 w-16 rounded-full flex items-center justify-center transition-all relative cursor-pointer bg-black/30 backdrop-blur-lg border-2",
                          isLocked ? "border-red-500/30 bg-red-950/20" : "border-purple-500/30 hover:border-primary",
                          occupant && "border-primary shadow-[0_0_20px_rgba(255,107,107,0.3)] ring-2 ring-white/5"
                        )}
                      >
                        {isLocked ? (
                          <Lock className="h-6 w-6 text-red-500/40" />
                        ) : occupant ? (
                          <Avatar className="h-full w-full rounded-full p-0.5">
                            <AvatarImage src={occupant.avatarUrl} alt={occupant.name} />
                            <AvatarFallback>{occupant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                        ) : (
                          <Mic className="h-6 w-6 text-white/20" />
                        )}
                      </div>
                    )}
                    
                    {isAdmin && (
                      <div className="absolute -top-1 -right-1 z-30 opacity-0 group-hover/seat:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full bg-black/80 border border-white/10 p-0">
                              <MoreVertical className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-900 border-white/10 text-white">
                            <DropdownMenuItem onClick={() => toggleSeatLock(seatIndex)} className="text-xs uppercase font-bold focus:bg-white/5">
                              {isLocked ? <Unlock className="mr-2 h-3 w-3" /> : <Lock className="mr-2 h-3 w-3" />}
                              {isLocked ? 'Unlock Seat' : 'Lock Seat'}
                            </DropdownMenuItem>
                            {occupant && occupant.uid !== room.ownerId && (
                              <DropdownMenuItem className="text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <UserX className="mr-2 h-3 w-3" />
                                <span>Kick User</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-black truncate max-w-[60px] uppercase tracking-wider text-white/40">
                    {occupant ? occupant.name : `Slot ${seatIndex}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Chat Messages */}
          <div className="mt-8 mb-24 max-w-lg mx-auto space-y-3 px-4">
            {activeMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-2">
                <span className="text-[10px] font-black text-blue-400 uppercase shrink-0 mt-1">{msg.user.name}:</span>
                <p className="text-xs text-white/80 font-body drop-shadow-sm">{msg.text}</p>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Control Footer */}
      <footer className="relative z-50 shrink-0 px-6 pb-12 pt-4 bg-transparent">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          
          <form className="flex-1 flex items-center bg-blue-900/40 backdrop-blur-xl rounded-full border border-white/10 h-12 px-5" onSubmit={handleSendMessage}>
            <Input 
              placeholder="Type a vibe..." 
              className="bg-transparent border-none h-full focus-visible:ring-0 text-xs font-body placeholder:text-white/30"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isSending}
            />
            <Button type="submit" variant="ghost" size="icon" className="text-blue-400/60 hover:text-blue-400" disabled={isSending || !messageText.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsMicOn(!isMicOn)}
              className={cn(
                "rounded-full h-12 w-12 border border-white/10 backdrop-blur-md transition-all",
                isMicOn ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_15px_rgba(251,191,36,0.3)]" : "bg-white/5 text-white/40"
              )}
              aria-label="Toggle Mic"
            >
              {isMicOn ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-white/5 border border-white/10 backdrop-blur-md text-white/60" aria-label="Toggle Audio">
              <Volume2 className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSendGift}
              className="rounded-full h-14 w-14 bg-gradient-to-br from-pink-500 to-rose-600 shadow-xl shadow-pink-500/20 border-2 border-white/20 animate-pulse hover:scale-110 transition-transform" 
              aria-label="Send Gift"
            >
              <Gift className="h-7 w-7 text-white" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
