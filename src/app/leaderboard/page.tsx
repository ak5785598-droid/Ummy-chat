'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Trophy, Crown, TrendingUp, Heart, Loader } from 'lucide-react';

/**
 * Global Leaderboard.
 * Real-time rankings for coins and popularity, guarded by auth to prevent permission errors.
 */
export default function LeaderboardPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  // REAL QUERIES FOR PRODUCTION DATA
  const richUsersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('wallet.coins', 'desc'), limit(20));
  }, [firestore, user]);

  const charmUsersQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'users'), orderBy('stats.followers', 'desc'), limit(20));
  }, [firestore, user]);

  const topRoomsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'chatRooms'), limit(20));
  }, [firestore, user]);

  const { data: richUsers, isLoading: isLoadingRich } = useCollection(richUsersQuery);
  const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(charmUsersQuery);
  const { data: rooms, isLoading: isLoadingRooms } = useCollection(topRoomsQuery);

  const RankingList = ({ items, type, isLoading }: { items: any[] | null, type: 'rich' | 'charm' | 'room', isLoading: boolean }) => {
    if (isLoading) return <div className="flex justify-center py-20"><Loader className="animate-spin text-primary" /></div>;
    if (!items || items.length === 0) return <div className="text-center py-20 text-muted-foreground">No real data available yet. Start your journey to be #1!</div>;

    const top3 = items.slice(0, 3);
    const others = items.slice(3);

    return (
      <div className="space-y-4">
        <div className="flex justify-center items-end gap-4 py-8">
          {/* Silver - 2nd */}
          {top3[1] && (
            <div className="flex flex-col items-center order-1 mt-8">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-slate-300">
                  <AvatarImage 
                    src={type === 'room' ? `https://picsum.photos/seed/${top3[1].id}/200` : (top3[1].avatarUrl || top3[1].profile?.avatarUrl)} 
                    alt={top3[1].username || top3[1].name || "Runner Up"}
                  />
                  <AvatarFallback>{(top3[1].username || top3[1].name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -left-2 bg-slate-300 text-slate-800 rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-white">2</div>
              </div>
              <p className="font-bold mt-2 text-sm">{top3[1].username || top3[1].name}</p>
            </div>
          )}
          
          {/* Gold - 1st */}
          {top3[0] && (
            <div className="flex flex-col items-center order-2">
              <Crown className="text-yellow-400 h-8 w-8 mb-1 animate-bounce" />
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-yellow-400 shadow-xl">
                  <AvatarImage 
                    src={type === 'room' ? `https://picsum.photos/seed/${top3[0].id}/200` : (top3[0].avatarUrl || top3[0].profile?.avatarUrl)} 
                    alt={top3[0].username || top3[0].name || "Champion"}
                  />
                  <AvatarFallback>{(top3[0].username || top3[0].name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -left-2 bg-yellow-400 text-yellow-900 rounded-full w-10 h-10 flex items-center justify-center font-bold border-2 border-white">1</div>
              </div>
              <p className="font-bold mt-2 text-lg">{top3[0].username || top3[0].name}</p>
            </div>
          )}

          {/* Bronze - 3rd */}
          {top3[2] && (
            <div className="flex flex-col items-center order-3 mt-8">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-amber-600">
                  <AvatarImage 
                    src={type === 'room' ? `https://picsum.photos/seed/${top3[2].id}/200` : (top3[2].avatarUrl || top3[2].profile?.avatarUrl)} 
                    alt={top3[2].username || top3[2].name || "Third Place"}
                  />
                  <AvatarFallback>{(top3[2].username || top3[2].name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -top-2 -left-2 bg-amber-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold border-2 border-white">3</div>
              </div>
              <p className="font-bold mt-2 text-sm">{top3[2].username || top3[2].name}</p>
            </div>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {others.map((item, index) => (
              <div key={item.id} className="flex items-center gap-4 p-4 border-b last:border-0 hover:bg-secondary/20 transition-colors">
                <span className="w-6 text-center font-bold text-muted-foreground">{index + 4}</span>
                <Avatar className="h-10 w-10">
                   <AvatarImage 
                     src={type === 'room' ? `https://picsum.photos/seed/${item.id}/200` : (item.avatarUrl || item.profile?.avatarUrl)} 
                     alt={item.username || item.name || "User Avatar"}
                   />
                  <AvatarFallback>{(item.username || item.name || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold">{item.username || item.name}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">ID: {item.id.substring(0, 8)}</p>
                </div>
                <div className="flex items-center gap-1 font-bold text-primary">
                  {type === 'rich' && <Trophy className="h-3 w-3" />}
                  {type === 'charm' && <Heart className="h-3 w-3" />}
                  {type === 'room' && <TrendingUp className="h-3 w-3" />}
                  {type === 'rich' ? (item.wallet?.coins || 0).toLocaleString() : type === 'charm' ? (item.stats?.followers || 0).toLocaleString() : 'Live'}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <header className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-4xl font-bold tracking-tight">Global Rankings</h1>
        </header>

        <Tabs defaultValue="rich" className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto mb-8 bg-secondary/50 rounded-full p-1 h-12">
            <TabsTrigger value="rich" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Rich</TabsTrigger>
            <TabsTrigger value="charm" className="rounded-full data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">Charm</TabsTrigger>
            <TabsTrigger value="room" className="rounded-full data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">Active</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rich"><RankingList items={richUsers} type="rich" isLoading={isLoadingRich} /></TabsContent>
          <TabsContent value="charm"><RankingList items={charmUsers} type="charm" isLoading={isLoadingCharm} /></TabsContent>
          <TabsContent value="room"><RankingList items={rooms} type="room" isLoading={isLoadingRooms} /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}