'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Loader,
  ChevronLeft,
  Wallet, 
  Disc3,
  Heart,
  Ticket,
  Theater,
  Shirt,
  CircleDollarSign,
  MoreHorizontal,
  Pencil,
  MessageCircle,
  ChevronRight,
  Sparkles,
  Settings as SettingsIcon,
  LogOut,
  Users,
  Gem,
  Calendar,
  Globe,
  Phone,
  Camera,
  ShieldAlert,
  Medal as MedalIcon,
  DollarSign,
  HelpCircle,
  Check,
  Crown,
  Gift,
  Activity as ActivityIcon
} from 'lucide-react';
import { GoldCoinIcon } from '@/components/icons';
import { AppLayout } from '@/components/layout/app-layout';
import { useUser, useDoc, useFirestore, useMemoFirebase, useCollection, deleteDocumentNonBlocking, setDocumentNonBlocking, useFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AvatarFrame } from '@/components/avatar-frame';
import { DirectMessageDialog } from '@/components/direct-message-dialog';
import { EditProfileDialog } from '@/components/edit-profile-dialog';
import { doc, serverTimestamp, collection, query, orderBy, limit, where, onSnapshot, runTransaction } from 'firebase/firestore';
import { SocialRelationsDialog } from '@/components/social-relations-dialog';
import { useTranslation } from '@/hooks/use-translation';
import { SellerTransferDialog } from "@/components/seller-transfer-dialog";
import { FullProfileDialog } from '@/components/full-profile-dialog';
import { ReportUserDialog } from '@/components/report-user-dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MEDAL_REGISTRY } from '@/constants/medals';
import { AVATAR_FRAMES } from '@/constants/avatar-frames';
import { VEHICLE_REGISTRY } from '@/constants/vehicles';

import { CompactVideoAvatarFrame } from '@/components/compact-video-avatar-frame';
import { ActiveIDBadge } from '@/components/id-badge';

// ============================================================
// ⚡ SMART BLACK BACKGROUND REMOVER ⚡
// ============================================================
const SmartBlackRemover = ({ 
  src, 
  type = 'image', 
  className = '', 
  style = {} 
}: { 
  src: string; 
  type?: 'image' | 'video'; 
  className?: string; 
  style?: React.CSSProperties;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [useCanvas, setUseCanvas] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const processingRef = useRef(false);
  const lastProcessedSrc = useRef('');
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const detectSolidBlackBg = (media: HTMLVideoElement | HTMLImageElement, width: number, height: number) => {
    if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) return false;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.drawImage(media, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const STRICT_BLACK = 30;
    const EDGE_CHECK = 0.08;
    const SOLID_THRESHOLD = 0.85;

    const checkEdge = (xStart: number, xEnd: number, yStart: number, yEnd: number) => {
      let blackCount = 0, total = 0;
      for (let y = yStart; y < yEnd; y++) {
        for (let x = xStart; x < xEnd; x++) {
          const i = (y * width + x) * 4;
          if (data[i] < STRICT_BLACK && data[i+1] < STRICT_BLACK && data[i+2] < STRICT_BLACK) {
            blackCount++;
          }
          total++;
        }
      }
      return blackCount / total >= SOLID_THRESHOLD;
    };

    const topSolid = checkEdge(0, width, 0, Math.floor(height * EDGE_CHECK));
    const bottomSolid = checkEdge(0, width, Math.floor(height * (1 - EDGE_CHECK)), height);
    const leftSolid = checkEdge(0, Math.floor(width * EDGE_CHECK), 0, height);
    const rightSolid = checkEdge(Math.floor(width * (1 - EDGE_CHECK)), width, 0, height);

    return topSolid && bottomSolid && leftSolid && rightSolid;
  };

  const processFrame = (video?: HTMLVideoElement) => {
    if (processingRef.current) return;
    processingRef.current = true;

    const canvas = canvasRef.current;
    const media = video || mediaRef.current;
    if (!canvas || !media) {
      processingRef.current = false;
      return;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) {
      processingRef.current = false;
      return;
    }

    const width = 'videoWidth' in media ? media.videoWidth : media.width;
    const height = 'videoHeight' in media ? media.videoHeight : media.height;

    if (!width || !height || width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) {
      processingRef.current = false;
      return;
    }

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(media, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const STRICT_BLACK = 25;
    const scale = 4;
    const scaledW = Math.ceil(width / scale);
    const scaledH = Math.ceil(height / scale);
    const visited = new Uint8Array(scaledW * scaledH);

    const isBlack = (sx: number, sy: number) => {
      const x = Math.min(sx * scale, width - 1);
      const y = Math.min(sy * scale, height - 1);
      const i = (y * width + x) * 4;
      return data[i] < STRICT_BLACK && data[i+1] < STRICT_BLACK && data[i+2] < STRICT_BLACK;
    };

    const queue: [number, number][] = [];
    
    for (let sx = 0; sx < scaledW; sx++) {
      if (isBlack(sx, 0)) { queue.push([sx, 0]); visited[0 * scaledW + sx] = 1; }
      if (isBlack(sx, scaledH - 1)) { queue.push([sx, scaledH - 1]); visited[(scaledH - 1) * scaledW + sx] = 1; }
    }
    for (let sy = 0; sy < scaledH; sy++) {
      if (isBlack(0, sy)) { queue.push([0, sy]); visited[sy * scaledW + 0] = 1; }
      if (isBlack(scaledW - 1, sy)) { queue.push([scaledW - 1, sy]); visited[sy * scaledW + (scaledW - 1)] = 1; }
    }

    const centerSX = Math.floor(scaledW / 2);
    const centerSY = Math.floor(scaledH / 2);
    if (isBlack(centerSX, centerSY) && !visited[centerSY * scaledW + centerSX]) {
      queue.push([centerSX, centerSY]);
      visited[centerSY * scaledW + centerSX] = 1;
    }

    let head = 0;
    while (head < queue.length) {
      const [sx, sy] = queue[head++];
      const neighbors: [number, number][] = [[sx-1, sy], [sx+1, sy], [sx, sy-1], [sx, sy+1]];
      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < scaledW && ny >= 0 && ny < scaledH) {
          const nidx = ny * scaledW + nx;
          if (!visited[nidx] && isBlack(nx, ny)) {
            visited[nidx] = 1;
            queue.push([nx, ny]);
          }
        }
      }
    }

    for (let sy = 0; sy < scaledH; sy++) {
      for (let sx = 0; sx < scaledW; sx++) {
        if (visited[sy * scaledW + sx]) {
          for (let dy = 0; dy < scale; dy++) {
            for (let dx = 0; dx < scale; dx++) {
              const x = sx * scale + dx, y = sy * scale + dy;
              if (x < width && y < height) {
                const i = (y * width + x) * 4;
                if (data[i] < STRICT_BLACK && data[i+1] < STRICT_BLACK && data[i+2] < STRICT_BLACK) {
                  data[i] = 0;
                  data[i+1] = 0;
                  data[i+2] = 0;
                  data[i+3] = 0;
                }
              }
            }
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    processingRef.current = false;

    if (type === 'video' && video) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => processFrame(video));
    }
  };

  useEffect(() => {
    if (src !== lastProcessedSrc.current) {
      setUseCanvas(false);
      setIsReady(false);
      lastProcessedSrc.current = src;
    }

    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    if (type === 'image' && mediaRef.current && 'complete' in mediaRef.current) {
      const img = mediaRef.current as HTMLImageElement;
      if (img.complete && img.naturalWidth > 0 && !isReady) {
        const hasBlackBg = detectSolidBlackBg(img, img.naturalWidth, img.naturalHeight);
        setUseCanvas(hasBlackBg);
        setIsReady(true);
        if (hasBlackBg) {
          setTimeout(() => processFrame(), 50);
        }
      }
    }

    loadTimeoutRef.current = setTimeout(() => {
      if (!isReady && mediaRef.current) {
        setIsReady(true);
        setUseCanvas(false);
      }
    }, 5000);

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [src, type, isReady]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.naturalWidth > 0) {
      const hasBlackBg = detectSolidBlackBg(img, img.naturalWidth, img.naturalHeight);
      setUseCanvas(hasBlackBg);
      setIsReady(true);
      if (hasBlackBg) {
        setTimeout(() => processFrame(), 50);
      }
    }
  };

  const handleImageError = () => {
    setIsReady(true);
    setUseCanvas(false);
  };

  const handleVideoReady = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
      const hasBlackBg = detectSolidBlackBg(video, video.videoWidth, video.videoHeight);
      setUseCanvas(hasBlackBg);
      setIsReady(true);
      if (hasBlackBg) {
        setTimeout(() => processFrame(video), 150);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      processingRef.current = false;
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  if (type === 'video') {
    return (
      <div className={cn("relative", className)} style={{ ...style, background: 'transparent' }}>
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          onLoadedData={handleVideoReady}
          className={useCanvas ? 'hidden' : 'w-full h-full object-cover'}
          style={{ display: useCanvas ? 'none' : 'block' }}
          crossOrigin="anonymous"
        />
        {useCanvas && (
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
            style={{ 
              display: isReady ? 'block' : 'none', 
              background: 'transparent',
              backgroundColor: 'transparent'
            }}
          />
        )}
        {!isReady && !useCanvas && (
          <video
            src={src}
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            crossOrigin="anonymous"
          />
        )}
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={{ ...style, background: 'transparent' }}>
      <img
        ref={mediaRef as React.RefObject<HTMLImageElement>}
        src={src}
        alt=""
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={useCanvas ? 'hidden' : 'w-full h-full object-cover'}
        style={{ display: useCanvas ? 'none' : 'block' }}
        crossOrigin="anonymous"
      />
      {useCanvas && (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
          style={{ 
            display: isReady ? 'block' : 'none', 
            background: 'transparent',
            backgroundColor: 'transparent'
          }}
        />
      )}
      {!isReady && !useCanvas && (
        <img
          src={src}
          alt=""
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

// ============================================================
// ⚡ DIRECT MEDIA WRAPPER ⚡
// ============================================================
const DirectMedia = ({ 
  src, 
  type = 'image', 
  className = '', 
  style = {} 
}: { 
  src: string; 
  type?: 'image' | 'video'; 
  className?: string; 
  style?: React.CSSProperties;
}) => {
  return (
    <div className={cn("relative", className)} style={{ ...style, background: 'transparent' }}>
      <SmartBlackRemover 
        src={src} 
        type={type} 
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />
    </div>
  );
};

// ============================================================
// ⚡ AVATAR FRAME WITH BLACK REMOVER - FRAME SIZE BADA, OVERLAP KAREGA ⚡
// ============================================================
const AvatarFrameWithBlackRemover = React.memo(({ 
  frameId, 
  frameMediaUrl, 
  size = 'xl',
  children 
}: { 
  frameId?: string; 
  frameMediaUrl?: string | null; 
  size?: 'xl' | 'lg' | 'md'; 
  children: React.ReactNode 
}) => {
  // CHANGE 1: Frame size bohot bada kar diya - 160px
  const sizeMap = {
    xl: { frame: 'h-[160px] w-[160px]' },
    lg: { frame: 'h-[140px] w-[140px]' },
    md: { frame: 'h-[120px] w-[120px]' },
  };
  
  const s = sizeMap[size] || sizeMap.xl;

  if (!frameMediaUrl) {
    return (
      <AvatarFrame frameId={frameId} frameMediaUrl={null} size={size}>
        {children}
      </AvatarFrame>
    );
  }

  const isVideo = frameMediaUrl && (frameMediaUrl.includes('.mp4') || frameMediaUrl.includes('video') || frameMediaUrl.includes('.webm') || frameMediaUrl.includes('.mov'));

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Avatar center mein */}
      <div className="z-10">
        {children}
      </div>
      
      {/* Frame upar overlap karega, center aligned */}
      <div 
        className="absolute pointer-events-none z-20 flex items-center justify-center"
        style={{ 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'transparent'
        }}
      >
        <div 
          className={s.frame}
          style={{ background: 'transparent' }}
        >
          <DirectMedia 
            src={frameMediaUrl} 
            type={isVideo ? 'video' : 'image'} 
            className="w-full h-full"
            style={{ background: 'transparent' }}
          />
        </div>
      </div>
    </div>
  );
});
AvatarFrameWithBlackRemover.displayName = 'AvatarFrameWithBlackRemover';

// ============================================================
// ⚡ SAARE SVG COMPONENTS ⚡
// ============================================================

const SVGA_OfficialTag = React.memo(() => (
  <div className="relative inline-flex items-center h-[20px] rounded-full p-[2px] ml-0.5" style={{
    background: 'linear-gradient(180deg, #ffe8b8 0%, #f5c57a 30%, #e4a95a 70%, #d08c3a 100%)',
    boxShadow: 'inset 0 1px 0 #fff5d6, inset 0 -1px 1px #a66a1e, 0 2px 6px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.15)'
  }}>
    <div className="relative w-full h-full rounded-full flex items-center pl-[22px] pr-2.5" style={{
      background: 'linear-gradient(180deg, #b82340 0%, #a81835 20%, #98142f 50%, #8a102b 85%, #7f0e27 100%)',
      boxShadow: 'inset 0 1px 2px rgba(255,200,210,0.22), inset 0 -2px 3px rgba(0,0,0,0.45)'
    }}>
      <div style={{
        content: '""',
        position: 'absolute',
        top: '1px',
        left: '8%',
        right: '8%',
        height: '48%',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.18) 35%, rgba(255,255,255,0.05) 70%, transparent 100%)',
        borderRadius: '20px 20px 80px 80px / 12px 12px 30px 30px',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        content: '""',
        position: 'absolute',
        left: '14%',
        right: '14%',
        bottom: '2px',
        height: '1px',
        background: 'linear-gradient(90deg, transparent, rgba(0,0,0,0.55), transparent)',
        opacity: 0.6
      }} />

      <div className="absolute left-[2px] top-1/2 -translate-y-1/2 z-[3]" style={{
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'radial-gradient(circle at 30% 30%, #ffc46a 0%, #ffb03a 35%, #f18c1f 65%, #d87312 100%)',
        border: '1px solid #e9a84a',
        boxShadow: '0 0 0 1px #3b1800, 0 0 0 1.5px #f3c26f, 0 0 0 2.2px #5b2700, inset 0 1.5px 2px rgba(255,255,225,0.75), inset 0 -2px 2.5px rgba(90,35,0,0.9), 0 1px 1.5px rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          position: 'absolute',
          inset: '2px',
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 22%, rgba(255,255,255,0.6), rgba(255,255,255,0.18) 38%, transparent 62%)',
          mixBlendMode: 'screen',
          pointerEvents: 'none'
        }} />
        <span className="relative z-10" style={{
          fontFamily: "Georgia, 'Times New Roman', Times, serif",
          fontWeight: 900,
          fontSize: '13px',
          lineHeight: 1,
          top: '-0.5px',
          background: 'linear-gradient(180deg, #fff9d1 0%, #ffe08a 25%, #f5c44e 55%, #e0a732 80%, #c98a1a 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          textShadow: '0 1px 0 #fff7c8, 0 1.5px 0 #d9a43a, 0 2px 1.5px rgba(90,42,0,0.6), 0 2.5px 2px rgba(0,0,0,0.7)'
        }}>
          U
          <span style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(180deg, #fffce8 0%, rgba(255,252,232,0) 38%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            opacity: 0.92
          }}>U</span>
        </span>
      </div>

      <span className="relative z-10" style={{
        fontFamily: "Georgia, 'Times New Roman', Times, serif",
        fontWeight: 900,
        fontSize: '11px',
        letterSpacing: '0.2px',
        lineHeight: 1,
        top: '-0.5px',
        marginLeft: '4px',
        background: 'linear-gradient(180deg, #fff9d1 0%, #ffe08a 25%, #f5c44e 55%, #e0a732 80%, #c98a1a 100%)',
        WebkitBackgroundClip: 'text',
        backgroundClip: 'text',
        color: 'transparent',
        textShadow: '0 1px 0 #fff7c8, 0 1.5px 0 #d9a43a, 0 2px 1.5px rgba(90,42,0,0.6), 0 2.5px 2px rgba(0,0,0,0.7)'
      }}>
        Official
        <span style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #fffde9 0%, rgba(255,253,233,0) 42%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          color: 'transparent',
          opacity: 0.94
        }}>Official</span>
      </span>
    </div>
  </div>
));
SVGA_OfficialTag.displayName = 'SVGA_OfficialTag';

const SVGA_SellerTag = React.memo(() => (
  <div className="relative inline-flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#FFAE00] via-[#FFC300] to-[#FF9500] shadow-[0_2px_8px_rgba(255,149,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.7)] px-2 border border-[#FFE1A8] ml-1 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[45%] bg-gradient-to-b from-white/70 to-transparent rounded-full blur-[0.5px]" />
    <div className="relative z-10 -ml-1 mr-1 flex items-center justify-center w-[14px] h-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="redBag" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF5F5F" />
            <stop offset="100%" stopColor="#C81E1E" />
          </linearGradient>
        </defs>
        <path d="M20 8 C16 8 14 11 14 13 L26 13 C26 11 24 8 20 8 Z" fill="#991B1B" />
        <path d="M12 14 C12 14 8 20 8 28 C8 34 12 36 20 36 C28 36 32 34 32 28 C32 20 28 14 28 14 Z" fill="url(#redBag)" />
        <text x="20" y="30" fontSize="15" fontWeight="900" fill="white" textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>$</text>
        <ellipse cx="14" cy="22" rx="3" ry="1.5" fill="white" fillOpacity="0.4" transform="rotate(-20 14 22)" />
      </svg>
    </div>
    <span className="relative z-10 text-[9px] font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
      Seller
    </span>
  </div>
));
SVGA_SellerTag.displayName = 'SVGA_SellerTag';

const SVGA_ServiceTag = React.memo(() => (
  <div className="relative inline-flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#17CFB8] via-[#10B9A4] to-[#0D9482] shadow-[0_2px_8px_rgba(23,207,184,0.3),inset_0_1px_2px_rgba(255,255,255,0.7)] px-2 border border-[#A7FFF1] ml-1 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[45%] bg-gradient-to-b from-white/70 to-transparent rounded-full blur-[0.5px]" />
    <div className="relative z-10 -ml-1 mr-1 flex items-center justify-center w-[14px] h-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="tealBubble" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#43F3D8" />
            <stop offset="100%" stopColor="#0ACAA8" />
          </linearGradient>
        </defs>
        <path d="M20 6 C12.27 6 6 12.27 6 20 C6 23.5 7.3 26.7 9.4 29.2 C9.8 29.7 9.9 30.4 9.7 31.0 L8.5 34.5 L12.2 33.6 C12.8 33.4 13.5 33.6 14.1 33.9 C15.9 34.9 17.9 35.5 20 35.5 C27.73 35.5 34 29.23 34 21.5 C34 13.77 27.73 6 20 6 Z" fill="url(#tealBubble)" />
        <path d="M 13 21 Q 20 27 27 21" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
    <span className="relative z-10 text-[9px] font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
      Service
    </span>
  </div>
));
SVGA_ServiceTag.displayName = 'SVGA_ServiceTag';

const SVGA_HostTag = React.memo(() => (
  <div className="relative inline-flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#B57AFF] via-[#9E60FA] to-[#803AF5] shadow-[0_2px_8px_rgba(158,96,250,0.3),inset_0_1px_2px_rgba(255,255,255,0.7)] px-2 border border-[#E0C6FF] ml-1 overflow-hidden">
    <div className="absolute top-[1px] left-[5%] right-[5%] h-[45%] bg-gradient-to-b from-white/70 to-transparent rounded-full blur-[0.5px]" />
    <div className="relative z-10 -ml-1 mr-1 flex items-center justify-center w-[14px] h-[14px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="balloonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#7C3AED" />
          </linearGradient>
        </defs>
        <path d="M 24 24 Q 24 30 22 34" fill="none" stroke="#D8B4FE" strokeWidth="2" strokeLinecap="round" />
        <path d="M 16 26 Q 16 32 18 36" fill="none" stroke="#D8B4FE" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="26" cy="18" r="8" fill="url(#balloonGrad)" />
        <circle cx="15" cy="16" r="10" fill="url(#balloonGrad)" />
        <path d="M 9 13 Q 12 8 16 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    </div>
    <span className="relative z-10 text-[9px] font-black text-white tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
      Host
    </span>
  </div>
));
SVGA_HostTag.displayName = 'SVGA_HostTag';

const SVGA_VIPBanner = React.memo(({ onClick }: { onClick: () => void }) => (
  <div
    onClick={onClick}
    className="relative w-full h-[75px] rounded-2xl overflow-hidden cursor-pointer active:scale-[0.98] transition-all duration-300 shadow-lg group mt-3 flex items-center px-4"
    style={{
      background: 'linear-gradient(90deg, #02C697 0%, #2087D6 50%, #9C3FE4 100%)',
    }}
  >
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-25deg] -translate-x-[150%] group-hover:animate-shine-slow" />

    <div className="relative flex items-center h-full w-24 shrink-0">
      <div className="absolute left-10 scale-75 opacity-80 rotate-[5deg]">
        <svg width="45" height="50" viewBox="0 0 45 50">
          <defs>
            <linearGradient id="pinkBadge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FF7EB3" />
              <stop offset="100%" stopColor="#E7227E" />
            </linearGradient>
          </defs>
          <path d="M22.5 0L45 12.5V37.5L22.5 50L0 37.5V12.5L22.5 0Z" fill="url(#pinkBadge)" />
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontSize="14" fontWeight="900">VIP</text>
        </svg>
      </div>

      <div className="absolute left-5 scale-90 -rotate-[5deg]">
        <svg width="45" height="50" viewBox="0 0 45 50">
          <defs>
            <linearGradient id="blueBadge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4FACFE" />
              <stop offset="100%" stopColor="#0066FF" />
            </linearGradient>
          </defs>
          <path d="M22.5 0L45 12.5V37.5L22.5 50L0 37.5V12.5L22.5 0Z" fill="url(#blueBadge)" />
          <text x="50%" y="60%" textAnchor="middle" fill="white" fontSize="14" fontWeight="900">VIP</text>
        </svg>
      </div>

      <div className="absolute left-0 z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]">
        <svg width="50" height="55" viewBox="0 0 50 55">
          <defs>
            <linearGradient id="greenBadge" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#5AF9B1" />
              <stop offset="100%" stopColor="#00AD69" />
            </linearGradient>
          </defs>
          <path d="M25 0L50 13.75V41.25L25 55L0 41.25V13.75L25 0Z" fill="url(#greenBadge)" stroke="white" strokeWidth="1.5" />
          <path d="M25 15 L18 25 L25 35 L32 25 Z" fill="white" fillOpacity="0.4" />
          <text x="50%" y="82%" textAnchor="middle" fill="white" fontSize="11" fontWeight="900" style={{ letterSpacing: '1px' }}>VIP</text>
        </svg>
      </div>
    </div>

    <div className="flex-1 flex flex-col justify-center ml-2 z-10">
      <div className="flex items-center gap-1">
        <h3 className="text-white font-black text-[18px] tracking-tight leading-tight">VIP Club</h3>
        <Sparkles className="h-3 w-3 text-white/70 animate-pulse" />
      </div>
      <p className="text-white/80 text-[10px] font-bold leading-tight mt-0.5">
        Upgrade to VIP and get free coins daily
      </p>
    </div>

    <div className="shrink-0 z-10">
      <div className="relative px-5 py-2.5 rounded-full bg-gradient-to-b from-[#FFE770] via-[#FDB931] to-[#9E7302] shadow-[0_4px_10px_rgba(0,0,0,0.2),inset_0_1px_2px_rgba(255,255,255,0.8)] active:scale-90 transition-transform">
        <span className="text-[#5C4000] font-black text-[12px] uppercase">Get VIP</span>
        <div className="absolute top-1 left-2 right-2 h-1.5 bg-white/40 rounded-full blur-[0.5px]" />
      </div>
    </div>

    <div className="absolute top-2 right-12 opacity-40">
      <Sparkles className="h-4 w-4 text-white" />
    </div>
  </div>
));
SVGA_VIPBanner.displayName = 'SVGA_VIPBanner';

const SVGA_GlossyID = React.memo(({ variant, label }: { variant: string, label: string }) => {
  const idNum = label? label.replace('ID: ', '').trim() : '000000';

  return (
    <div className="relative flex items-center h-[18px] rounded-full bg-gradient-to-r from-[#6b1e60] via-[#912480] to-[#b33596] shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_2px_rgba(255,255,255,0.4)] ml-1 pr-2.5 pl-[20px] border border-[#c157a8]">

      <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-[30px] h-[30px] z-10 flex items-center justify-center">
        <svg viewBox="0 0 60 60" className="w-full h-full drop-shadow-[0_3px_5px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="goldFrame" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FBE3A4" />
              <stop offset="40%" stopColor="#D2923A" />
              <stop offset="60%" stopColor="#F9D479" />
              <stop offset="100%" stopColor="#B37322" />
            </linearGradient>
            <linearGradient id="purpleGem" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D57EEB" />
              <stop offset="50%" stopColor="#8A2387" />
              <stop offset="100%" stopColor="#4A00E0" />
            </linearGradient>
            <linearGradient id="textGloss" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#F3E5F5" />
              <stop offset="100%" stopColor="#D1A3D8" />
            </linearGradient>
            <linearGradient id="goldS" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFF1AA" />
              <stop offset="100%" stopColor="#F3A92A" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <path d="M30 4 L54 18 L54 42 L30 56 L6 42 L6 18 Z" fill="url(#goldFrame)" />
          <path d="M30 8 L50 20 L50 40 L30 52 L10 40 L10 20 Z" fill="url(#purpleGem)" />
          <path d="M10 20 L30 8 L50 20 L30 28 Z" fill="white" fillOpacity="0.15" />

          <text x="30" y="38" fontFamily="sans-serif" fontWeight="900" fontSize="24" fill="url(#textGloss)" textAnchor="middle" letterSpacing="-1" style={{ textShadow: '0px 2px 4px rgba(0,0,0,0.6)' }}>ID</text>

          <path d="M18 45 C 24 58, 36 58, 42 45 C 36 52, 24 52, 18 45 Z" fill="url(#goldFrame)" />
          <path d="M22 43 L38 43 L34 54 L26 54 Z" fill="url(#goldFrame)" />

          <text x="30" y="52" fontFamily="sans-serif" fontWeight="900" fontSize="13" fill="url(#goldS)" textAnchor="middle" style={{ textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>S</text>

          <path d="M 45 10 Q 48 10 48 7 Q 48 10 51 10 Q 48 10 48 13 Q 48 10 45 10 Z" fill="white" filter="url(#glow)"/>
          <path d="M 12 38 Q 14 38 14 36 Q 14 38 16 38 Q 14 38 14 40 Q 14 38 12 38 Z" fill="white" filter="url(#glow)"/>
        </svg>
      </div>

      <div className="absolute top-[1px] left-[15%] right-[15%] h-[40%] bg-gradient-to-b from-white/60 to-transparent rounded-full blur-[0.5px]" />

      <span className="relative z-10 text-[10px] font-bold text-white ml-1.5 tracking-[0.1em] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
        {idNum}
      </span>
    </div>
  );
});
SVGA_GlossyID.displayName = 'SVGA_GlossyID';

const SVGA_GoldDollar = React.memo(() => (
  <div className="relative h-7 w-7 flex items-center justify-center rounded-full bg-gradient-to-b from-[#FFE770] via-[#FDB931] to-[#9E7302] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8),0_2px_6px_rgba(0,0,0,0.15)]">
    <DollarSign className="h-4 w-4 text-[#5C4000] drop-shadow-sm" strokeWidth={3} />
    <div className="absolute top-0.5 left-1 w-2 h-1 bg-white/40 rounded-full blur-[1px] rotate-[-20deg]" />
  </div>
));
SVGA_GoldDollar.displayName = 'SVGA_GoldDollar';

const SVGA_LevelCrown = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-8 w-8 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="crownGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFC837" />
          <stop offset="50%" stopColor="#FF8008" />
          <stop offset="100%" stopColor="#FF6A00" />
        </linearGradient>
      </defs>
      <path
        fill="url(#crownGradient)"
        d="M5,16 L3,5 L8.5,10 L12,4 L15.5,10 L21,5 L19,16 L5,16 Z M5,19 L19,19 C19,20.1 18.1,21 17,21 L7,21 C5.9,21 5,20.1 5,19 Z"
      />
      <rect x="9" y="13" width="6" height="1.5" rx="0.75" fill="white" fillOpacity="0.4" />
    </svg>
    <div className="absolute top-1 right-2 w-1.5 h-1 bg-white/60 rounded-full blur-[1px] rotate-[20deg]" />
  </div>
));
SVGA_LevelCrown.displayName = 'SVGA_LevelCrown';

const SVGA_StoreCart = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-8 w-8 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="cartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00D2FF" />
          <stop offset="100%" stopColor="#3a7bd5" />
        </linearGradient>
      </defs>
      <path
        fill="url(#cartGradient)"
        d="M7,18 C5.9,18 5.01,18.9 5.01,20 C5.01,21.1 5.9,22 7,22 C8.1,22 9,21.1 9,20 C9,18.9 8.1,18.1 7,18 Z M1,2 L1,4 L3,4 L6.6,11.59 L5.25,14.04 C5.09,14.32 5,14.65 5,15 C5,16.1 5.9,17 7,17 L19,17 L19,15 L7.42,15 C7.28,15 7.17,14.89 7.17,14.75 L7.2,14.63 L8.1,13 L15.55,13 C16.3,13 16.96,12.59 17.3,11.97 L20.88,5.48 C21.05,5.17 21,4.82 21,4.5 C21,4.22 20.78,4 20.5,4 L5.21,4 L4.27,2 L1,2 Z M17,18 C15.9,18 15.01,18.9 15.01,20 C15.01,21.1 15.9,22 17,22 C18.1,22 19,21.1 19,20 C19,18.9 18.1,18.1 17,18 Z"
      />
    </svg>
    <div className="absolute top-2 left-2 w-2 h-1 bg-white/40 rounded-full blur-[1px] rotate-[-20deg]" />
  </div>
));
SVGA_StoreCart.displayName = 'SVGA_StoreCart';

const SVGA_MedalStar = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-lg">
      <defs>
        <linearGradient id="medalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#9333EA" />
        </linearGradient>
      </defs>
      <path d="M8,2 L16,2 L15,5 L9,5 Z" fill="#7E22CE" />
      <circle cx="12" cy="13" r="8" fill="url(#medalGradient)" />
      <path
        fill="white"
        fillOpacity="0.9"
        d="M12,9.5 L13.2,12.1 L16,12.4 L13.9,14.2 L14.5,17 L12,15.5 L9.5,17 L10.1,14.2 L8,12.4 L10.8,12.1 Z"
      />
      <path
        d="M7,10 A6,6 0 0 1 17,10"
        fill="none"
        stroke="white"
        strokeWidth="0.5"
        strokeLinecap="round"
        className="opacity-40"
      />
    </svg>
    <div className="absolute top-3 left-3 w-3 h-1.5 bg-white/30 rounded-full blur-[2px] rotate-[-25deg]" />
  </div>
));
SVGA_MedalStar.displayName = 'SVGA_MedalStar';

const SVGA_BonusGift = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-9 w-9 flex items-center justify-center", className)}>
    <svg viewBox="0 0 24 24" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="giftBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FB923C" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
        <linearGradient id="ribbonBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      </defs>
      <rect x="4" y="9" width="16" height="11" rx="2" fill="url(#giftBg)" stroke="#C2410C" strokeWidth="0.5" />
      <rect x="3" y="6" width="18" height="3" rx="1.5" fill="url(#giftBg)" stroke="#C2410C" strokeWidth="0.5" />
      <rect x="11" y="6" width="2" height="14" fill="url(#ribbonBg)" />
      <rect x="3" y="7" width="18" height="1" fill="url(#ribbonBg)" />
      <path d="M12,6 C10,3 10,1 12,3 C14,1 14,3 12,6 Z" fill="url(#ribbonBg)" stroke="#CA8A04" strokeWidth="0.5" />
      <path d="M12,6 C9,5 7,6 9,8 C11,10 11,8 12,6 Z" fill="url(#ribbonBg)" stroke="#CA8A04" strokeWidth="0.5" />
      <path d="M12,6 C15,5 17,6 15,8 C13,10 13,8 12,6 Z" fill="url(#ribbonBg)" stroke="#CA8A04" strokeWidth="0.5" />
    </svg>
    <div className="absolute top-2 left-3 w-3 h-1.5 bg-white/40 rounded-full blur-[1px] rotate-[-25deg]" />
  </div>
));
SVGA_BonusGift.displayName = 'SVGA_BonusGift';

const SVGA_InviteHeart = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="pinkBg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF9EB5" />
          <stop offset="100%" stopColor="#FF5C8A" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="32" height="32" rx="10" fill="url(#pinkBg)" />
      <path d="M8,14 L20,24 L32,14 V28 C32,29.1 31.1,30 30,30 H10 C8.9,30 8,29.1 8,28 V14 Z" fill="white" />
      <path d="M20,24 L8,14 H32 L20,24 Z" fill="#FFD1DC" />
      <path
        fill="#FF5C8A"
        d="M20,22 C20,22 18.5,20.5 17.5,20.5 C16.5,20.5 15.5,21.3 15.5,22.5 C15.5,24 18,26 20,27 C22,26 24.5,24 24.5,22.5 C24.5,21.3 23.5,20.5 22.5,20.5 C21.5,20.5 20,22 20,22 Z"
      />
    </svg>
    <div className="absolute top-2 right-3 w-3 h-1.5 bg-white/40 rounded-full blur-[1px] rotate-[25deg]" />
  </div>
));
SVGA_InviteHeart.displayName = 'SVGA_InviteHeart';

const SVGA_FamilyShield = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="bronzeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#CD7F32" />
          <stop offset="100%" stopColor="#8B4513" />
        </linearGradient>
      </defs>
      <path
        fill="url(#bronzeGradient)"
        d="M10,6 H30 V26 C30,26 20,34 20,34 C20,34 10,26 10,26 V6 Z"
        stroke="#5D2E0A"
        strokeWidth="1"
      />
      <rect x="8" y="4" width="24" height="4" rx="2" fill="#5D2E0A" />
      <circle cx="20" cy="16" r="3.5" fill="#FFE4D1" />
      <circle cx="14" cy="19" r="3.5" fill="#FFE4D1" opacity="0.8" />
      <circle cx="26" cy="19" r="3.5" fill="#FFE4D1" opacity="0.8" />
      <path d="M20,20 Q20,26 26,26 H14 Q20,26 20,20" fill="#FFE4D1" />
    </svg>
    <div className="absolute top-8 left-10 w-2 h-1 bg-white/30 rounded-full blur-[1px]" />
  </div>
));
SVGA_FamilyShield.displayName = 'SVGA_FamilyShield';

const SVGA_BagShirt = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="purpleShirt" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#B678FF" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
      </defs>
      <path
        d="M10,12 L16,8 L24,8 L30,12 L34,22 L28,26 L28,34 C28,35.1 27.1,36 26,36 L14,36 C12.9,36 12,35.1 12,34 L12,26 L6,22 Z"
        fill="url(#purpleShirt)"
      />
      <path
        d="M22,18 C22,18 26,18 26,22 C26,24 24,26 24,26 C24,26 22,24 22,22 Z"
        fill="white"
        opacity="0.8"
      />
    </svg>
    <div className="absolute top-2 left-3 w-4 h-1.5 bg-white/40 rounded-full blur-[1px] rotate-[-15deg]" />
  </div>
));
SVGA_BagShirt.displayName = 'SVGA_BagShirt';

const SVGA_CpHeart = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="cpPink" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF6B9E" />
          <stop offset="100%" stopColor="#FF1463" />
        </linearGradient>
      </defs>
      <path
        d="M20,34 C20,34 6,24 6,14 C6,8.5 10.5,4 16,4 C18.5,4 20,6 20,6 C20,6 21.5,4 24,4 C29.5,4 34,8.5 34,14 C34,24 20,34 20,34 Z"
        fill="url(#cpPink)"
      />
      <path
        d="M12,18 L18,14 C19,13 21,13 22,14 L24,16 M14,22 L22,16 M16,26 L24,20 M18,30 L26,24"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.9"
      />
    </svg>
    <div className="absolute top-3 right-4 w-4 h-1.5 bg-white/40 rounded-full blur-[1px] rotate-[30deg]" />
  </div>
));
SVGA_CpHeart.displayName = 'SVGA_CpHeart';

const SVGA_SellerBag = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-xl">
      <defs>
        <linearGradient id="sellerRed" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FF5F5F" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
        <radialGradient id="bagGloss" cx="30%" cy="30%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      <path
        d="M20,6 C16,6 14,9 14,12 C14,14 16,15 18,15 L22,15 C24,15 26,14 26,12 C26,9 24,6 20,6 Z"
        fill="#991B1B"
      />
      <path
        d="M10,16 C10,16 6,20 6,28 C6,34 10,36 20,36 C30,36 34,34 34,28 C34,20 30,16 30,16 L10,16 Z"
        fill="url(#sellerRed)"
      />
      <circle cx="20" cy="27" r="6" fill="white" fillOpacity="0.2" />
      <text x="20" y="31" fontSize="14" fontWeight="900" fill="white" textAnchor="middle" style={{ fontFamily: 'sans-serif' }}>$</text>
      <ellipse cx="14" cy="22" rx="4" ry="2" fill="url(#bagGloss)" transform="rotate(-20, 14, 22)" />
    </svg>
  </div>
));
SVGA_SellerBag.displayName = 'SVGA_SellerBag';

const SVGA_Settings = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-lg">
      <defs>
        <linearGradient id="settingsBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C7D2FE" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
      </defs>
      <path
        d="M20,6 L32.99,13.5 V28.5 L20,36 L7.01,28.5 V13.5 L20,6 Z"
        fill="url(#settingsBlue)"
      />
      <circle cx="20" cy="21" r="5" fill="white" />
      <path
        d="M12,14 Q20,10 28,14"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.4"
        fill="none"
      />
    </svg>
  </div>
));
SVGA_Settings.displayName = 'SVGA_Settings';

const SVGA_HelpCenter = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="helpBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0EA5E9" />
        </linearGradient>
      </defs>
      <path
        d="M10,8 H30 C32.2,8 34,9.8 34,12 V26 C34,28.2 32.2,30 30,30 H22 L20,33 L18,30 H10 C7.8,30 6,28.2 6,26 V12 C6,9.8 7.8,8 10,8 Z"
        fill="url(#helpBlue)"
      />
      <rect x="18.5" y="13" width="3" height="9" rx="1.5" fill="white" />
      <circle cx="20" cy="26" r="2" fill="white" />
      <path
        d="M10,12 Q20,9 30,12"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.5"
        fill="none"
      />
    </svg>
  </div>
));
SVGA_HelpCenter.displayName = 'SVGA_HelpCenter';

const SVGA_OfficialUser = React.memo(({ className }: { className?: string }) => (
  <div className={cn("relative h-11 w-11 flex items-center justify-center", className)}>
    <svg viewBox="0 0 40 40" className="h-full w-full drop-shadow-md">
      <defs>
        <linearGradient id="officialOrange" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="100%" stopColor="#FF8C00" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="30" height="30" rx="10" fill="url(#officialOrange)" />
      <circle cx="20" cy="16" r="6" fill="white" />
      <path d="M10,30 C10,25 14,23 20,23 C26,23 30,25 30,30 V32 H10 V30 Z" fill="white" />
      <circle cx="30" cy="30" r="5" fill="#4ADE80" stroke="#FF8C00" strokeWidth="1.5" />
      <path d="M30,27 V33 M27,30 H33" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
    <div className="absolute top-3 left-3 w-3 h-1.5 bg-white/40 rounded-full blur-[1px] rotate-[-20deg]" />
  </div>
));
SVGA_OfficialUser.displayName = 'SVGA_OfficialUser';

// ============================================================
// ⚡ HELPER FUNCTIONS & CONSTANTS ⚡
// ============================================================

const CREATOR_ID = '901piBzTQ0VzCtAvlyyobwvAaTs1';

const getBudgetVariant = (profile: any) => {
  if (profile.id === CREATOR_ID || profile.tags?.includes('Official')) return 'rainbow';
  if (profile.idColor && profile.idColor !== 'none') return profile.idColor;
  return 'none';
};

const formatCompactNumber = (num: number) => {
  if (!num || num === 0) return '0';
  const formatter = Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
  return formatter.format(num);
};

const calculateAge = (birthday: string) => {
  if (!birthday) return null;
  const birthDate = new Date(birthday);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const GenderAgeTag = React.memo(({ gender, birthday }: { gender: string | null | undefined, birthday?: string }) => {
  const age = calculateAge(birthday || '');
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-full shadow-sm shrink-0",
      gender === 'Female' ? "bg-pink-500" : "bg-blue-500"
    )}>
      <span className="text-[10px] font-bold text-white leading-none">{gender === 'Female' ? '♀' : '♂'}</span>
      {age !== null && <span className="text-[10px] font-bold text-white leading-none">{age}</span>}
    </div>
  );
});
GenderAgeTag.displayName = 'GenderAgeTag';

const StatItem = React.memo(({ label, value, onClick }: { label: string, value: number, onClick?: () => void }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center py-1 active:scale-95 transition-transform min-w-[60px] group">
    <span className="text-[20px] font-semibold text-slate-800 leading-none mb-1 group-hover:text-slate-900 transition">{formatCompactNumber(value)}</span>
    <span className="text-[9px] font-black text-slate-400 tracking-wider uppercase group-hover:text-slate-500">{label}</span>
  </button>
));
StatItem.displayName = 'StatItem';

const IconButton = React.memo(({ icon: Icon, label, iconColor, onClick, customIcon: CustomIcon }: { icon?: any, label: string, iconColor?: string, onClick: () => void, customIcon?: any }) => (
  <button onClick={onClick} className="flex flex-col items-center gap-1.5 transition-transform active:scale-95 group">
    <div className="flex items-center justify-center p-1 transition-all">
      {CustomIcon ? (
        <CustomIcon className="transition-all group-hover:scale-105" />
      ) : (
        <Icon className={cn("h-7 w-7 transition-all group-hover:scale-105", iconColor)} />
      )}
    </div>
    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-slate-700">{label}</span>
  </button>
));
IconButton.displayName = 'IconButton';

const ProfileMenuItem = React.memo(({ icon: Icon, label, extra, iconColor, onClick, destructive, extraColor, customIcon: CustomIcon }: { icon?: any, label: string, extra?: string, iconColor?: string, onClick: () => void, destructive?: boolean, extraColor?: string, customIcon?: any }) => (
  <button onClick={onClick} className="w-full flex items-center justify-between py-4 pl-4 pr-3 hover:bg-slate-50/80 active:bg-slate-100/50 transition-all text-left group border-b border-slate-50 last:border-0">
    <div className="flex items-center gap-4">
      <div className={cn("p-1.5 rounded-xl transition-colors shrink-0", iconColor || "bg-slate-100 text-slate-500 group-hover:scale-105")}>
        {CustomIcon ? <CustomIcon /> : <Icon className="h-6 w-6" />}
      </div>
      <span className={cn("font-medium text-[16px]", destructive ? "text-red-500" : "text-[#1F2937]")}>{label}</span>
    </div>
    <div className="flex items-center gap-1">
      {extra && <span className={cn("text-[11px] font-medium uppercase tracking-wider", extraColor || "text-slate-300")}>{extra}</span>}
      <ChevronRight className="h-4 w-4 text-slate-300 group-hover:translate-x-0.5 transition-transform" />
    </div>
  </button>
));
ProfileMenuItem.displayName = 'ProfileMenuItem';

// ============================================================
// ⚡ MEDAL MODAL ⚡
// ============================================================
const MedalModal = React.memo(({ open, onClose, profile }: { open: boolean, onClose: () => void, profile: any }) => {
  const [activeTab, setActiveTab] = useState<'Achievement' | 'Gift' | 'Activity'>('Achievement');
  const firestore = useFirestore();

  const medalsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "medals"));
  }, [firestore]);

  const { data: medalsData, isLoading } = useCollection(medalsQuery);

  const medals = useMemo(() => {
    if (!medalsData) return [];
    return [...medalsData].sort((a: any, b: any) => {
      const timeA = a.updatedAt?.toDate?.()?.getTime() || a.updatedAt?.seconds || 0;
      const timeB = b.updatedAt?.toDate?.()?.getTime() || b.updatedAt?.seconds || 0;
      return timeB - timeA;
    });
  }, [medalsData]);

  if (!open) return null;

  const currentTabLower = activeTab.toLowerCase();
  const filteredMedals = (medals || []).filter((m: any) => m.category === currentTabLower);
  const userMedalIds = profile?.medals || [];

  const obtainedMedals = (medals || []).filter((m: any) => userMedalIds.includes(m.id));

  return (
    <div className="fixed inset-0 z-[999] bg-[#0A0217] text-white flex flex-col font-outfit overflow-hidden animate-in fade-in duration-200 pt-6">
      
      <div className="flex items-center px-4 h-14 relative shrink-0">
        <ChevronLeft className="h-6 w-6 cursor-pointer active:scale-90 transition-transform" onClick={onClose} />
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[17px] font-medium tracking-wide">Medal</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-10 custom-scrollbar">
        <div className="flex items-center justify-center gap-3 mt-6 text-[#cfb284] text-[13px] font-medium">
          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#cfb284]/60"></div>
          <span className="tracking-widest uppercase">Current Medal</span>
          <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#cfb284]/60"></div>
        </div>

        <div className="grid grid-cols-5 gap-3 px-6 mt-6">
          {Array.from({length: 10}).map((_, i) => {
            const medal = obtainedMedals[i];
            return (
              <div key={i} className="aspect-square rounded-xl bg-white/[0.02] border border-white/[0.08] flex items-center justify-center shadow-inner overflow-hidden relative">
                {medal ? (
                  medal.imageUrl && (medal.imageUrl.includes('.mp4') || medal.imageUrl.includes('video') || medal.imageUrl.includes('.webm')) ? (
                    <video src={medal.imageUrl} autoPlay loop muted playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={medal.imageUrl} alt={medal.name} className="w-full h-full object-cover" loading="lazy" />
                  )
                ) : (
                  <span className="text-[#cfb284]/50 text-xl font-light">+</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 mb-4 flex justify-center">
          <div className="relative overflow-hidden group px-6 py-1.5 rounded-full border border-blue-500/30 bg-gradient-to-r from-blue-900/20 via-blue-800/20 to-blue-900/20 shadow-[0_0_15px_rgba(30,58,138,0.3)]">
            <span className="text-sm text-indigo-200/90 font-medium">Obtained Medal(s): {userMedalIds.length} </span>
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-blue-400/50 to-transparent" />
          </div>
        </div>

        <div className="flex justify-around mt-6 border-b border-white/10 px-4">
          {['Achievement', 'Gift', 'Activity'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)} 
              className={`pb-3 font-semibold text-[15px] tracking-wide transition-colors ${activeTab === tab ? 'border-b-2 border-[#fcd34d] text-[#fcd34d]' : 'text-white/50 hover:text-white/80'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader className="h-8 w-8 animate-spin text-[#fcd34d]" />
            <p className="text-xs text-white/40 uppercase tracking-widest font-black">Syncing Medals...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 p-4 mt-2">
            {filteredMedals.map((medal: any) => {
              const isOwned = userMedalIds.includes(medal.id);
              const isVideo = medal.imageUrl && (medal.imageUrl.includes('.mp4') || medal.imageUrl.includes('video') || medal.imageUrl.includes('.webm') || medal.imageUrl.includes('.mov') || medal.imageUrl.includes('m3u8'));

              return (
                <div 
                  key={medal.id} 
                  className={cn(
                    "bg-[#150a24] rounded-2xl p-4 flex flex-col items-center border border-white/5 shadow-lg relative overflow-hidden transition-all",
                    !isOwned && "opacity-30 grayscale"
                  )}
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-slate-400/30 to-transparent" />
                  <div className="h-24 w-24 bg-gradient-to-br from-slate-200 via-slate-400 to-slate-600 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(255,255,255,0.15)] p-1 overflow-hidden relative">
                    <div className="h-full w-full rounded-full border border-white/40 flex items-center justify-center bg-[#0d041c] overflow-hidden relative">
                      {medal.imageUrl ? (
                        isVideo ? (
                          <video 
                            src={medal.imageUrl} 
                            autoPlay 
                            loop 
                            muted 
                            playsInline 
                            className="w-full h-full object-cover scale-105" 
                          />
                        ) : (
                            <img 
                              src={medal.imageUrl} 
                              alt={medal.name} 
                              className="w-full h-full object-cover scale-105" 
                              loading="lazy"
                            />
                        )
                      ) : (
                        <div className="flex flex-col items-center text-white/50">
                          {activeTab === 'Achievement' ? <Crown className="h-10 w-10 text-yellow-400" /> :
                           activeTab === 'Gift' ? <Gift className="h-10 w-10 text-pink-400" /> :
                           <ActivityIcon className="h-10 w-10 text-green-400" />}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex text-[#fcd34d] text-[10px] mb-1.5 tracking-widest drop-shadow-sm">
                    {medal.tier === 'legendary' ? '★★★★★' : medal.tier === 'epic' ? '★★★★' : medal.tier === 'rare' ? '★★★' : '★★'}
                  </div>
                  <span className="text-[13px] font-bold text-white tracking-wide text-center truncate w-full">{medal.name}</span>
                  {medal.description && <span className="text-[9px] text-white/40 mt-1 text-center line-clamp-1 w-full">{medal.description}</span>}
                </div>
              );
            })}

            {filteredMedals.length === 0 && (
              <div className="col-span-2 text-center py-20 text-white/40">
                <p className="text-xs uppercase tracking-widest font-black">No medals available yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
MedalModal.displayName = 'MedalModal';


// ============================================================
// ⚡ MAIN PROFILE COMPONENT ⚡
// ============================================================

export default function ProfileView({ profileId, mode = 'public' }: { profileId: string; mode?: 'public' | 'editable' }) {
  const router = useRouter();
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user: currentUser, isUserLoading } = useUser();
  const { userProfile: profile, isLoading: isProfileLoading } = useUserProfile(profileId || undefined);

  const [liveID, setLiveID] = useState<string | null>(null);
  const [isProcessingFollow, setIsProcessingFollow] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [socialTab, setSocialTab] = useState<'followers' | 'following' | 'friends' | 'visitors'>('followers');
  const [fullViewOpen, setFullViewOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [medalModalOpen, setMedalModalOpen] = useState(false);

  const isOwnProfile = currentUser?.uid === profileId;

  const fansQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'followers'), where('followingId', '==', profileId));
  }, [firestore, profileId]);

  const followingQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'followers'), where('followerId', '==', profileId));
  }, [firestore, profileId]);

  const visitorsQuery = useMemoFirebase(() => {
    if (!firestore || !profileId) return null;
    return query(collection(firestore, 'users', profileId, 'profileVisitors'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore, profileId]);

  const { data: fansData } = useCollection(fansQuery);
  const { data: followingData } = useCollection(followingQuery);
  const { data: visitorsData } = useCollection(visitorsQuery);

  const stats = useMemo(() => {
    const fans = fansData?.length || 0;
    const following = followingData?.length || 0;
    const visitors = visitorsData?.length || 0;
    const fanIds = new Set(fansData?.map(f => f.followerId) || []);
    const followingIds = followingData?.map(f => f.followingId) || [];
    const friends = followingIds.filter(id => fanIds.has(id)).length;
    return { fans, following, friends, visitors };
  }, [fansData, followingData, visitorsData]);

  const isAuthorizedAdmin = currentUser?.uid === CREATOR_ID || profile?.isAdmin === true;
  const isCertifiedSeller = profile?.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) || isAuthorizedAdmin;

  useEffect(() => {
    if (!firestore || !currentUser || !profileId || isOwnProfile) return;
    const recordVisit = async () => {
      try {
        const visitRef = doc(firestore, 'users', profileId, 'profileVisitors', currentUser.uid);
        await setDocumentNonBlocking(visitRef, { visitorId: currentUser.uid, timestamp: serverTimestamp() }, { merge: true });
      } catch (e) { console.error(e); }
    };
    recordVisit();
  }, [firestore, currentUser, profileId, isOwnProfile]);

  useEffect(() => {
    if (!firestore || !profileId) return;
    const userRef = doc(firestore, 'users', profileId);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        setLiveID(snap.data().accountNumber || null);
      }
    });
    return () => unsubscribe();
  }, [firestore, profileId]);

  const [fallbackID] = useState(() => {
    if (profileId === CREATOR_ID) return '0000';
    let hash = 0;
    const str = profileId || 'fallback';
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash % 900000) + 100000).toString();
  });

  const currentDBId = liveID || profile?.accountNumber;
  const isCorrectFormat = /^\d{6}$/.test(String(currentDBId)) || (profileId === CREATOR_ID && String(currentDBId) === '0000');
  const displayID = isCorrectFormat ? String(currentDBId) : fallbackID;

  useEffect(() => {
    const syncUserID = async () => {
      if (!isOwnProfile || !profile || !firestore || !profileId) return;
      
      const currentID = profile.accountNumber;
      const isStrictlySixDigits = /^\d{6}$/.test(String(currentID));
      const isCreator = profileId === CREATOR_ID;

      if (isCreator && currentID === '0000') {
        return;
      }

      if (!isCreator && currentID && isStrictlySixDigits) {
        return;
      }

      let finalNumber = '';
      try {
        await runTransaction(firestore, async (transaction) => {
          const uRef = doc(firestore, 'users', profileId);
          const userSnap = await transaction.get(uRef);

          if (userSnap.exists()) {
            const dbID = userSnap.data().accountNumber;
            const isDbIdValid = /^\d{6}$/.test(String(dbID));

            if ((isCreator && dbID === '0000') || (!isCreator && dbID && isDbIdValid)) {
              return;
            }
          }

          finalNumber = '';

          if (isCreator) {
            finalNumber = '0000';
          } else {
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;
            
            while (!isUnique && attempts < maxAttempts) {
              const randomID = Math.floor(100000 + Math.random() * 900000).toString();
              const idRef = doc(firestore, 'assigned_ids', randomID);
              const idSnap = await transaction.get(idRef);

              if (!idSnap.exists()) {
                transaction.set(idRef, { 
                  uid: profileId, 
                  createdAt: serverTimestamp(),
                  lockedPermanently: true
                });
                finalNumber = randomID;
                isUnique = true;
              }
              attempts++;
            }

            if (!isUnique) {
              const fallbackRandom = Math.floor(100000 + Math.random() * 900000).toString();
              finalNumber = fallbackRandom;
            }
          }

          const pRef = doc(firestore, 'users', profileId, 'profile', profileId);
          transaction.update(uRef, { 
            accountNumber: finalNumber,
            accountNumberLocked: true,
            accountNumberLockedAt: serverTimestamp()
          });
          transaction.update(pRef, { 
            accountNumber: finalNumber,
            accountNumberLocked: true
          });
        });
        
        console.log('✅ ID permanently locked:', finalNumber);
      } catch (err: any) {
        console.warn("❌ ID Generation mein error: ", err);
      }
    };

    syncUserID();
  }, [isOwnProfile, profile, firestore, profileId]);

  const followRef = useMemoFirebase(() => {
    if (!firestore || !currentUser || !profileId || currentUser.uid === profileId) return null;
    return doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
  }, [firestore, currentUser, profileId]);
  const { data: followData } = useDoc(followRef);

  const handleFollow = async () => {
    if (!firestore || !currentUser || !profileId || isProcessingFollow) return;
    setIsProcessingFollow(true);
    const fRef = doc(firestore, 'followers', `${currentUser.uid}_${profileId}`);
    try {
      if (followData) {
        await deleteDocumentNonBlocking(fRef);
        toast({ title: 'Unfollowed' });
      } else {
        await setDocumentNonBlocking(fRef, { followerId: currentUser.uid, followingId: profileId, timestamp: serverTimestamp() }, { merge: true });
        toast({ title: 'Following' });
      }
    } catch (e) { console.error(e); } finally { setIsProcessingFollow(false); }
  };

  const handleCopyId = () => {
    if (!displayID || displayID === "Syncing...") return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(displayID).then(() => {
        toast({ title: 'ID Copied' });
      }).catch(() => {});
    }
  };

  const handleWhatsAppInvite = () => {
    const inviteMessage = encodeURIComponent(`Hey! Download Ummy Chat and join me! My ID is: ${displayID}`);
    window.open(`https://wa.me/?text=${inviteMessage}`, '_blank');
  };

  const activeFrameMediaUrl = useMemo(() => {
    const inv = profile?.inventory as any;
    if (!inv?.activeFrameMediaUrl) return null;
    return inv.activeFrameMediaUrl;
  }, [profile?.inventory]);

  const handleBagClick = () => {
    router.push('/store?filter=purchased');
  };

  if (isUserLoading || isProfileLoading || !profile) return (
    <AppLayout>
      <div className="flex h-full w-full flex-col items-center justify-center bg-white space-y-4">
        <Loader className="animate-spin h-10 w-10 text-slate-300" />
        <p className="text-[10px] font-outfit font-black uppercase text-slate-400">Syncing Identity...</p>
      </div>
    </AppLayout>
  );

  if (!isOwnProfile) {
    return (
      <FullProfileDialog
        open={true}
        onOpenChange={(open) => {
          if (!open) router.back();
        }}
        profile={profile}
        stats={stats}
        followData={followData}
        onFollow={handleFollow}
        isProcessingFollow={isProcessingFollow}
        isOwnProfile={false}
        displayId={displayID}
      />
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col h-full overflow-hidden bg-white font-outfit text-[13px] relative">
        <div className="absolute top-0 left-0 right-0 flex flex-col z-0 pointer-events-none">
          <div className="h-[3vh] bg-purple-400" />
          <div className="h-[25vh] bg-gradient-to-b from-purple-400 via-purple-300/40 to-transparent" />
        </div>

        <header className="absolute top-0 right-0 z-[100] bg-transparent px-6 pt-10 pb-0">
          <div className="flex items-center justify-end max-w-[440px] mx-auto">
             {isOwnProfile && (
               <EditProfileDialog profile={profile} trigger={
                 <button className="p-2 active:scale-90 transition-all hover:opacity-70"><Pencil className="h-6 w-6 text-slate-600 drop-shadow-sm" /></button>
               }/>
             )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth pt-14 z-10 relative mt-2">
          <div className="max-w-[440px] mx-auto px-5">
            <div className="flex items-center gap-1 mb-0 pt-0">
              {/* CHANGE 2: marginLeft hata diya - ab avatar left shift nahi hoga */}
              <div onClick={() => setFullViewOpen(true)} className="shrink-0 cursor-pointer active:scale-95 transition-transform">
                  <AvatarFrameWithBlackRemover 
                    frameId={profile.inventory?.activeFrame} 
                    frameMediaUrl={activeFrameMediaUrl}
                    size="xl"
                  >
                    <Avatar className="h-[88px] w-[88px] border-2 border-white shadow-xl rounded-full ring-1 ring-slate-200">
                      <AvatarImage src={profile.avatarUrl} className="object-cover" />
                      <AvatarFallback className="text-3xl font-bold bg-slate-50 text-slate-300">{(profile.username || 'U').charAt(0)}</AvatarFallback>
                    </Avatar>
                  </AvatarFrameWithBlackRemover>
              </div>
              <div className="flex-1 min-w-0 -ml-1 pt-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-[22px] font-bold text-slate-800 tracking-tighter leading-none truncate">{profile.username}</h2>
                  <span className="text-lg">🇮🇳</span>
                  <GenderAgeTag gender={profile.gender} birthday={profile.birthday} />
                </div>
                
                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  <div onClick={handleCopyId} className="cursor-pointer active:opacity-60 transition-opacity">
                    {profile.inventory?.activeIdBadge ? (
                      <ActiveIDBadge badgeData={profile.inventory.activeIdBadge} fallbackNumber={displayID} />
                    ) : profile.tags?.includes('Official') ? (
                      <SVGA_GlossyID
                        variant={getBudgetVariant(profile)}
                        label={`ID: ${displayID}`}
                      />
                    ) : (
                      <span className="text-[12px] font-bold text-slate-600 bg-slate-100/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
                        ID: {displayID}
                      </span>
                    )}
                  </div>

                  {profile.tags?.includes('Official') && <SVGA_OfficialTag />}
                  {profile.tags?.some((t: string) => ['Seller', 'Seller center', 'Coin Seller'].includes(t)) && <SVGA_SellerTag />}
                  {profile.tags?.includes('Service') && <SVGA_ServiceTag />}
                  {profile.tags?.includes('Host') && <SVGA_HostTag />}
                </div>
              </div>
            </div>

            <div className="flex justify-start gap-8 items-center py-2 px-1 border-b border-slate-100 mb-4 mt-[-5px] pl-1">
              <StatItem label="Fans" value={stats.fans} onClick={() => { setSocialTab('followers'); setSocialOpen(true); }} />
              <StatItem label="Following" value={stats.following} onClick={() => { setSocialTab('following'); setSocialOpen(true); }} />
              <StatItem label="Friends" value={stats.friends} onClick={() => { setSocialTab('friends'); setSocialOpen(true); }} />
              <StatItem label="Visitors" value={stats.visitors} onClick={() => { setSocialTab('visitors'); setSocialOpen(true); }} />
            </div>

            {isOwnProfile && (
              <div className="grid grid-cols-2 gap-3 mt-2 -mx-2">
                <div onClick={() => router.push('/wallet')} className="h-[85px] bg-gradient-to-br from-[#FFD700] via-[#FDB931] to-[#9E7302] rounded-2xl p-4 shadow-[0_8px_20px_rgba(253,185,49,0.25)] active:scale-95 transition-all group cursor-pointer relative overflow-hidden backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 skew-x-[-20deg] translate-x-[-100%] group-hover:animate-shine" />
                  <div className="flex items-center gap-2 relative z-10">
                    <SVGA_GoldDollar />
                    <span className="text-[10px] font-black text-[#5C4000] uppercase tracking-widest opacity-90">Coins</span>
                  </div>
                  <p className="font-black text-[20px] text-[#422E00] tracking-tighter leading-none absolute bottom-4 left-5 drop-shadow-sm">
                    {profile.wallet?.coins?.toFixed(1) || '0.0'}
                  </p>
                </div>

                <div onClick={() => router.push('/wallet')} className="h-[85px] bg-gradient-to-br from-[#00D2FF] via-[#3a7bd5] to-[#004e92] rounded-2xl p-4 shadow-[0_8px_20px_rgba(58,123,213,0.25)] active:scale-95 transition-all group cursor-pointer relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50 skew-x-[-20deg] translate-x-[-100%] group-hover:animate-shine" />
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="h-7 w-7 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 text-[14px]">💎</div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest opacity-90">Diamonds</span>
                  </div>
                  <p className="font-black text-[20px] text-white tracking-tighter leading-none absolute bottom-4 left-5 drop-shadow-md">
                    {profile.wallet?.diamonds?.toFixed(1) || '0.0'}
                  </p>
                </div>
              </div>
            )}

            <div className="-mx-2">
              <SVGA_VIPBanner onClick={() => router.push('/vips')} />
            </div>

            <div className="flex justify-between items-center px-4 mt-6">
              <IconButton customIcon={SVGA_LevelCrown} label="Level" onClick={() => router.push('/level')} />
              <IconButton customIcon={SVGA_StoreCart} label="Store" onClick={() => router.push('/store')} />
              <IconButton customIcon={SVGA_MedalStar} label="Medal" onClick={() => setMedalModalOpen(true)} />
              <IconButton customIcon={SVGA_BonusGift} label="Bonus" onClick={() => router.push('/bonus')} />
            </div>

            <div className="space-y-3 pt-6 pb-32">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ProfileMenuItem
                  customIcon={SVGA_InviteHeart}
                  label="Invite friends"
                  iconColor="bg-pink-50"
                  onClick={handleWhatsAppInvite}
                />
                <ProfileMenuItem
                  customIcon={SVGA_FamilyShield}
                  label="Family"
                  extraColor="text-indigo-500"
                  iconColor="bg-orange-50"
                  onClick={() => router.push('/families')}
                />
                
                <ProfileMenuItem
                  customIcon={SVGA_BagShirt}
                  label="My-Iteam"
                  extraColor="text-purple-500"
                  iconColor="bg-purple-50"
                  onClick={handleBagClick}
                />
                
                <ProfileMenuItem
                  customIcon={SVGA_CpHeart}
                  label="Cp/friends"
                  iconColor="bg-pink-50"
                  onClick={() => router.push('/cp-house')}
                />

                {isCertifiedSeller && (
                   <SellerTransferDialog trigger={
                     <ProfileMenuItem
                        customIcon={SVGA_SellerBag}
                        label="Seller center"
                        iconColor="bg-red-50"
                        onClick={() => {}}
                      />
                   } />
                )}

                {isAuthorizedAdmin && (
                  <ProfileMenuItem
                    customIcon={SVGA_OfficialUser}
                    label="Official Centre"
                    extraColor="text-orange-600"
                    iconColor="bg-orange-50"
                    onClick={() => router.push('/admin')}
                  />
                )}
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <ProfileMenuItem
                  customIcon={SVGA_Settings}
                  label="Settings"
                  iconColor="bg-slate-50"
                  onClick={() => router.push('/settings')}
                />
                <ProfileMenuItem
                  customIcon={SVGA_HelpCenter}
                  label="Help center"
                  iconColor="bg-sky-50"
                  onClick={() => router.push('/help-center')}
                />
              </div>
            </div>
          </div>
        </div>

        <MedalModal open={medalModalOpen} onClose={() => setMedalModalOpen(false)} profile={profile} />
        <SocialRelationsDialog open={socialOpen} onOpenChange={setSocialOpen} userId={profileId} initialTab={socialTab} username={profile.username} />
        <FullProfileDialog open={fullViewOpen} onOpenChange={setFullViewOpen} profile={profile} stats={stats} followData={followData} onFollow={handleFollow} isProcessingFollow={isProcessingFollow} isOwnProfile={isOwnProfile} displayId={displayID} />
        <ReportUserDialog
          open={reportOpen}
          onOpenChange={setReportOpen}
          targetUser={{
            uid: profile.id,
            username: profile.username,
            accountNumber: displayID
          }}
        />
      </div>
    </AppLayout>
  );
           }
