
'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
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
  Star,
  Gem,
  Car,
  Plane,
  Castle,
  HeartHandshake,
  HeartPulse,
  Ship,
  IceCream,
  Pizza,
  Gamepad2,
  Trophy,
  Rocket,
  Diamond,
  Watch,
  Palette,
  Music,
  Camera,
  Film,
  Sparkles,
  Sun,
  Moon,
  Cat,
  Lollipop,
  Bone,
  Apple,
  Cookie,
  Coffee,
  Donut,
  Popcorn,
  Candy,
  Cherry,
  Grape,
  Banana,
  Mic2,
  Guitar,
  Paintbrush,
  GraduationCap,
  Feather,
  Flower,
  Leaf,
  Cloud,
  Droplet,
  Flame,
  Umbrella,
  Bomb,
  Component,
  Briefcase,
  Book,
  Camera as CameraIcon,
  Cigarette,
  Dumbbell,
  File,
  Film as FilmIcon,
  Flag,
  Pen,
  Mail,
  Medal,
  Mouse,
  Navigation,
  Package,
  Pencil,
  Phone,
  Power,
  Search,
  Settings,
  Shield,
  ShoppingBag,
  Smartphone,
  Tablet,
  Tag,
  Ticket,
  Wallet,
  Zap,
  CupSoda,
  GlassWater,
  Shirt,
  ShoppingBasket,
  Baby,
  Beer,
  Bike,
  Building,
  Bus,
  Train,
  Clover,
  Dice1,
  Dice2,
  Dice3,
  Dice4,
  Dice5,
  Dice6,
  Dna,
  DoorClosed,
  DraftingCompass,
  Drama,
  Dog,
  Folder,
  Gamepad,
  Hammer,
  Key,
  Laptop,
  Lightbulb,
  Map,
  Pin,
  Plane as PlaneIcon,
  Plug,
  Plus,
  Pocket,
  Puzzle,
  Scissors,
  Share,
  Smile,
  Speaker,
  Square,
  Triangle,
  Voicemail,
  Wifi,
  Wind,
  Wrench,
  Anchor,
  Bone as BoneIcon,
  Brain,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Cloud as CloudIcon,
  Cog,
  Coins,
  CreditCard,
  Download,
  Eye,
  File as FileIcon2,
  Globe,
  Grid,
  Heart as HeartIcon,
  HelpCircle,
  Home,
  Image as ImageIcon,
  Info,
  Link,
  Lock as LockIcon,
  LogIn,
  LogOut,
  Mail as MailIcon,
  MapPin,
  Maximize,
  Menu,
  MessageCircle,
  Minimize,
  Minus,
  Monitor,
  MoreHorizontal,
  MoreVertical,
  Move,
  Music as MusicIcon,
  Paperclip,
  Pause,
  Pen as PenTool,
  Percent,
  Phone as PhoneIcon,
  Play,
  Power as PowerIcon,
  Printer,
  Radio,
  RefreshCcw,
  RefreshCw,
  Repeat,
  Save,
  Scissors as ScissorsIcon,
  Search as SearchIcon,
  Send as SendIcon,
  Server,
  Settings as SettingsIcon,
  Share2,
  Shield as ShieldIcon2,
  ShoppingBag as ShoppingBagIcon,
  ShoppingCart,
  Sidebar,
  SkipBack,
  SkipForward,
  Slack,
  Sliders,
  Smartphone as SmartphoneIcon,
  Smile as SmileIcon,
  Speaker as SpeakerIcon,
  Star as StarIcon,
  StopCircle,
  Sun as SunIcon,
  Sunrise,
  Sunset,
  Table,
  Tablet as TabletIcon,
  Tag as TagIcon,
  Target,
  Thermometer,
  ThumbsDown,
  ThumbsUp as ThumbsUpIcon,
  ToggleLeft,
  ToggleRight,
  Tool,
  Trash,
  Trash2,
  TrendingDown,
  TrendingUp,
  Truck,
  Twitch,
  Twitter,
  Type,
  Umbrella as UmbrellaIcon,
  Underline,
  Unlock,
  Upload,
  User,
  UserCheck,
  UserMinus,
  UserPlus as UserPlusIcon,
  UserX,
  Users,
  Video as VideoIcon,
  Voicemail as VoicemailIcon,
  Volume,
  Volume1,
  Volume2,
  VolumeX as VolumeXIcon,
  Watch as WatchIcon,
  Wifi as WifiIcon,
  WifiOff,
  Wind as WindIcon,
  X,
  XCircle,
  XOctagon,
  XSquare,
  Youtube,
  Zap as ZapIcon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type { Room } from '@/lib/types';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getCurrentUser } from '@/lib/mock-data';

export function RoomClient({ room }: { room: Room }) {
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
  const currentUser = getCurrentUser();

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
    return null;
  }
  
  const [pkContestant1, pkContestant2] = room.participants.slice(0, 2);

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
      { icon: IceCream, name: 'Ice Cream', cost: 25 },
      { icon: Cookie, name: 'Cookie', cost: 25 },
      { icon: Coffee, name: 'Coffee', cost: 30 },
      { icon: PartyPopper, name: 'Confetti', cost: 30 },
      { icon: Donut, name: 'Donut', cost: 35 },
      { icon: Music, name: 'Music Note', cost: 35 },
      { icon: Pizza, name: 'Pizza', cost: 40 },
      { icon: Popcorn, name: 'Popcorn', cost: 45 },
      { icon: Cake, name: 'Cake', cost: 50 },
      { icon: Candy, name: 'Candy', cost: 55 },
      { icon: Gamepad2, name: 'Game', cost: 60 },
      { icon: Cherry, name: 'Cherry', cost: 65 },
      { icon: Grape, name: 'Grape', cost: 70 },
      { icon: Feather, name: 'Feather', cost: 75 },
      { icon: Mic2, name: 'Mic', cost: 80 },
      { icon: Banana, name: 'Banana', cost: 85 },
      { icon: Leaf, name: 'Leaf', cost: 90 },
      { icon: Droplet, name: 'Droplet', cost: 95 },
      { icon: Sun, name: 'Sun', cost: 100 },
      { icon: Moon, name: 'Moon', cost: 100 },
      { icon: Cloud, name: 'Cloud', cost: 110 },
    ],
    premium: [
      { icon: Trophy, name: 'Trophy', cost: 250 },
      { icon: Palette, name: 'Palette', cost: 300 },
      { icon: Camera, name: 'Camera', cost: 350 },
      { icon: Film, name: 'Film', cost: 400 },
      { icon: Crown, name: 'Crown', cost: 500 },
      { icon: Medal, name: 'Medal', cost: 600 },
      { icon: Rocket, name: 'Rocket', cost: 750 },
      { icon: Shield, name: 'Shield', cost: 800 },
      { icon: Bomb, name: 'Bomb', cost: 850 },
      { icon: Flag, name: 'Flag', cost: 900 },
      { icon: Gem, name: 'Gem', cost: 1000 },
      { icon: Anchor, name: 'Anchor', cost: 1200 },
      { icon: Diamond, name: 'Diamond', cost: 1500 },
      { icon: Key, name: 'Key', cost: 1750 },
      { icon: Watch, name: 'Watch', cost: 3000 },
      { icon: Laptop, name: 'Laptop', cost: 3500 },
      { icon: Briefcase, name: 'Briefcase', cost: 4000 },
      { icon: Car, name: 'Sports Car', cost: 5000 },
      { icon: Bike, name: 'Bike', cost: 5500 },
      { icon: Bus, name: 'Bus', cost: 6000 },
      { icon: Train, name: 'Train', cost: 7000 },
      { icon: ShoppingBag, name: 'Shopping Bag', cost: 7500 },
      { icon: GraduationCap, name: 'Cap', cost: 8000 },
      { icon: Guitar, name: 'Guitar', cost: 8500 },
      { icon: Paintbrush, name: 'Brush', cost: 9000 },
    ],
    couple: [
      { icon: HeartPulse, name: 'Heartbeat', cost: 520 },
      { icon: Clover, name: 'Clover', cost: 777 },
      { icon: Sparkles, name: 'Magic', cost: 1314 },
      { icon: Cat, name: 'Kitten', cost: 666 },
      { icon: Dog, name: 'Puppy', cost: 666 },
      { icon: HeartHandshake, name: 'Promise', cost: 8888 },
      { icon: Ship, name: 'Love Boat', cost: 10000 },
      { icon: Umbrella, name: 'Umbrella', cost: 12000 },
      { icon: Brain, name: 'Telepathy', cost: 15000 },
      { icon: Plane, name: 'Private Jet', cost: 20000 },
      { icon: Building, name: 'Apartment', cost: 30000 },
      { icon: Castle, name: 'Castle', cost: 50000 },
      { icon: Lightbulb, name: 'Idea', cost: 55555 },
      { icon: Map, name: 'World Tour', cost: 60000 },
      { icon: Dna, name: 'DNA', cost: 66666 },
      { icon: Puzzle, name: 'Puzzle', cost: 77777 },
      { icon: Home, name: 'Our Home', cost: 80000 },
      { icon: Globe, name: 'Our World', cost: 90000 },
      { icon: Rocket, name: 'To The Moon', cost: 99999 },
      { icon: Star, name: 'Universe', cost: 100000 },
    ],
  };


  const toggleMic = () => setIsMicOn(prev => !prev);
  const toggleCamera = () => setIsCameraOn(prev => !prev);

  const otherParticipants = room.participants.filter(p => p.id !== currentUser.id);
  const allParticipantsInOrder = [currentUser, ...otherParticipants];

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
                {allParticipantsInOrder.map((p) => {
                  const isCurrentUser = p.id === currentUser.id;
                  return (
                    <div key={p.id} className="relative group aspect-square flex flex-col items-center justify-center gap-2 bg-muted rounded-md">
                      {isCurrentUser ? (
                        <>
                          <video ref={videoRef} className={cn("w-full h-full object-cover rounded-md", isCameraOn && hasCameraPermission ? "block" : "hidden")} autoPlay muted />
                          {(!isCameraOn || !hasCameraPermission) && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted rounded-md">
                              <VideoOff className="h-10 w-10"/>
                              <span>{ !hasCameraPermission ? "No Camera" : "Camera off" }</span>
                            </div>
                          )}
                           <div className="absolute bottom-2 left-2 right-2 p-1 bg-black/50 rounded-md text-center">
                              <span className="font-semibold text-white text-sm truncate w-full">{p.name} (You)</span>
                            </div>
                        </>
                      ) : (
                        <>
                          <Avatar className={cn(
                            "h-20 w-20 border-4 border-transparent transition-all",
                            speakingId === p.id && "border-primary shadow-lg"
                          )}>
                            <AvatarImage src={p.avatarUrl} alt={p.name} data-ai-hint="person portrait" />
                            <AvatarFallback>{p.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-semibold text-center text-sm truncate w-full px-2">{p.name}</span>
                          {!isCurrentUser && (
                            <div className="absolute top-1 right-1 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button size="icon" variant="destructive" className="h-7 w-7">
                                <ShieldX className="h-4 w-4" />
                              </Button>
                              <Button size="icon" variant="secondary" className="h-7 w-7">
                                <VolumeX className="h-4 w-4" />
                              </Button>
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
                    <PopoverContent className="w-80 p-0" align="end">
                       <Tabs defaultValue="common">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="common">Common</TabsTrigger>
                            <TabsTrigger value="premium">Premium</TabsTrigger>
                            <TabsTrigger value="couple">Couple</TabsTrigger>
                          </TabsList>
                           <ScrollArea className="h-64">
                            <TabsContent value="common" className="p-2">
                                <div className="grid grid-cols-4 gap-2">
                                    {gifts.common.map((g) => (
                                        <div key={g.name} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary cursor-pointer">
                                            <g.icon className="h-8 w-8 text-primary" />
                                            <span className="text-xs text-center">{g.name}</span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Gem className="h-3 w-3" />
                                                <span>{g.cost}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                             <TabsContent value="premium" className="p-2">
                                <div className="grid grid-cols-4 gap-2">
                                    {gifts.premium.map((g) => (
                                        <div key={g.name} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary cursor-pointer">
                                            <g.icon className="h-8 w-8 text-yellow-500" />
                                            <span className="text-xs text-center">{g.name}</span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Gem className="h-3 w-3" />
                                                <span>{g.cost.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                             <TabsContent value="couple" className="p-2">
                                <div className="grid grid-cols-4 gap-2">
                                    {gifts.couple.map((g) => (
                                        <div key={g.name} className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-secondary cursor-pointer">
                                            <g.icon className="h-8 w-8 text-red-500" />
                                            <span className="text-xs text-center">{g.name}</span>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Gem className="h-3 w-3" />
                                                <span>{g.cost.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>
                          </ScrollArea>
                        </Tabs>
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

