'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs, onSnapshot } from 'firebase/firestore';
import { TrendingUp, Loader, ChevronLeft, HelpCircle, X, User } from 'lucide-react';
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

// --- Canvas Frame Overlay Component - SQUARE ASPECT RATIO (1:1) ---
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
  const animationFrameRef = useRef<number>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isFrameLoaded, setIsFrameLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: true
    });
    
    if (!ctx) return;

    const removeBlackPixels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) return;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (r < 30 && g < 30 && b < 30) {
          data[i + 3] = 0;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    };

    if (isVideo) {
      const video = document.createElement('video');
      videoRef.current = video;
      video.src = frameUrl;
      video.autoplay = true;
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';

      video.addEventListener('loadedmetadata', () => {
        setIsFrameLoaded(true);
      });

      video.addEventListener('loadeddata', () => {
        setIsFrameLoaded(true);
      });

      video.play().catch(console.error);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        if (videoRef.current) {
          videoRef.current.pause();
          videoRef.current.remove();
          videoRef.current = null;
        }
      };
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = frameUrl;

      img.onload = () => {
        setIsFrameLoaded(true);
      };
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [frameUrl, isVideo]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isFrameLoaded) return;

    const ctx = canvas.getContext('2d', { 
      alpha: true,
      willReadFrequently: true
    });
    
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    
    const canvasWidth = containerSize;
    const canvasHeight = containerSize;
    
    canvas.width = Math.round(canvasWidth * dpr);
    canvas.height = Math.round(canvasHeight * dpr);
    
    canvas.style.width = Math.round(canvasWidth) + 'px';
    canvas.style.height = Math.round(canvasHeight) + 'px';
    
    ctx.scale(dpr, dpr);

    const removeBlackPixels = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) return;
      const imageData = ctx.getImageData(0, 0, width, height);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        if (r < 30 && g < 30 && b < 30) {
          data[i + 3] = 0;
        }
      }
      
      ctx.putImageData(imageData, 0, 0);
    };

    if (isVideo && videoRef.current) {
      const drawFrame = () => {
        if (!ctx || !canvas || videoRef.current!.readyState < 2) {
          animationFrameRef.current = requestAnimationFrame(drawFrame);
          return;
        }
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        const videoRatio = videoRef.current!.videoWidth / videoRef.current!.videoHeight;
        let sx = 0, sy = 0, sWidth = videoRef.current!.videoWidth, sHeight = videoRef.current!.videoHeight;
        
        if (videoRatio > 1) {
          sWidth = sHeight;
          sx = (videoRef.current!.videoWidth - sWidth) / 2;
        } else if (videoRatio < 1) {
          sHeight = sWidth;
          sy = (videoRef.current!.videoHeight - sHeight) / 2;
        }
        
        ctx.drawImage(videoRef.current!, sx, sy, sWidth, sHeight, 0, 0, canvasWidth, canvasHeight);
        removeBlackPixels(ctx, canvas.width, canvas.height);
        
        animationFrameRef.current = requestAnimationFrame(drawFrame);
      };
      
      drawFrame();
    } else {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = frameUrl;

      img.onload = () => {
        if (!ctx || !canvas) return;
        
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;
        
        if (imgRatio > 1) {
          sWidth = sHeight;
          sx = (img.naturalWidth - sWidth) / 2;
        } else if (imgRatio < 1) {
          sHeight = sWidth;
          sy = (img.naturalHeight - sHeight) / 2;
        }
        
        ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvasWidth, canvasHeight);
        removeBlackPixels(ctx, canvas.width, canvas.height);
      };
    }
  }, [containerSize, frameUrl, isVideo, isFrameLoaded]);

  return (
    <canvas 
      ref={canvasRef}
      className="absolute inset-0 z-10 pointer-events-none m-auto"
      style={{ 
        maxWidth: containerSize + 'px',
        maxHeight: containerSize + 'px'
      }}
    />
  );
};

// --- Placeholder Avatar for Empty State ---
const PlaceholderAvatar = ({ size = "md", rank }: { size?: "sm" | "md" | "lg"; rank?: number }) => {
  const sizes = { sm: "h-12 w-12", md: "h-16 w-16", lg: "h-20 w-20" };
  
  return (
    <div className={cn("relative z-5 flex items-center justify-center p-0.5 rounded-full border-2 border-white/20 bg-slate-900/50 backdrop-blur-sm", sizes[size])}>
      <div className="h-full w-full rounded-full bg-slate-800/80 flex items-center justify-center">
        <User className="h-1/2 w-1/2 text-white/40" />
      </div>
    </div>
  );
};

// --- CircleAvatar with Frame ---
const CircleAvatar = ({ src, fallback, size = "md", rank, theme, isEmpty = false }: { src?: string; fallback: string; size?: "sm" | "md" | "lg"; rank?: number; theme?: LeaderboardThemeConfig | null; isEmpty?: boolean }) => {
  const sizes = { sm: "h-12 w-12", md: "h-16 w-16", lg: "h-20 w-20" };
  const frameSizes = { sm: "h-[120px] w-[120px]", md: "h-[144px] w-[144px]", lg: "h-[192px] w-[192px]" };
  const containerPixelSizes = { sm: 120, md: 144, lg: 192 };

  const getRankFrame = () => {
    if (!theme) return null;
    if (rank === 1 && theme.frameConfigs.rank1.isEnabled) return theme.frameConfigs.rank1;
    if (rank === 2 && theme.frameConfigs.rank2.isEnabled) return theme.frameConfigs.rank2;
    if (rank === 3 && theme.frameConfigs.rank3.isEnabled) return theme.frameConfigs.rank3;
    if (rank && rank >= 4 && theme.frameConfigs.top.isEnabled) return theme.frameConfigs.top;
    return null;
  };

  const frame = getRankFrame();

  // Agar empty hai toh placeholder dikhao
  if (isEmpty) {
    return (
      <div className="relative inline-flex items-center justify-center">
        {frame && (
          <div className={cn("absolute z-10 pointer-events-none", frameSizes[size])}>
            <FrameOverlayCanvas 
              frameUrl={frame.type === 'image' ? frame.imageUrl! : frame.videoUrl!}
              isVideo={frame.type === 'video'}
              containerSize={containerPixelSizes[size]}
            />
          </div>
        )}
        <PlaceholderAvatar size={size} rank={rank} />
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      {frame && (
        <div className={cn("absolute z-10 pointer-events-none", frameSizes[size])}>
          <FrameOverlayCanvas 
            frameUrl={frame.type === 'image' ? frame.imageUrl! : frame.videoUrl!}
            isVideo={frame.type === 'video'}
            containerSize={containerPixelSizes[size]}
          />
        </div>
      )}

      <div className={cn("relative z-5 flex items-center justify-center p-0.5 rounded-full border-2 border-white/20 bg-slate-900/50 backdrop-blur-sm", sizes[size])}>
        <Avatar className="h-full w-full">
          <AvatarImage src={src} className="object-cover rounded-full" />
          <AvatarFallback className="bg-slate-900 text-white font-black rounded-full">{fallback}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};

// --- Info Modal Component ---
const InfoModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Card */}
      <div className="relative z-10 bg-white rounded-2xl w-[90%] max-w-sm p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        {/* Title */}
        <h3 className="text-lg font-black text-gray-900 mb-4 text-center">
          Ranking Info
        </h3>

        {/* Content */}
        <div className="space-y-4 text-sm text-gray-700">
          {/* Honor */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="font-black text-amber-600 mb-1">🏆 Honor Ranking</p>
            <p className="text-xs leading-relaxed text-gray-600">
              Honor Ranking is determined by the number of <span className="font-bold text-amber-500">Coins you Spend</span> in Gifts.
            </p>
            <p className="text-xs leading-relaxed text-gray-600 mt-1">
              Daily Rewards: Sending Coins value × <span className="font-bold">1.4%</span> You will receive, Frame
            </p>
          </div>

          {/* Charm */}
          <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
            <p className="font-black text-pink-600 mb-1">💖 Charm Ranking</p>
            <p className="text-xs leading-relaxed text-gray-600">
              Charm Ranking is determined by the number of <span className="font-bold text-pink-500">Coins you Received</span> in Gifts.
            </p>
            <p className="text-xs leading-relaxed text-gray-600 mt-1">
              Daily Rewards: Receiving Coins value × <span className="font-bold">1.4%</span> You will receive, Frame
            </p>
          </div>

          {/* Room */}
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <p className="font-black text-purple-600 mb-1">🏠 Room Ranking</p>
            <p className="text-xs leading-relaxed text-gray-600">
              Room Ranking is determined by the number of <span className="font-bold text-purple-500">Coins you Spend</span> in Room.
            </p>
            <p className="text-xs leading-relaxed text-gray-600 mt-1">
              Daily Rewards: Sending Coins value × <span className="font-bold">1.3%</span> You will receive, Frame
            </p>
          </div>
        </div>

        {/* OK Button */}
        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-gray-900 text-white font-black rounded-xl hover:bg-gray-800 transition-colors active:scale-[0.98]"
        >
          OK
        </button>
      </div>
    </div>
  );
};

// --- Helper: Check if current time is midnight reset window (12:00:00 - 12:00:05) ---
const isMidnightResetWindow = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  // Midnight reset window: 00:00:00 se 00:00:10 tak
  return hours === 0 && minutes === 0 && seconds < 10;
};

// --- Helper: Get today's date string for cache busting ---
const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

// --- Helper: Get current week number ---
const getWeekNumber = (date: Date): number => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  return Math.ceil((days + startOfYear.getDay() + 1) / 7);
};

// --- Helper: Get week identifier string ---
const getWeekString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-W${getWeekNumber(now)}`;
};

// --- Helper: Get month identifier string ---
const getMonthString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}`;
};

const RankingList = ({ items, type, isLoading, theme, timeFilter }: { items: any[] | null; type: string; isLoading: boolean; theme: LeaderboardThemeConfig | null; timeFilter: 'daily' | 'weekly' | 'monthly' }) => {
  // Midnight reset ke time sab kuch clear dikhega
  const [isResetWindow, setIsResetWindow] = useState(false);
  const [todayDate, setTodayDate] = useState(getTodayDateString());

  useEffect(() => {
    // Har second check karo ki midnight window hai ya nahi
    const interval = setInterval(() => {
      const resetNow = isMidnightResetWindow();
      setIsResetWindow(resetNow);
      
      // Naya din start hua toh date update karo
      const newDate = getTodayDateString();
      if (newDate !== todayDate) {
        setTodayDate(newDate);
      }
    }, 1000);

    // Initial check
    setIsResetWindow(isMidnightResetWindow());
    setTodayDate(getTodayDateString());

    return () => clearInterval(interval);
  }, [todayDate]);

  if (isLoading)
    return (
      <div className="flex flex-col items-center py-40 gap-4 relative z-10">
        <Loader className="animate-spin text-white h-10 w-10" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 animate-pulse">Syncing Data...</p>
      </div>
    );

  const getValue = (item: any) => {
    const prefix = timeFilter;
    // Daily fields
    if (timeFilter === 'daily') {
      const fieldSuffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
      if (type === 'rich') return item.wallet?.[`daily${fieldSuffix}`] || 0;
      return item.stats?.[`daily${fieldSuffix}`] || 0;
    }
    // Weekly fields
    if (timeFilter === 'weekly') {
      const fieldSuffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
      if (type === 'rich') return item.wallet?.[`weekly${fieldSuffix}`] || 0;
      return item.stats?.[`weekly${fieldSuffix}`] || 0;
    }
    // Monthly fields
    const fieldSuffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
    if (type === 'rich') return item.wallet?.[`monthly${fieldSuffix}`] || 0;
    return item.stats?.[`monthly${fieldSuffix}`] || 0;
  };

  // Only show reset window for daily
  if (isResetWindow && timeFilter === 'daily') {
    // Top 3 empty + No Data in list
    return (
      <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-700">
        {/* Fixed Section — Empty Top 3 */}
        <div className="flex-shrink-0">
          {/* Top 3 in One Row - Empty State with ? avatar */}
          <div className="flex items-end justify-center gap-4 px-4 pt-20 pb-8">
            {/* Top 2 - Left side (Empty) */}
            <div className="flex-1 flex justify-center">
              <div className="flex flex-col items-center gap-1 mt-16 translate-x-3">
                <CircleAvatar isEmpty={true} fallback="?" size="md" rank={2} theme={theme} />
                <span className="text-[10px] font-black uppercase text-white/50 truncate w-16 text-center mt-12">---</span>
                <div className="flex items-center gap-1 -mt-0.5 opacity-50">
                  <span className="text-amber-400/50 font-black text-xs">0</span>
                  <GoldCoinIcon className="h-3 w-3 opacity-50" />
                </div>
              </div>
            </div>

            {/* Top 1 - Center (Empty) */}
            <div className="flex-1 flex justify-center relative -top-16">
              <div className="flex flex-col items-center gap-1 -mt-12">
                <CircleAvatar isEmpty={true} fallback="?" size="lg" rank={1} theme={theme} />
                <span className="text-[13px] font-black uppercase text-white/50 mt-12">---</span>
                <div className="flex items-center gap-1 -mt-1 opacity-50">
                  <span className="text-amber-400/50 font-black text-base">0</span>
                  <GoldCoinIcon className="h-4 w-4 opacity-50" />
                </div>
              </div>
            </div>

            {/* Top 3 - Right side (Empty) */}
            <div className="flex-1 flex justify-center">
              <div className="flex flex-col items-center gap-1 mt-16 -translate-x-4">
                <CircleAvatar isEmpty={true} fallback="?" size="md" rank={3} theme={theme} />
                <span className="text-[10px] font-black uppercase text-white/50 truncate w-16 text-center mt-12">---</span>
                <div className="flex items-center gap-1 -mt-0.5 opacity-50">
                  <span className="text-amber-400/50 font-black text-xs">0</span>
                  <GoldCoinIcon className="h-3 w-3 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* 10vh Space */}
          <div className="h-[10vh]" />
        </div>

        {/* Scrollable Section — No Data message */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20">
          <div className="text-center py-20 opacity-60">
            <TrendingUp className="mx-auto mb-4 h-10 w-10 text-white/40" />
            <p className="font-bold uppercase text-sm text-white/50">Resetting for new day...</p>
            <p className="text-xs text-white/30 mt-2">Leaderboard will refresh shortly</p>
          </div>
        </div>
      </div>
    );
  }

  // Normal flow - filter active players
  const activePlayers = (items || []).filter((item) => getValue(item) > 0);

  // Agar active players hi nahi hai (0 players with value > 0)
  if (activePlayers.length === 0)
    return (
      <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-700">
        {/* Fixed Section — Empty Top 3 with ? */}
        <div className="flex-shrink-0">
          <div className="flex items-end justify-center gap-4 px-4 pt-20 pb-8">
            {/* Top 2 - Left (Empty) */}
            <div className="flex-1 flex justify-center">
              <div className="flex flex-col items-center gap-1 mt-16 translate-x-3">
                <CircleAvatar isEmpty={true} fallback="?" size="md" rank={2} theme={theme} />
                <span className="text-[10px] font-black uppercase text-white/50 truncate w-16 text-center mt-12">---</span>
                <div className="flex items-center gap-1 -mt-0.5 opacity-50">
                  <span className="text-amber-400/50 font-black text-xs">0</span>
                  <GoldCoinIcon className="h-3 w-3 opacity-50" />
                </div>
              </div>
            </div>

            {/* Top 1 - Center (Empty) */}
            <div className="flex-1 flex justify-center relative -top-16">
              <div className="flex flex-col items-center gap-1 -mt-12">
                <CircleAvatar isEmpty={true} fallback="?" size="lg" rank={1} theme={theme} />
                <span className="text-[13px] font-black uppercase text-white/50 mt-12">---</span>
                <div className="flex items-center gap-1 -mt-1 opacity-50">
                  <span className="text-amber-400/50 font-black text-base">0</span>
                  <GoldCoinIcon className="h-4 w-4 opacity-50" />
                </div>
              </div>
            </div>

            {/* Top 3 - Right (Empty) */}
            <div className="flex-1 flex justify-center">
              <div className="flex flex-col items-center gap-1 mt-16 -translate-x-4">
                <CircleAvatar isEmpty={true} fallback="?" size="md" rank={3} theme={theme} />
                <span className="text-[10px] font-black uppercase text-white/50 truncate w-16 text-center mt-12">---</span>
                <div className="flex items-center gap-1 -mt-0.5 opacity-50">
                  <span className="text-amber-400/50 font-black text-xs">0</span>
                  <GoldCoinIcon className="h-3 w-3 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          <div className="h-[7vh]" />
        </div>

        {/* No Data for list */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20">
          <div className="text-center py-20 opacity-60">
            <TrendingUp className="mx-auto mb-4 h-10 w-10 text-white/40" />
            <p className="font-bold uppercase text-sm text-white/50">No Data</p>
            <p className="text-xs text-white/30 mt-2">Be the first to rank!</p>
          </div>
        </div>
      </div>
    );

  // Normal case - players exist
  const top1 = activePlayers[0];
  const top2 = activePlayers[1];
  const top3 = activePlayers[2];
  
  // Rank 4 se baaki sab scrollable
  const scrollablePlayers = activePlayers.slice(3);

  const formatValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  return (
    <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-700">
      {/* Fixed Section — Top 3 + 10vh space */}
      <div className="flex-shrink-0">
        {/* Top 3 in One Row */}
        <div className="flex items-end justify-center gap-4 px-4 pt-20 pb-8">
          {/* Top 2 - Left side */}
          <div className="flex-1 flex justify-center">
            {top2 ? (
              <Link 
                href={type === 'rooms' ? `/rooms/${top2.id}` : `/profile/${top2.id}`} 
                className="flex flex-col items-center gap-1 mt-16 translate-x-3"
              >
                <CircleAvatar src={top2.avatarUrl || top2.coverUrl} fallback="2" size="md" rank={2} theme={theme} />
                <span className="text-[10px] font-black uppercase text-white truncate w-16 text-center drop-shadow-lg mt-12">{top2.username || top2.name || 'User'}</span>
                <div className="flex items-center gap-1 -mt-0.5">
                  <span className="text-amber-400 font-black text-xs drop-shadow-lg">{formatValue(getValue(top2))}</span>
                  <GoldCoinIcon className="h-3 w-3" />
                </div>
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-1 mt-16 translate-x-3">
                <CircleAvatar isEmpty={true} fallback="?" size="md" rank={2} theme={theme} />
                <span className="text-[10px] font-black uppercase text-white/50 truncate w-16 text-center mt-12">---</span>
                <div className="flex items-center gap-1 -mt-0.5 opacity-50">
                  <span className="text-amber-400/50 font-black text-xs">0</span>
                  <GoldCoinIcon className="h-3 w-3 opacity-50" />
                </div>
              </div>
            )}
          </div>

          {/* Top 1 - Center */}
          <div className="flex-1 flex justify-center relative -top-16">
            {top1 ? (
              <Link 
                href={type === 'rooms' ? `/rooms/${top1.id}` : `/profile/${top1.id}`} 
                className="flex flex-col items-center gap-1 -mt-12"
              >
                <CircleAvatar src={top1.avatarUrl || top1.coverUrl} fallback="1" size="lg" rank={1} theme={theme} />
                <span className="text-[13px] font-black uppercase text-black drop-shadow-md mt-12">{top1.username || top1.name || 'User'}</span>
                <div className="flex items-center gap-1 -mt-1">
                  <span className="text-amber-400 font-black text-base drop-shadow-md">{formatValue(getValue(top1))}</span>
                  <GoldCoinIcon className="h-4 w-4" />
                </div>
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-1 -mt-12">
                <CircleAvatar isEmpty={true} fallback="?" size="lg" rank={1} theme={theme} />
                <span className="text-[13px] font-black uppercase text-white/50 mt-12">---</span>
                <div className="flex items-center gap-1 -mt-1 opacity-50">
                  <span className="text-amber-400/50 font-black text-base">0</span>
                  <GoldCoinIcon className="h-4 w-4 opacity-50" />
                </div>
              </div>
            )}
          </div>

          {/* Top 3 - Right side */}
          <div className="flex-1 flex justify-center">
            {top3 ? (
              <Link 
                href={type === 'rooms' ? `/rooms/${top3.id}` : `/profile/${top3.id}`} 
                className="flex flex-col items-center gap-1 mt-16 -translate-x-4"
              >
                <CircleAvatar src={top3.avatarUrl || top3.coverUrl} fallback="3" size="md" rank={3} theme={theme} />
                <span className="text-[10px] font-black uppercase text-white truncate w-16 text-center drop-shadow-lg mt-12">{top3.username || top3.name || 'User'}</span>
                <div className="flex items-center gap-1 -mt-0.5">
                  <span className="text-amber-400 font-black text-xs drop-shadow-lg">{formatValue(getValue(top3))}</span>
                  <GoldCoinIcon className="h-3 w-3" />
                </div>
              </Link>
            ) : (
              <div className="flex flex-col items-center gap-1 mt-16 -translate-x-4">
                <CircleAvatar isEmpty={true} fallback="?" size="md" rank={3} theme={theme} />
                <span className="text-[10px] font-black uppercase text-white/50 truncate w-16 text-center mt-12">---</span>
                <div className="flex items-center gap-1 -mt-0.5 opacity-50">
                  <span className="text-amber-400/50 font-black text-xs">0</span>
                  <GoldCoinIcon className="h-3 w-3 opacity-50" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 10vh Space — Fixed gap between Top 3 and scrollable list */}
        <div className="h-[10vh]" />
      </div>

      {/* Scrollable Section — Rank 4 se baaki sab */}
      {scrollablePlayers.length > 0 ? (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 space-y-1 pb-20">
          {scrollablePlayers.map((item, index) => {
            const rank = index + 4;
            return (
              <Link
                key={item.id}
                href={type === 'rooms' ? `/rooms/${item.id}` : `/profile/${item.id}`}
                className="flex items-center gap-3 py-2 px-2 hover:bg-white/5 rounded-lg transition-all"
              >
                <span className="text-base font-black italic text-white/40 w-5">{rank}</span>
                <CircleAvatar src={item.avatarUrl || item.coverUrl} fallback={rank.toString()} size="sm" rank={rank} theme={theme} />
                <div className="flex-1">
                  <p className="text-xs font-black uppercase text-white drop-shadow-md">{item.username || item.name || 'User'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-white font-black text-xs drop-shadow-md">{formatValue(getValue(item))}</span>
                  <GoldCoinIcon className="h-3 w-3" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20">
          <div className="text-center py-20 opacity-60">
            <TrendingUp className="mx-auto mb-4 h-10 w-10 text-white/40" />
            <p className="font-bold uppercase text-sm text-white/50">No Data</p>
            <p className="text-xs text-white/30 mt-2">Waiting for more players...</p>
          </div>
        </div>
      )}
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
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [mounted, setMounted] = useState(false);
  const [activeTheme, setActiveTheme] = useState<LeaderboardThemeConfig | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!firestore) return;

    const q = query(collection(firestore, 'leaderboardThemes'), where('isActive', '==', true), limit(1));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.docs.length > 0) {
        const themeData = snapshot.docs[0].data() as LeaderboardThemeConfig;
        themeData.id = snapshot.docs[0].id;
        setActiveTheme(themeData);
      } else {
        setActiveTheme(null);
      }
    }, (error) => {
      console.error('Error listening to active theme:', error);
    });

    return () => unsubscribe();
  }, [firestore]);

  // Helper to get field name based on ranking type and time filter
  const getFieldName = (category: 'rich' | 'charm' | 'rooms' | 'games') => {
    const prefix = timeFilter;
    const suffix = category === 'rich' ? 'Spent' : category === 'charm' ? 'GiftsReceived' : category === 'rooms' ? 'Gifts' : 'GameWins';
    return `${prefix}${suffix}`;
  };

  // Helper to get collection path
  const getCollectionPath = (category: 'rich' | 'charm' | 'rooms' | 'games') => {
    return category === 'rooms' ? 'chatRooms' : 'users';
  };

  // Helper to get field path (wallet or stats)
  const getFieldPath = (category: 'rich' | 'charm' | 'rooms' | 'games') => {
    const fieldName = getFieldName(category);
    if (category === 'rich') return `wallet.${fieldName}`;
    if (category === 'rooms') return `stats.${fieldName}`;
    return `stats.${fieldName}`;
  };

  const richQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rich') return null;
      const fieldPath = getFieldPath('rich');
      return query(
        collection(firestore, getCollectionPath('rich')), 
        where(fieldPath, '>', 0), 
        orderBy(fieldPath, 'desc'), 
        limit(50)
      );
    },
    [firestore, rankingType, timeFilter]
  );

  const charmQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'charm') return null;
      const fieldPath = getFieldPath('charm');
      return query(
        collection(firestore, getCollectionPath('charm')), 
        where(fieldPath, '>', 0), 
        orderBy(fieldPath, 'desc'), 
        limit(50)
      );
    },
    [firestore, rankingType, timeFilter]
  );

  const roomsQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rooms') return null;
      const fieldPath = getFieldPath('rooms');
      return query(
        collection(firestore, getCollectionPath('rooms')), 
        where(fieldPath, '>', 0), 
        orderBy(fieldPath, 'desc'), 
        limit(50)
      );
    },
    [firestore, rankingType, timeFilter]
  );

  const gamesQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'games') return null;
      const fieldPath = getFieldPath('games');
      return query(
        collection(firestore, getCollectionPath('games')), 
        where(fieldPath, '>', 0), 
        orderBy(fieldPath, 'desc'), 
        limit(50)
      );
    },
    [firestore, rankingType, timeFilter]
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
    <div className="min-h-screen h-screen text-white relative font-sans flex flex-col overflow-hidden bg-transparent">
      <DynamicThemeBackground theme={activeTheme} />

      {/* Header */}
      <header className="relative z-50 p-4 pt-safe flex items-center justify-between flex-shrink-0">
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

        {/* HelpCircle Icon - Click pe info modal open hoga */}
        <button 
          onClick={() => setShowInfo(true)}
          className="flex items-center justify-center w-10 h-10"
        >
          <HelpCircle className="h-5 w-5 text-white" />
        </button>
      </header>

      {/* Time Filter Tabs - Daily, Weekly, Monthly - Chote tabs niche */}
      <div className="relative z-50 flex justify-center gap-2 px-4 pb-2 flex-shrink-0">
        {(['daily', 'weekly', 'monthly'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setTimeFilter(filter)}
            className={cn(
              'px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border',
              timeFilter === filter 
                ? 'bg-white/20 border-white/30 text-white shadow-lg scale-105' 
                : 'bg-transparent border-white/10 text-white/50 hover:border-white/20 hover:text-white/70'
            )}
          >
            {filter === 'daily' ? 'Daily' : filter === 'weekly' ? 'Weekly' : 'Monthly'}
          </button>
        ))}
      </div>

      <main className="relative z-10 flex-1 overflow-hidden">
        <RankingList items={activeItems} type={rankingType} isLoading={isActiveLoading} theme={activeTheme} timeFilter={timeFilter} />
      </main>

      {/* Info Modal */}
      <InfoModal isOpen={showInfo} onClose={() => setShowInfo(false)} />
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
