'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { Crown, ChevronLeft, HelpCircle, Clock, Loader, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';

const CircleAvatar = ({ src, fallback, size = "md", color = "blue" }: { src?: string, fallback: string, size?: "sm" | "md" | "lg", color?: string }) => {
  const sizes = { sm: "h-14 w-14", md: "h-20 w-20", lg: "h-24 w-24" };
  const glows: Record<string, string> = {
    blue: "border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.4)]",
    purple: "border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]",
    yellow: "border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.5)]"
  };

  return (
    <div className={cn("relative flex items-center justify-center rounded-full border-2 bg-slate-900/50", sizes[size], glows[color])}>
      <Avatar className="h-full w-full rounded-full">
        <AvatarImage src={src} className="object-cover" />
        <AvatarFallback className="bg-slate-950 text-white font-bold">{fallback}</AvatarFallback>
      </Avatar>
    </div>
  );
};

const LiveTimer = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center justify-center gap-2 py-3 border-y border-white/5 bg-white/5 my-4">
      <Clock className="h-3 w-3 text-cyan-400 animate-pulse" />
      <span className="text-[10px] font-mono text-cyan-100/40 tracking-widest uppercase">
        RESETS: <span className="text-cyan-400 font-bold">{time}</span> (GMT+5:30)
      </span>
    </div>
  );
};

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'games'>((searchParams.get('type') as any) || 'rich');
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile: me } = useUserProfile(user?.uid);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const activeQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    let coll = rankingType === 'rooms' ? 'chatRooms' : 'users';
    let field = rankingType === 'rich' ? 'wallet.dailySpent' : 'stats.dailyGiftsReceived';
    return query(collection(firestore, coll), orderBy(field, 'desc'), limit(50));
  }, [firestore, rankingType]);

  const { data: activeItems, isLoading } = useCollection(activeQuery);

  if (!mounted) return null;

  return (
    <AppLayout>
      <div className="min-h-screen bg-[#02040a] text-white flex flex-col relative overflow-hidden">
        {/* Cosmic Background Design */}
        <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-600/20 via-purple-600/5 to-transparent -z-10" />
        <div className="absolute top-[10%] right-[-5%] w-72 h-72 bg-cyan-500/10 blur-[120px] rounded-full -z-10" />

        <header className="p-6 pt-10">
          <div className="flex items-center justify-between mb-8">
            <Link href="/rooms" className="p-2 bg-white/5 rounded-xl border border-white/10"><ChevronLeft className="h-6 w-6 text-cyan-400" /></Link>
            <h1 className="text-xl font-black uppercase tracking-widest italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-white">Hall of Fame</h1>
            <HelpCircle className="h-5 w-5 opacity-20" />
          </div>

          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-around w-full bg-slate-900/80 backdrop-blur-xl p-1 rounded-2xl border border-white/10">
              {['rich', 'charm', 'games', 'rooms'].map((tab) => (
                <button key={tab} onClick={() => setRankingMode(tab as any)} 
                  className={cn("flex-1 text-[10px] font-black uppercase py-3 rounded-xl transition-all", 
                  rankingType === tab ? "bg-cyan-500 text-black shadow-[0_0_20px_rgba(34,211,238,0.4)]" : "text-white/40")}>
                  {tab === 'rich' ? 'Honor' : tab === 'charm' ? 'Charm' : tab === 'games' ? 'Game' : 'Room'}
                </button>
              ))}
            </div>
            <div className="bg-cyan-500/10 border border-cyan-400/20 px-6 py-1 rounded-full">
              <span className="text-[9px] font-black text-cyan-400 tracking-[0.4em]">DAILY</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
          {isLoading ? (
            <div className="flex flex-col items-center py-40 gap-4">
              <Loader className="animate-spin text-cyan-500 h-8 w-8" />
              <p className="text-[10px] font-bold text-cyan-400/60 uppercase tracking-widest">Loading Galaxy...</p>
            </div>
          ) : (
            <div className="px-4">
              {/* Podium Section */}
              <div className="flex items-end justify-center gap-2 pt-12 pb-6">
                {activeItems?.[1] && (
                  <div className="flex-1 flex flex-col items-center">
                    <CircleAvatar src={activeItems[1].avatarUrl} fallback="2" color="blue" />
                    <div className="mt-2 text-center"><p className="text-[10px] font-bold truncate w-20">{activeItems[1].username}</p></div>
                  </div>
                )}
                {activeItems?.[0] && (
                  <div className="flex-1 flex flex-col items-center -translate-y-4 scale-110">
                    <Crown className="h-8 w-8 text-yellow-400 mb-1 animate-bounce" />
                    <CircleAvatar src={activeItems[0].avatarUrl} fallback="1" size="lg" color="yellow" />
                    <div className="mt-2 text-center"><p className="text-xs font-black text-yellow-400 truncate w-24 uppercase">{activeItems[0].username}</p></div>
                  </div>
                )}
                {activeItems?.[2] && (
                  <div className="flex-1 flex flex-col items-center">
                    <CircleAvatar src={activeItems[2].avatarUrl} fallback="3" color="purple" />
                    <div className="mt-2 text-center"><p className="text-[10px] font-bold truncate w-20">{activeItems[2].username}</p></div>
                  </div>
                )}
              </div>

              <LiveTimer />

              {/* Others List */}
              <div className="space-y-3">
                {activeItems?.slice(3).map((item, index) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-lg font-black text-white/10 w-6 italic">{index + 4}</span>
                    <CircleAvatar src={item.avatarUrl} fallback="U" size="sm" color="purple" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-white/90 uppercase">{item.username || 'User'}</p>
                    </div>
                    <div className="text-cyan-400 font-bold text-sm flex items-center gap-1">
                      {item.wallet?.dailySpent || 0} <GoldCoinIcon className="h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Footer Profile */}
        <footer className="fixed bottom-6 left-4 right-4 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-3xl p-4 flex items-center justify-between shadow-2xl">
          <div className="flex items-center gap-3">
            <CircleAvatar src={me?.avatarUrl} fallback="U" size="sm" color="blue" />
            <div>
              <p className="font-black text-xs uppercase">{me?.username || 'Player'}</p>
              <p className="text-[10px] text-cyan-400 font-bold">SYCNED</p>
            </div>
          </div>
          <div className="bg-green-500/20 px-3 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
            <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-green-500">LIVE</span>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
