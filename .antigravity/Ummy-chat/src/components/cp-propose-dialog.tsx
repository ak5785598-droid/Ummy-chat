'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, Sparkles, Star, Zap } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp, setDoc, arrayUnion } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CPProposeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    uid: string;
    username: string;
    avatarUrl: string;
  };
}

/**
 * CPProposeDialog - A romantic UI for proposing a special bond.
 * Supports CP (Couple Partner), BFF, and Love relationships.
 */
export function CPProposeDialog({ isOpen, onClose, targetUser }: CPProposeDialogProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<'CP' | 'BFF' | 'Love'>('Love');
  const [isSent, setIsSent] = useState(false);

  const handlePropose = async () => {
    if (!user || !firestore) return;

    try {
      // 1. Create a proposal notification/request in Firestore
      const proposalId = `${user.uid}_to_${targetUser.uid}`;
      const proposalRef = doc(firestore, 'proposals', proposalId);
      
      await setDoc(proposalRef, {
        fromUid: user.uid,
        toUid: targetUser.uid,
        type: selectedType,
        status: 'pending',
        timestamp: serverTimestamp()
      });

      // 2. Local feedback UI
      setIsSent(true);
      toast({ title: 'Proposal Sent!', description: `Awaiting response from ${targetUser.username}.` });
      
      setTimeout(() => {
        onClose();
        setIsSent(false);
      }, 3000);
    } catch (err) {
      console.error("Propose failed:", err);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send proposal.' });
    }
  };

  const types = [
    { id: 'Love', label: 'True Love', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
    { id: 'CP', label: 'CP Partner', icon: Sparkles, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
    { id: 'BFF', label: 'Eternal BFF', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px] bg-[#0f0019] border-white/5 rounded-[3rem] p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>Propose Relationship</DialogTitle>
          <DialogDescription>Start a special bond with another user.</DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8 relative">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-rose-500/20 to-transparent pointer-none" />
          
          <div className="flex flex-col items-center text-center space-y-4 pt-4">
             <div className="flex items-center gap-4 relative">
                <Avatar className="h-16 w-16 border-2 border-white/10 shadow-2xl">
                   <AvatarImage src={targetUser.avatarUrl} />
                   <AvatarFallback>{(targetUser.username || 'U').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="bg-rose-500 p-2 rounded-full shadow-lg relative z-10">
                   <Heart className="h-5 w-5 text-white animate-pulse fill-current" />
                </div>
                <div className="h-16 w-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                   <Sparkles className="h-6 w-6 text-white/40" />
                </div>
             </div>
             
             <div className="space-y-1">
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Express Your Feelings</h2>
                <p className="text-xs text-white/40 font-bold uppercase tracking-widest">To {targetUser.username}</p>
             </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
             {types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id as any)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-3xl border-2 transition-all active:scale-95 group",
                    selectedType === type.id 
                      ? `${type.bg} ${type.border} border-white/20` 
                      : "bg-white/5 border-transparent hover:bg-white/[0.08]"
                  )}
                >
                   <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center", type.bg)}>
                      <type.icon className={cn("h-5 w-5", type.color)} />
                   </div>
                   <div className="text-left flex-1">
                      <p className="text-sm font-black text-white uppercase tracking-tight">{type.label}</p>
                      <p className="text-[10px] text-white/30 font-bold uppercase">Special Badge & Entrance</p>
                   </div>
                   <div className={cn("h-4 w-4 rounded-full border-2 border-white/20", selectedType === type.id && "bg-rose-500 border-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]")} />
                </button>
             ))}
          </div>

          <Button 
            onClick={handlePropose}
            disabled={isSent}
            className="w-full h-16 rounded-[2rem] bg-gradient-to-r from-rose-600 to-indigo-600 text-white font-black text-lg uppercase tracking-tight shadow-xl shadow-rose-600/20 active:scale-95 transition-all hover:scale-[1.02]"
          >
             {isSent ? "Sent with Love!" : "Send Proposal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
