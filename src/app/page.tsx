import { AppLayout } from '@/components/layout/app-layout';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserCard } from '@/components/user-card';
import { RecommendationsForm } from '@/components/recommendations-form';
import { getPopularUsers, getPopularRooms } from '@/lib/mock-data';
import { ChatRoomCard } from '@/components/chat-room-card';

export default function Home() {
  const popularUsers = getPopularUsers();
  const popularRooms = getPopularRooms();

  return (
    <AppLayout>
      <div className="space-y-8">
        <section className="space-y-4 rounded-lg bg-card p-6 shadow-sm">
          <h1 className="font-headline text-3xl md:text-4xl font-bold tracking-tight">
            Find Your Vibe, Find Your People
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Tell us what you're into, and our AI will suggest the perfect chat rooms for you to join. Start connecting with your community today!
          </p>
          <RecommendationsForm />
        </section>
        
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-semibold">Popular Anchors</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {popularUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl font-semibold">Popular Rooms</h2>
            <Button variant="link" asChild>
              <Link href="/rooms">
                See All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {popularRooms.map((room) => (
              <ChatRoomCard key={room.id} room={room} />
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
