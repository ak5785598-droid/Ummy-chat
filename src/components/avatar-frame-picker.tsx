'use client';

import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { AvatarFrame } from '@/components/avatar-frame';
import { AVATAR_FRAMES } from '@/constants/avatar-frames';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Check, X, Shield, Sparkles, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AvatarFramePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  currentFrameId: string | null;
  avatarUrl?: string;
  username?: string;
}

export function AvatarFramePicker({ 
  open, 
  onOpenChange, 
  userId, 
  currentFrameId,
  avatarUrl,
  username
}: AvatarFramePickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentFrameId);
  const [isEquipping, setIsEquipping] = useState(false);
  const firestore = useFirestore();
  const { toast } = useToast();

  const frames = Object.values(AVATAR_FRAMES);

  const handleEquip = async () => {
    if (!firestore || !userId) return;
    setIsEquipping(true);
    
    try {
      const userProfileRef = doc(firestore, 'users', userId, 'profile', userId);
      await setDocumentNonBlocking(userProfileRef, {
        inventory: {
          activeFrame: selectedId || 'None'
        }
      }, { merge: true });

      toast({ 
        title: selectedId ? 'Frame Equipped' : 'Frame Removed',
        description: selectedId ? `You are now using ${AVATAR_FRAMES[selectedId].name}` : 'Your avatar is back to normal.'
      });
      onOpenChange(false);
    } catch (error) {
      toast({ variant: 'destructive', title: 'Equip Failed', description: 'Could not update your frame.' });
    } finally {
      setIsEquipping(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px] bg-[#020617] border-slate-800 text-white rounded-t-[3rem] p-0 overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] border-2">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 via-transparent to-transparent pointer-events-none" />
        
        {/* Header with Live Preview */}
        <div className="relative pt-10 pb-8 px-8 text-center border-b border-white/5 bg-white/[0.02]">
          <button 
            onClick={() => onOpenChange(false)}
            className="absolute top-6 right-6 p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-slate-400" />
          </button>

          <div className="flex flex-col items-center">
            <div className="relative mb-6">
               {/* Pulsing Light behind Preview */}
               <div className="absolute inset-[-20%] bg-purple-500/20 blur-3xl animate-pulse rounded-full" />
               
               <AvatarFrame frameId={selectedId} size="xl" className="scale-125">
                 <div className="w-full h-full bg-slate-800 flex items-center justify-center overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt={username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-10 w-10 text-slate-500" />
                    )}
                 </div>
               </AvatarFrame>
            </div>

            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">
              Identity Dimension
            </h2>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1">
              Select your elite visual aura
            </p>
          </div>
        </div>

        {/* Frame Selection Grid */}
        <ScrollArea className="h-[420px] px-6 py-4 relative z-10 scrollbar-hide">
          <div className="grid grid-cols-4 gap-3 pb-20">
            {/* "None" Option */}
            <div 
              onClick={() => setSelectedId(null)}
              className={cn(
                "relative aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 group",
                !selectedId 
                  ? "bg-white/10 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]" 
                  : "bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-800/60"
              )}
            >
              <div className="h-12 w-12 rounded-full border-2 border-dashed border-slate-700 flex items-center justify-center group-hover:border-slate-500 transition-colors">
                <X className="h-6 w-6 text-slate-600 group-hover:text-slate-400" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 group-hover:text-slate-300">Default</span>
              {!selectedId && (
                <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-lg">
                  <Check className="h-3 w-3 text-black stroke-[3]" />
                </div>
              )}
            </div>

            {frames.map((frame) => (
              <div 
                key={frame.id}
                onClick={() => setSelectedId(frame.id)}
                className={cn(
                  "relative aspect-square rounded-2xl border transition-all flex flex-col items-center justify-center p-1 group overflow-visible",
                  selectedId === frame.id 
                    ? "bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border-purple-400/50 shadow-[0_0_25px_rgba(168,85,247,0.2)]" 
                    : "bg-slate-900/60 border-white/5 hover:border-white/20 hover:bg-slate-800/60"
                )}
              >
                 <div className="relative z-10 w-full h-full flex items-center justify-center">
                   <div className={cn(
                     "transition-transform duration-300",
                     selectedId === frame.id ? "scale-90" : "scale-75 group-hover:scale-80"
                   )}>
                     <AvatarFrame frameId={frame.id} size="sm">
                       <div className="w-full h-full bg-slate-800/50 backdrop-blur-sm" />
                     </AvatarFrame>
                   </div>
                 </div>

                 <div className="absolute bottom-2 left-0 right-0 px-1 text-center z-20">
                   <span className={cn(
                     "text-[8px] font-bold uppercase tracking-tight line-clamp-1 transition-colors",
                     selectedId === frame.id ? "text-purple-300" : "text-slate-500 group-hover:text-slate-400"
                   )}>
                      {frame.name}
                   </span>
                 </div>

                 {selectedId === frame.id && (
                    <div className="absolute -top-1 -right-1 bg-purple-500 rounded-full p-0.5 shadow-lg z-30">
                      <Check className="h-3 w-3 text-white stroke-[3]" />
                    </div>
                 )}
                 
                 {/* Tier Indicator Dots */}
                 <div className="absolute top-2 left-2 flex gap-0.5 z-20">
                    <div className={cn(
                      "w-1 h-1 rounded-full",
                      frame.tier === 'legendary' ? "bg-orange-500 shadow-[0_0_4px_#f97316]" :
                      frame.tier === 'mythic' ? "bg-purple-500 shadow-[0_0_4px_#a855f7]" :
                      frame.tier === 'luxury' ? "bg-blue-500 shadow-[0_0_4px_#3b82f6]" : "bg-slate-600"
                    )} />
                 </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="p-6 bg-white/[0.02] border-t border-white/5 flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1 rounded-2xl h-14 bg-transparent border-white/10 text-slate-300 hover:bg-white/5 uppercase font-black text-xs tracking-widest"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 rounded-2xl h-14 bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 uppercase font-black text-xs tracking-widest shadow-xl shadow-purple-900/20"
            onClick={handleEquip}
            disabled={isEquipping || selectedId === currentFrameId}
          >
            {isEquipping ? 'Syncing...' : 'Equip Frame'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
