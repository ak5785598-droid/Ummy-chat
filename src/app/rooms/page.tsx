
'use client';

import { useMemo } from 'react';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Compass, Loader, Sparkles, LayoutPanelTop, Crown, LifeBuoy, ArrowRight, Zap } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { useCollection, useFirestore, useUser, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { RecommendationsForm } from '@/components/recommendations-form';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RoomsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const firestore = useFirestore();

  const allRoomsQuery = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return query(collection(firestore, 'chatRooms'), orderBy('createdAt', 'desc'), limit(50));
  }, [firestore, isUserLoading]);

  const { data: roomsData, isLoading: isRoomsLoading } = useCollection(allRoomsQuery);

  const configRef = useMemoFirebase(() => {
    if (!firestore || isUserLoading) return null;
    return doc(firestore, 'appConfig', 'global');
  }, [firestore, isUserLoading]);
  
  const { data: config } = useDoc(configRef);

  const activeBanner = config?.activeBanners?.[0];

  const categories = ['Popular', 'Game', 'Chat', 'Singing', 'Battle'];

  const roomsByCategory = (category: string) => {
    if (!roomsData) return [];
    if (category === 'Popular') return roomsData.filter((r: any) => r.id !== 'official-help-room').slice(0, 8);
    return roomsData.filter((room: any) => room.category === category && room.id !== 'official-help-room');
  };

  const myRooms = useMemo(() => {
    if (!roomsData || !user) return [];
    return roomsData.filter((r: any) => r.ownerId === user.uid && r.id !== 'official-help-room');
  }, [roomsData, user]);

  return (
    <AppLayout>
      <div className="space-y-10 pb-20">
        
        {/* OFFICIAL BANNER SECTION (1536x681 Aspect) */}
        <section className="relative overflow-hidden rounded-[2rem] shadow-2xl border border-white/10 group">
          <Link href={activeBanner?.link || '#'}>
            <div className="relative aspect-[1536/681] w-full">
              <Image
                src={activeBanner?.imageUrl || "https://picsum.photos/seed/ummy-banner/1536/681"}
                alt="Official Ummy Event"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
                data-ai-hint="vibrant party"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-8 md:bottom-12 md:left-12 space-y-4">
                 <div className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-primary/20">
                    <Crown className="h-4 w-4" /> Official Event
                 </div>
                 <h2 className="text-3xl md:text-5xl font-black font-headline text-white drop-shadow-lg">
                   {activeBanner?.title || 'Grand Opening:'} <br/><span className="text-primary">Ummy Music Fest</span>
                 </h2>
                 <p className="text-white/60 text-sm md:text-lg max-w-xl font-body">
                   Join 10,000+ users in the main stage. Send special gifts to win a unique entry wave!
                 </p>
              </div>
            </div>
          </Link>
        </section>

        {/* FEATURED OFFICIAL HELP ROOM & MATCH */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden border-none bg-gradient-to-br from-[#1a1a2e] to-[#16213e] shadow-2xl relative group">
             <div className="absolute top-0 right-0 p-6 z-10">
                <Badge className="bg-primary hover:bg-primary shadow-xl animate-pulse">LIVE SUPPORT</Badge>
             </div>
             <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8 relative z-10">
                <div className="relative h-40 w-40 shrink-0">
                  <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                  <Avatar className="h-full w-full border-4 border-primary shadow-2xl">
                    <AvatarImage src="https://picsum.photos/seed/official-help/400" />
                    <AvatarFallback>UM</AvatarFallback>
                  </Avatar>
                </div>
                <div className="space-y-4 text-center md:text-left">
                   <div className="flex items-center justify-center md:justify-start gap-2">
                     <LifeBuoy className="h-6 w-6 text-primary" />
                     <h2 className="text-3xl font-black font-headline text-white italic uppercase tracking-tighter">Official Help Room</h2>
                   </div>
                   <p className="text-white/60 font-body text-lg leading-snug max-w-md">
                     New here? Join our official community hub to meet people, learn the app, and get real-time support from the Ummy Team.
                   </p>
                   <Button asChild size="lg" className="rounded-full px-10 shadow-xl shadow-primary/20 hover:scale-105 transition-transform group">
                      <Link href="/rooms/official-help-room" className="flex items-center gap-2">
                         Join Official Hub <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Link>
                   </Button>
                </div>
             </CardContent>
             <div className="absolute bottom-0 right-0 opacity-10 pointer-events-none">
                <LifeBuoy className="h-64 w-64 -mb-10 -mr-10" />
             </div>
          </Card>

          <Card className="border-primary/20 bg-primary/5 rounded-[2rem] flex flex-col shadow-inner overflow-hidden relative">
            <CardContent className="p-6 flex-1 flex flex-col justify-center relative z-10">
               <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-6 w-6 text-primary animate-bounce" />
                  <h2 className="font-headline text-xl font-bold">Vibe Match</h2>
               </div>
               <p className="text-xs text-muted-foreground mb-6">Let AI find your perfect tribe based on your current mood.</p>
               <Button asChild variant="outline" className="rounded-full border-primary/20 hover:bg-primary/10 transition-all font-bold group">
                  <Link href="/match" className="flex items-center justify-between w-full">
                     Start Matching <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
               </Button>
            </CardContent>
            <div className="absolute -bottom-4 -right-4 opacity-5 pointer-events-none">
              <Sparkles className="h-32 w-32 text-primary" />
            </div>
          </Card>
        </section>

        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-headline text-4xl font-bold tracking-tight flex items-center gap-2">
              <Compass className="h-8 w-8 text-primary" />
              Explore Rooms
            </h1>
            <p className="text-muted-foreground">Real-time voice communities. Join the vibe.</p>
          </div>
          <CreateRoomDialog />
        </header>

        {/* My Rooms Section */}
        {myRooms.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-semibold flex items-center gap-2">
               <LayoutPanelTop className="h-5 w-5 text-primary" /> My Managed Rooms
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {myRooms.map((room: any) => (
                <ChatRoomCard key={room.id} room={{ ...room, id: room.id } as any} />
              ))}
            </div>
          </section>
        )}

        {/* Categorized Rooms Section */}
        <Tabs defaultValue="Popular" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="border-none h-14 bg-muted/30 p-1.5 rounded-full mb-8">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="px-10 rounded-full h-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-xl font-bold">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {isRoomsLoading ? (
            <div className="flex justify-center py-20"><Loader className="h-10 w-10 animate-spin text-primary" /></div>
          ) : (
            categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    {roomsByCategory(category).map((room: any) => (
                      <ChatRoomCard key={room.id} room={{ ...room, id: room.id } as any} />
                    ))}
                  </div>
                  {roomsByCategory(category).length === 0 && (
                    <div className="py-24 text-center text-muted-foreground bg-muted/10 rounded-[3rem] border-2 border-dashed">
                      <p className="mb-4">No live rooms in this category. Be the leader!</p>
                      <CreateRoomDialog />
                    </div>
                  )}
                </TabsContent>
              ))
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}

function Avatar({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full ${className}`}>{children}</div>;
}

function AvatarImage({ src }: { src: string }) {
  return <img className="aspect-square h-full w-full" src={src} />;
}

function AvatarFallback({ children }: { children: React.ReactNode }) {
  return <div className="flex h-full w-full items-center justify-center rounded-full bg-muted">{children}</div>;
}
