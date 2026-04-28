'use client';

import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { ROOM_TASKS, RoomTask } from "@/constants/room-tasks";
import { 
  UserPlus,
  X,
  Lock,
  ChevronLeft,
  CheckCircle2, 
  Circle, 
  Trophy, 
  TrendingUp, 
  Zap, 
  Mic, 
  Users, 
  Gift, 
  Share2
} from "lucide-react";
import { GoldCoinIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

interface RoomTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskProgress: Record<string, number>;
  achievedTasks: string[];
  claimedTasks: string[];
  onClaim: (taskId: string) => void;
  totalRoomGifts?: number;
}

const getCategoryIcon = (category: RoomTask['category']) => {
  switch (category) {
    case 'mic': return Mic;
    case 'invite': return UserPlus;
    case 'gift': return Gift;
    case 'traffic': return Users;
    case 'follow': return Users;
    case 'share': return Share2;
    default: return Trophy;
  }
};

export function RoomTasksDialog({ 
  open, 
  onOpenChange, 
  taskProgress, 
  achievedTasks, 
  claimedTasks,
  onClaim,
  totalRoomGifts = 0
}: RoomTasksDialogProps) {
  const [timeLeft, setTimeLeft] = React.useState<string>('00:00:00');

  React.useEffect(() => {
    if (!open) return;

    const calculateTimeLeft = () => {
      const now = new Date();
      const nextReset = new Date();
      nextReset.setUTCHours(24, 0, 0, 0); // Next UTC 00:00
      
      const diff = nextReset.getTime() - now.getTime();
      
      if (diff <= 0) return '00:00:00';
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      
      return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
      ].join(':');
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [open]);

  const accumulatedBonus = Math.floor(totalRoomGifts * 0.05);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        hideClose={true}
        className="w-full h-full max-w-none bg-gradient-to-br from-[#1c011e] via-[#4d0246] to-[#0d011c] border-none text-white rounded-none p-0 overflow-hidden shadow-none z-[2000]"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Room Missions</DialogTitle>
          <DialogDescription>Complete daily missions to earn rewards in the room jar.</DialogDescription>
        </DialogHeader>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
        
        {/* Floating Back Button (Top Left) */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-10 left-6 z-[100] p-3 bg-black/40 hover:bg-black/60 rounded-full border border-white/20 backdrop-blur-md transition-all active:scale-90 group shadow-2xl"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>

        <ScrollArea className="h-full px-0 relative z-10 scrollbar-hide">
          {/* GRAND MAJESTIC HERO SECTION */}
          <div className="relative w-full aspect-[3/4] flex items-center justify-center overflow-hidden bg-[#1c011e]">
             {/* Dynamic Background Effects */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,215,0,0.15)_0%,transparent_70%)] animate-pulse" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#1c011e] via-transparent to-transparent z-20" />
             <div className="absolute inset-0 bg-gradient-to-b from-[#1c011e]/60 via-transparent to-transparent z-20 h-40" />
             
             {/* MAIN ASSET: GRAND JAR */}
             <img 
                src="/images/pink_violet_golden_task_jar_1776801042241.png" 
                className="w-full h-full object-cover relative z-10 scale-105" 
                alt="Golden Jar" 
             />

             {/* OVERLAID FLOATING TITLE - COIN TREE STYLE */}
             <div className="absolute top-28 left-0 right-0 z-[30] text-center px-4">
                <h1 className="text-5xl font-black italic uppercase tracking-tighter text-white drop-shadow-[0_5px_0_#B38D4F] [text-shadow:0_0_20px_rgba(179,141,79,0.8)] [webkit-text-stroke:2px_#B38D4F]">
                   Room<br/>Missions
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-transparent via-[#F9E58A] to-transparent mx-auto mt-2 blur-[1px]" />
             </div>

             {/* HOST BONUS DESCRIPTION */}
             <div className="absolute bottom-6 left-0 right-0 z-[30] text-center px-10">
                <div className="bg-black/30 backdrop-blur-sm py-2 px-4 rounded-2xl border border-white/5 inline-block">
                  <p className="text-[11px] font-bold text-pink-100/80 leading-snug max-w-[260px] mx-auto drop-shadow-md">
                     The Task Jar allows the room host to get a <span className="text-[#F9E58A] font-black">5% bonus</span> of the total Gold Coins consumed in the room.
                  </p>
                </div>
             </div>
          </div>

          {/* ACCUMULATED BONUS PANEL */}
          <div className="px-6 mb-4 mt-1">
             <div className="bg-gradient-to-br from-[#805e26] via-[#B38D4F] to-[#5e4113] p-[1.5px] rounded-2xl shadow-lg">
                <div className="bg-[#4d0246] rounded-2xl p-4 text-center relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-20" />
                   <div className="flex items-center justify-center gap-2 mb-1">
                      <GoldCoinIcon className="h-7 w-7 drop-shadow-glow" />
                      <span className="text-3xl font-black text-[#F9E58A] tabular-nums tracking-tighter">
                         {accumulatedBonus.toLocaleString()}
                      </span>
                   </div>
                   <p className="text-[9px] font-black uppercase tracking-[0.1em] text-[#E8C27E]/50">Accumulated Bonus Gold Coins</p>
                </div>
             </div>
          </div>

          <div className="px-6 space-y-4 pb-20">
             {/* SECTION HEADER */}
             <div className="flex items-center justify-between px-2 mb-2">
                <div className="flex items-center gap-2">
                   <div className="bg-[#B38D4F] h-4 w-1 rounded-full" />
                   <span className="text-sm font-black uppercase tracking-widest text-[#F9E58A]">Daily Missions</span>
                </div>
                <div className="bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                   <span className="text-[10px] font-black text-pink-200 tabular-nums">End in {timeLeft}</span>
                </div>
             </div>
            {ROOM_TASKS.map((task) => {
              const progress = taskProgress[task.id] || 0;
              const isAchieved = achievedTasks.includes(task.id) || progress >= task.target;
              const isClaimed = claimedTasks.includes(task.id);
              const CategoryIcon = getCategoryIcon(task.category);
              const percentage = Math.min((progress / task.target) * 100, 100);

              return (
                <div 
                  key={task.id} 
                  className={cn(
                    "relative p-5 rounded-[2rem] border-2 transition-all duration-300 overflow-hidden shadow-xl group",
                    isClaimed 
                      ? "bg-black/20 border-white/5 opacity-50" 
                      : "bg-gradient-to-br from-[#4d1209] via-[#330c06] to-[#1a0502] border-[#C19A5B]/30"
                  )}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    {/* Icon Box */}
                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#8B3A1C] to-[#4D1209] border border-[#C19A5B]/40 flex items-center justify-center p-3 shadow-2xl shrink-0">
                      <CategoryIcon className="h-full w-full text-[#F9E58A]" strokeWidth={2.5} />
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "text-[14px] font-black uppercase tracking-tight leading-tight mb-2 line-clamp-2",
                        isClaimed ? "text-[#E8C27E]/40" : "text-white"
                      )}>
                        {task.title}
                      </h4>
                      
                      {/* Reward Badge */}
                      <div className="flex items-center gap-2 py-0.5">
                        <GoldCoinIcon className="h-4 w-4" />
                        <span className="text-sm font-black text-[#F9E58A]">{task.reward.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 min-w-[80px]">
                      {isClaimed ? (
                        <div className="h-10 w-10 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center shadow-inner">
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                      ) : isAchieved ? (
                        <button
                          onClick={() => onClaim(task.id)}
                          className="w-full py-2.5 rounded-2xl bg-gradient-to-b from-[#F9E58A] via-[#E8C27E] to-[#B38D4F] text-[#4D1209] font-black text-[12px] uppercase shadow-[0_4px_0_#6B4E2E] active:translate-y-[2px] active:shadow-none transition-all hover:brightness-110 active:scale-95"
                        >
                          Claim
                        </button>
                      ) : (
                        <button
                          className="w-full py-2.5 rounded-2xl bg-gradient-to-b from-white/10 to-transparent text-[#E8C27E] border border-[#C19A5B]/30 font-black text-[12px] uppercase transition-all hover:bg-white/5 active:scale-95 flex flex-col items-center leading-none"
                        >
                          <span>Go</span>
                          <span className="text-[8px] opacity-70 mt-1 font-bold">{progress}/{task.target}</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Decorative Progress Glow */}
                  {!isClaimed && !isAchieved && (
                    <div 
                      className="absolute bottom-0 left-0 h-1 bg-[#F9E58A] opacity-20 transition-all duration-1000"
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Footer Accent */}
        <div className="h-4 w-full bg-gradient-to-t from-[#C19A5B]/10 to-transparent absolute bottom-0" />
      </DialogContent>
    </Dialog>
  );
}
