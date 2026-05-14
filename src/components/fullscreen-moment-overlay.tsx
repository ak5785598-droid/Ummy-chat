'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { 
  X, 
  Heart, 
  MessageCircle, 
  Share2, 
  Volume2, 
  VolumeX, 
  ChevronUp, 
  ChevronDown,
  Eye,
  Crown
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { doc, increment, serverTimestamp, setDoc, deleteDoc } from 'firebase/firestore';
import { useUser, useFirestore, updateDocumentNonBlocking, useDoc } from '@/firebase';

interface FullscreenMomentOverlayProps {
  moments: any[];
  initialIndex: number;
  open: boolean;
  onClose: () => void;
  onOpenComments: (id: string, user: string) => void;
}

export function FullscreenMomentOverlay({ 
  moments, 
  initialIndex, 
  open, 
  onClose,
  onOpenComments
}: FullscreenMomentOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isMuted, setIsMuted] = useState(false);
  const [direction, setDirection] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const moment = moments[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  // Like Logic
  const likeRef = firestore && user && moment ? doc(firestore, 'moments', moment.id, 'likes', user.uid) : null;
  const { data: likeDoc } = useDoc(likeRef);
  const isLiked = !!likeDoc;

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!firestore || !user || !moment) return;

    try {
      const momentRef = doc(firestore, 'moments', moment.id);
      const userLikeRef = doc(firestore, 'moments', moment.id, 'likes', user.uid);

      if (!isLiked) {
        await setDoc(userLikeRef, { userId: user.uid, createdAt: serverTimestamp() });
        await updateDocumentNonBlocking(momentRef, { likes: increment(1) });
      } else {
        await deleteDoc(userLikeRef);
        await updateDocumentNonBlocking(momentRef, { likes: increment(-1) });
      }
    } catch (err) {}
  };

  const handleSwipe = (dir: 'up' | 'down') => {
    if (dir === 'up' && currentIndex < moments.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    } else if (dir === 'down' && currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  if (!open || !moment) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center overflow-hidden touch-none"
      >
        <motion.div
          key={moment.id}
          initial={{ y: direction * 100 + '%' }}
          animate={{ y: 0 }}
          exit={{ y: -direction * 100 + '%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          onDragEnd={(_, info) => {
            if (info.offset.y < -100) handleSwipe('up');
            else if (info.offset.y > 100) handleSwipe('down');
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Media Content */}
          {moment.type === 'video' || moment.videoUrl ? (
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                src={moment.videoUrl}
                autoPlay
                loop
                muted={isMuted}
                playsInline
                className="w-full h-full object-contain md:object-cover"
              />
              {/* Mute Button */}
              <button 
                onClick={() => setIsMuted(!isMuted)}
                className="absolute top-20 right-6 z-50 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
            </div>
          ) : (
            <img 
              src={moment.imageUrl} 
              alt="Full Moment" 
              className="w-full h-full object-contain md:object-cover"
            />
          )}

          {/* Overlays */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

          {/* Close Button */}
          <button 
            onClick={onClose}
            className="absolute top-6 left-6 z-50 h-10 w-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/20"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Bottom Info Section */}
          <div className="absolute bottom-10 left-6 right-20 z-50 space-y-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-white/40 shadow-xl">
                <AvatarImage src={moment.avatarUrl} className="object-cover" />
                <AvatarFallback className="bg-slate-900 text-white font-black">{moment.username?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-black text-white text-lg drop-shadow-lg italic">{moment.username}</span>
                  <div className="px-2 py-0.5 bg-yellow-400 rounded-lg flex items-center gap-1 shadow-lg">
                    <Crown className="h-3 w-3 text-slate-900" />
                    <span className="text-[10px] font-black text-slate-900">Lv.{moment.userLevel || 1}</span>
                  </div>
                </div>
                <p className="text-white/80 text-sm font-medium line-clamp-2 drop-shadow-md pr-10">
                  {moment.content}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="absolute right-4 bottom-24 z-50 flex flex-col items-center gap-6">
            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={handleLike}
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all active:scale-125 shadow-xl border border-white/10 backdrop-blur-md",
                  isLiked ? "bg-red-500 text-white" : "bg-black/40 text-white"
                )}
              >
                <Heart className={cn("h-6 w-6", isLiked && "fill-current")} />
              </button>
              <span className="text-white text-xs font-black drop-shadow-md">{moment.likes || 0}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <button 
                onClick={() => onOpenComments(moment.id, moment.username)}
                className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-90 shadow-xl"
              >
                <MessageCircle className="h-6 w-6" />
              </button>
              <span className="text-white text-xs font-black drop-shadow-md">{moment.commentsCount || 0}</span>
            </div>

            <div className="flex flex-col items-center gap-1">
              <div className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 shadow-xl">
                <Eye className="h-5 w-5" />
              </div>
              <span className="text-white text-xs font-black drop-shadow-md">{moment.views || 0}</span>
            </div>

            <button className="h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 active:scale-90 shadow-xl">
              <Share2 className="h-5 w-5" />
            </button>
          </div>

          {/* Swipe Indicator Overlay (Only when many) */}
          {moments.length > 1 && (
            <div className="absolute inset-y-0 right-0 w-2 flex flex-col items-center justify-center gap-2 pointer-events-none opacity-20">
               {currentIndex > 0 && <ChevronUp className="h-4 w-4 text-white animate-bounce" />}
               {currentIndex < moments.length - 1 && <ChevronDown className="h-4 w-4 text-white animate-bounce" />}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
