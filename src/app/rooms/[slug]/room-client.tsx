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
  Gem,
  Star,
  Trophy,
  Crown,
  Rocket,
  Sparkles,
  Loader,
  MoreVertical,
  ShieldAlert,
  UserX,
  Trash2,
  UserPlus,
} from 'lucide-react';
import type { Room, Message, User as RoomUser } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, doc, writeBatch } from 'firebase/firestore';

export function RoomClient({ room }: { room: Room }) {
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [lockedSeats, setLockedSeats] = useState<number[]>([]);
  const [mutedSeats, setMutedSeats] = useState<number[]>([]);
  const [activeParticipants, setActiveParticipants] = useState<RoomUser[]>(room.participants || []);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  // Role Detection
  const isOwner = currentUser?.uid === room.ownerId || room.slug === 'mumbai-adda';
  const isAdmin = room.moderatorIds?.includes(currentUser?.uid || '') || isOwner;

  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(
      collection(firestore, 'chatRooms', room.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(100)
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
  })) || [];

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
        if (videoRef.current) videoRef.current.srcObject = stream;
      } catch (error) {
        console.error('Camera/Mic access denied');
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
      toast({ 
        variant: 'destructive', 
        title: 'Send Error', 
        description: 'Failed to send message. Please check permissions.' 
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleSeatLock = (index: number) => {
    const isCurrentlyLocked = lockedSeats.includes(index);
    setLockedSeats(prev => isCurrentlyLocked ? prev.filter(i => i !== index) : [...prev, index]);
    toast({
      title: isCurrentlyLocked ? 'Seat Unlocked' : 'Seat Locked',
      description: `Seat ${index} is now ${isCurrentlyLocked ? 'open' : 'closed (Private)'}.`,
    });
  };

  const toggleSeatMute = (index: number) => {
    const isCurrentlyMuted = mutedSeats.includes(index);
    setMutedSeats(prev => isCurrentlyMuted ? prev.filter(i => i !== index) : [...prev, index]);
    toast({
      title: isCurrentlyMuted ? 'Unmuted' : 'Muted',
      description: `User in seat ${index} is now ${isCurrentlyMuted ? 'free to speak' : 'silenced'}.`,
    });
  };

  const handleKickout = (id: string, name: string) => {
    setActiveParticipants(prev => prev.filter(p => p.id !== id));
    toast({
      variant: 'destructive',
      title: 'User Kicked Out',
      description: `${name} has been removed and is now completely invisible from the room.`,
    });
  };

  const handleInvite = () => {
    toast({
      title: 'Invitation Sent',
      description: 'Your friends list has been notified to join this slot.',
    });
  };

  const handleClearChat = async () => {
    if (!firestore || !room.id || isClearing || !isOwner) return;
    
    setIsClearing(true);
    try {
      if (firestoreMessages && firestoreMessages.length > 0) {
        const batch = writeBatch(firestore);
        firestoreMessages.forEach((msg) => {
          const msgRef = doc(firestore, 'chatRooms', room.id, 'messages', msg.id);
          batch.delete(msgRef);
        });
        await batch.commit();
      }
      
      toast({
        title: 'History Erased',
        description: 'All messages have been permanently deleted for everyone.',
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Clear Error',
        description: 'Could not delete chat history.',
      });
    } finally {
      setIsClearing(false);
    }
  };

  if (isUserLoading) return <div className="flex h-full w-full items-center justify-center"><Loader className="h-8 w-8 animate-spin" /></div>;
  if (!currentUser) return null;

  const gifts = [
    { icon: Gift, name: 'Gift Box', cost: 10 },
    { icon: Star, name: 'Star', cost: 20 },
    { icon: Trophy, name: 'Trophy', cost: 250 },
    { icon: Crown, name: 'Crown', cost: 500 },
    { icon: Rocket, name: 'Rocket', cost: 750 },
    { icon: Gem, name: 'Gem', cost: 1000 },
  ];

  const totalSeats = 10;
  const otherParticipantsToDisplay = activeParticipants.filter(p => p.id !== currentUser.uid);

  return (
    <div className="grid h-[calc(100vh-10rem)] md:h-full gap-4 lg:grid-cols-3 xl:grid-cols-4">
      <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-4">
        {/* Header Section */}
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/10 overflow-hidden shadow-md border-none">
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="font-headline text-2xl truncate">{room.title}</CardTitle>
                <Badge variant="outline" className="hidden sm:inline-flex">{room.topic}</Badge>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {isOwner && (
                  <Badge variant="default" className="bg-primary/80 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Owner Mode
                  </Badge>
                )}
                {isAdmin && !isOwner && (
                  <Badge variant="secondary" className="bg-accent/80 flex items-center gap-1">
                    <Crown className="h-3 w-3" /> Admin Mode
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
              
              {isAdmin && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="default" size="icon" className="rounded-full bg-primary text-primary-foreground">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Management Tools</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {isOwner && (
                      <DropdownMenuItem onClick={handleClearChat} className="text-destructive font-bold">
                        {isClearing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Clear Chat History (Global)
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleInvite}>
                      <UserPlus className="mr-2 h-4 w-4" /> Global Invite
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

        {/* Seat Grid */}
        <Card className="flex-1 overflow-hidden border-none shadow-inner bg-secondary/5">
          <CardContent className="p-4 h-full">
            <ScrollArea className="h-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {/* My Seat */}
                <div className="relative aspect-square flex flex-col items-center justify-center gap-2 bg-muted rounded-2xl overflow-hidden ring-4 ring-primary shadow-xl">
                  <video ref={videoRef} className={cn("w-full h-full object-cover", isCameraOn ? "block" : "hidden")} autoPlay muted />
                  {!isCameraOn && (
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={currentUser.photoURL || ''} />
                      <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className="absolute bottom-2 inset-x-2 p-1.5 bg-black/60 rounded-lg text-center backdrop-blur-sm">
                    <span className="font-bold text-white text-[10px] truncate block uppercase tracking-tight">{currentUser.displayName} {isOwner ? '(Owner)' : isAdmin ? '(Admin)' : ''}</span>
                  </div>
                </div>

                {/* Other Seats */}
                {Array.from({ length: totalSeats - 1 }).map((_, i) => {
                  const participant = otherParticipantsToDisplay[i];
                  const seatIndex = i + 2;
                  const isLocked = lockedSeats.includes(seatIndex);
                  const isMuted = mutedSeats.includes(seatIndex);

                  return (
                    <div key={seatIndex} className={cn(
                      "relative aspect-square flex flex-col items-center justify-center gap-2 border-2 rounded-2xl transition-all overflow-hidden",
                      isLocked ? "bg-slate-200 border-dashed border-slate-400 shadow-inner" : "bg-card hover:border-primary/40 shadow-sm"
                    )}>
                      {isLocked ? (
                        <div className="flex flex-col items-center gap-1 opacity-60">
                           <Lock className="h-8 w-8 text-slate-500" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase">Closed</span>
                        </div>
                      ) : participant ? (
                        <>
                          <Avatar className="h-16 w-16 sm:h-20 sm:w-20 border-2 border-primary/10">
                            <AvatarImage src={participant.avatarUrl} alt={participant.name} />
                            <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-center text-[10px] truncate w-full px-2 uppercase tracking-tight">{participant.name}</span>
                          <div className="absolute top-2 left-2 flex gap-1">
                            {isMuted && <VolumeX className="h-4 w-4 text-red-500 bg-black/60 p-1 rounded-md" />}
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-1 opacity-30">
                          <Unlock className="h-6 w-6 text-muted-foreground" />
                          <span className="text-[9px] font-bold uppercase">Empty</span>
                        </div>
                      )}

                      {/* Admin Menu for EACH SEAT */}
                      {isAdmin && (
                        <div className="absolute top-2 right-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white/90 shadow-sm border">
                                <MoreVertical className="h-4 w-4 text-primary" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel>Seat {seatIndex} Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => toggleSeatLock(seatIndex)}>
                                {isLocked ? <Unlock className="mr-2 h-4 w-4 text-green-500" /> : <Lock className="mr-2 h-4 w-4 text-primary" />}
                                {isLocked ? 'Unlock Seat' : 'Lock Seat (Hide Info)'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleInvite}>
                                <UserPlus className="mr-2 h-4 w-4 text-blue-500" /> Invite to Seat
                              </DropdownMenuItem>
                              {participant && !isLocked && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => toggleSeatMute(seatIndex)}>
                                    {isMuted ? <Volume2 className="mr-2 h-4 w-4 text-green-500" /> : <VolumeX className="mr-2 h-4 w-4 text-orange-500" />}
                                    {isMuted ? 'Unmute' : 'Mute Voice'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleKickout(participant.id, participant.name)} 
                                    className="text-destructive font-bold"
                                  >
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

      {/* Chat Sidebar */}
      <Card className="lg:col-span-1 xl:col-span-1 flex flex-col h-full shadow-2xl border-none">
        <CardHeader className="p-4 border-b flex flex-row items-center justify-between bg-secondary/10">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" /> Chat
          </CardTitle>
          <Badge variant="outline" className="text-[10px] animate-pulse">LIVE</Badge>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-4">
          <ScrollArea className="h-full pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {activeMessages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2">
                  <Avatar className="h-8 w-8 shadow-sm flex-shrink-0">
                    <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} />
                    <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2">
                      <span className="font-bold text-xs truncate max-w-[100px]">{msg.user.name}</span>
                      <span className="text-[9px] text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs bg-muted p-2 rounded-xl rounded-tl-none mt-1 shadow-sm break-words">
                      {msg.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="p-4 space-y-4 bg-secondary/10">
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10 text-primary rounded-xl bg-background shadow">
                  <Gift className="h-5 w-5"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-3 shadow-2xl border-primary/20">
                <div className="grid grid-cols-3 gap-2">
                  {gifts.map((g) => (
                    <div key={g.name} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-all active:scale-90">
                      <g.icon className="h-8 w-8 text-primary" />
                      <span className="text-[8px] font-bold text-center truncate w-full uppercase">{g.name}</span>
                      <Badge variant="secondary" className="text-[8px] px-1 h-3">{g.cost} <Gem className="h-2 w-2 ml-0.5" /></Badge>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <div className="flex-1 flex gap-2 overflow-x-auto py-1">
               {['👋', '❤️', '🔥', '😂', '💯'].map(emoji => (
                  <button key={emoji} className="text-xl hover:scale-125 transition-transform" onClick={() => setMessageText(prev => prev + emoji)}>
                    {emoji}
                  </button>
               ))}
            </div>
          </div>
          <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
            <Input 
              placeholder="Send message..." 
              className="h-11 text-sm rounded-xl border-primary/20 bg-background" 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isSending}
            />
            <Button type="submit" size="icon" className="h-11 w-11 rounded-xl shadow-xl bg-primary" disabled={isSending || !messageText.trim()}>
              {isSending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
