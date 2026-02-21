'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import type { Room, Message, User as RoomUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc, writeBatch, getDocs } from 'firebase/firestore';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(false);
  const [micPermissionStatus, setMicPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
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
      toast({ title: 'Chat Cleared', description: 'History deleted permanently for everyone.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Failed', description: 'Only owner can clear chat.' });
    } finally {
      setIsClearing(false);
    }
  };

  const toggleSeatLock = (index: number) => {
    if (!isAdmin) return;
    setLockedSeats(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    toast({ title: lockedSeats.includes(index) ? 'Seat Unlocked' : 'Seat Locked' });
  };

  if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader className="h-8 w-8 animate-spin text-primary" /></div>;

  const totalSeats = 10;
  const otherParticipants = (room.participants || []).filter(p => !kickedUserIds.includes(p.id) && p.id !== currentUser?.uid);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4 overflow-hidden max-w-7xl mx-auto p-4">
      <div className="grid h-full gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
          <Card className="bg-primary/5 border-none shrink-0">
            <CardHeader className="flex flex-row items-center justify-between p-4">
              <div className="flex-1 min-w-0">
                <CardTitle className="font-headline text-2xl truncate">{room.title}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline">{room.topic}</Badge>
                  {isOwner && <Badge className="bg-primary flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Owner</Badge>}
                  {isAdmin && !isOwner && <Badge className="bg-accent flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Admin</Badge>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="icon" 
                  variant={isMicOn ? "default" : "secondary"} 
                  onClick={() => setIsMicOn(!isMicOn)}
                  className="rounded-full h-10 w-10"
                >
                  {isMicOn ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}
                </Button>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>Room Admin Tools</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {isOwner && (
                        <DropdownMenuItem onClick={handleClearChat} className="text-destructive font-bold">
                          {isClearing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Clear Chat History (Global)
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => toast({ title: 'Announcement Updated' })}>
                        Edit Announcement
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast({ title: 'Privacy Settings Updated' })}>
                        Privacy Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button size="icon" variant="destructive" asChild className="rounded-full">
                  <a href="/rooms"><PhoneOff className="h-5 w-5"/></a>
                </Button>
              </div>
            </CardHeader>
          </Card>

          <Card className="flex-1 overflow-hidden bg-secondary/5 border-none">
            <CardContent className="p-4 h-full">
              <ScrollArea className="h-full">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {/* My Seat */}
                  <div className="relative aspect-square flex flex-col items-center justify-center gap-2 bg-muted rounded-2xl ring-1 ring-border overflow-hidden">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={currentUser?.photoURL || ''} />
                      <AvatarFallback>{currentUser?.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-[10px] uppercase truncate px-2">{currentUser?.displayName} (Me)</span>
                  </div>

                  {/* Dynamic Seats */}
                  {Array.from({ length: totalSeats - 1 }).map((_, i) => {
                    const seatIndex = i + 2;
                    const participant = otherParticipants[i];
                    const isLocked = lockedSeats.includes(seatIndex);
                    const isMuted = mutedSeats.includes(seatIndex);

                    return (
                      <div key={seatIndex} className={cn(
                        "relative aspect-square flex flex-col items-center justify-center gap-2 border rounded-2xl transition-all overflow-hidden",
                        isLocked ? "bg-slate-200 border-dashed" : "bg-card shadow-sm"
                      )}>
                        {isLocked ? (
                          <div className="flex flex-col items-center opacity-60">
                            <Lock className="h-6 w-6 text-slate-500" />
                            <span className="text-[10px] font-bold uppercase mt-1">Closed</span>
                          </div>
                        ) : participant ? (
                          <>
                            <Avatar className="h-16 w-16 border border-primary/10">
                              <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                              <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="font-bold text-[10px] uppercase truncate w-full px-2 text-center">{participant.name}</span>
                            {isMuted && <MicOff className="absolute top-2 left-2 h-3 w-3 text-red-500" />}
                          </>
                        ) : (
                          <div className="flex flex-col items-center opacity-30">
                            <Unlock className="h-5 w-5" />
                            <span className="text-[8px] font-bold uppercase mt-1">Join</span>
                          </div>
                        )}

                        {isAdmin && (
                          <div className="absolute top-1 right-1">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/5">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>Seat {seatIndex} Controls</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => toggleSeatLock(seatIndex)}>
                                  {isLocked ? <Unlock className="mr-2 h-4 w-4" /> : <Lock className="mr-2 h-4 w-4" />}
                                  {isLocked ? 'Unlock Seat' : 'Lock Seat'}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => toast({ title: 'Invite Sent' })}>
                                  <UserPlus className="mr-2 h-4 w-4" /> Invite User
                                </DropdownMenuItem>
                                {participant && (
                                  <>
                                    <DropdownMenuItem onClick={() => setMutedSeats(prev => isMuted ? prev.filter(s => s !== seatIndex) : [...prev, seatIndex])}>
                                      {isMuted ? <Mic className="mr-2 h-4 w-4 text-green-500" /> : <MicOff className="mr-2 h-4 w-4 text-orange-500" />}
                                      {isMuted ? 'Unmute' : 'Mute'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => {
                                      setKickedUserIds(prev => [...prev, participant.id]);
                                      toast({ variant: 'destructive', title: 'User Kicked', description: `${participant.name} is now invisible.` });
                                    }} className="text-destructive font-bold">
                                      <UserX className="mr-2 h-4 w-4" /> Kick Out User
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-1 flex flex-col h-full shadow-lg border-none overflow-hidden shrink-0">
          <CardHeader className="p-3 border-b bg-secondary/10 shrink-0">
            <CardTitle className="text-lg flex items-center justify-between">
              <span className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Live Chat</span>
              <Badge className="h-4 text-[9px] animate-pulse">LIVE</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-3">
            <ScrollArea className="h-full pr-2" ref={scrollRef}>
              <div className="space-y-3">
                {activeMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2">
                    <Avatar className="h-7 w-7 flex-shrink-0">
                      <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} />
                      <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-bold text-[10px]">{msg.user.name}</span>
                        <span className="text-[8px] text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs bg-muted p-2 rounded-xl rounded-tl-none mt-0.5 shadow-sm break-words inline-block">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
          <div className="p-3 bg-secondary/10 shrink-0">
            <form className="flex gap-2" onSubmit={handleSendMessage}>
              <Input 
                placeholder="Chat live..." 
                className="h-10 text-sm rounded-xl" 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                disabled={isSending}
              />
              <Button type="submit" size="icon" className="rounded-xl shrink-0" disabled={isSending || !messageText.trim()}>
                {isSending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
}
