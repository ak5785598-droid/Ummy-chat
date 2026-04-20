'use client';

import React, { useState, useEffect } from 'react';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { doc, increment, setDoc, deleteDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, MoreHorizontal, ShieldAlert, Flag, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface GridMomentCardProps {
  moment: any;
  index: number;
  onOpenComments: (id: string, user: string) => void;
}

const REPORT_REASONS = [
  "Spam",
  "Harassment or Bullying",
  "Inappropriate/Adult Content",
  "Hate Speech",
  "Intellectual Property Violation",
  "Other"
];

export function GridMomentCard({ moment, index, onOpenComments }: GridMomentCardProps) {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // Like Persistence Logic
  const likeRef = firestore && user ? doc(firestore, 'moments', moment.id, 'likes', user.uid) : null;
  const { data: likeDoc } = useDoc(likeRef);
  const isLiked = !!likeDoc;

  const [localLiked, setLocalLiked] = useState(false);
  const [localLikesCount, setLocalLikesCount] = useState(moment.likes || 0);
  const [reportOpen, setReportOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  // Sync local state with DB
  useEffect(() => {
    setLocalLiked(isLiked);
  }, [isLiked]);

  useEffect(() => {
    setLocalLikesCount(moment.likes || 0);
  }, [moment.likes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !user) return;

    const newLiked = !localLiked;
    setLocalLiked(newLiked);
    setLocalLikesCount(prev => newLiked ? prev + 1 : prev - 1);

    try {
      const momentRef = doc(firestore, 'moments', moment.id);
      const userLikeRef = doc(firestore, 'moments', moment.id, 'likes', user.uid);

      if (newLiked) {
        await setDoc(userLikeRef, {
          userId: user.uid,
          createdAt: serverTimestamp()
        });
        await updateDocumentNonBlocking(momentRef, { likes: increment(1) });
      } else {
        await deleteDoc(userLikeRef);
        await updateDocumentNonBlocking(momentRef, { likes: increment(-1) });
      }
    } catch (err) {
      console.error("Like error:", err);
      setLocalLiked(!newLiked);
      setLocalLikesCount(prev => !newLiked ? prev + 1 : prev - 1);
    }
  };

  const submitReport = async () => {
    if (!firestore || !user || !selectedReason) return;
    setIsReporting(true);
    try {
      await addDoc(collection(firestore, 'reports'), {
        type: 'moment',
        targetId: moment.id,
        targetContent: moment.content || '',
        targetImageUrl: moment.imageUrl || '',
        targetAuthorId: moment.userId,
        targetAuthorName: moment.username,
        reason: selectedReason,
        reporterId: user.uid,
        reporterName: user.displayName || 'User',
        status: 'pending',
        timestamp: serverTimestamp()
      });
      toast({
        title: "Report Received",
        description: "Thank you for keeping the community safe. Our team will review this post soon.",
      });
      setReportOpen(false);
      setSelectedReason(null);
    } catch (e) {
      console.error("Report error:", e);
      toast({
        variant: "destructive",
        title: "Report Failed",
        description: "Could not submit report. Please try again.",
      });
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onOpenComments(moment.id, moment.username)}
      className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 group cursor-pointer shadow-sm active:scale-[0.98] transition-transform"
    >
      {/* Post Image */}
      {moment.imageUrl ? (
        <Image
          src={moment.imageUrl}
          alt="Moment"
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 to-slate-100 italic text-slate-400 text-center text-[10px] leading-tight">
          {moment.content?.substring(0, 50)}...
        </div>
      )}

      {/* Top Menu Trigger (Three Dots) - Overlay */}
      <div className="absolute top-2 right-2 z-20 flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white border border-white/20 active:scale-90 transition-all hover:bg-black/50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl">
            <DropdownMenuItem 
              onClick={(e) => { e.stopPropagation(); setReportOpen(true); }}
              className="text-red-600 font-bold flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4" />
              Report Post
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content Overlay */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/60 via-black/20 to-transparent flex items-end justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Avatar className="h-5 w-5 border border-white/40 shadow-sm shrink-0">
            <AvatarImage src={moment.avatarUrl} className="object-cover" />
            <AvatarFallback className="text-[6px] font-black">{moment.username?.charAt(0)}</AvatarFallback>
          </Avatar>
          <span className="text-[10px] font-bold text-white truncate drop-shadow-md">
            {moment.username}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 pr-0.5">
          <button 
            onClick={handleLike}
            className="flex items-center gap-0.5 transition-all active:scale-125"
          >
            <Heart 
              className={cn(
                "h-3.5 w-3.5 drop-shadow-md transition-colors", 
                localLiked ? "fill-red-500 text-red-500" : "text-white fill-none"
              )} 
            />
            <span className="text-[9px] font-black text-white drop-shadow-md">{localLikesCount}</span>
          </button>
        </div>
      </div>

      {/* Comments Shortcut Indicator (only if not hidden by menu) */}
      {moment.commentsCount > 0 && !reportOpen && (
         <div className="absolute top-2 left-2 bg-black/30 backdrop-blur-md rounded-full px-1.5 py-0.5 flex items-center gap-1 pointer-events-none">
            <MessageCircle className="h-2.5 w-2.5 text-white fill-white" />
            <span className="text-[8px] font-black text-white">{moment.commentsCount}</span>
         </div>
      )}

      {/* Report Dialog */}
      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent 
           onClick={(e) => e.stopPropagation()}
           className="sm:max-w-[400px] rounded-t-[2rem] sm:rounded-[2rem] border-none shadow-2xl"
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-headline font-black uppercase text-center flex items-center justify-center gap-2">
               <AlertTriangle className="h-5 w-5 text-red-500" />
               Report Post
            </DialogTitle>
            <DialogDescription className="text-center text-xs font-medium">
              Help us understand why this content should be reviewed.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2 py-4">
            {REPORT_REASONS.map((reason) => (
              <button
                key={reason}
                onClick={() => setSelectedReason(reason)}
                className={cn(
                  "w-full p-4 rounded-2xl text-left text-sm font-bold transition-all border-2",
                  selectedReason === reason 
                    ? "bg-red-50 border-red-500 text-red-700 shadow-sm" 
                    : "bg-slate-50 border-transparent text-slate-600 hover:bg-slate-100"
                )}
              >
                {reason}
              </button>
            ))}
          </div>

          <DialogFooter className="flex flex-col gap-2">
            <Button 
               disabled={!selectedReason || isReporting}
               onClick={submitReport}
               className="w-full h-12 rounded-2xl font-black uppercase tracking-tight bg-red-600 hover:bg-red-700 text-white border-none"
            >
              {isReporting ? <Loader className="h-4 w-4 animate-spin" /> : "Submit Report"}
            </Button>
            <Button 
               variant="ghost" 
               onClick={() => setReportOpen(false)}
               className="w-full text-slate-400 font-bold uppercase text-[10px]"
            >
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
