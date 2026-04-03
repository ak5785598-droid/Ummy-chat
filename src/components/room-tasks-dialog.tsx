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
  UserPlus 
} from "lucide-react";
import { GoldCoinIcon } from "@/components/icons";

interface RoomTasksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskProgress: Record<string, number>;
  completedTasks: string[];
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

export function RoomTasksDialog({ open, onOpenChange, taskProgress, completedTasks }: RoomTasksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-black/40 backdrop-blur-xl border-white/10 text-white rounded-[2rem] p-0 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <DialogHeader className="p-6 pb-2 relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/20 p-2 rounded-2xl">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Room Missions</DialogTitle>
              <p className="text-[10px] text-white/50 font-bold uppercase tracking-widest">Complete & sync rewards</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[450px] px-6 pb-6 relative z-10">
          <div className="space-y-3 pb-4">
            {ROOM_TASKS.map((task) => {
              const progress = taskProgress[task.id] || 0;
              const isCompleted = completedTasks.includes(task.id) || progress >= task.target;
              const CategoryIcon = getCategoryIcon(task.category);
              const percentage = Math.min((progress / task.target) * 100, 100);

              return (
                <div 
                  key={task.id} 
                  className={cn(
                    "relative p-4 rounded-3xl border transition-all duration-500 overflow-hidden group",
                    isCompleted 
                      ? "bg-white/5 border-green-500/30 opacity-70" 
                      : "bg-white/5 border-white/5 hover:border-white/20"
                  )}
                >
                  {/* Subtle Background Glow */}
                  <div className={cn(
                    "absolute -right-4 -top-4 w-16 h-16 blur-2xl opacity-10 transition-opacity",
                    isCompleted ? "bg-green-500" : "bg-primary"
                  )} />

                  <div className="flex items-center gap-4 relative z-10">
                    <div className={cn(
                      "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-500 group-hover:scale-110",
                      isCompleted ? "bg-green-500/20 text-green-500" : "bg-white/10 text-white/70"
                    )}>
                      <CategoryIcon className="h-6 w-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className={cn(
                          "text-[11px] font-black uppercase tracking-tight leading-tight transition-colors",
                          isCompleted ? "text-green-500" : "text-white"
                        )}>
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-1 bg-black/20 px-2 py-0.5 rounded-full border border-white/5">
                          <GoldCoinIcon className="h-2.5 w-2.5" />
                          <span className="text-[10px] font-black text-yellow-500">+{task.reward.toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Progress 
                          value={percentage} 
                          className="h-1.5 bg-white/5" 
                        />
                        <span className="text-[9px] font-bold text-white/40 whitespace-nowrap min-w-[30px] text-right">
                          {progress}/{task.target}{task.unit ? ` ${task.unit}` : ''}
                        </span>
                      </div>
                    </div>

                    <div className="pl-2">
                      {isCompleted ? (
                        <CheckCircle2 className="h-6 w-6 text-green-500 animate-in zoom-in duration-300" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-white/10 flex items-center justify-center">
                          <Zap className="h-3 w-3 text-white/20" />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Scrolling Highlight Effect */}
                  {!isCompleted && (
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
