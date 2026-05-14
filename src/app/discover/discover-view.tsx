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
import { FullscreenMomentOverlay } from '@/components/fullscreen-moment-overlay';

export default function DiscoverView() {
  const firestore = useFirestore();
  const { user } = useUser();
  const [showPublish, setShowPublish] = useState(false);
  const [selectedMomentId, setSelectedMomentId] = useState<string | null>(null);
  const [selectedMomentUser, setSelectedMomentUser] = useState<string | undefined>();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<'photos' | 'reels'>('photos');
  // Defaulting to recommend logic as before, without changing the core functionality
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

  const rawMoments = activeTab === 'recommend' ? recommendMoments : followingMoments;
  const filteredMoments = useMemo(() => {
    if (!rawMoments) return [];
    if (activeSection === 'reels') {
      return rawMoments.filter((m: any) => m.type === 'video' || m.videoUrl);
    }
    return rawMoments.filter((m: any) => m.type !== 'video' && !m.videoUrl);
  }, [rawMoments, activeSection]);

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
        
        {/* --- FIXED: Top 20Vh Purple & White Mix Gradient --- */}
        <div className="absolute top-0 left-0 right-0 h-[20vh] bg-gradient-to-b from-purple-300 via-purple-100/80 to-transparent pointer-events-none z-10" />

        {/* Discovery Header */}
        <header className={cn(
          "shrink-0 pt-12 pb-4 px-6 z-50 border-b border-black/5 bg-white/20 backdrop-blur-xl",
          DESIGN_TOKENS.appBackground === '#FF91B5' && "bg-[#FF91B5]/40 border-white/10"
        )}>
          <div className="flex items-center justify-between max-w-2xl mx-auto relative h-10">
            <span className="text-sm md:text-base font-black tracking-tight text-slate-800 uppercase drop-shadow-sm">
              Post a Day with Ummy
            </span>
            
            <motion.button 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              whileTap={{ scale: 0.9, y: 2 }}
              onClick={() => setShowPublish(true)}
              className="h-10 w-10 flex items-center justify-center rounded-xl 
                         bg-gradient-to-br from-purple-400 to-purple-600 
                         text-white shadow-[0_4px_0_rgb(126,34,206),0_8px_15px_rgba(0,0,0,0.2)] 
                         border-t border-white/40 backdrop-blur-md transition-all active:shadow-none"
            >
              <Camera className="h-5 w-5 drop-shadow-md" />
            </motion.button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto no-scrollbar relative z-20 px-2 py-4 pb-40">
          {isLoading ? null : (
            <div className="grid grid-cols-2 gap-2 max-w-2xl mx-auto">
              {filteredMoments?.map((moment: any, idx: number) => (
                <GridMomentCard 
                  key={moment.id} 
                  moment={moment} 
                  index={idx} 
                  onOpenComments={(id, username) => {
                    setSelectedMomentId(id);
                    setSelectedMomentUser(username);
                  }}
                  onOpenFullscreen={(idx) => {
                    setSelectedIndex(idx);
                  }}
                />
              ))}

              {(!filteredMoments || filteredMoments.length === 0) && (
                <div className="col-span-2 py-24 text-center space-y-4 opacity-30 flex flex-col items-center">
                  <Compass className="h-16 w-16 text-slate-400" />
                  <div className="space-y-1">
                    <p className="font-headline font-black uppercase text-lg">No {activeSection === 'reels' ? 'Reels' : 'Photos'} Yet</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest">
                      Share the first {activeSection === 'reels' ? 'video' : 'moment'} of the day
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* --- BOTTOM SECTION SWITCHER --- */}
        <div className="absolute bottom-24 left-0 right-0 z-50 flex justify-center px-6">
          <div className="bg-white/40 backdrop-blur-2xl border border-white/40 rounded-full p-1.5 flex items-center gap-1 shadow-2xl">
            <button 
              onClick={() => setActiveSection('photos')}
              className={cn(
                "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                activeSection === 'photos' 
                  ? "bg-white text-purple-600 shadow-md scale-105" 
                  : "text-slate-600 hover:bg-white/20"
              )}
            >
              Photos
            </button>
            <button 
              onClick={() => setActiveSection('reels')}
              className={cn(
                "px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                activeSection === 'reels' 
                  ? "bg-white text-purple-600 shadow-md scale-105" 
                  : "text-slate-600 hover:bg-white/20"
              )}
            >
              Reels
            </button>
          </div>
        </div>

        {/* Dialogs & Sheets */}
        <PublishMomentDialog open={showPublish} onOpenChange={setShowPublish} />

        <FullscreenMomentOverlay 
          open={selectedIndex !== null}
          initialIndex={selectedIndex || 0}
          moments={activeMoments || []}
          onClose={() => setSelectedIndex(null)}
          onOpenComments={(id, username) => {
            setSelectedMomentId(id);
            setSelectedMomentUser(username);
          }}
        />

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
