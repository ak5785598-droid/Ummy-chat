'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ChatRoomCard } from '@/components/chat-room-card';
import { Loader, Search, Plus, Trophy, Users, Heart, MessageCircle, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/app-layout';
import { CreateRoomDialog } from '@/components/create-room-dialog';
import { UserSearchDialog } from '@/components/user-search-dialog';
import { useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { collection, query, limit, orderBy } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

/**
 * High-Fidelity Home / Discovery Hub.
 * Re-engineered to match the "Popular" grid layout exactly.
 * Includes a persistent "Official Help" frequency at the apex of the grid.
 * "Me" section now displays followed rooms at the top.
 */
export default function RoomsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Popular' | 'Me'>('Popular');

  const roomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'chatRooms'), 
      orderBy('participantCount', 'desc'),
      limit(50)
    );
  }, [firestore, user]);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(
      collection(firestore, 'users', user.uid, 'followingRooms'),
      orderBy('followedAt', 'desc'),
      limit(20)
    );
  }, [firestore, user]);

  const { data: roomsData, isLoading: isRoomsLoading } = useCollection(roomsQuery);
  const { data: followedRooms, isLoading: isFollowingLoading } = useCollection(followingQuery);

  const discoveryBanner = PlaceHolderImages.find(img => img.id === 'discovery-banner');

  // Elite Help Room Protocol: Ensures Ummy Official Help is always first.
  const displayRooms = useMemo(() => {
    const helpRoom: any = {
      id: 'ummy-help-center',
      roomNumber: '0000',
      title: 'Ummy Official Help',
      topic: 'Ask any app related question quick and fast.',
      category: 'Chat',
      coverUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1000',
      ownerId: 'official-support-bot',
      participantCount: 99,
      isOfficial: true
    };

    if (!roomsData) return [helpRoom];
    // Filter out the help room if it already exists in data to avoid duplicates
    return [helpRoom, ...roomsData.filter(r => r.id !== helpRoom.id)];
  }, [roomsData]);

  const CategoryCard = ({ title, label, gradient, onClick }: { title: string, label: string, gradient: string, onClick?: () => void }) => (
    <div 
      onClick={onClick}
      className={cn(
      "relative flex-1 min-w-0 rounded-2xl h-24 overflow-hidden border-2 border-white/20 shadow-lg flex flex-col items-center justify-center gap-1 group active:scale-95 transition-all cursor-pointer",
      gradient
    )}>
       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
       <span className="text-white font-black text-[10px] uppercase tracking-widest drop-shadow-md z-10">{label}</span>
       <div className="bg-white/20 backdrop-blur-md px-3 py-0.5 rounded-full z-10">
          <p className="text-[8px] font-black text-white uppercase">{title}</p>
       </div>
       <div className="absolute -bottom-2 -right-2 opacity-20 rotate-12">
          {title === 'Ranking' && <Trophy className="h-16 w-16 text-white" />}
          {title === 'Family' && <Users className="h-16 w-16 text-white" />}
          {title === 'CP' && <Heart className="h-16 w-16 text-white" />}
       </div>
    </div>
  );

  return (
    <AppLayout>
      <div className="min-h-full bg-[#f8f9fa] flex flex-col space-y-6 pb-32 font-headline">
        {/* Top Header Navigation */}
        <header className="flex items-center justify-between px-6 pt-6 bg-white shrink-0">
          <div className="flex items-center gap-8">
            <CreateRoomDialog 
              trigger={
                <button 
                  className={cn(
                    "text-xl font-black uppercase italic transition-colors relative",
                    activeTab === 'Me' ? "text-gray-900" : "text-gray-400"
                  )}
                >
                  Me
                  {activeTab === 'Me' && (
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-primary rounded-full" />
                  )}
                </button>
              }
            />
            <div className="relative">
              <button 
                onClick={() => setActiveTab('Popular')}
                className={cn(
                  "text-2xl font-black uppercase italic tracking-tighter transition-colors",
                  activeTab === 'Popular' ? "text-gray-900" : "text-gray-400"
                )}
              >
                Popular
              </button>
              {activeTab === 'Popular' && (
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-[#00E5FF] rounded-full" />
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
             <UserSearchDialog />
             <CreateRoomDialog iconOnly />
          </div>
        </header>

        <div className="px-4 space-y-6 overflow-y-auto no-scrollbar flex-1">
          {activeTab === 'Popular' ? (
            <>
              {/* Top Category Row */}
              <div className="flex gap-2">
                 <CategoryCard 
                   title="Ranking" 
                   label="Ranking" 
                   gradient="bg-gradient-to-br from-orange-400 to-yellow-600" 
                   onClick={() => router.push('/leaderboard')}
                 />
                 <CategoryCard title="Family" label="Family" gradient="bg-gradient-to-br from-blue-400 to-indigo-600" />
                 <CategoryCard title="CP" label="CP" gradient="bg-gradient-to-br from-pink-400 to-purple-600" />
              </div>

              {/* Grid View */}
              {isRoomsLoading && !roomsData ? (
                <div className="flex justify-center py-20"><Loader className="animate-spin text-primary h-8 w-8" /></div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                  {displayRooms.map((room: any, index: number) => (
                    <React.Fragment key={room.id}>
                      <ChatRoomCard room={room} variant="modern" />
                      {index === 3 && (
                        <div className="col-span-2 my-2 rounded-[1.5rem] overflow-hidden relative h-28 shadow-xl border-2 border-white/20 group active:scale-[0.98] transition-all cursor-pointer">
                           {discoveryBanner && (
                             <Image 
                               src={discoveryBanner.imageUrl} 
                               alt="Discovery Banner" 
                               fill 
                               className="object-cover group-hover:scale-105 transition-transform duration-700"
                               data-ai-hint={discoveryBanner.imageHint}
                             />
                           )}
                           <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent flex flex-col justify-center px-8">
                              <h4 className="text-white font-black uppercase italic text-xl tracking-tighter leading-none drop-shadow-lg">Tribe Events</h4>
                              <p className="text-white/80 font-bold uppercase text-[8px] tracking-[0.3em] mt-1 drop-shadow-md">Global Frequency Sync</p>
                           </div>
                           <div className="absolute top-1/2 right-6 -translate-y-1/2">
                              <div className="h-10 w-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30">
                                 <ArrowRight className="h-5 w-5 text-white" />
                              </div>
                           </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* "Me" Section - Followed Rooms at the Top */
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between px-2">
                <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">Followed Rooms</h2>
                <CreateRoomDialog 
                  trigger={
                    <button className="text-[10px] font-black uppercase text-primary bg-primary/10 px-3 py-1 rounded-full">
                      Create My Room
                    </button>
                  }
                />
              </div>

              {isFollowingLoading ? (
                <div className="flex justify-center py-10"><Loader className="animate-spin text-primary h-6 w-6" /></div>
              ) : !followedRooms || followedRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-white rounded-[2rem] border-2 border-dashed border-gray-100">
                   <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center">
                      <Heart className="h-8 w-8 text-gray-200" />
                   </div>
                   <div className="space-y-1">
                      <p className="font-black uppercase italic text-gray-400">No Followed Tribes</p>
                      <p className="text-[10px] text-gray-300 uppercase font-bold max-w-[180px]">Follow your favorite frequencies to see them here.</p>
                   </div>
                   <button 
                     onClick={() => setActiveTab('Popular')}
                     className="bg-primary text-white font-black uppercase text-[10px] px-6 py-2 rounded-full shadow-lg"
                   >
                     Explore Popular
                   </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-6">
                  {followedRooms.map((follow: any) => (
                    <ChatRoomCard 
                      key={follow.roomId} 
                      room={{ 
                        id: follow.roomId, 
                        title: follow.roomName, 
                        coverUrl: follow.coverUrl, 
                        participantCount: 0 // Count will sync from standard discovery logic if needed
                      } as any} 
                      variant="modern" 
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}