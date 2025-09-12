'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { notFound } from 'next/navigation';
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
  Cake,
  Swords,
  Lock,
  UserPlus,
  ShieldX,
  VolumeX,
} from 'lucide-react';
import { getRoomBySlug } from '@/lib/mock-data';
import type { User } from '@/lib/types';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

export default function RoomPage({ params }: { params: { slug: string } }) {
  const room = getRoomBySlug(params.slug);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [hasMicPermission, setHasMicPermission] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [isPkBattle, setIsPkBattle] = useState(false);
  const [pkProgress1, setPkProgress1] = useState(30);
  const [pkProgress2, setPkProgress2] = useState(70);

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
        if ((error as Error).name === 'NotAllowedError' || (error as Error).name === 'PermissionDeniedError') {
            toast({
              variant: 'destructive',
              title: 'Permissions Denied',
              description:
                'Please enable camera and microphone permissions in your browser settings.',
            });
            setHasCameraPermission(false);
            setHasMicPermission(false);
        }
      }
    };
    getPermissions();
  }, [toast]);

  useEffect(() => {
    if (!room) return;
    const interval = setInterval(() => {
      if (room.participants.length > 0) {
        const randomIndex = Math.floor(Math.random() * room.participants.length);
        const randomParticipant = room.participants[randomIndex];
        setSpeakingId(randomParticipant.id);
        setTimeout(() => setSpeakingId(null), 1500);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [room]);
  
  useEffect(() => {
    if (isPkBattle) {
      const battleInterval = setInterval(() => {
        setPkProgress1(Math.random() * 100);
        setPkProgress2(Math.random() * 100);
      }, 2000);
      return () => clearInterval(battleInterval);
    }
  }, [isPkBattle]);

  if (!room) {
    notFound();
  }
  
  const [pkContestant1, pkContestant2] = room.participants.slice(0, 2);

  const reactions = [
    { icon: Heart, label: 'Love' },
    { icon: ThumbsUp, label: 'Like' },
    { icon: PartyPopper, label: 'Celebrate' },
  ];
  const gifts = [
    { icon: Gift, label: 'Gift' },
    { icon: Cake, label: 'Cake' },
    { icon: Crown, label: 'Crown' },
  ];

  const toggleMic = () => setIsMicOn(prev => !prev);
  const toggleCamera = () => setIsCameraOn(prev => !prev);


  return (
    <div className="grid h-[calc(100vh-10rem)] md:h-full gap-4 lg:grid-cols-3 xl:grid-cols-4">
      <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-4">
        <Card>
           <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-2xl">{room.title}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{room.topic}</Badge>
                <Badge variant="outline">Seats: {room.participants.length}/20</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
               <Button size="icon" variant="outline">
                <Lock className="h-5 w-5" />
              </Button>
               <Button size="icon" variant="outline">
                <UserPlus className="h-5 w-5" />
              </Button>
              <Button size="icon" variant="outline" onClick={() => setIsPkBattle(p => !p)}>
                <Swords className="h-5 w-5 text-destructive" />
              </Button>
              <Button size="icon" variant={isMicOn ? "outline" : "secondary"} onClick={toggleMic} disabled={!hasMicPermission}>
                {isMicOn ? <Mic className="h-5 w-5"/> : <MicOff className="h-5 w-5"/>}
              </Button>
              <Button size="icon" variant={isCameraOn ? "outline" : "secondary"} onClick={toggleCamera} disabled={!hasCameraPermission}>
                {isCameraOn ? <Video className="h-5 w-5"/> : <VideoOff className="h-5 w-5"/>}
              </Button>
              <Button size="icon" variant="destructive"><PhoneOff className="h-5 w-5"/></Button>
            </div>
          </CardHeader>
        </Card>

        {isPkBattle && pkContestant1 && pkContestant2 ? (
          <Card className="flex-1">
             <CardContent className="p-4 h-full flex flex-col items-center justify-center gap-4 relative">
                <Swords className="h-16 w-16 text-destructive absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transform rotate-[-15deg]" />
                <div className="flex w-full items-center justify-around">
                    <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-28 w-28 border-4 border-blue-500">
                             <AvatarImage src={pkContestant1.avatarUrl} alt={pkContestant1.name} data-ai-hint="person portrait" />
                             <AvatarFallback>{pkContestant1.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold">{pkContestant1.name}</span>
                    </div>
                     <div className="flex flex-col items-center gap-2">
                        <Avatar className="h-28 w-28 border-4 border-red-500">
                             <AvatarImage src={pkContestant2.avatarUrl} alt={pkContestant2.name} data-ai-hint="person portrait" />
                             <AvatarFallback>{pkContestant2.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-bold">{pkContestant2.name}</span>
                    </div>
                </div>
                <div className="w-full max-w-md flex items-center gap-2">
                    <Progress value={pkProgress1} className="[&>div]:bg-blue-500" />
                    <span className="font-bold text-lg">VS</span>
                    <Progress value={pkProgress2} className="[&>div]:bg-red-500 transform -scale-x-100" />
                </div>
             </CardContent>
          </Card>
        ) : (
          <Card className="flex-1">
            <CardContent className="p-4 h-full">
              <ScrollArea className="h-full">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                <div className="relative group aspect-square bg-muted rounded-md flex items-center justify-center">
                  <video ref={videoRef} className={cn("w-full h-full object-cover rounded-md", isCameraOn && hasCameraPermission ? "block" : "hidden")} autoPlay muted />
                  {(!isCameraOn || !hasCameraPermission) && (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <VideoOff className="h-10 w-10"/>
                      <span>{ !hasCameraPermission ? "Camera off" : "Camera off" }</span>
                    </div>
                  )}
                </div>
                {room.participants.map((p) => (
                  <div key={p.id} className="relative group aspect-square flex flex-col items-center justify-center gap-2 bg-muted rounded-md">
                    <Avatar className={cn(
                      "h-20 w-20 border-4 border-transparent transition-all",
                      speakingId === p.id && "border-primary shadow-lg"
                    )}>
                      <AvatarImage src={p.avatarUrl} alt={p.name} data-ai-hint="person portrait" />
                      <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-center text-sm truncate w-full px-2">{p.name}</span>
                    <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="destructive" className="h-7 w-7">
                        <ShieldX className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" className="h-7 w-7">
                        <VolumeX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="lg:col-span-1 xl:col-span-1 flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">Live Chat</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-4">
              {room.messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.user.avatarUrl} alt={msg.user.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{msg.user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold text-sm">{msg.user.name}</span>
                      <span className="text-xs text-muted-foreground">{msg.timestamp}</span>
                    </div>
                    <p className="text-sm">{msg.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
        <Separator />
        <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
                {reactions.map(r => (
                     <Button key={r.label} variant="outline" size="icon" className="h-9 w-9">
                        <r.icon className="h-5 w-5"/>
                     </Button>
                ))}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon" className="h-9 w-9">
                            <Gift className="h-5 w-5 text-primary"/>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                        <div className="flex gap-2">
                        {gifts.map(g => (
                            <Button key={g.label} variant="ghost" size="icon">
                                <g.icon className="h-6 w-6"/>
                            </Button>
                        ))}
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
            <form className="flex items-center gap-2">
              <Input placeholder="Send a message..." />
              <Button type="submit" size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </form>
        </div>
      </Card>
    </div>
  );
}
