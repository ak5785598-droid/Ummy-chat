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
      <DialogContent className="max-w-[440px] bg-gradient-to-b from-[#3D0B04] via-[#2A0502] to-[#1A0502] border-[#C19A5B]/30 text-white rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border-2">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
        
        {/* Header with Title and Gold Accents */}
        <div className="relative pt-8 pb-4 px-10 text-center border-b border-[#C19A5B]/20">
          {/* Close Button */}
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 z-50 p-1.5 bg-[#5D160A]/50 hover:bg-[#5D160A] rounded-full border border-[#C19A5B]/30 transition-all active:scale-95 group"
          >
            <X className="h-4 w-4 text-[#E8C27E] opacity-70 group-hover:opacity-100" />
          </button>

          <div className="inline-flex flex-col items-center">
            <h2 className="text-3xl font-black italic uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-[#F9E58A] via-[#E8C27E] to-[#B38D4F] drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              Room Missions
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#C19A5B]/50" />
              <p className="text-[10px] text-[#E8C27E]/60 font-black uppercase tracking-[0.3em]">Daily Rewards</p>
              <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#C19A5B]/50" />
            </div>
          </div>
        </div>

        <ScrollArea className="h-[420px] px-6 py-4 relative z-10 scrollbar-hide">
          <div className="space-y-3 pb-10">
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
                    "relative p-3 rounded-[1.5rem] border transition-all duration-300 overflow-hidden",
                    isClaimed 
                      ? "bg-[#1A0502]/50 border-white/5 opacity-50" 
                      : "bg-gradient-to-r from-[#5D160A] to-[#3D0B04] border-[#C19A5B]/20 shadow-inner"
                  )}
                >
                  <div className="flex items-center gap-4 relative z-10">
                    {/* Icon Box */}
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#8B3A1C] to-[#4D1209] border border-[#C19A5B]/30 flex items-center justify-center p-2 shadow-lg shrink-0">
                      <CategoryIcon className="h-full w-full text-[#F9E58A]" strokeWidth={2.5} />
                    </div>

                    {/* Task Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={cn(
                        "text-[13px] font-black uppercase tracking-tight leading-tight mb-1 line-clamp-2",
                        isClaimed ? "text-[#E8C27E]/40" : "text-white"
                      )}>
                        {task.title}
                      </h4>
                      
                      {/* Reward Badge */}
                      <div className="flex items-center gap-1.5 py-0.5">
                        <div className="p-0.5 rounded-full bg-yellow-500/20">
                          <GoldCoinIcon className="h-3 w-3" />
                        </div>
                        <span className="text-[11px] font-black text-[#F9E58A]">{task.reward.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Action Section */}
                    <div className="flex flex-col items-center justify-center gap-1.5 shrink-0 min-w-[70px]">
                      {isClaimed ? (
                        <div className="h-8 w-8 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                      ) : isAchieved ? (
                        <button
                          onClick={() => onClaim(task.id)}
                          className="w-full h-8 rounded-full bg-gradient-to-b from-[#F9E58A] via-[#E8C27E] to-[#B38D4F] text-[#4D1209] font-black text-[10px] uppercase shadow-[0_3px_0_#6B4E2E] active:translate-y-[2px] active:shadow-none transition-all hover:brightness-110"
                        >
                          Claim
                        </button>
                      ) : (
                        <div className="relative h-8 w-full rounded-full bg-[#1A0502] border border-[#C19A5B]/30 flex items-center justify-center px-2 overflow-hidden">
                          {/* Inner Progress Fill */}
                          <div 
                            className="absolute left-0 top-0 h-full bg-gradient-to-b from-[#F9E58A] to-[#B38D4F] opacity-20 transition-all duration-1000"
                            style={{ width: `${percentage}%` }}
                          />
                          <span className="text-[10px] font-black text-[#E8C27E] relative z-10 tabular-nums">
                            {progress}/{task.target}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Decorative Border Glow for Unclaimed Completed Tasks */}
                  {isAchieved && !isClaimed && (
                    <div className="absolute inset-0 border-2 border-yellow-500/30 rounded-[1.5rem] animate-pulse pointer-events-none" />
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
