'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs } from 'firebase/firestore';
import { TrendingUp, Loader, ChevronLeft, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { GoldCoinIcon } from '@/components/icons';
import { useUserProfile } from '@/hooks/use-user-profile';
import { LeaderboardThemeConfig } from '@/components/admin/leaderboard-theme-admin';

// --- Dynamic Theme Background ---
const DynamicThemeBackground = ({ theme }: { theme: LeaderboardThemeConfig | null }) => {
  if (!theme) {
    return (
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-br from-[#2e152b] via-[#2c1b18] to-[#3b1c32]">
        <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-pink-500/15 blur-[130px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-purple-600/15 blur-[130px] rounded-full animate-pulse [animation-delay:3s]" />
        <div className="absolute top-[40%] right-[-20%] w-[50%] h-[50%] bg-[#8B4513]/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-[1px] h-full bg-gradient-to-b from-transparent via-yellow-500/40 to-transparent" />
          <div className="absolute top-0 left-3/4 w-[1px] h-full bg-gradient-to-b from-transparent via-yellow-500/40 to-transparent" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#1a0e14] to-transparent" />
      </div>
    );
  }

  return (
    <>
      {theme.backgroundType === 'image' ? (
        <img
          src={theme.backgroundUrl}
          alt="Theme background"
          className="fixed inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <video
          src={theme.backgroundUrl}
          autoPlay
          loop
          muted
          className="fixed inset-0 w-full h-full object-cover z-0"
        />
      )}
      <div className="fixed inset-0 z-1 bg-black/30 pointer-events-none" />
    </>
  );
};

// --- Canvas Frame Overlay Component - AB BLACK BACKGROUND REMOVE HOGA, FRAME BILKUL CLEAR AAYEGA ---
const FrameOverlayCanvas = ({ 
  frameUrl, 
  isVideo = false,
  containerSize = 96 
}: { 
  frameUrl: string; 
  isVideo?: boolean;
  containerSize?: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: true // Performance ke liye, kyunki baar baar getImageData karenge
    });
    
    if (!ctx) return;

    // Canvas ko High DPI display ke hisaab se sharp rakho
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerSize * dpr;
    canvas.height = containerSize * dpr;
    
    // CSS size wahi rakho
    canvas.style.width = containerSize + 'px';
    canvas.style.height = containerSize + 'px';
    
    // DPR ke hisaab se scale karo taaki drawing sharp ho
    ctx.scale(dpr, dpr);

    if (isVideo) {
      // Video frame ke liye
      const video = document.createElement('video');
      video.src = frameUrl;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      videoRef.current = video;

      const drawFrame = () => {
        if (!ctx || !canvas) return;
        
        // Canvas clear karo
        ctx.clearRect(0, 0, containerSize, containerSize);
        
        if (video.readyState >= 2) {
          // Video ko canvas pe draw karo
          ctx.drawImage(video, 0, 0, containerSize, containerSize);
          
          // Black pixels ko transparent karo
          const imageData = ctx.getImageData(0, 0, containerSize, containerSize);
          const data = imageData.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Pure black ya near-black pixels ko poora transparent karo
            if (r < 30 && g < 30 && b < 30) {
              data[i + 3] = 0; // Alpha 0 = fully transparent
            }
          }
          
          // Wapis canvas pe updated imageData daalo
          ctx.putImageData(imageData, 0, 0);
        }
        
        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };

      video.addEventListener('play', () => {
        animationFrameRef.current = requestAnimationFrame(drawFrame);
      });

      video.play().catch(console.error);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        video.pause();
        video.remove();
      };
    } else {
      // Image frame ke liye
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = frameUrl;

      img.onload = () => {
        if (!ctx || !canvas) return;
        
        // Canvas clear karo
        ctx.clearRect(0, 0, containerSize, containerSize);
        
        // Image ko canvas pe draw karo - yahan koi resize ya blur nahi hoga
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, containerSize, containerSize);
        
        // Black pixels ko transparent karo
        const imageData = ctx.getImageData(0, 0, containerSize, containerSize);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Black ya near-black pixels transparent
          if (r < 30 && g < 30 && b < 30) {
            data[i + 3] = 0;
          }
        }
        
        // Wapis canvas pe updated imageData daalo
        ctx.putImageData(imageData, 0, 0);
      };

      return () => {
        // Cleanup
      };
    }
  }, [frameUrl, isVideo, containerSize]);

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none"
      style={{ 
        width: containerSize, 
        height: containerSize
      }}
    />
  );
};

// --- CircleAvatar with Frame - AB FRAME BILKUL CLEAR AAYEGA, KOI BLUR NAHI ---
const CircleAvatar = ({ src, fallback, size = "md", rank, theme }: { src?: string; fallback: string; size?: "sm" | "md" | "lg"; rank?: number; theme?: LeaderboardThemeConfig | null }) => {
  const sizes = { sm: "h-12 w-12", md: "h-16 w-16", lg: "h-20 w-20" };
  const frameSizes = { sm: "h-20 w-20", md: "h-24 w-24", lg: "h-32 w-32" };
  const containerPixelSizes = { sm: 80, md: 96, lg: 128 };

  const getRankFrame = () => {
    if (!theme) return null;
    if (rank === 1 && theme.frameConfigs.rank1.isEnabled) return theme.frameConfigs.rank1;
    if (rank === 2 && theme.frameConfigs.rank2.isEnabled) return theme.frameConfigs.rank2;
    if (rank === 3 && theme.frameConfigs.rank3.isEnabled) return theme.frameConfigs.rank3;
    if (rank && rank >= 4 && theme.frameConfigs.top.isEnabled) return theme.frameConfigs.top;
    return null;
  };

  const frame = getRankFrame();

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Frame Canvas Overlay - Ab bilkul clear aayega, koi blur nahi */}
      {frame && (
        <div className={cn("absolute z-10 pointer-events-none", frameSizes[size])}>
          <FrameOverlayCanvas 
            frameUrl={frame.type === 'image' ? frame.imageUrl! : frame.videoUrl!}
            isVideo={frame.type === 'video'}
            containerSize={containerPixelSizes[size]}
          />
        </div>
      )}

      {/* User Avatar */}
      <div className={cn("relative z-5 flex items-center justify-center p-0.5 rounded-full border-2 border-white/20 bg-slate-900/50 backdrop-blur-sm", sizes[size])}>
        <Avatar className="h-full w-full">
          <AvatarImage src={src} className="object-cover rounded-full" />
          <AvatarFallback className="bg-slate-900 text-white font-black rounded-full">{fallback}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

const RankingList = ({ items, type, isLoading, theme }: { items: any[] | null; type: string; isLoading: boolean; theme: LeaderboardThemeConfig | null }) => {
  if (isLoading)
    return (
      <div className="flex flex-col items-center py-40 gap-4 relative z-10">
        <Loader className="animate-spin text-white h-10 w-10" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 animate-pulse">Syncing Daily Data...</p>
      </div>
    );

  const getValue = (item: any) => {
    const fieldSuffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
    if (type === 'rich') return item.wallet?.[`daily${fieldSuffix}`] || 0;
    return item.stats?.[`daily${fieldSuffix}`] || 0;
  };

  const activePlayers = (items || []).filter((item) => getValue(item) > 0);

  if (activePlayers.length === 0)
    return (
      <div className="text-center py-40 opacity-40 relative z-10">
        <TrendingUp className="mx-auto mb-4 h-12 w-12 text-white/50" />
        <p className="font-bold uppercase text-sm text-white/70">No Daily Legends Yet.</p>
      </div>
    );

  const top1 = activePlayers[0];
  const top2 = activePlayers[1];
  const top3 = activePlayers[2];
  const others = activePlayers.slice(3);

  const formatValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  return (
    <div className="space-y-1 animate-in fade-in duration-700 pb-20 relative z-10">
      {/* Top 3 in One Row */}
      <div className="flex items-end justify-center gap-4 px-4 pt-20 pb-8">
        {/* Top 2 - Left */}
        <div className="flex-1 flex justify-center">
          {top2 && (
            <Link href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} className="flex flex-col items-center gap-1 mt-12">
              <CircleAvatar src={top2.avatarUrl || top2.coverUrl} fallback="2" size="sm" rank={2} theme={theme} />
              <span className="text-[9px] font-black uppercase text-white truncate w-16 text-center drop-shadow-lg">{top2.username || top2.name || 'User'}</span>
              <div className="flex items-center gap-1">
                <GoldCoinIcon className="h-2.5 w-2.5" />
                <span className="text-white/90 font-bold text-[10px] drop-shadow-lg">{formatValue(getValue(top2))}</span>
              </div>
            </Link>
          )}
        </div>

        {/* Top 1 - Center */}
        <div className="flex-1 flex justify-center">
          {top1 && (
            <Link href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} className="flex flex-col items-center gap-1 mt-4">
              <CircleAvatar src={top1.avatarUrl || top1.coverUrl} fallback="1" size="lg" rank={1} theme={theme} />
              <span className="text-[11px] font-black uppercase text-white drop-shadow-lg">{top1.username || top1.name || 'User'}</span>
              <div className="flex items-center gap-1">
                <GoldCoinIcon className="h-3 w-3" />
                <span className="text-white font-black text-sm drop-shadow-lg">{formatValue(getValue(top1))}</span>
              </div>
            </Link>
          )}
        </div>

        {/* Top 3 - Right */}
        <div className="flex-1 flex justify-center">
          {top3 && (
            <Link href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} className="flex flex-col items-center gap-1 mt-12">
              <CircleAvatar src={top3.avatarUrl || top3.coverUrl} fallback="3" size="sm" rank={3} theme={theme} />
              <span className="text-[9px] font-black uppercase text-white truncate w-16 text-center drop-shadow-lg">{top3.username || top3.name || 'User'}</span>
              <div className="flex items-center gap-1">
                <GoldCoinIcon className="h-2.5 w-2.5" />
                <span className="text-white/90 font-bold text-[10px] drop-shadow-lg">{formatValue(getValue(top3))}</span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* 4 to 50 - Scrollable */}
      <div className="px-4 space-y-1">
        {others.map((item, index) => (
          <Link
            key={item.id}
            href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`}
            className="flex items-center gap-3 py-2 px-2 hover:bg-white/5 rounded-lg transition-all"
          >
            <span className="text-base font-black italic text-white/40 w-5">{index + 4}</span>
            <CircleAvatar src={item.avatarUrl || item.coverUrl} fallback={(index + 4).toString()} size="sm" rank={index + 4} theme={theme} />
            <div className="flex-1">
              <p className="text-xs font-black uppercase text-white drop-shadow-md">{item.username || item.name || 'User'}</p>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-white font-black text-xs drop-shadow-md">{formatValue(getValue(item))}</span>
              <GoldCoinIcon className="h-3 w-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

function LeaderboardContent() {
  const searchParams = useSearchParams();
  const initialType = (searchParams.get('type') as any) || 'rich';
  const { user } = useUser();
  const firestore = useFirestore();
  const { userProfile: me } = useUserProfile(user?.uid);

  const [rankingType, setRankingMode] = useState<'rich' | 'charm' | 'rooms' | 'games'>(initialType);
  const [mounted, setMounted] = useState(false);
  const [activeTheme, setActiveTheme] = useState<LeaderboardThemeConfig | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!firestore) return;

    const fetchActiveTheme = async () => {
      try {
        const q = query(collection(firestore, 'leaderboardThemes'), where('isActive', '==', true), limit(1));
        const snapshot = await getDocs(q);
        if (snapshot.docs.length > 0) {
          const themeData = snapshot.docs[0].data() as LeaderboardThemeConfig;
          themeData.id = snapshot.docs[0].id;
          setActiveTheme(themeData);
        }
      } catch (error) {
        console.error('Error fetching active theme:', error);
      }
    };

    fetchActiveTheme();
  }, [firestore]);

  const richQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rich') return null;
      return query(collection(firestore, 'users'), where('wallet.dailySpent', '>', 0), orderBy('wallet.dailySpent', 'desc'), limit(50));
    },
    [firestore, rankingType]
  );

  const charmQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'charm') return null;
      return query(collection(firestore, 'users'), where('stats.dailyGiftsReceived', '>', 0), orderBy('stats.dailyGiftsReceived', 'desc'), limit(50));
    },
    [firestore, rankingType]
  );

  const roomsQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rooms') return null;
      return query(collection(firestore, 'chatRooms'), where('stats.dailyGifts', '>', 0), orderBy('stats.dailyGifts', 'desc'), limit(50));
    },
    [firestore, rankingType]
  );

  const gamesQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'games') return null;
      return query(collection(firestore, 'users'), where('stats.dailyGameWins', '>', 0), orderBy('stats.dailyGameWins', 'desc'), limit(50));
    },
    [firestore, rankingType]
  );

  const { data: richUsers, isLoading: isLoadingRich } = useCollection(richQuery);
  const { data: charmUsers, isLoading: isLoadingCharm } = useCollection(charmQuery);
  const { data: rankedRooms, isLoading: isLoadingRooms } = useCollection(roomsQuery);
  const { data: gameUsers, isLoading: isLoadingGames } = useCollection(gamesQuery);

  const activeItems = useMemo(() => {
    if (rankingType === 'rich') return richUsers;
    if (rankingType === 'charm') return charmUsers;
    if (rankingType === 'rooms') return rankedRooms;
    if (rankingType === 'games') return gameUsers;
    return null;
  }, [rankingType, richUsers, charmUsers, rankedRooms, gameUsers]);

  const isActiveLoading = rankingType === 'rich' ? isLoadingRich : rankingType === 'charm' ? isLoadingCharm : rankingType === 'rooms' ? isLoadingRooms : isLoadingGames;

  if (!mounted) return null;

  return (
    <div className="min-h-screen text-white relative font-sans flex flex-col overflow-hidden bg-transparent">
      <DynamicThemeBackground theme={activeTheme} />

      {/* Header */}
      <header className="relative z-50 p-4 pt-safe flex items-center justify-between">
        <Link href="/rooms" className="flex items-center justify-center w-10 h-10">
          <ChevronLeft className="h-6 w-6 text-white" />
        </Link>

        <div className="flex items-center gap-6">
          {['rich', 'charm', 'rooms'].map((tab) => (
            <button
              key={tab}
              onClick={() => setRankingMode(tab as any)}
              className={cn(
                'text-xs font-black uppercase tracking-widest transition-all',
                rankingType === tab ? 'text-white' : 'text-white/40'
              )}
            >
              {tab === 'rich' ? 'Honor' : tab === 'charm' ? 'Charm' : 'Room'}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-center w-10 h-10">
          <HelpCircle className="h-5 w-5 text-white" />
        </div>
      </header>

      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar">
        <RankingList items={activeItems} type={rankingType} isLoading={isActiveLoading} theme={activeTheme} />
      </main>
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#2e152b]"><Loader className="animate-spin text-white" /></div>}>
        <LeaderboardContent />
      </Suspense>
    </AppLayout>
  );
      }
