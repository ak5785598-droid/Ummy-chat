'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Trophy, 
  Star, 
  Zap, 
  Target, 
  Gift, 
  Gamepad2, 
  CheckCircle2,
  Lock,
  Loader
} from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment, 
  serverTimestamp 
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { GoldCoinIcon } from '@/components/icons';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Quest {
  id: string;
  title: string;
  description: string;
  reward: number;
  icon: any;
  target: number;
  current: number;
  isClaimed: boolean;
}

interface DailyQuestsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DailyQuestsDialog - The gamification hub for Ummy Chat.
 * Tracks daily milestones and rewards users with Gold Coins.
 */
export function DailyQuestsDialog({ isOpen, onClose }: DailyQuestsDialogProps) {
  const { user } = useUser();
  const { userProfile } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [quests, setQuests] = useState<Quest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data for now, in a real app this comes from 'userQuests' collection
  useEffect(() => {
    if (!isOpen || !userProfile) return;
    
    // Simulate fetching daily progress
    const mockQuests: Quest[] = [
      { id: 'stay_15', title: 'Loyal Resident', description: 'Stay in any room for 15 mins', reward: 500, icon: Zap, target: 15, current: Math.min(userProfile.activityPoints || 0, 15), isClaimed: false },
      { id: 'send_gift', title: 'Generous Soul', description: 'Send at least 1 gift', reward: 1000, icon: Gift, target: 1, current: (userProfile.stats?.dailyGifts || 0) > 0 ? 1 : 0, isClaimed: false },
      { id: 'win_ludo', title: 'Ludo Master', description: 'Win 1 Ludo match', reward: 2000, icon: Gamepad2, target: 1, current: (userProfile.stats?.dailyGameWins || 0) >= 1 ? 1 : 0, isClaimed: false },
    ];
    
    setQuests(mockQuests);
    setIsLoading(false);
  }, [isOpen, userProfile]);

  const handleClaim = async (questId: string, reward: number) => {
    if (!user || !firestore) return;

    try {
      const userRef = doc(firestore, 'users', user.uid);
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      
      await updateDoc(userRef, { 'wallet.coins': increment(reward) });
      await updateDoc(profileRef, { 'wallet.coins': increment(reward) });

      setQuests(prev => prev.map(q => q.id === questId ? { ...q, isClaimed: true } : q));
      
      toast({
        title: 'Reward Claimed!',
        description: `You received ${reward.toLocaleString()} Gold Coins!`,
      });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to claim reward.' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-[#0c001a] border-white/5 rounded-[3rem] p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Daily Quests</DialogTitle>
          <DialogDescription>Complete tasks and earn rewards.</DialogDescription>
        </DialogHeader>

        <div className="relative p-8 space-y-8">
           <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-b from-primary/10 to-transparent" />
           
           <header className="flex flex-col items-center text-center space-y-3 pt-4 relative z-10">
              <div className="h-16 w-16 rounded-3xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(0,229,255,0.2)]">
                 <Trophy className="h-8 w-8 text-primary animate-bounce shadow-glow" />
              </div>
              <div>
                 <h2 className="text-2xl font-black text-white uppercase tracking-tight">Quest Center</h2>
                 <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Resetting in 14h 22m</p>
              </div>
           </header>

           <div className="space-y-4">
              {isLoading ? (
                <div className="flex justify-center py-10"><Loader className="animate-spin text-primary h-8 w-8" /></div>
              ) : quests.map((quest) => {
                const isCompleted = quest.current >= quest.target;
                return (
                  <motion.div 
                    key={quest.id}
                    layout
                    className={cn(
                      "group p-5 rounded-[2.5rem] border transition-all duration-300",
                      isCompleted ? "bg-primary/5 border-primary/20" : "bg-white/5 border-white/5"
                    )}
                  >
                     <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
                          isCompleted ? "bg-primary text-black" : "bg-white/5 text-white/40"
                        )}>
                           <quest.icon className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-1">
                           <div className="flex items-center justify-between">
                              <h3 className="text-sm font-black text-white uppercase tracking-tight">{quest.title}</h3>
                              <div className="flex items-center gap-1">
                                 <GoldCoinIcon className="h-3 w-3" />
                                 <span className="text-[10px] font-black text-primary">+{quest.reward}</span>
                              </div>
                           </div>
                           <p className="text-[10px] font-bold text-white/30 uppercase tracking-tight">{quest.description}</p>
                           
                           <div className="pt-2 flex items-center gap-3">
                              <Progress value={(quest.current / quest.target) * 100} className="h-1.5 flex-1 bg-white/5" />
                              <span className="text-[10px] font-black text-white/60 tracking-widest">{quest.current}/{quest.target}</span>
                           </div>
                        </div>
                     </div>
                     
                     {isCompleted && !quest.isClaimed && (
                       <Button 
                         onClick={() => handleClaim(quest.id, quest.reward)}
                         className="w-full mt-4 h-12 rounded-2xl bg-primary text-black font-black uppercase text-xs shadow-lg shadow-primary/20 hover:scale-[1.02]"
                       >
                          Claim Reward
                       </Button>
                     )}

                     {quest.isClaimed && (
                       <div className="w-full mt-4 h-12 rounded-2xl bg-white/5 flex items-center justify-center gap-2 border border-white/5">
                          <CheckCircle2 className="h-4 w-4 text-primary" />
                          <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Completed</span>
                       </div>
                     )}
                  </motion.div>
                );
              })}
           </div>

           <footer className="text-center pt-2">
              <p className="text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">Become an Elite Member for x2 Rewards</p>
           </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
}
