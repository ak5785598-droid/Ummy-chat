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
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 relative overflow-hidden">
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
                <Badge variant="secondary">{room.topic}</Badge>
                <Badge variant="outline" className="font-mono text-[10px]">ID: {room.id.substring(0, 8)}</Badge>
                {isOwner && (
                    <Badge variant="default" className="bg-primary/80 flex items-center gap-1">
                        <ShieldAlert className="h-3 w-3" /> Admin Mode
                    </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant={isMicOn ? "outline" : "secondary"} onClick={() => setIsMicOn(!isMicOn)}>
                {isMicOn ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}
              </Button>
              <Button size="icon" variant={isCameraOn ? "outline" : "secondary"} onClick={() => setIsCameraOn(!isCameraOn)}>
                {isCameraOn ? <Video className="h-5 w-5"/> : <VideoOff className="h-5 w-5"/>}
              </Button>
              <Button size="icon" variant="destructive" asChild>
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
                <div className="relative aspect-square flex flex-col items-center justify-center gap-2 bg-muted rounded-xl overflow-hidden ring-4 ring-primary/40 shadow-xl">
                  <video ref={videoRef} className={cn("w-full h-full object-cover", isCameraOn ? "block" : "hidden")} autoPlay muted />
                  {!isCameraOn && (
                    <Avatar className="h-16 w-16 shadow-inner">
                      <AvatarImage src={currentUser.photoURL || ''} />
                      <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    {!isMicOn && <MicOff className="h-3 w-3 text-red-500 bg-black/50 p-0.5 rounded" />}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 p-1 bg-black/60 rounded-md text-center backdrop-blur-md">
                    <span className="font-semibold text-white text-[10px] truncate block">{currentUser.displayName}</span>
                  </div>
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
                      isLocked ? "bg-muted/50 border-dashed border-primary/20" : "bg-card hover:shadow-md"
                    )}>
                      {participant ? (
                        <>
                          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-transparent">
                            <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-center text-[10px] truncate w-full px-2">{participant.name}</span>
                          <div className="absolute top-2 left-2 flex gap-1">
                            {isMuted && <VolumeX className="h-3 w-3 text-red-500 bg-black/50 p-0.5 rounded" />}
                          </div>
                          
                          {/* Admin Controls for Occupied Seats */}
                          {isOwner && (
                            <div className="absolute top-1 right-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="secondary" size="icon" className="h-7 w-7 rounded-full shadow-lg border-2 border-background hover:bg-primary hover:text-white transition-colors">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                  <DropdownMenuItem onClick={() => toggleSeatMute(seatIndex)}>
                                    {isMuted ? <Volume2 className="mr-2 h-4 w-4" /> : <VolumeX className="mr-2 h-4 w-4 text-red-500" />}
                                    {isMuted ? 'Unmute' : 'Mute Seat'}
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
                          <div className="flex flex-col items-center gap-1">
                            {isLocked ? <Lock className="h-6 w-6 text-primary/40" /> : <Unlock className="h-6 w-6 text-muted-foreground/10" />}
                            <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground/30">
                              {isLocked ? 'Locked' : 'Available'}
                            </span>
                          </div>
                          
                          {/* Admin Controls for Empty Seats */}
                          {isOwner && (
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40 backdrop-blur-[1px] rounded-xl">
                              <div className="flex gap-2">
                                <Button 
                                  variant="secondary" 
                                  size="icon" 
                                  className="h-8 w-8 rounded-full shadow-md hover:bg-primary hover:text-white"
                                  onClick={() => toggleSeatLock(seatIndex)}
                                  title={isLocked ? "Unlock" : "Lock"}
                                >
                                  {isLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                                </Button>
                                {!isLocked && (
                                   <Button 
                                   variant="primary" 
                                   size="icon" 
                                   className="h-8 w-8 rounded-full shadow-md bg-primary text-primary-foreground"
                                   onClick={() => toast({ title: "Invite Sent", description: "Invite link copied to clipboard." })}
                                 >
                                   <UserPlus className="h-4 w-4" />
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

      <Card className="lg:col-span-1 xl:col-span-1 flex flex-col h-full shadow-2xl border-none">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-card rounded-t-xl">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> Room Chat
          </CardTitle>
          {isOwner && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast({ title: "Chat Cleared", description: "All messages have been cleared for you." })}>
                   Clear History
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast({ title: "Room Settings", description: "Room privacy updated." })}>
                   Privacy Mode
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-4">
          <ScrollArea className="h-full pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {activeMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2 group">
                  <Avatar className="h-7 w-7 border shadow-sm">
                    <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} />
                    <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs hover:underline cursor-pointer">{msg.user.name}</span>
                      <span className="text-[9px] text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs bg-muted/40 p-2 rounded-2xl rounded-tl-none mt-1 leading-relaxed border border-transparent hover:border-primary/10 transition-colors">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
              {activeMessages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-2 opacity-40">
                  <Sparkles className="h-8 w-8 text-primary" />
                  <p className="text-xs font-medium">No messages yet. Start the vibe!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <Separator />
        <div className="p-4 space-y-3 bg-card rounded-b-xl">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 text-primary border-primary/20 rounded-full hover:bg-primary/5">
                  <Gift className="h-4 w-4"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <Tabs defaultValue="common">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="common">Normal</TabsTrigger>
                    <TabsTrigger value="premium">Premium</TabsTrigger>
                  </TabsList>
                  <ScrollArea className="h-72">
                    <TabsContent value="common" className="p-3 grid grid-cols-4 gap-2">
                      {gifts.common.map((g) => (
                        <div key={g.name} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-colors active:scale-95">
                          <g.icon className="h-8 w-8 text-primary" />
                          <span className="text-[9px] font-semibold text-center truncate w-full">{g.name}</span>
                          <div className="flex items-center gap-0.5 text-[8px] font-bold text-muted-foreground bg-muted px-1 rounded">
                            <Gem className="h-2 w-2" /> <span>{g.cost}</span>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="premium" className="p-3 grid grid-cols-4 gap-2">
                      {gifts.premium.map((g) => (
                        <div key={g.name} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-colors active:scale-95">
                          <g.icon className="h-8 w-8 text-primary" />
                          <span className="text-[9px] font-semibold text-center truncate w-full">{g.name}</span>
                          <div className="flex items-center gap-0.5 text-[8px] font-bold text-muted-foreground bg-muted px-1 rounded">
                            <Gem className="h-2 w-2" /> <span>{g.cost}</span>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                  </ScrollArea>
                </Tabs>
              </PopoverContent>
            </Popover>
          </div>
          <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
            <Input 
              placeholder="Type a message..." 
              className="h-9 text-xs rounded-full border-muted-foreground/20 focus-visible:ring-primary/40" 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isSending}
            />
            <Button type="submit" size="icon" className="h-9 w-9 rounded-full shadow-lg transition-transform active:scale-90" disabled={isSending || !messageText.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
