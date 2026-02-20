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
  Heart,
  ThumbsUp,
  PartyPopper,
  Crown,
  Swords,
  UserPlus,
  Gem,
  Star,
  Flower,
  Lollipop,
  Trophy,
  Rocket,
  Sparkles,
  Loader,
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
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit } from 'firebase/firestore';

export function RoomClient({ room }: { room: Room }) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [isPkBattle, setIsPkBattle] = useState(false);
  const [pkProgress1, setPkProgress1] = useState(50);
  const [pkProgress2, setPkProgress2] = useState(50);
  const { user: currentUser, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  // Listen to real-time messages for this specific room
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !room.id) return null;
    return query(
      collection(firestore, 'chatRooms', room.id, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(50)
    );
  }, [firestore, room.id]);

  const { data: firestoreMessages, isLoading: isMessagesLoading } = useCollection(messagesQuery);

  // Map Firestore messages to our UI Message type
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

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [activeMessages]);

  // Initialize camera and mic
  useEffect(() => {
    const getPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setHasCameraPermission(true);
        setHasMicPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
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
      console.error('Error sending message:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send message. Please try again.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleMic = () => setIsMicOn(prev => !prev);
  const toggleCamera = () => setIsCameraOn(prev => !prev);

  if (isUserLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentUser) return null;

  const reactions = [
    { icon: Heart, label: 'Love' },
    { icon: ThumbsUp, label: 'Like' },
    { icon: PartyPopper, label: 'Celebrate' },
  ];

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
  const filledSeatsCount = otherParticipants.length;
  const emptySeatsCount = Math.max(0, totalSeats - 1 - filledSeatsCount);

  return (
    <div className="grid h-[calc(100vh-10rem)] md:h-full gap-4 lg:grid-cols-3 xl:grid-cols-4">
      <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between p-4">
            <div>
              <CardTitle className="font-headline text-2xl truncate max-w-[200px] sm:max-w-md">{room.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{room.topic}</Badge>
                <Badge variant="outline">Online: {(room.participants?.length || 0) + 1}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="icon" variant="outline" onClick={() => setIsPkBattle(p => !p)} className="hidden sm:flex">
                <Swords className="h-5 w-5 text-destructive" />
              </Button>
              <Button size="icon" variant={isMicOn ? "outline" : "secondary"} onClick={toggleMic} disabled={!hasMicPermission}>
                {isMicOn ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}
              </Button>
              <Button size="icon" variant={isCameraOn ? "outline" : "secondary"} onClick={toggleCamera} disabled={!hasCameraPermission}>
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
                <div className="relative aspect-square flex flex-col items-center justify-center gap-2 bg-muted rounded-xl overflow-hidden ring-4 ring-primary/40 shadow-inner">
                  <video ref={videoRef} className={cn("w-full h-full object-cover", (isCameraOn && hasCameraPermission) ? "block" : "hidden")} autoPlay muted />
                  {(!isCameraOn || !hasCameraPermission) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-secondary/20">
                      <Avatar className="h-16 w-16">
                          <AvatarImage src={currentUser.photoURL || ''} />
                          <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[8px] uppercase tracking-widest font-bold text-primary">Me</span>
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 right-2 p-1 bg-black/60 rounded-md text-center backdrop-blur-md">
                    <span className="font-semibold text-white text-[10px] truncate block">{currentUser.displayName}</span>
                  </div>
                </div>

                {otherParticipants.map((p) => (
                  <div key={p.id} className="relative aspect-square flex flex-col items-center justify-center gap-2 bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                    <Avatar className={cn(
                      "h-16 w-16 sm:h-20 sm:w-20 border-4 border-transparent transition-all",
                      speakingId === p.id && "border-primary shadow-lg scale-105"
                    )}>
                      <AvatarImage src={p.avatarUrl} alt={p.name} />
                      <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-center text-[10px] truncate w-full px-2">{p.name}</span>
                  </div>
                ))}

                {Array.from({ length: emptySeatsCount }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square border-2 border-dashed border-muted/50 bg-muted/5 flex flex-col items-center justify-center rounded-xl text-muted-foreground/20 hover:bg-muted/10 transition-colors">
                    <UserPlus className="h-8 w-8 mb-1" />
                    <span className="text-[8px] font-bold uppercase tracking-widest">Available</span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Card className="lg:col-span-1 xl:col-span-1 flex flex-col h-full">
        <CardHeader className="p-4 border-b">
          <CardTitle className="font-headline text-lg flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            Room Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 p-4">
          <ScrollArea className="h-full pr-4" ref={scrollRef}>
            <div className="space-y-4">
              {activeMessages.length > 0 ? (
                activeMessages.map((msg) => (
                  <div key={msg.id} className="flex items-start gap-2 animate-in fade-in slide-in-from-bottom-1">
                    <Avatar className="h-7 w-7 border">
                      <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} />
                      <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-xs">{msg.user.name}</span>
                        <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs bg-muted/40 p-2 rounded-lg mt-1 leading-relaxed shadow-sm">{msg.text}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/50 space-y-2">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Send className="h-5 w-5" />
                  </div>
                  <p className="text-xs italic">No messages yet. Say hi!</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <Separator />
        <div className="p-4 space-y-3 bg-secondary/5">
          <div className="flex items-center gap-2">
            {reactions.map(r => (
              <Button key={r.label} variant="ghost" size="icon" className="h-8 w-8 hover:scale-125 transition-transform">
                <r.icon className="h-4 w-4 text-muted-foreground hover:text-primary"/>
              </Button>
            ))}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 text-primary border-primary/20 hover:bg-primary/10 ml-auto rounded-full shadow-sm">
                  <Gift className="h-4 w-4"/>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 rounded-xl overflow-hidden shadow-2xl" align="end">
                <Tabs defaultValue="common">
                  <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
                    <TabsTrigger value="common">Common</TabsTrigger>
                    <TabsTrigger value="premium">Premium</TabsTrigger>
                  </TabsList>
                  <ScrollArea className="h-72">
                    <TabsContent value="common" className="p-3 grid grid-cols-4 gap-2">
                      {gifts.common.map((g) => (
                        <div key={g.name} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-colors border border-transparent hover:border-primary/20">
                          <g.icon className="h-8 w-8 text-primary" />
                          <span className="text-[9px] font-semibold text-center truncate w-full">{g.name}</span>
                          <div className="flex items-center gap-0.5 text-[8px] font-bold text-muted-foreground bg-muted px-1 rounded">
                            <Gem className="h-2 w-2" />
                            <span>{g.cost}</span>
                          </div>
                        </div>
                      ))}
                    </TabsContent>
                    <TabsContent value="premium" className="p-3 grid grid-cols-4 gap-2">
                      {gifts.premium.map((g) => (
                        <div key={g.name} className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-primary/10 cursor-pointer transition-colors border border-transparent hover:border-primary/20">
                          <g.icon className="h-8 w-8 text-primary" />
                          <span className="text-[9px] font-semibold text-center truncate w-full">{g.name}</span>
                          <div className="flex items-center gap-0.5 text-[8px] font-bold text-muted-foreground bg-muted px-1 rounded">
                            <Gem className="h-2 w-2" />
                            <span>{g.cost}</span>
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
              className="h-9 text-xs rounded-full border-muted-foreground/20" 
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              disabled={isSending}
            />
            <Button type="submit" size="icon" className="h-9 w-9 rounded-full shrink-0" disabled={isSending || !messageText.trim()}>
              {isSending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}