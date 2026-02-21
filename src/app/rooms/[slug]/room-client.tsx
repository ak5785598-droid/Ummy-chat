
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
  UserX,
  Megaphone,
  Settings2,
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
  UserPlus,
  ShieldAlert,
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [lockedSeats, setLockedSeats] = useState<number[]>([]);
  const [mutedSeats, setMutedSeats] = useState<number[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const isOwner = currentUser?.uid === room.ownerId;

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
    try {
      await addDoc(collection(firestore, 'chatRooms', room.id, 'messages'), {
        content: messageText,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Anonymous',
        senderAvatar: currentUser.photoURL || '',
        timestamp: serverTimestamp(),
      });
      setMessageText('');
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send message.' });
    } finally {
      setIsSending(false);
    }
  };

  const toggleSeatLock = (index: number) => {
    setLockedSeats(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    const isLocked = !lockedSeats.includes(index);
    toast({
      title: isLocked ? 'Seat Locked' : 'Seat Unlocked',
      description: `Seat ${index} is now ${isLocked ? 'restricted' : 'open'}.`,
    });
  };

  const toggleSeatMute = (index: number) => {
    setMutedSeats(prev => prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]);
    const isMuted = !mutedSeats.includes(index);
    toast({
      title: isMuted ? 'User Muted' : 'User Unmuted',
      description: `Seat ${index} has been ${isMuted ? 'muted' : 'unmuted'} by admin.`,
    });
  };

  const handleKickout = (name: string) => {
    toast({
      variant: 'destructive',
      title: 'User Kicked Out',
      description: `${name} has been removed from the room.`,
    });
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
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden shadow-md">
          <CardHeader className="flex flex-row items-center justify-between p-4 relative z-10">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="font-headline text-2xl truncate">{room.title}</CardTitle>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary animate-pulse">
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
                <Badge variant="outline" className="font-mono text-[10px]">ID: {room.id.substring(0, 8)}</Badge>
                {isOwner && (
                    <Badge variant="default" className="bg-primary/80 flex items-center gap-1 shadow-sm">
                        <ShieldAlert className="h-3 w-3" /> Admin Mode
                    </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant={isMicOn ? "outline" : "secondary"} onClick={() => setIsMicOn(!isMicOn)} className="rounded-full">
                {isMicOn ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}
              </Button>
              <Button size="icon" variant={isCameraOn ? "outline" : "secondary"} onClick={() => setIsCameraOn(!isCameraOn)} className="rounded-full">
                {isCameraOn ? <Video className="h-5 w-5"/> : <VideoOff className="h-5 w-5"/>}
              </Button>
              
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="primary" size="icon" className="rounded-full bg-primary text-primary-foreground shadow-md">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => toast({ title: "Room Settings", description: "Announcement updated." })}>
                      <Megaphone className="mr-2 h-4 w-4" /> Update Announcement
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toast({ title: "Chat Cleared", description: "History cleared for all users." })}>
                      <Sparkles className="mr-2 h-4 w-4" /> Clear Chat History
                    </DropdownMenuItem>
                    <Separator className="my-1" />
                    <DropdownMenuItem onClick={() => toast({ title: "Privacy", description: "Room is now private." })}>
                      <Lock className="mr-2 h-4 w-4" /> Make Room Private
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

        <Card className="flex-1 overflow-hidden">
          <CardContent className="p-4 h-full bg-secondary/5">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* User's Seat */}
                <div className="relative aspect-square flex flex-col items-center justify-center gap-2 bg-muted rounded-xl overflow-hidden ring-4 ring-primary/40 shadow-2xl">
                  <video ref={videoRef} className={cn("w-full h-full object-cover", isCameraOn ? "block" : "hidden")} autoPlay muted />
                  {!isCameraOn && (
                    <Avatar className="h-20 w-20 shadow-inner">
                      <AvatarImage src={currentUser.photoURL || ''} />
                      <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {!isMicOn && <MicOff className="h-4 w-4 text-red-500 bg-black/60 p-1 rounded-md" />}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 p-1.5 bg-black/70 rounded-lg text-center backdrop-blur-md">
                    <span className="font-bold text-white text-[10px] truncate block uppercase tracking-tight">{currentUser.displayName}</span>
                  </div>
                  
                  {isOwner && (
                    <div className="absolute top-2 right-2">
                       <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full bg-white/20 hover:bg-white/40 text-white backdrop-blur-md">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                           <DropdownMenuItem onClick={() => setIsMicOn(!isMicOn)}>
                              {isMicOn ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
                              {isMicOn ? 'Mute Myself' : 'Unmute Myself'}
                           </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {/* Other Participants and Empty Seats */}
                {Array.from({ length: totalSeats - 1 }).map((_, i) => {
                  const participant = otherParticipants[i];
                  const seatIndex = i + 2;
                  const isLocked = lockedSeats.includes(seatIndex);
                  const isMuted = mutedSeats.includes(seatIndex);

                  return (
                    <div key={seatIndex} className={cn(
                      "relative aspect-square flex flex-col items-center justify-center gap-2 border rounded-xl shadow-sm transition-all group",
                      isLocked ? "bg-muted/50 border-dashed border-primary/40" : "bg-card hover:shadow-lg"
                    )}>
                      {participant ? (
                        <>
                          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-transparent">
                            <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-center text-[10px] truncate w-full px-2 uppercase tracking-tight">{participant.name}</span>
                          <div className="absolute top-2 left-2 flex gap-1">
                            {isMuted && <VolumeX className="h-4 w-4 text-red-500 bg-black/60 p-1 rounded-md" />}
                          </div>
                          
                          {/* Admin Controls for Occupied Seats - ALWAYS VISIBLE */}
                          {isOwner && (
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="primary" size="icon" className="h-8 w-8 rounded-full shadow-md bg-primary text-white border-2 border-background">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52">
                                  <DropdownMenuItem onClick={() => toggleSeatMute(seatIndex)}>
                                    {isMuted ? <Volume2 className="mr-2 h-4 w-4 text-green-500" /> : <VolumeX className="mr-2 h-4 w-4 text-red-500" />}
                                    {isMuted ? 'Unmute Participant' : 'Mute Participant'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-destructive font-bold focus:bg-destructive focus:text-destructive-foreground" 
                                    onClick={() => handleKickout(participant.name)}
                                  >
                                    <UserX className="mr-2 h-4 w-4" /> Kick Out User
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="flex flex-col items-center gap-2">
                            {isLocked ? <Lock className="h-8 w-8 text-primary/60" /> : <Unlock className="h-8 w-8 text-muted-foreground/20" />}
                            <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                              {isLocked ? 'Closed' : 'Open'}
                            </span>
                          </div>
                          
                          {/* Admin Controls for Empty Seats - ALWAYS VISIBLE */}
                          {isOwner && (
                            <div className="absolute inset-0 flex items-center justify-center bg-background/10 backdrop-blur-[1px] rounded-xl">
                              <div className="flex gap-2">
                                <Button 
                                  variant="secondary" 
                                  size="icon" 
                                  className={cn(
                                    "h-10 w-10 rounded-full shadow-lg border-2 border-background transition-colors",
                                    isLocked ? "bg-primary text-white" : "bg-white text-primary"
                                  )}
                                  onClick={() => toggleSeatLock(seatIndex)}
                                  title={isLocked ? "Unlock Seat" : "Lock Seat"}
                                >
                                  {isLocked ? <Unlock className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                                </Button>
                                {!isLocked && (
                                   <Button 
                                   variant="primary" 
                                   size="icon" 
                                   className="h-10 w-10 rounded-full shadow-lg bg-green-500 text-white border-2 border-background hover:bg-green-600"
                                   onClick={() => toast({ title: "Invite Link", description: "Room invite link copied to clipboard!" })}
                                 >
                                   <UserPlus className="h-5 w-5" />
                                 </Button>
                                )}
                              </div>
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

      <Card className="lg:col-span-1 xl:col-span-1 flex flex-col h-full shadow-2xl border-none bg-card">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between rounded-t-xl bg-secondary/10">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Global Vibe
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-bold">LIVE</Badge>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-4">
          <ScrollArea className="h-full pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {activeMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 group">
                  <Avatar className="h-8 w-8 border shadow-sm flex-shrink-0">
                    <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} />
                    <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs hover:underline cursor-pointer truncate max-w-[100px]">{msg.user.name}</span>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs bg-muted/60 p-2.5 rounded-2xl rounded-tl-none mt-1 leading-relaxed border border-transparent group-hover:border-primary/20 transition-all shadow-sm break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
              {activeMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3 opacity-30">
                  <div className="p-4 rounded-full bg-primary/10">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <p className="text-sm font-bold uppercase tracking-tight">No messages yet</p>
                  <p className="text-[10px] max-w-[150px]">Be the first to say hi and set the vibe for the room!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <Separator />
        <div className="p-4 space-y-4 bg-secondary/5 rounded-b-xl">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 text-primary border-primary/20 rounded-full hover:bg-primary/5 bg-background shadow-sm">
                  <Gift className="h-5 w-5"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 shadow-2xl border-primary/20" align="end">
                <Tabs defaultValue="common">
                  <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
                    <TabsTrigger value="common" className="rounded-none">Normal</TabsTrigger>
                    <TabsTrigger value="premium" className="rounded-none">Premium</TabsTrigger>
                  </TabsList>
                  <ScrollArea className="h-80">
                    <TabsContent value="common" className="p-3 m-0 grid grid-cols-4 gap-2">
                      {gifts.common.map((g) => (
                        <div key={g.name} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-all active:scale-95 group">
                          <g.icon className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-bold text-center truncate w-full uppercase">{g.name}</span>
                          <div className="flex items-center gap-0.5 text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            <Gem className="h-2 w-2" /> <span>{g.cost}</span>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="premium" className="p-3 m-0 grid grid-cols-4 gap-2">
                      {gifts.premium.map((g) => (
                        <div key={g.name} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-all active:scale-95 group">
                          <g.icon className="h-10 w-10 text-accent group-hover:scale-110 transition-transform" />
                          <span className="text-[9px] font-bold text-center truncate w-full uppercase">{g.name}</span>
                          <div className="flex items-center gap-0.5 text-[8px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded-full">
                            <Gem className="h-2 w-2" /> <span>{g.cost}</span>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </PopoverContent>
            </Popover>
            <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide py-1">
               {['👋', '❤️', '🔥', '😂', '💯'].map(emoji => (
                  <button key={emoji} className="text-xl hover:scale-125 transition-transform" onClick={() => setMessageText(prev => prev + emoji)}>
                    {emoji}
                  </button>
               ))}
            </div>
          </div>
          <form className="flex items-center gap-3" onSubmit={handleSendMessage}>
            <Input 
              placeholder="Type your vibe..." 
              className="h-11 text-sm rounded-2xl border-muted-foreground/20 focus-visible:ring-primary/40 bg-background shadow-inner" 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isSending}
            />
            <Button type="submit" size="icon" className="h-11 w-11 rounded-2xl shadow-xl bg-primary hover:bg-primary/90 transition-all active:scale-90" disabled={isSending || !messageText.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
