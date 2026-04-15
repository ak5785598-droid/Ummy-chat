'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { DESIGN_TOKENS } from '@/lib/design-tokens';
import { 
  Compass, 
  Loader, 
  Sparkles, 
  Plus, 
  Heart, 
  MessageCircle, 
  Share2, 
  MoreHorizontal,
  Flame,
  Globe,
  Crown,
  History
} from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase, useUser, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, limit, orderBy, where, Timestamp, doc, increment } from 'firebase/firestore';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import Image from 'next/image';
import { PublishMomentDialog } from '@/components/publish-moment-dialog';
import { MomentCommentsSheet } from '@/components/moment-comments-sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeColorMeta } from '@/components/theme-color-meta';

/**
 * Discovery Dimension - Post Of The Day
 * Featuring a cosmic theme and 24h social feed.
 */
export function DiscoverViewGlossy() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [showPublish, setShowPublish] = useState(false);
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [selectedMomentUser, setSelectedMomentUser] = useState<string | undefined>();

  // Filter moments from last 24 hours
  const discoveryQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    return query(
      collection(firestore, 'moments'),
      where('createdAt', '>=', yesterday), // Only show posts from last 24h
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore]);

  const { data: moments, isLoading } = useCollection(discoveryQuery);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F4F7FE] font-sans">
      <ThemeColorMeta color="#ffffff" />
      
      {/* FIXED GLOSSY HEADER */}
      <header className="sticky top-0 z-[100] w-full bg-white/70 backdrop-blur-3xl border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] px-6 py-5 shrink-0">
        <div className="flex flex-col items-center max-w-lg mx-auto">
          <h1 className="text-[26px] font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            MOMENT OF DAY
          </h1>
          <div className="flex items-center gap-3 mt-2">
            <div className="h-[1px] w-12 bg-slate-200" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Ummy Discovery</p>
            <div className="h-[1px] w-12 bg-slate-200" />
          </div>
        </div>
      </header>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pb-32">
        <main className="px-4 py-8 space-y-8 max-w-lg mx-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
              <div className="relative">
                <Loader className="h-10 w-10 text-slate-300 animate-spin" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Syncing Frequencies...</p>
            </div>
          ) : (
            <>
              {moments?.map((moment, idx) => (
                <MomentCard 
                  key={moment.id} 
                  moment={moment} 
                  index={idx} 
                  onOpenComments={(id, username) => {
                    setSelectedMomentId(id);
                    setSelectedMomentUser(username);
                  }}
                />
              ))}

              {(!moments || moments.length === 0) && (
                <div className="py-24 text-center space-y-4 opacity-30 flex flex-col items-center">
                  <Compass className="h-16 w-16 text-slate-400" />
                  <div className="space-y-1">
                    <p className="font-headline font-black uppercase text-lg text-slate-900">Silence in the Galaxy</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Share the first moment of the day</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating Post Button (Flaming Heart) */}
      <button 
        onClick={() => setShowPublish(true)}
        className="fixed bottom-24 right-6 z-[100] h-16 w-16 bg-slate-900 rounded-full flex items-center justify-center shadow-xl border-2 border-white/20 active:scale-95 transition-all group"
      >
        <Plus className="h-8 w-8 text-white" />
      </button>

      <PublishMomentDialog open={showPublish} onOpenChange={setShowPublish} />

      <MomentCommentsSheet 
        momentId={selectedMomentId} 
        open={!!selectedMomentId} 
        onOpenChange={(open) => !open && setSelectedMomentId(null)}
        momentUsername={selectedMomentUser}
      />
    </div>
  );
}

function MomentCard({ moment, index, onOpenComments }: { moment: any, index: number, onOpenComments: (id: string, user: string) => void }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(moment.likes || 0);

  const handleLike = async () => {
    if (!firestore || !user) return;
    setLiked(!liked);
    setLikesCount((prev: number) => liked ? prev - 1 : prev + 1);
    
    try {
      await updateDocumentNonBlocking(doc(firestore, 'moments', moment.id), {
        likes: increment(liked ? -1 : 1)
      });
    } catch (e) {
      console.error("Like error:", e);
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="bg-white border-white shadow-xl rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-14 w-14 border border-slate-100 shadow-sm">
                  <AvatarImage src={moment.avatarUrl} className="object-cover" />
                  <AvatarFallback className="bg-slate-100 font-black text-slate-300">{moment.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-white text-slate-900 shadow-sm">
                  Lv.{moment.userLevel || 1}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-black text-[15px] text-slate-900 tracking-tight">{moment.username}</span>
                  <div className="px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1">
                    <span className="text-[10px]">🇮🇳</span>
                    <Globe className="h-2 w-2 text-slate-400" />
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  {moment.createdAt ? formatDistanceToNow(moment.createdAt.toDate(), { addSuffix: true }) : 'Calculating...'}
                </p>
              </div>
            </div>
            
            <button className="h-10 w-10 flex items-center justify-center rounded-full text-slate-300 hover:text-slate-900 transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-7 pb-5">
            <p className="text-slate-600 text-[14px] leading-relaxed font-medium">
              {moment.content}
            </p>
          </div>

          {/* Image */}
          {moment.imageUrl && (
            <div className="relative aspect-auto min-h-[300px] w-full bg-slate-50 border-y border-slate-50">
              <Image 
                src={moment.imageUrl} 
                alt="Moment content"
                layout="responsive"
                width={720}
                height={720}
                className="object-contain max-h-[600px]"
              />
            </div>
          )}

          {/* Actions */}
          <div className="p-5 px-7 flex items-center justify-between border-t border-slate-50 bg-slate-50/30">
            <div className="flex items-center gap-8">
              <button 
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 transition-all active:scale-125",
                  liked ? "text-red-500" : "text-slate-300 hover:text-red-500"
                )}
              >
                <Heart className={cn("h-6 w-6", liked && "fill-current")} />
                <span className="text-xs font-black">{likesCount}</span>
              </button>

              <button 
                onClick={() => onOpenComments(moment.id, moment.username)}
                className="flex items-center gap-2 text-slate-300 hover:text-slate-900 transition-colors active:scale-95"
              >
                <MessageCircle className="h-6 w-6" />
                <span className="text-xs font-black">{moment.commentsCount || 0}</span>
              </button>
            </div>

            <button className="text-slate-300 hover:text-slate-900 transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default DiscoverViewGlossy;
