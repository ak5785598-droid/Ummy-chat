'use client';

import React, { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
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
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Discovery Dimension - Post Of The Day
 * Featuring a cosmic theme and 24h social feed.
 */
export default function DiscoverPage() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [showPublish, setShowPublish] = useState(false);

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
    <AppLayout>
      <div className="min-h-screen bg-[#0F011F] text-white font-sans relative overflow-x-hidden">
        {/* Cosmic Background Elements */}
        <div className="fixed inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/10 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20" />
        </div>

        {/* Discovery Header */}
        <header className="sticky top-0 z-50 pt-12 pb-4 px-6 bg-[#0F011F]/80 backdrop-blur-xl border-b border-white/5">
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-headline font-black italic uppercase tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 animate-pulse">
              Moment of Day
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-purple-500/50" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">Cosmic Discovery</p>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-purple-500/50" />
            </div>
          </div>
        </header>

        <main className="relative z-10 px-4 py-6 space-y-6 max-w-2xl mx-auto pb-32">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
              <div className="relative">
                <Loader className="h-10 w-10 text-purple-500 animate-spin" />
                <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-400 animate-bounce" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-purple-400/60">Calibrating Frequencies...</p>
            </div>
          ) : (
            <>
              {moments?.map((moment, idx) => (
                <MomentCard key={moment.id} moment={moment} index={idx} />
              ))}

              {(!moments || moments.length === 0) && (
                <div className="py-24 text-center space-y-4 opacity-30 flex flex-col items-center">
                  <Compass className="h-16 w-16 text-purple-500" />
                  <div className="space-y-1">
                    <p className="font-headline font-black uppercase text-lg">Silence in the Galaxy</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest">Share the first moment of the day</p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>

        {/* Floating Post Button (Flaming Heart) */}
        <button 
          onClick={() => setShowPublish(true)}
          className="fixed bottom-24 right-6 z-[100] h-16 w-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(236,72,153,0.4)] border-2 border-white/20 active:scale-90 transition-all group"
        >
          <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 rounded-full transition-opacity" />
          <Flame className="h-8 w-8 text-white fill-white animate-pulse" />
        </button>

        <PublishMomentDialog open={showPublish} onOpenChange={setShowPublish} />
      </div>
    </AppLayout>
  );
}

function MomentCard({ moment, index }: { moment: any, index: number }) {
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
      <Card className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-md">
        <CardContent className="p-0">
          {/* Header */}
          <div className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-14 w-14 border-2 border-purple-500/30">
                  <AvatarImage src={moment.avatarUrl} />
                  <AvatarFallback>{moment.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-yellow-400 to-amber-600 text-[8px] font-black px-1.5 py-0.5 rounded-full border border-black text-black">
                  Lv.68
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-headline font-black text-sm text-white tracking-tight">{moment.username}</span>
                  <div className="px-2 py-0.5 rounded-md bg-purple-500/20 border border-purple-500/30 flex items-center gap-1">
                    <span className="text-[10px]">🇮🇳</span>
                    <Globe className="h-2 w-2 text-purple-400" />
                  </div>
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                  {moment.createdAt ? formatDistanceToNow(moment.createdAt.toDate(), { addSuffix: true }) : 'Just now'}
                </p>
              </div>
            </div>
            
            <button className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-colors">
              <MoreHorizontal className="h-5 w-5 opacity-40" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-white/90 text-sm leading-relaxed font-medium">
              {moment.content}
            </p>
          </div>

          {/* Image */}
          {moment.imageUrl && (
            <div className="relative aspect-auto min-h-[300px] w-full bg-black/40">
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
          <div className="p-4 px-6 flex items-center justify-between border-t border-white/5 bg-black/20">
            <div className="flex items-center gap-8">
              <button 
                onClick={handleLike}
                className={cn(
                  "flex items-center gap-2 transition-all active:scale-125",
                  liked ? "text-pink-500" : "text-white/40"
                )}
              >
                <Heart className={cn("h-6 w-6", liked && "fill-current")} />
                <span className="text-xs font-black">{likesCount}</span>
              </button>

              <button className="flex items-center gap-2 text-white/40 hover:text-indigo-400 transition-colors">
                <MessageCircle className="h-6 w-6" />
                <span className="text-xs font-black">2.4k</span>
              </button>
            </div>

            <button className="text-white/40 hover:text-white transition-colors">
              <Share2 className="h-5 w-5" />
            </button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
