'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Send,
  Gift,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  Megaphone,
  Gem,
  Star,
  Flower,
  Lollipop,
  Trophy,
  Crown,
  Rocket,
  Sparkles,
  Loader,
  MoreVertical,
  ShieldAlert,
  UserX,
  Trash2,
  Smile,
} from 'lucide-react';
import type { Room, Message } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc, deleteDoc, writeBatch } from 'firebase/firestore';

export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lockedSeats, setLockedSeats] = useState<number[]>([]);
  const [mutedSeats, setMutedSeats] = useState<number[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  // Determine if the user is the owner
  // We check against the ownerId from Firestore or the hardcoded mock owner 'u1'
  const isOwner = currentUser?.uid === room.ownerId || (room.ownerId === 'u1' && currentUser?.uid === '901piBzTQ0VzCtAvlyyobwvAaTs1');

  // Listen to real-time messages
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(
      collection(firestore, 'chatRooms', room.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
  }, [firestore, room.id]);

  const { data: firestoreMessages } = useCollection(messagesQuery);

  const activeMessages: Message[] = firestoreMessages?.map((m: any) => ({
    id: m.id,
    text: m.content,
    timestamp: m.timestamp?.toDate() ? new Date(m.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
    user: {
      id: m.senderId,
      name: m.senderName || 'User',
      avatarUrl: m.senderAvatar || '',
    }
  })) || room.messages || [];

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [activeMessages]);

  useEffect(() => {
    const getPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasCameraPermission(true);
        setHasMicPermission(true);
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        setHasCameraPermission(false);
        setHasMicPermission(false);
      }
    };
    getPermissions();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !firestore || isSending) return;
    setIsSending(true);
    
    const payload = {
      content: messageText,
      senderId: currentUser.uid,
      senderName: currentUser.displayName || 'Anonymous',
      senderAvatar: currentUser.photoURL || '',
      chatRoomId: room.id, 
      timestamp: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'chatRooms', room.id, 'messages'), payload);
      setMessageText('');
    } catch (error: any) {
      console.error('Send message error:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to send message.' 
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleSeatLock = (index: number) => {
    setLockedSeats(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    const isLocked = !lockedSeats.includes(index);
    toast({
      title: isLocked ? 'Seat Unlocked' : 'Seat Locked',
      description: `Seat ${index} status changed.`,
    });
  };

  const toggleSeatMute = (index: number) => {
    setMutedSeats(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    const isMuted = !mutedSeats.includes(index);
    toast({
      title: isMuted ? 'Unmuted' : 'Muted',
      description: `Participant in seat ${index} has been ${isMuted ? 'unmuted' : 'muted'}.`,
    });
  };

  const handleKickout = (name: string) => {
    toast({
      variant: 'destructive',
      title: 'User Kicked Out',
      description: `${name} has been removed from the room.`,
    });
  };

  const handleClearChat = async () => {
    if (!firestore || !room.id || isClearing) return;
    
    setIsClearing(true);
    try {
      // For permanent deletion that "no one can see", we must delete the actual docs from Firestore
      if (firestoreMessages && firestoreMessages.length > 0) {
        const batch = writeBatch(firestore);
        firestoreMessages.forEach((msg) => {
          const msgRef = doc(firestore, 'chatRooms', room.id, 'messages', msg.id);
          batch.delete(msgRef);
        });
        await batch.commit();
      }
      
      toast({
        title: 'Chat History Cleared',
        description: 'All messages have been permanently deleted from this room.',
      });
    } catch (error: any) {
      console.error('Clear chat error:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to clear chat history. Check your permissions.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (isUserLoading) return <div className="flex h-full w-full items-center justify-center"><Loader className="h-8 w-8 animate-spin" /></div>;
  if (!currentUser) return null;

  const gifts = {
    common: [
      { icon: Gift, name: 'Gift Box', cost: 10 },
      { icon: Star, name: 'Star', cost: 20 },
      { icon: Lollipop, name: 'Lollipop', cost: 15 },
      { icon: Flower, name: 'Flower', cost: 15 },
    ],
    premium: [
      { icon: Trophy, name: 'Trophy', cost: 250 },
      { icon: Crown, name: 'Crown', cost: 500 },
      { icon: Rocket, name: 'Rocket', cost: 750 },
      { icon: Gem, name: 'Gem', cost: 1000 },
    ],
  };

  const otherParticipants = (room.participants || []).filter(p => p.id !== currentUser.uid);
  const totalSeats = 10;

  return (
    <div className="grid h-[calc(100vh-10rem)] md:h-full gap-4 lg:grid-cols-3 xl:grid-cols-4">
      <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-4">
        {/* ROOM HEADER CARD */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden shadow-md">
          <CardHeader className="flex flex-row items-center justify-between p-4 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="font-headline text-2xl truncate">{room.title}</CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary">
                      <Megaphone className="h-5 w-5" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-2">
                      <h4 className="font-bold flex items-center gap-2"><Megaphone className="h-4 w-4" /> Announcement</h4>
                      <p className="text-sm text-muted-foreground">{room.announcement || 'Welcome to the room! Have a great time chatting.'}</p>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="px-2 py-0.5">{room.topic}</Badge>
                {isOwner && (
                    <Badge variant="default" className="bg-primary/80 flex items-center gap-1 shadow-sm">
                        <ShieldAlert className="h-3 w-3" /> Admin Mode
                    </Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="icon" variant={isMicOn ? "outline" : "secondary"} onClick={() => setIsMicOn(!isMicOn)} className="rounded-full shadow-sm">
                {isMicOn ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}
              </Button>
              <Button size="icon" variant={isCameraOn ? "outline" : "secondary"} onClick={() => setIsCameraOn(!isCameraOn)} className="rounded-full shadow-sm">
                {isCameraOn ? <Video className="h-5 w-5"/> : <VideoOff className="h-5 w-5"/>}
              </Button>
              
              {/* GLOBAL ADMIN MENU (THREE DOTS) */}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="icon" className="rounded-full bg-primary text-primary-foreground shadow-lg">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel>Room Management</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleClearChat} className="text-destructive font-bold focus:bg-destructive focus:text-destructive-foreground">
                      {isClearing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                      Clear Chat History (Permanent)
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toast({ title: "Privacy", description: "Room locked." })}>
                      <Lock className="mr-2 h-4 w-4" /> Lock Room (Private)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Privacy", description: "Room opened." })}>
                      <Unlock className="mr-2 h-4 w-4" /> Open Room (Public)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Button size="icon" variant="destructive" asChild className="rounded-full shadow-md">
                <a href="/rooms"><PhoneOff className="h-5 w-5"/></a>
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* SEATS GRID */}
        <Card className="flex-1 overflow-hidden border-none shadow-inner">
          <CardContent className="p-4 h-full bg-secondary/10">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* Seat 1: Current User */}
                <div className="relative aspect-square flex flex-col items-center justify-center gap-2 bg-muted rounded-2xl overflow-hidden ring-4 ring-primary/40 shadow-xl">
                  <video ref={videoRef} className={cn("w-full h-full object-cover", isCameraOn ? "block" : "hidden")} autoPlay muted />
                  {!isCameraOn && (
                    <Avatar className="h-20 w-20 shadow-inner">
                      <AvatarImage src={currentUser.photoURL || ''} />
                      <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {!isMicOn && <MicOff className="h-4 w-4 text-red-500 bg-black/60 p-1 rounded-md shadow-lg" />}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/70 rounded-xl text-center backdrop-blur-md">
                    <span className="font-bold text-white text-[10px] truncate block uppercase tracking-tight">{currentUser.displayName} (Me)</span>
                  </div>
                </div>

                {/* Other Seats */}
                {Array.from({ length: totalSeats - 1 }).map((_, i) => {
                  const participant = otherParticipants[i];
                  const seatIndex = i + 2;
                  const isLocked = lockedSeats.includes(seatIndex);
                  const isMuted = mutedSeats.includes(seatIndex);

                  return (
                    <div key={seatIndex} className={cn(
                      "relative aspect-square flex flex-col items-center justify-center gap-2 border-2 rounded-2xl shadow-sm transition-all",
                      isLocked ? "bg-muted/50 border-dashed border-primary/20" : "bg-card hover:border-primary/40"
                    )}>
                      {participant ? (
                        <>
                          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/10">
                            <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-center text-[10px] truncate w-full px-2 uppercase tracking-tight text-foreground/80">{participant.name}</span>
                          <div className="absolute top-2 left-2 flex gap-1">
                            {isMuted && <VolumeX className="h-4 w-4 text-red-500 bg-black/60 p-1 rounded-md" />}
                          </div>
                          
                          {/* SEAT ADMIN MENU (THREE DOTS) - FOR OCCUPIED SEATS */}
                          {isOwner && (
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background shadow-md">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuLabel>Manage Participant</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toggleSeatMute(seatIndex)}>
                                    {isMuted ? <Volume2 className="mr-2 h-4 w-4 text-green-500" /> : <VolumeX className="mr-2 h-4 w-4 text-orange-500" />}
                                    {isMuted ? 'Unmute' : 'Mute'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleKickout(participant.name)} className="text-destructive font-bold focus:bg-destructive focus:text-destructive-foreground">
                                    <UserX className="mr-2 h-4 w-4" /> Kick Out User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col items-center gap-2 opacity-50">
                            {isLocked ? <Lock className="h-8 w-8 text-primary" /> : <Unlock className="h-8 w-8 text-muted-foreground/20" />}
                            <span className="text-[9px] font-bold uppercase tracking-widest">
                              {isLocked ? 'Closed' : 'Open'}
                            </span>
                          </div>
                          
                          {/* SEAT ADMIN MENU (THREE DOTS) - FOR EMPTY SEATS */}
                          {isOwner && (
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-background shadow-md">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Seat Control</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toggleSeatLock(seatIndex)}>
                                    {isLocked ? <Unlock className="mr-2 h-4 w-4 text-green-500" /> : <Lock className="mr-2 h-4 w-4 text-primary" />}
                                    {isLocked ? 'Open Seat' : 'Lock Seat'}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* CHAT & GIFTS SIDEBAR */}
      <Card className="lg:col-span-1 xl:col-span-1 flex flex-col h-full shadow-2xl border-none bg-card/80 backdrop-blur-md">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between rounded-t-xl bg-secondary/20">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Live Chat
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-bold border-primary/20">LIVE</Badge>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-4">
          <ScrollArea className="h-full pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {activeMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 group">
                  <Avatar className="h-8 w-8 border-2 border-background shadow-sm flex-shrink-0">
                    <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} />
                    <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs hover:text-primary transition-colors cursor-pointer truncate max-w-[100px]">{msg.user.name}</span>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs bg-muted/80 p-3 rounded-2xl rounded-tl-none mt-1 border border-transparent group-hover:border-primary/20 transition-all shadow-sm break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
              {activeMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 opacity-40">
                  <div className="p-5 rounded-full bg-primary/10">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-widest">No messages yet</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <Separator className="opacity-50" />
        <div className="p-4 space-y-4 bg-secondary/10 rounded-b-xl">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-11 w-11 text-primary border-primary/20 rounded-2xl bg-background shadow-lg">
                  <Gift className="h-6 w-6"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 shadow-2xl border-primary/20" align="end">
                <Tabs defaultValue="common">
                  <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger value="common" className="font-bold">Normal</TabsTrigger>
                    <TabsTrigger value="premium" className="font-bold">Premium</TabsTrigger>
                  </TabsList>
                  <ScrollArea className="h-80">
                    <TabsContent value="common" className="p-3 m-0 grid grid-cols-4 gap-2">
                      {gifts.common.map((g) => (
                        <div key={g.name} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-all active:scale-90 group">
                          <g.icon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-bold text-center truncate w-full uppercase">{g.name}</span>
                          <div className="flex items-center gap-0.5 text-[8px] font-bold text-primary bg-primary/20 px-2 py-0.5 rounded-full">
                            <Gem className="h-2.5 w-2.5" /> <span>{g.cost}</span>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="premium" className="p-3 m-0 grid grid-cols-4 gap-2">
                      {gifts.premium.map((g) => (
                        <div key={g.name} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-all active:scale-90 group">
                          <g.icon className="h-10 w-10 text-accent group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-bold text-center truncate w-full uppercase">{g.name}</span>
                          <div className="flex items-center gap-0.5 text-[8px] font-bold text-accent bg-accent/20 px-2 py-0.5 rounded-full">
                            <Gem className="h-2.5 w-2.5" /> <span>{g.cost}</span>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </PopoverContent>
            </Popover>
            <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide py-1">
               {['👋', '❤️', '🔥', '😂', '💯', '✨'].map(emoji => (
                  <button key={emoji} className="text-2xl hover:scale-150 transition-transform active:scale-90" onClick={() => setMessageText(prev => prev + emoji)}>
                    {emoji}
                  </button>
               ))}
            </div>
          </div>
          <form className="flex items-center gap-3" onSubmit={handleSendMessage}>
            <Input 
              placeholder="Type your vibe..." 
              className="h-12 text-sm rounded-2xl border-primary/10 focus-visible:ring-primary/40 bg-background shadow-md pr-10" 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isSending || isClearing}
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-all active:scale-90 -ml-14" disabled={isSending || isClearing || !messageText.trim()}>
              {isSending ? <Loader className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
