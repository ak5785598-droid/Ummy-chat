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
  Smile,
  Gift,
  Info,
  Armchair,
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
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, writeBatch } from 'firebase/firestore';

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

  // Role Detection - Owner has full power, Admin has seat power
  const isOwner = useMemo(() => {
    if (!currentUser) return false;
    // For testing, any logged in user is owner of the 'mumbai-adda' room
    return currentUser.uid === room.ownerId || room.slug === 'mumbai-adda' || room.id === 'mumbai-adda';
  }, [currentUser, room]);

  const isAdmin = useMemo(() => {
    if (!currentUser) return false;
    // Admins are moderators or the owner
    return room.moderatorIds?.includes(currentUser.uid) || isOwner;
  }, [currentUser, room, isOwner]);

  // Real-time Chat
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id || !currentUser) return null;
    return query(
      collection(firestore, 'chatRooms', room.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
    );
  }, [firestore, room.id, currentUser]);

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
    toast({ title: lockedSeats.includes(index) ? 'Seat Opened' : 'Seat Locked & Cleared' });
  };

  if (isUserLoading) return <div className="flex h-screen items-center justify-center bg-[#1a1a2e]"><Loader className="h-8 w-8 animate-spin text-primary" /></div>;

  const otherParticipants = (room.participants || []).filter(p => !kickedUserIds.includes(p.id) && p.id !== currentUser?.uid);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gradient-to-b from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden text-white">
      
      {/* Header Section */}
      <header className="flex items-center justify-between p-4 bg-black/30 backdrop-blur-md border-b border-white/10 shrink-0">
        <div className="flex items-center gap-3">
           <Avatar className="h-12 w-12 border-2 border-primary shadow-lg">
             <AvatarImage src={`https://picsum.photos/seed/${room.ownerId}/200`} />
             <AvatarFallback>H</AvatarFallback>
           </Avatar>
           <div className="flex flex-col">
             <h1 className="font-bold text-lg leading-none">{room.title}</h1>
             <div className="flex items-center gap-2 mt-1">
               <Badge className="bg-primary/20 text-primary text-[10px] uppercase h-4">Host</Badge>
               <span className="text-[10px] text-white/60">ID: {room.id.substring(0, 8)}</span>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full bg-white/10 hover:bg-white/20 h-10 w-10 border border-white/10">
                  <MoreVertical className="h-6 w-6 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#1a1a2e] border-white/10 text-white">
                <DropdownMenuLabel className="text-[10px] opacity-40 uppercase tracking-widest">Admin actions</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleClearChat} className="text-destructive focus:bg-destructive/10 cursor-pointer h-12">
                  <Trash2 className="mr-3 h-5 w-5" /> <span className="font-bold">Clear Chat History</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button size="icon" variant="destructive" asChild className="rounded-full h-10 w-10">
            <a href="/rooms"><PhoneOff className="h-5 w-5"/></a>
          </Button>
        </div>
      </header>

      {/* Announcements */}
      <div className="px-4 py-2 shrink-0">
        <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10 text-xs">
          <Sparkles className="h-4 w-4 text-yellow-400" />
          <span className="text-white/80 italic truncate">{room.announcement || "Welcome! Be respectful and enjoy the vibe."}</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-4" ref={scrollRef}>
        {/* Seats Grid (10 Seats) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 py-6">
          {/* Host Seat */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <Avatar className="h-20 w-20 border-2 border-primary shadow-xl ring-2 ring-primary/20">
                <AvatarImage src={currentUser?.photoURL || ''} />
                <AvatarFallback>{currentUser?.displayName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-primary text-[8px] font-bold px-1.5 rounded-full border border-[#1a1a2e]">No.1</div>
            </div>
            <span className="text-xs font-bold text-primary truncate max-w-[80px]">{currentUser?.displayName}</span>
          </div>

          {/* Dynamic Seats 2-10 */}
          {Array.from({ length: 9 }).map((_, i) => {
            const seatIndex = i + 2;
            const participant = otherParticipants[i];
            const isLocked = lockedSeats.includes(seatIndex);
            const isMuted = mutedSeats.includes(seatIndex);

            return (
              <div key={seatIndex} className="flex flex-col items-center gap-2 group">
                <div className="relative">
                  <div className={cn(
                    "h-20 w-20 rounded-full flex items-center justify-center transition-all relative",
                    isLocked ? "bg-black/40 border border-white/10" : "bg-white/5 border border-white/10",
                    participant && !isLocked && "ring-2 ring-primary/40 border-primary"
                  )}>
                    {isLocked ? (
                      <Lock className="h-8 w-8 text-white/20" />
                    ) : participant ? (
                      <Avatar className="h-full w-full">
                        <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                        <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    ) : (
                      <Armchair className="h-8 w-8 text-white/20" />
                    )}
                    
                    <div className="absolute -bottom-1 -right-1 bg-black/60 text-[8px] font-bold px-1.5 rounded-full border border-white/10">No.{seatIndex}</div>

                    {isAdmin && (
                      <div className="absolute -top-1 -right-1">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full bg-black/80 hover:bg-primary/20 border border-white/10">
                              <MoreVertical className="h-4 w-4 text-white" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-[#1a1a2e] border-white/10 text-white w-48 shadow-2xl">
                            <DropdownMenuItem onClick={() => toggleSeatLock(seatIndex)} className="focus:bg-white/10 h-10 cursor-pointer">
                              {isLocked ? <Unlock className="mr-3 h-4 w-4" /> : <Lock className="mr-3 h-4 w-4" />}
                              {isLocked ? 'Unlock Seat' : 'Lock Seat'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toast({ title: 'Invite Sent' })} className="focus:bg-white/10 h-10 cursor-pointer">
                              <UserPlus className="mr-3 h-4 w-4" /> Invite User
                            </DropdownMenuItem>
                            {participant && !isLocked && (
                              <>
                                <DropdownMenuItem onClick={() => setMutedSeats(prev => isMuted ? prev.filter(s => s !== seatIndex) : [...prev, seatIndex])} className="focus:bg-white/10 h-10 cursor-pointer">
                                  {isMuted ? <Mic className="mr-3 h-4 w-4" /> : <MicOff className="mr-3 h-4 w-4" />}
                                  {isMuted ? 'Unmute' : 'Mute User'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => {
                                  setKickedUserIds(prev => [...prev, participant.id]);
                                  toast({ variant: 'destructive', title: 'User Kicked' });
                                }} className="text-destructive focus:bg-destructive/10 h-10 cursor-pointer font-bold">
                                  <UserX className="mr-3 h-4 w-4" /> Kick Out
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
                  "text-[10px] font-bold truncate max-w-[80px]",
                  isLocked ? "text-white/20" : participant ? "text-white" : "text-white/40"
                )}>
                  {isLocked ? "CLOSED" : participant ? participant.name : "SOFA"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Live Chat Panel */}
        <div className="mt-8 mb-24 max-w-xl mx-auto space-y-4 px-2">
          {activeMessages.map((msg) => (
            <div key={msg.id} className="flex items-start gap-3">
              <Avatar className="h-8 w-8 border border-white/10">
                <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} />
                <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary/80">{msg.user.name}</span>
                  <span className="text-[8px] text-white/20">{msg.timestamp}</span>
                </div>
                <div className="mt-0.5 bg-white/5 p-2.5 rounded-2xl rounded-tl-none border border-white/5 text-sm">
                  {msg.text}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Bottom Nav Bar */}
      <footer className="shrink-0 bg-black/40 backdrop-blur-xl border-t border-white/10 p-4 pb-8 shadow-2xl">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <form className="flex-1 flex gap-2" onSubmit={handleSendMessage}>
            <div className="relative flex-1">
              <Input 
                placeholder="Type a message..." 
                className="bg-white/10 border-white/5 rounded-full h-12 px-5 focus:ring-primary/40 text-sm"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={isSending}
              />
              <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 text-white/20 hover:text-white">
                <Smile className="h-5 w-5" />
              </Button>
            </div>
            <Button type="submit" className="rounded-full h-12 w-12 bg-primary hover:bg-primary/90 shadow-lg" disabled={isSending || !messageText.trim()}>
              {isSending ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
          
          <div className="flex items-center gap-2">
            <Button 
              variant={isMicOn ? "default" : "secondary"} 
              size="icon" 
              onClick={() => setIsMicOn(!isMicOn)}
              className={cn("rounded-full h-12 w-12", isMicOn ? "bg-green-500 hover:bg-green-600" : "bg-white/10 hover:bg-white/20")}
            >
              {isMicOn ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}
            </Button>
            <Button variant="secondary" size="icon" className="rounded-full h-12 w-12 bg-gradient-to-br from-accent to-primary border-none">
              <Gift className="h-5 w-5 text-white" />
            </Button>
          </div>
        </div>
      </footer>
    </div>
  );
}
