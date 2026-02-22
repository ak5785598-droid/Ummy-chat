'use client';

import { useMemo } from 'react';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { LifeBuoy, Loader, Compass, Zap, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/app-layout';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { RecommendationsForm } from '@/components/recommendations-form';
import type { Room } from '@/lib/types';

export default function RoomsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // Real Firestore data for All Rooms
  const allRoomsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'chatRooms'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const { data: roomsData, isLoading } = useCollection(allRoomsQuery);

  const categories = ['Popular', 'Game', 'Chat', 'Singing', 'Battle'];

  const roomsByCategory = (category: string) => {
    if (!roomsData) return [];
    if (category === 'Popular') return roomsData.slice(0, 8);
    return roomsData.filter((room: any) => room.category === category);
  };

  const myRooms = useMemo(() => {
    if (!roomsData || !user) return [];
    return roomsData.filter((r: any) => r.ownerId === user.uid);
  }, [roomsData, user]);

  return (
    <AppLayout>
      <div className="space-y-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-headline text-3xl font-bold tracking-tight flex items-center gap-2">
              <Compass className="h-8 w-8 text-primary" />
              Explore Rooms
            </h1>
            <p className="text-muted-foreground">
              Real-time voice rooms. Connect with people instantly.
            </p>
          </div>
          <CreateRoomDialog />
        </header>

        {/* AI Recommendations Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h2 className="font-headline text-2xl font-semibold">AI Recommendations</h2>
          </div>
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Find Your Tribe</CardTitle>
              <CardDescription>Our AI analyzes live room topics to find your perfect match.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecommendationsForm />
            </CardContent>
          </Card>
        </section>

        {/* My Rooms Section */}
        {myRooms.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-headline text-2xl font-semibold">My Rooms</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {myRooms.map((room: any) => (
                <ChatRoomCard key={room.id} room={{
                    ...room,
                    slug: room.id,
                    title: room.name,
                    topic: room.description,
                    participants: [], // Real count handled in card
                    messages: [],
                    coverUrl: `https://picsum.photos/seed/${room.id}/400/225`
                } as any} />
              ))}
            </div>
          </section>
        )}

        {/* Categorized Rooms Section */}
        <Tabs defaultValue="Popular" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="border-none h-12 bg-muted/50 p-1 rounded-full mb-6">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="px-8 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center py-20">
               <Loader className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            categories.map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {roomsByCategory(category).map((room: any) => (
                      <ChatRoomCard key={room.id} room={{
                        ...room,
                        slug: room.id,
                        title: room.name,
                        topic: room.description,
                        participants: [],
                        messages: [],
                        coverUrl: `https://picsum.photos/seed/${room.id}/400/225`
                      } as any} />
                    ))}
                  </div>
                  {roomsByCategory(category).length === 0 && (
                    <div className="py-16 text-center text-muted-foreground bg-muted/20 rounded-xl">
                      <p>No real rooms active in this category. Be the first to create one!</p>
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
