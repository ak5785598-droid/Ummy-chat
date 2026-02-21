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
  Trash2,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Smile,
  Gift,
  Info,
  Armchair,
  MessageSquare,
} from 'lucide-react';
import type { Room, Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, writeBatch, doc } from 'firebase/firestore';

export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lockedSeats, setLockedSeats] = useState<number[]>([]);
  const [mutedSeats, setMutedSeats] = useState<number[]>([]);
  const [kickedUserIds, setKickedUserIds] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  // Role Detection
  const isOwner = useMemo(() => {
    return currentUser?.uid === room.ownerId || room.slug === 'mumbai-adda';
  }, [currentUser, room]);

  const isAdmin = useMemo(() => {
    return room.moderatorIds?.includes(currentUser?.uid || '') || isOwner;
  }, [currentUser, room, isOwner]);

  // Real-time Chat Logic
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(
      collection(firestore, 'chatRooms', room.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
  }, [firestore, room.id]);

  const { data: firestoreMessages } = useCollection(messagesQuery);

  const activeMessages: Message[] = useMemo(() => {
    return firestoreMessages?.map((m: any) => ({
      id: m.id,
      text: m.content,
      timestamp: m.timestamp?.toDate() ? new Date(m.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      user: {
        id: m.senderId,
        name: m.senderName || 'User',
        avatarUrl: m.senderAvatar || '',
      }
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
    if (!messageText.trim() || !currentUser || !firestore || isSending) return;
    setIsSending(true);
    
    try {
      await addDoc(collection(firestore, 'chatRooms', room.id, 'messages'), {
        content: messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderAvatar: currentUser.photoURL || '',
        chatRoomId: room.id, 
        timestamp: serverTimestamp(),
      });
      setMessageText('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleClearChat = async () => {
    if (!firestore || !room.id || isClearing || !isOwner) return;
    setIsClearing(true);
    try {
      const msgsSnapshot = await getDocs(collection(firestore, 'chatRooms', room.id, 'messages'));
      const batch = writeBatch(firestore);
      msgsSnapshot.forEach((m) => {
        batch.delete(m.ref);
      });
      await batch.commit();
      toast({ title: 'Chat Cleared', description: 'All history permanently deleted for everyone.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: 'Only owner can clear chat.' });
    } finally {
      setIsClearing(false);
    }
  };

  const toggleSeatLock = (index: number) => {
    if (!isAdmin) return;
    setLockedSeats(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    toast({ title: lockedSeats.includes(index) ? 'Seat Opened' : 'Seat Closed' });
  };

  if (isUserLoading) return <div className="flex h-screen items-center justify-center bg-black"><Loader className="h-8 w-8 animate-spin text-primary" /></div>;

  const otherParticipants = (room.participants || []).filter(p => !kickedUserIds.includes(p.id) && p.id !== currentUser?.uid);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden text-white font-sans">
      
      {/* Header Section */}
      <header className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
           <Avatar className="h-12 w-12 border-2 border-primary shadow-[0_0_10px_rgba(255,127,80,0.5)]">
             <AvatarImage src={`https://picsum.photos/seed/${room.ownerId}/200`} />
             <AvatarFallback>H</AvatarFallback>
           </Avatar>
           <div className="flex flex-col">
             <h1 className="font-bold text-lg leading-none">{room.title}</h1>
             <div className="flex items-center gap-2 mt-1">
               <Badge className="bg-primary/20 text-primary text-[10px] py-0 px-2 h-4 border-primary/30 uppercase tracking-wider">Host</Badge>
               <span className="text-[10px] text-white/60">ID: {room.id.substring(0, 8)}</span>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 h-10 w-10">
                  <MoreVertical className="h-6 w-6" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 bg-[#1a1a2e] border-white/10 text-white shadow-2xl">
                <DropdownMenuLabel className="text-white/40 uppercase text-[10px] tracking-widest px-4 py-2">Room Administration</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                {isOwner && (
                  <DropdownMenuItem onClick={handleClearChat} className="text-destructive focus:bg-destructive/10 cursor-pointer h-12">
                    <Trash2 className="mr-3 h-5 w-5" /> <span className="font-bold">Clear Chat History</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="focus:bg-white/10 cursor-pointer h-12">
                   <Info className="mr-3 h-5 w-5" /> Edit Room Rules
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button size="icon" variant="destructive" asChild className="rounded-full h-11 w-11 shadow-lg shadow-red-500/30 active:scale-90 transition-transform">
            <a href="/rooms"><PhoneOff className="h-5 w-5"/></a>
          </Button>
        </div>
      </header>

      {/* Announcements Section */}
      <div className="px-4 py-2 shrink-0">
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 text-[12px] shadow-inner">
          <Sparkles className="h-4 w-4 text-yellow-400 animate-pulse" />
          <span className="text-white/80 italic font-serif truncate">{room.announcement || "Welcome to our tribe! Respect everyone and have a blast."}</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        {/* Seats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8 py-8">
          {/* Seat 1 (Always User/Host) */}
          <div className="flex flex-col items-center gap-3 group">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-accent rounded-full blur opacity-40 animate-pulse group-hover:opacity-100 transition-opacity"></div>
              <Avatar className="h-24 w-24 border-2 border-primary relative shadow-2xl">
                <AvatarImage src={currentUser?.photoURL || ''} />
                <AvatarFallback className="bg-secondary text-2xl">{currentUser?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-primary text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-[#1a1a2e] uppercase shadow-lg">No.1</div>
            </div>
            <span className="text-sm font-bold truncate max-w-[100px] text-primary">{currentUser?.displayName}</span>
          </div>

          {/* Dynamic Seats No.2 to No.10 */}
          {Array.from({ length: 9 }).map((_, i) => {
            const seatIndex = i + 2;
            const participant = otherParticipants[i];
            const isLocked = lockedSeats.includes(seatIndex);
            const isMuted = mutedSeats.includes(seatIndex);

            return (
              <div key={seatIndex} className="flex flex-col items-center gap-3 group">
                <div className="relative">
                  <div className={cn(
                    "h-24 w-24 rounded-full flex items-center justify-center transition-all duration-300 relative overflow-hidden",
                    isLocked ? "bg-black/60 border-2 border-white/10" : "bg-white/5 border-2 border-white/10",
                    participant && !isLocked && "ring-4 ring-primary/20 border-primary shadow-[0_0_30px_rgba(255,127,80,0.15)]"
                  )}>
                    {isLocked ? (
                      <div className="flex flex-col items-center justify-center">
                        <Lock className="h-10 w-10 text-white/30" />
                      </div>
                    ) : participant ? (
                      <Avatar className="h-full w-full">
                        <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                        <AvatarFallback className="bg-secondary text-xl">{participant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="flex flex-col items-center gap-1 opacity-20 group-hover:opacity-60 transition-opacity">
                        <Armchair className="h-10 w-10 text-white" />
                        <span className="text-[10px] font-black tracking-tighter">EMPTY</span>
                      </div>
                    )}
                    
                    <div className="absolute -bottom-2 -right-2 bg-black/80 text-[9px] font-black px-2 py-0.5 rounded-full border-2 border-[#1a1a2e] uppercase shadow-lg">
                      No.{seatIndex}
                    </div>

                    {isAdmin && (
                      <div className="absolute -top-1 -right-1 z-10">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-black/70 hover:bg-primary border border-white/20 shadow-xl transition-all">
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1a1a2e] border-white/10 text-white w-56 shadow-2xl">
                            <DropdownMenuLabel className="px-4 py-2 text-[10px] text-white/40 uppercase tracking-widest">Seat {seatIndex} Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-white/10" />
                            <DropdownMenuItem onClick={() => toggleSeatLock(seatIndex)} className="h-12 focus:bg-white/10 cursor-pointer">
                              {isLocked ? <Unlock className="mr-3 h-5 w-5 text-green-400" /> : <Lock className="mr-3 h-5 w-5 text-yellow-400" />}
                              <span className="font-bold">{isLocked ? 'Open Seat' : 'Close Seat'}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: 'Invite Sent' })} className="h-12 focus:bg-white/10 cursor-pointer">
                              <UserPlus className="mr-3 h-5 w-5 text-blue-400" /> <span className="font-bold">Invite User</span>
                            </DropdownMenuItem>
                            {participant && (
                              <>
                                <DropdownMenuItem onClick={() => setMutedSeats(prev => isMuted ? prev.filter(s => s !== seatIndex) : [...prev, seatIndex])} className="h-12 focus:bg-white/10 cursor-pointer">
                                  {isMuted ? <Mic className="mr-3 h-5 w-5 text-green-400" /> : <MicOff className="mr-3 h-5 w-5 text-yellow-400" />}
                                  <span className="font-bold">{isMuted ? 'Unmute User' : 'Mute User'}</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setKickedUserIds(prev => [...prev, participant.id]);
                                  toast({ variant: 'destructive', title: 'User Kicked', description: `${participant.name} is now invisible.` });
                                }} className="h-12 text-destructive focus:bg-destructive/10 cursor-pointer font-bold">
                                  <UserX className="mr-3 h-5 w-5" /> Kick Out
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
                <span className={cn(
                  "text-xs font-black truncate max-w-[100px] transition-all",
                  isLocked ? "text-white/20" : participant ? "text-white/100" : "text-white/40"
                )}>
                  {isLocked ? "CLOSED" : participant ? participant.name : "AVAILABLE"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Chat Panel */}
        <div className="mt-12 mb-32 max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-6 px-4">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-ping"></div>
            <h3 className="text-[10px] font-black tracking-[0.2em] uppercase opacity-40">Live Conversation</h3>
          </div>
          <div className="space-y-6 px-4">
            {activeMessages.length === 0 && (
              <div className="text-center py-12 opacity-20 italic text-sm">Silence is golden, but words are better...</div>
            )}
            {activeMessages.map((msg) => (
              <div key={msg.id} className="flex items-start gap-4 animate-in slide-in-from-bottom-4 duration-500">
                <Avatar className="h-10 w-10 flex-shrink-0 border-2 border-white/10 shadow-lg">
                  <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} />
                  <AvatarFallback className="bg-secondary">{msg.user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-3">
                    <span className="font-black text-xs text-primary/90 tracking-tight">{msg.user.name}</span>
                    <span className="text-[9px] font-medium text-white/20">{msg.timestamp}</span>
                  </div>
                  <div className="mt-1.5 bg-white/5 p-4 rounded-3xl rounded-tl-none border border-white/10 text-sm text-white/90 shadow-xl leading-relaxed backdrop-blur-sm">
                    {msg.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Bottom Navigation Bar */}
      <footer className="shrink-0 bg-black/60 backdrop-blur-3xl border-t border-white/10 p-4 pb-10 md:pb-6 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="max-w-4xl mx-auto flex items-center gap-5">
          <form className="flex-1 flex gap-3" onSubmit={handleSendMessage}>
            <div className="relative flex-1">
              <Input 
                placeholder="Type a message..." 
                className="bg-white/10 border-white/10 rounded-full h-14 px-7 focus:ring-primary/50 text-base shadow-inner placeholder:text-white/20"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={isSending}
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="icon" 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
              >
                <Smile className="h-6 w-6" />
              </Button>
            </div>
            <Button 
              type="submit" 
              className="rounded-full h-14 w-14 shrink-0 bg-primary hover:bg-primary/90 shadow-2xl shadow-primary/30 active:scale-90 transition-all"
              disabled={isSending || !messageText.trim()}
            >
              {isSending ? <Loader className="h-6 w-6 animate-spin" /> : <Send className="h-6 w-6" />}
            </Button>
          </form>
          
          <div className="flex items-center gap-3">
            <Button 
              variant={isMicOn ? "default" : "secondary"} 
              size="icon" 
              onClick={() => setIsMicOn(!isMicOn)}
              className={cn(
                "rounded-full h-14 w-14 shadow-2xl transition-all active:scale-90",
                isMicOn ? "bg-green-500 hover:bg-green-600 shadow-green-500/30" : "bg-white/10 hover:bg-white/20 border-white/10"
              )}
            >
              {isMicOn ? <Mic className="h-6 w-6"/> : <MicOff className="h-6 w-6"/>}
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              className="rounded-full h-14 w-14 bg-gradient-to-br from-accent to-primary border-none shadow-2xl shadow-accent/20 active:scale-90 transition-all"
            >
              <Gift className="h-6 w-6 text-white" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
