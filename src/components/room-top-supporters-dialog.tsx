'use client';

import * as React from 'react';
import { useState } from 'react';
import { 
  X, 
  Crown, 
  Coins, 
  Trophy, 
  Calendar,
  Clock
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  useFirestore, 
  useCollection, 
  useMemoFirebase 
} from '@/firebase/provider';
import { 
  collection, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';

interface RoomTopSupportersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
}

export function RoomTopSupportersDialog({ 
  open, 
  onOpenChange, 
  roomId 
}: RoomTopSupportersDialogProps) {
  const [activeTab, setActiveTab] = useState<'daily' | 'weekly'>('daily');
  const firestore = useFirestore();

  // --- QUERY DAILY SUPPORTERS ---
  const dailyQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return query(
      collection(firestore, 'chatRooms', roomId, 'topSupporters'),
      orderBy('dailyAmount', 'desc'),
      limit(50)
    );
  }, [firestore, roomId]);

  // --- QUERY WEEKLY SUPPORTERS ---
  const weeklyQuery = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return query(
      collection(firestore, 'chatRooms', roomId, 'topSupporters'),
      orderBy('weeklyAmount', 'desc'),
      limit(50)
    );
  }, [firestore, roomId]);

  const { data: dailyData = [] } = useCollection(dailyQuery);
  const { data: weeklyData = [] } = useCollection(weeklyQuery);

  // Map supporters depending on the tab
  const rawList = activeTab === 'daily' ? dailyData : weeklyData;

  // Filter out users who have 0 contribution for the selected period
  const supporters = React.useMemo(() => {
    return rawList
      .map(sup => ({
        ...sup,
        amount: activeTab === 'daily' ? (sup.dailyAmount || 0) : (sup.weeklyAmount || 0)
      }))
      .filter(sup => sup.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [rawList, activeTab]);

  const topThree = supporters.slice(0, 3);
  const others = supporters.slice(3);

  // Re-arrange top 3 for the podium layout: [2nd, 1st, 3rd]
  const podiumList = React.useMemo(() => {
    const list = [];
    if (topThree[1]) list.push({ ...topThree[1], rank: 2 });
    if (topThree[0]) list.push({ ...topThree[0], rank: 1 });
    if (topThree[2]) list.push({ ...topThree[2], rank: 3 });
    return list;
  }, [topThree]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose={true}
        className="w-full max-w-md bg-[#0a0f1d] border border-yellow-500/20 text-white rounded-3xl p-0 overflow-hidden shadow-[0_0_50px_rgba(234,179,8,0.1)] z-[3000] font-headline"
      >
        {/* PREMIUM GOLDEN PATTERN HEADER */}
        <div className="relative w-full h-[180px] bg-gradient-to-b from-[#1b1509] to-[#0a0f1d] flex flex-col items-center justify-center p-6 text-center border-b border-yellow-500/10 overflow-hidden">
          <div className="absolute -inset-10 bg-yellow-500/10 blur-3xl rounded-full" />
          
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 z-50 h-8 w-8 flex items-center justify-center rounded-full bg-black/40 border border-white/10 active:scale-95 transition-transform"
          >
            <X className="h-4 w-4 text-white/70 hover:text-white" />
          </button>

          <Trophy className="h-10 w-10 text-yellow-400 fill-current mb-2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)] animate-pulse" />
          
          <DialogTitle className="text-xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 via-yellow-400 to-yellow-600 drop-shadow-[0_2px_8px_rgba(234,179,8,0.3)]">
            Room Supporters
          </DialogTitle>
          <p className="text-[10px] text-yellow-500/60 font-semibold tracking-wider mt-1 uppercase">
            Top Givers of the Room
          </p>

          {/* TAB BUTTONS (DAILY / WEEKLY) */}
          <div className="flex bg-black/50 p-1 rounded-full border border-yellow-500/20 mt-4 relative z-10 w-[200px]">
            <button
              onClick={() => setActiveTab('daily')}
              className={cn(
                "flex-1 py-1 rounded-full text-[10px] font-black uppercase transition-all tracking-wider flex items-center justify-center gap-1",
                activeTab === 'daily' 
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/20 scale-105" 
                  : "text-white/60 hover:text-white"
              )}
            >
              <Clock className="h-3 w-3" />
              Daily
            </button>
            <button
              onClick={() => setActiveTab('weekly')}
              className={cn(
                "flex-1 py-1 rounded-full text-[10px] font-black uppercase transition-all tracking-wider flex items-center justify-center gap-1",
                activeTab === 'weekly' 
                  ? "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/20 scale-105" 
                  : "text-white/60 hover:text-white"
              )}
            >
              <Calendar className="h-3 w-3" />
              Weekly
            </button>
          </div>
        </div>

        {/* DIALOG MAIN CONTENT */}
        <div className="p-4 space-y-4">
          
          {/* PODIUM SECTION (TOP 3) */}
          {supporters.length > 0 ? (
            <div className="flex justify-center items-end gap-3 pt-6 pb-2 relative min-h-[160px]">
              {podiumList.map((sup) => {
                const isFirst = sup.rank === 1;
                const isSecond = sup.rank === 2;
                const isThird = sup.rank === 3;
                
                return (
                  <div
                    key={sup.uid}
                    className={cn(
                      "flex flex-col items-center relative transition-all duration-500",
                      isFirst ? "w-[120px] -translate-y-3 z-30 scale-110" : "w-[90px] z-20 scale-95"
                    )}
                  >
                    {/* Crown and Avatar Ring */}
                    <div className="relative">
                      {/* Premium Golden Rings */}
                      <div className={cn(
                        "absolute -inset-1 rounded-full blur-sm opacity-50",
                        isFirst ? "bg-yellow-500 animate-pulse" : isSecond ? "bg-slate-300" : "bg-amber-600"
                      )} />
                      
                      <Avatar className={cn(
                        "border-2 shadow-xl",
                        isFirst 
                          ? "h-20 w-20 border-yellow-400" 
                          : isSecond 
                            ? "h-16 w-16 border-slate-300" 
                            : "h-14 w-14 border-amber-600"
                      )}>
                        <AvatarImage src={sup.avatarUrl || ''} alt={sup.username} />
                        <AvatarFallback className="bg-slate-800 text-sm font-black text-yellow-500">
                          {sup.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Rank Crown badge */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center">
                        <Crown className={cn(
                          "h-5 w-5 drop-shadow-md",
                          isFirst ? "text-yellow-400 fill-current" : isSecond ? "text-slate-300 fill-current" : "text-amber-600 fill-current"
                        )} />
                        <span className={cn(
                          "text-[9px] font-black px-1.5 py-0.5 rounded-full border leading-none shadow-sm -mt-0.5",
                          isFirst 
                            ? "bg-yellow-500 text-black border-yellow-400" 
                            : isSecond 
                              ? "bg-slate-400 text-black border-slate-300" 
                              : "bg-amber-700 text-white border-amber-600"
                        )}>
                          {sup.rank}
                        </span>
                      </div>
                    </div>

                    {/* Name & Score */}
                    <span className="text-xs font-black text-white/95 mt-2 truncate max-w-[80px] text-center">
                      {sup.username}
                    </span>
                    <div className="flex items-center gap-0.5 mt-0.5 bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded-full">
                      <Coins className="h-2.5 w-2.5 text-yellow-400 fill-current" />
                      <span className="text-[9px] font-black text-yellow-400 leading-none">
                        {sup.amount >= 1000000 
                          ? `${(sup.amount / 1000000).toFixed(1)}M` 
                          : sup.amount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-2">
              <Trophy className="h-12 w-12 text-white/10" />
              <p className="text-sm font-black text-white/40">No supporters yet for this period</p>
              <p className="text-[10px] text-white/20 italic">Send gifts to be the first on the podium!</p>
            </div>
          )}

          {/* LIST OF OTHER SUPPORTERS (4+) */}
          {others.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-yellow-500/10">
              <span className="text-[9px] font-black uppercase text-yellow-500/40 tracking-wider">
                Rankings 4 - 50
              </span>
              
              <ScrollArea className="h-[240px] pr-2">
                <div className="space-y-1.5">
                  {others.map((sup, idx) => {
                    const rank = idx + 4;
                    return (
                      <div 
                        key={sup.uid}
                        className="flex items-center gap-3 bg-white/5 border border-white/5 rounded-2xl p-2.5 hover:bg-white/10 transition-colors"
                      >
                        {/* Rank Badge */}
                        <div className="w-6 flex items-center justify-center font-black text-xs text-white/40">
                          #{rank}
                        </div>

                        {/* Avatar */}
                        <Avatar className="h-9 w-9 border border-white/10">
                          <AvatarImage src={sup.avatarUrl || ''} alt={sup.username} />
                          <AvatarFallback className="bg-slate-800 text-xs font-black text-yellow-500">
                            {sup.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        {/* Username */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-white truncate">
                            {sup.username}
                          </p>
                          <p className="text-[9px] text-white/30 font-semibold truncate">
                            Tribe Supporter
                          </p>
                        </div>

                        {/* Amount */}
                        <div className="flex items-center gap-1 bg-yellow-500/5 px-2.5 py-1 rounded-full border border-yellow-500/10">
                          <Coins className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-[10px] font-black text-yellow-400">
                            {sup.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
