'use client';

import { useState, useEffect, Suspense, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AppLayout } from '@/components/layout/app-layout';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit, where, getDocs, onSnapshot } from 'firebase/firestore';
import { TrendingUp, Loader, ChevronLeft, HelpCircle, X, User, Calendar, CalendarDays, CalendarRange } from 'lucide-react';
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
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative z-10 bg-white rounded-2xl w-[90%] max-w-sm p-6 shadow-2xl animate-in zoom-in-95 fade-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="h-4 w-4 text-gray-500" />
        </button>

        <h3 className="text-lg font-black text-gray-900 mb-4 text-center">
          Ranking Info
        </h3>

        <div className="space-y-4 text-sm text-gray-700">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <p className="font-black text-amber-600 mb-1">🏆 Honor Ranking</p>
            <p className="text-xs leading-relaxed text-gray-600">
              Honor Ranking is determined by the number of <span className="font-bold text-amber-500">Coins you Spend</span> in Gifts.
            </p>
            <p className="text-xs leading-relaxed text-gray-600 mt-1">
              Daily Rewards: Sending Coins value × <span className="font-bold">1.4%</span> You will receive, Frame
            </p>
          </div>

          <div className="bg-pink-50 rounded-xl p-4 border border-pink-100">
            <p className="font-black text-pink-600 mb-1">💖 Charm Ranking</p>
            <p className="text-xs leading-relaxed text-gray-600">
              Charm Ranking is determined by the number of <span className="font-bold text-pink-500">Coins you Received</span> in Gifts.
            </p>
            <p className="text-xs leading-relaxed text-gray-600 mt-1">
              Daily Rewards: Receiving Coins value × <span className="font-bold">1.4%</span> You will receive, Frame
            </p>
          </div>

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

// --- Period Tabs Component (Vertical) ---
const PeriodTabs = ({ period, onChange }: { period: 'daily' | 'weekly' | 'monthly'; onChange: (p: 'daily' | 'weekly' | 'monthly') => void }) => {
  const tabs = [
    { key: 'daily' as const, label: 'Daily', icon: Calendar },
    { key: 'weekly' as const, label: 'Weekly', icon: CalendarDays },
    { key: 'monthly' as const, label: 'Monthly', icon: CalendarRange },
  ];

  return (
    <div className="bg-white/5 backdrop-blur-md rounded-2xl p-1.5 border border-white/10 shadow-lg">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = period === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200',
              isActive
                ? 'bg-gradient-to-r from-amber-400/20 to-orange-400/20 text-amber-300 shadow-inner border border-amber-400/30'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            )}
          >
            <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-amber-400' : 'text-white/40')} />
            <span className="tracking-wider uppercase">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

// --- Helper: Check if current time is midnight reset window (12:00:00 - 12:00:05) ---
const isMidnightResetWindow = (): boolean => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  
  return hours === 0 && minutes === 0 && seconds < 10;
};

// --- Helper: Get today's date string for cache busting ---
const getTodayDateString = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`;
};

const RankingList = ({ items, type, isLoading, theme, period }: { items: any[] | null; type: string; isLoading: boolean; theme: LeaderboardThemeConfig | null; period: 'daily' | 'weekly' | 'monthly' }) => {
  const [isResetWindow, setIsResetWindow] = useState(false);
  const [todayDate, setTodayDate] = useState(getTodayDateString());

  useEffect(() => {
    const interval = setInterval(() => {
      const resetNow = isMidnightResetWindow();
      setIsResetWindow(resetNow);
      
      const newDate = getTodayDateString();
      if (newDate !== todayDate) {
        setTodayDate(newDate);
      }
    }, 1000);

    setIsResetWindow(isMidnightResetWindow());
    setTodayDate(getTodayDateString());

    return () => clearInterval(interval);
  }, [todayDate]);

  if (isLoading)
    return (
      <div className="flex flex-col items-center py-40 gap-4 relative z-10">
        <Loader className="animate-spin text-white h-10 w-10" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 animate-pulse">Syncing {period.charAt(0).toUpperCase() + period.slice(1)} Data...</p>
      </div>
    );

  const getValue = (item: any) => {
    const fieldSuffix = type === 'rich' ? 'Spent' : type === 'charm' ? 'GiftsReceived' : type === 'rooms' ? 'Gifts' : 'GameWins';
    const prefix = period === 'daily' ? 'daily' : period === 'weekly' ? 'weekly' : 'monthly';
    
    if (type === 'rich') return item.wallet?.[`${prefix}${fieldSuffix}`] || 0;
    return item.stats?.[`${prefix}${fieldSuffix}`] || 0;
  };

  // Sirf daily period ke liye midnight reset
  if (period === 'daily' && isResetWindow) {
    return (
      <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-700">
        <div className="flex-shrink-0">
          <div className="flex items-end justify-center gap-4 px-4 pt-20 pb-8">
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

          <div className="h-[10vh]" />
        </div>

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

  const activePlayers = (items || []).filter((item) => getValue(item) > 0);

  if (activePlayers.length === 0)
    return (
      <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-700">
        <div className="flex-shrink-0">
          <div className="flex items-end justify-center gap-4 px-4 pt-20 pb-8">
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

          <div className="h-[10vh]" />
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar px-4 pb-20">
          <div className="text-center py-20 opacity-60">
            <TrendingUp className="mx-auto mb-4 h-10 w-10 text-white/40" />
            <p className="font-bold uppercase text-sm text-white/50">No Data</p>
            <p className="text-xs text-white/30 mt-2">
              {period === 'daily' ? 'Be the first to rank today!' : 
               period === 'weekly' ? 'No rankings this week yet!' : 
               'No rankings this month yet!'}
            </p>
          </div>
        </div>
      </div>
    );

  const top1 = activePlayers[0];
  const top2 = activePlayers[1];
  const top3 = activePlayers[2];
  
  const scrollablePlayers = activePlayers.slice(3);

  const formatValue = (val: number) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toLocaleString();
  };

  return (
    <div className="flex flex-col h-full relative z-10 animate-in fade-in duration-700">
      <div className="flex-shrink-0">
        <div className="flex items-end justify-center gap-4 px-4 pt-20 pb-8">
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

        <div className="h-[10vh]" />
      </div>

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
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
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

  // --- Daily Queries ---
  const dailyRichQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rich' || period !== 'daily') return null;
      return query(collection(firestore, 'users'), where('wallet.dailySpent', '>', 0), orderBy('wallet.dailySpent', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  const dailyCharmQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'charm' || period !== 'daily') return null;
      return query(collection(firestore, 'users'), where('stats.dailyGiftsReceived', '>', 0), orderBy('stats.dailyGiftsReceived', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  const dailyRoomsQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rooms' || period !== 'daily') return null;
      return query(collection(firestore, 'chatRooms'), where('stats.dailyGifts', '>', 0), orderBy('stats.dailyGifts', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  const dailyGamesQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'games' || period !== 'daily') return null;
      return query(collection(firestore, 'users'), where('stats.dailyGameWins', '>', 0), orderBy('stats.dailyGameWins', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  // --- Weekly Queries ---
  const weeklyRichQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rich' || period !== 'weekly') return null;
      return query(collection(firestore, 'users'), where('wallet.weeklySpent', '>', 0), orderBy('wallet.weeklySpent', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  const weeklyCharmQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'charm' || period !== 'weekly') return null;
      return query(collection(firestore, 'users'), where('stats.weeklyGiftsReceived', '>', 0), orderBy('stats.weeklyGiftsReceived', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  const weeklyRoomsQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rooms' || period !== 'weekly') return null;
      return query(collection(firestore, 'chatRooms'), where('stats.weeklyGifts', '>', 0), orderBy('stats.weeklyGifts', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  const weeklyGamesQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'games' || period !== 'weekly') return null;
      return query(collection(firestore, 'users'), where('stats.weeklyGameWins', '>', 0), orderBy('stats.weeklyGameWins', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  // --- Monthly Queries ---
  const monthlyRichQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rich' || period !== 'monthly') return null;
      return query(collection(firestore, 'users'), where('wallet.monthlySpent', '>', 0), orderBy('wallet.monthlySpent', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  const monthlyCharmQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'charm' || period !== 'monthly') return null;
      return query(collection(firestore, 'users'), where('stats.monthlyGiftsReceived', '>', 0), orderBy('stats.monthlyGiftsReceived', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  const monthlyRoomsQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'rooms' || period !== 'monthly') return null;
      return query(collection(firestore, 'chatRooms'), where('stats.monthlyGifts', '>', 0), orderBy('stats.monthlyGifts', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  const monthlyGamesQuery = useMemoFirebase(
    () => {
      if (!firestore || rankingType !== 'games' || period !== 'monthly') return null;
      return query(collection(firestore, 'users'), where('stats.monthlyGameWins', '>', 0), orderBy('stats.monthlyGameWins', 'desc'), limit(50));
    },
    [firestore, rankingType, period]
  );

  // --- Collection Hooks ---
  const { data: dailyRichUsers, isLoading: isLoadingDailyRich } = useCollection(dailyRichQuery);
  const { data: dailyCharmUsers, isLoading: isLoadingDailyCharm } = useCollection(dailyCharmQuery);
  const { data: dailyRankedRooms, isLoading: isLoadingDailyRooms } = useCollection(dailyRoomsQuery);
  const { data: dailyGameUsers, isLoading: isLoadingDailyGames } = useCollection(dailyGamesQuery);

  const { data: weeklyRichUsers, isLoading: isLoadingWeeklyRich } = useCollection(weeklyRichQuery);
  const { data: weeklyCharmUsers, isLoading: isLoadingWeeklyCharm } = useCollection(weeklyCharmQuery);
  const { data: weeklyRankedRooms, isLoading: isLoadingWeeklyRooms } = useCollection(weeklyRoomsQuery);
  const { data: weeklyGameUsers, isLoading: isLoadingWeeklyGames } = useCollection(weeklyGamesQuery);

  const { data: monthlyRichUsers, isLoading: isLoadingMonthlyRich } = useCollection(monthlyRichQuery);
  const { data: monthlyCharmUsers, isLoading: isLoadingMonthlyCharm } = useCollection(monthlyCharmQuery);
  const { data: monthlyRankedRooms, isLoading: isLoadingMonthlyRooms } = useCollection(monthlyRoomsQuery);
  const { data: monthlyGameUsers, isLoading: isLoadingMonthlyGames } = useCollection(monthlyGamesQuery);

  // --- Active Items based on period & type ---
  const activeItems = useMemo(() => {
    if (period === 'daily') {
      if (rankingType === 'rich') return dailyRichUsers;
      if (rankingType === 'charm') return dailyCharmUsers;
      if (rankingType === 'rooms') return dailyRankedRooms;
      if (rankingType === 'games') return dailyGameUsers;
    }
    if (period === 'weekly') {
      if (rankingType === 'rich') return weeklyRichUsers;
      if (rankingType === 'charm') return weeklyCharmUsers;
      if (rankingType === 'rooms') return weeklyRankedRooms;
      if (rankingType === 'games') return weeklyGameUsers;
    }
    if (period === 'monthly') {
      if (rankingType === 'rich') return monthlyRichUsers;
      if (rankingType === 'charm') return monthlyCharmUsers;
      if (rankingType === 'rooms') return monthlyRankedRooms;
      if (rankingType === 'games') return monthlyGameUsers;
    }
    return null;
  }, [period, rankingType, dailyRichUsers, dailyCharmUsers, dailyRankedRooms, dailyGameUsers, weeklyRichUsers, weeklyCharmUsers, weeklyRankedRooms, weeklyGameUsers, monthlyRichUsers, monthlyCharmUsers, monthlyRankedRooms, monthlyGameUsers]);

  // --- Active Loading ---
  const isActiveLoading = useMemo(() => {
    if (period === 'daily') {
      if (rankingType === 'rich') return isLoadingDailyRich;
      if (rankingType === 'charm') return isLoadingDailyCharm;
      if (rankingType === 'rooms') return isLoadingDailyRooms;
      if (rankingType === 'games') return isLoadingDailyGames;
    }
    if (period === 'weekly') {
      if (rankingType === 'rich') return isLoadingWeeklyRich;
      if (rankingType === 'charm') return isLoadingWeeklyCharm;
      if (rankingType === 'rooms') return isLoadingWeeklyRooms;
      if (rankingType === 'games') return isLoadingWeeklyGames;
    }
    if (period === 'monthly') {
      if (rankingType === 'rich') return isLoadingMonthlyRich;
      if (rankingType === 'charm') return isLoadingMonthlyCharm;
      if (rankingType === 'rooms') return isLoadingMonthlyRooms;
      if (rankingType === 'games') return isLoadingMonthlyGames;
    }
    return false;
  }, [period, rankingType, isLoadingDailyRich, isLoadingDailyCharm, isLoadingDailyRooms, isLoadingDailyGames, isLoadingWeeklyRich, isLoadingWeeklyCharm, isLoadingWeeklyRooms, isLoadingWeeklyGames, isLoadingMonthlyRich, isLoadingMonthlyCharm, isLoadingMonthlyRooms, isLoadingMonthlyGames]);

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

        <button 
          onClick={() => setShowInfo(true)}
          className="flex items-center justify-center w-10 h-10"
        >
          <HelpCircle className="h-5 w-5 text-white" />
        </button>
      </header>

      {/* Period Tabs - Left side, Back icon ke neeche */}
      <div className="relative z-50 px-4 pb-2">
        <div className="w-40">
          <PeriodTabs period={period} onChange={setPeriod} />
        </div>
      </div>

      <main className="relative z-10 flex-1 overflow-hidden">
        <RankingList items={activeItems} type={rankingType} isLoading={isActiveLoading} theme={activeTheme} period={period} />
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
