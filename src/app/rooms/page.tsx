import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { ChatRoomCard } from '@/components/chat-room-card';
import { getAllRooms } from '@/lib/mock-data';

export default function RoomsPage() {
  const allRooms = getAllRooms();

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="font-headline text-3xl font-bold tracking-tight">
            All Rooms
          </h1>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {allRooms.map((room) => (
            <ChatRoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>
    </div>
  );
}
