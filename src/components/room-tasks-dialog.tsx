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
  CheckCircle2, 
  Circle, 
  Trophy, 
  TrendingUp, 
  Zap, 
  Mic, 
  Users, 
  Gift, 
  Share2, 
  UserPlus,
  X,
  Lock
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
  onClaim
}: RoomTasksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#1a1c23]/90 backdrop-blur-2xl border-white/5 text-white rounded-[2rem] p-0 overflow-hidden shadow-2xl transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Close Button (Cut Menu Fix) */}
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute top-6 right-6 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-all active:scale-90"
        >
          <X className="h-5 w-5 text-white/50" />
        </button>

        <DialogHeader className="p-8 pb-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/20 p-3 rounded-2xl border border-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <Trophy className="h-7 w-7 text-yellow-500" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Room Missions</DialogTitle>
              <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.2em] mt-0.5">Complete & Sync Rewards</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[480px] px-8 pb-8 relative z-10 scrollbar-hide">
          <div className="space-y-4 pb-12">
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
                    "relative p-5 rounded-[1.75rem] border transition-all duration-500 overflow-hidden group",
                    isClaimed 
                      ? "bg-white/5 border-white/5 opacity-60" 
                      : isAchieved
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-white/5 border-white/5 hover:border-white/20 shadow-lg"
                  )}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-500 group-hover:scale-105 shrink-0",
                      isClaimed ? "bg-white/5 text-white/20" : 
                      isAchieved ? "bg-green-500/20 text-green-500" : "bg-white/10 text-white/70"
                    )}>
                      <CategoryIcon className="h-7 w-7" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className={cn(
                          "text-[12px] font-black uppercase tracking-tight leading-tight transition-colors truncate pr-2",
                          isClaimed ? "text-white/40" : isAchieved ? "text-green-500" : "text-white"
                        )}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full border border-white/5 shrink-0">
                          <GoldCoinIcon className="h-3 w-3" />
                          <span className="text-[10px] font-black text-yellow-500">+{task.reward.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-1000 ease-out",
                              isClaimed ? "bg-white/10" : isAchieved ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" : "bg-primary"
                            )}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-white/30 whitespace-nowrap min-w-[35px] text-right tabular-nums">
                          {progress}/{task.target}{task.unit ? ` ${task.unit}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* ACTION BUTTON (CLAIM FEATURE) */}
                    <div className="pl-2 shrink-0">
                      {isClaimed ? (
                        <div className="flex flex-col items-center gap-1">
                          <CheckCircle2 className="h-7 w-7 text-white/20" />
                          <span className="text-[8px] font-black uppercase opacity-20">Synced</span>
                        </div>
                      ) : isAchieved ? (
                        <Button
                          size="sm"
                          onClick={() => onClaim(task.id)}
                          className="h-9 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-[10px] uppercase shadow-lg shadow-green-900/40 hover:scale-105 active:scale-95 transition-all animate-pulse"
                        >
                          Claim
                        </Button>
                      ) : (
                        <div className="h-10 w-10 rounded-full border-2 border-white/5 flex items-center justify-center bg-white/5">
                          <Zap className="h-4 w-4 text-white/20" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Shimmer Effect for Ongoing Tasks */}
                  {!isAchieved && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-shimmer pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
