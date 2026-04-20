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
  History,
  Camera
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
import { useDoc } from '@/firebase';
import { DiscoverViewGlossy } from './discover-view-glossy';
import { GridMomentCard } from '@/components/grid-moment-card';
import { ThemeColorMeta } from '@/components/theme-color-meta';

export default function DiscoverView() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [showPublish, setShowPublish] = useState(false);
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [selectedMomentUser, setSelectedMomentUser] = useState<string | undefined>();
  const [activeTab, setActiveTab] = useState<'recommend' | 'following'>('recommend');
  
  const configRef = useMemo(() => firestore ? doc(firestore, 'appConfig', 'global') : null, [firestore]);
  const { data: config } = useDoc(configRef);
  const theme = config?.appTheme || 'CLASSIC';

  // Social Graph: Get users that the current user follows
  const followingListQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return query(collection(firestore, 'followers'), where('followerId', '==', user.uid));
  }, [firestore, user]);
  const { data: followingData } = useCollection(followingListQuery);
  const followingIds = useMemo(() => followingData?.map(f => f.followingId) || [], [followingData]);

  // Global "Recommend" Feed (Last 24h)
  const recommendQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    return query(
      collection(firestore, 'moments'),
      where('createdAt', '>=', yesterday),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore]);

  // Personalized "Following" Feed
  const followingMomentsQuery = useMemoFirebase(() => {
    if (!firestore || followingIds.length === 0) return null;
    return query(
      collection(firestore, 'moments'),
      where('userId', 'in', followingIds.slice(0, 30)), // Firestore 'in' limit is 30
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [firestore, followingIds]);

  const { data: recommendMoments, isLoading: isLoadingRecommend } = useCollection(recommendQuery);
  const { data: followingMoments, isLoading: isLoadingFollowing } = useCollection(followingMomentsQuery);

  const activeMoments = activeTab === 'recommend' ? recommendMoments : followingMoments;
  const isLoading = activeTab === 'recommend' ? isLoadingRecommend : isLoadingFollowing;

  if (theme === 'GLOSSY') {
    return <DiscoverViewGlossy />;
  }

  return (
    <AppLayout>
      <ThemeColorMeta color={DESIGN_TOKENS.appBackground === '#FF91B5' ? '#FF91B5' : '#ffffff'} />
      <div className={cn(
        "h-[100dvh] flex flex-col relative overflow-hidden text-slate-800 font-sans",
        DESIGN_TOKENS.appBackground === '#FF91B5' ? "bg-[#FF91B5]" : "bg-white"
      )}>
        {/* Subtle Background Elements */}
        {DESIGN_TOKENS.appBackground !== '#FF91B5' && (
          <div className="fixed inset-0 z-0">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-slate-50 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-slate-50/50 blur-[100px] rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>
        )}

        {/* Discovery Header - Fixed Height & Tabs */}
        <header className={cn(
          "shrink-0 pt-12 pb-4 px-6 z-50 border-b border-black/5 bg-white/80 backdrop-blur-xl",
          DESIGN_TOKENS.appBackground === '#FF91B5' && "bg-[#FF91B5] border-white/10"
        )}>
          <div className="flex items-center justify-between max-w-2xl mx-auto relative h-10">
            {/* Tabs Container */}
            <div className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
              <button 
                onClick={() => setActiveTab('recommend')}
                className="relative group py-2"
              >
                <span className={cn(
                  "text-lg font-black tracking-tight transition-colors",
                  activeTab === 'recommend' ? "text-slate-900" : "text-slate-400"
                )}>
                  Recommend
                </span>
                {activeTab === 'recommend' && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" 
                  />
                )}
              </button>
              
              <button 
                onClick={() => setActiveTab('following')}
                className="relative group py-2"
              >
                <span className={cn(
                  "text-lg font-black tracking-tight transition-colors",
                  activeTab === 'following' ? "text-slate-900" : "text-slate-400"
                )}>
                  Following
                </span>
                {activeTab === 'following' && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full" 
                  />
                )}
              </button>
            </div>

            {/* Post Button (Top Right) */}
            <button 
              onClick={() => setShowPublish(true)}
              className="ml-auto h-10 w-10 flex items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 active:scale-95 transition-all shadow-sm"
            >
              <Camera className="h-5 w-5 fill-primary" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar relative z-10 px-2 py-4 pb-40">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
              <div className="relative">
                <Loader className="h-10 w-10 text-slate-200 animate-spin" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Syncing Frequencies...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
              {activeMoments?.map((moment: any, idx: number) => (
                <GridMomentCard 
                  key={moment.id} 
                  moment={moment} 
                  index={idx} 
                  onOpenComments={(id, username) => {
                    setSelectedMomentId(id);
                    setSelectedMomentUser(username);
                  }}
                />
              ))}

              {(!activeMoments || activeMoments.length === 0) && (
                <div className="col-span-2 py-24 text-center space-y-4 opacity-30 flex flex-col items-center">
                  <Compass className="h-16 w-16 text-slate-400" />
                  <div className="space-y-1">
                    <p className="font-headline font-black uppercase text-lg">Silence in the Galaxy</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      {activeTab === 'following' ? 'Connect with users to see their vibes' : 'Share the first moment of the day'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        <PublishMomentDialog open={showPublish} onOpenChange={setShowPublish} />

        <MomentCommentsSheet 
          momentId={selectedMomentId} 
          open={!!selectedMomentId} 
          onOpenChange={(open) => !open && setSelectedMomentId(null)}
          momentUsername={selectedMomentUser}
        />
      </div>
    </AppLayout>
  );
}
