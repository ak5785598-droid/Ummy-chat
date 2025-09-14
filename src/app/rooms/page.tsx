import { ChatRoomCard } from '@/components/chat-room-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getAllRooms } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { LifeBuoy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/app-layout';

export default function RoomsPage() {
  const allRooms = getAllRooms();
  const officialHelpRoom = allRooms.find(
    (room) => room.slug === 'official-help-room'
  );
  const otherRooms = allRooms.filter(
    (room) => room.slug !== 'official-help-room'
  );

  const categories = ['Popular', 'Game', 'Chat', 'Singing', 'Battle'];

  const roomsByCategory = (category: string) => {
    if (category === 'Popular') {
      return [...otherRooms]
        .sort((a, b) => b.participants.length - a.participants.length)
        .slice(0, 8);
    }
    return otherRooms.filter((room) => room.category === category);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="space-y-4">
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            Explore Rooms
          </h1>
          <p className="text-muted-foreground">
            Find a room that matches your vibe.
          </p>
        </header>

        {officialHelpRoom && (
          <Card className="bg-secondary/50">
            <CardHeader>
              <CardTitle className="font-headline">Need Help?</CardTitle>
            </CardHeader>
            <CardContent>
              <Link href={`/rooms/${officialHelpRoom.slug}`}>
                <div className="flex items-center justify-between rounded-lg border bg-card p-4 transition-colors hover:bg-secondary">
                  <div className="flex items-center gap-3">
                    <LifeBuoy className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">{officialHelpRoom.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Get live support from our team.
                      </p>
                    </div>
                  </div>
                  <Button>Join Room</Button>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="Popular" className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="border-none">
              {categories.map((category) => (
                <TabsTrigger key={category} value={category} className="px-6">
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {categories.map((category) => (
            <TabsContent key={category} value={category}>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {roomsByCategory(category).map((room) => (
                  <ChatRoomCard key={room.id} room={room} />
                ))}
              </div>
              {roomsByCategory(category).length === 0 && (
                <div className="py-16 text-center text-muted-foreground">
                  <p>No rooms available in this category yet.</p>
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}
