'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, Loader, ChevronLeft, Check, Palette, Heart, X, Activity, Play, ImageIcon, Ticket, MessageSquare } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

// ============================================
// SMART BLACK BACKGROUND REMOVER
// ============================================
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

// ============================================
// DIRECT MEDIA WRAPPER
// ============================================
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

// ============================================
// ICONS
// ============================================

const DollarCoinIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={cn("text-[#FCD535]", className)} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="url(#goldGradient)" stroke="#B8860B" strokeWidth="2"/>
    <text x="12" y="16.5" fontFamily="Arial, sans-serif" fontWeight="bold" fontSize="14" fill="#6B4E00" textAnchor="middle">$</text>
    <defs>
      <linearGradient id="goldGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFF1AA" />
        <stop offset="0.5" stopColor="#FFD700" />
        <stop offset="1" stopColor="#D4AF37" />
      </linearGradient>
    </defs>
  </svg>
);

const WaveCircleIcon = ({ colorClass, size = "h-20 w-20", isLovelyShine = false }: any) => {
  const borderColor = colorClass.replace('text-', 'border-');
  
  if (isLovelyShine) {
    return (
      <div className={cn("relative flex items-center justify-center rounded-full", size)}>
        <div className="absolute inset-0 rounded-full border-[2px] border-blue-400/50 animate-pulse" />
        <div className="absolute inset-1 rounded-full border-[4px] border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.6)]" />
        <div className="absolute inset-3 rounded-full border border-blue-200/20 border-dashed animate-[spin_10s_linear_infinite]" />
        <Heart className="absolute -top-1 -right-1 h-4 w-4 text-blue-400 fill-blue-400/40 animate-bounce" />
        <Heart className="absolute top-1/2 -left-2 h-3 w-3 text-blue-300 fill-blue-300/40" />
        <Heart className="absolute bottom-0 right-2 h-3 w-3 text-white fill-white/20 animate-pulse" />
        <Sparkles className="absolute top-2 left-2 h-3 w-3 text-white animate-pulse" />
        <div className="absolute inset-[14px] rounded-full border-[1px] border-blue-400/60" />
      </div>
    );
  }

  return (
    <div className={cn("relative flex items-center justify-center rounded-full", size)}>
      <div className={cn("absolute inset-0 rounded-full border-[6px] opacity-30", borderColor)} />
      <div className={cn("absolute inset-[3px] rounded-full border-[8px] shadow-inner", borderColor)} />
      <div className={cn("absolute inset-[10px] rounded-full border-[1px] opacity-50", borderColor)} />
    </div>
  );
};

import { ActiveIDBadge, IDBadgeIcon, PinkDiamondIDBadgeIcon, SilverBlueIDBadgeIcon } from '@/components/id-badge';

const FramePlaceholderIcon = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center justify-center", className)}>
    <svg viewBox="0 0 60 60" className="w-full h-full">
      <defs>
        <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD535" />
          <stop offset="100%" stopColor="#D4AF37" />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="50" height="50" rx="10" fill="none" stroke="url(#frameGrad)" strokeWidth="3" />
      <rect x="12" y="12" width="36" height="36" rx="6" fill="none" stroke="url(#frameGrad)" strokeWidth="1.5" opacity="0.5" />
      <circle cx="30" cy="30" r="12" fill="url(#frameGrad)" opacity="0.3" />
      <circle cx="30" cy="30" r="6" fill="url(#frameGrad)" opacity="0.6" />
    </svg>
  </div>
);

// ============================================
// STATIC STORE ITEMS (Bubble aur Entry remove)
// ============================================
const STATIC_STORE_ITEMS = [
  { id: 'w-lovelyshine', name: 'Lovely Shine', type: 'Wave', price: 59999, durationDays: 7, description: 'Magical blue glow with floating hearts.', icon: Activity, color: 'text-blue-400' },
  { id: 'w-waveflew', name: 'Waveflew', type: 'Wave', price: 10000, durationDays: 7, description: 'Premium 3D Glossy frequency wave.', icon: Activity, color: 'text-white' },
  { id: 'w-tonepink', name: 'Tone Pink', type: 'Wave', price: 30000, durationDays: 7, description: '3D Glossy Pink rhythmic frequency.', icon: Activity, color: 'text-pink-500' },
  { id: 'w-vox', name: 'Vox', type: 'Wave', price: 30500, durationDays: 7, description: 'Crystal blue 3D glossy voice wave.', icon: Activity, color: 'text-blue-500' },
  { id: 'w-reso', name: 'Reso', type: 'Wave', price: 20000, durationDays: 7, description: 'Neon green resonance 3D glossy wave.', icon: Activity, color: 'text-green-500' },
  { id: 'w-echo', name: 'Echo', type: 'Wave', price: 25999, durationDays: 7, description: 'Vibrant orange echo 3D glossy frequency.', icon: Activity, color: 'text-orange-500' },
];

// ============================================
// MAIN STORE PAGE COMPONENT
// ============================================
export default function StorePage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('Store');

  useEffect(() => {
    if (previewItem) {
      setSelectedDuration(7);
    }
  }, [previewItem]);

  const themesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'roomThemes'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: dbThemes } = useCollection(themesQuery);

  const dynamicThemes = useMemo(() => {
    return (dbThemes || []).filter(t => (t.price || 0) > 0).map(t => ({
      ...t,
      type: 'Theme',
      description: t.description || `High-fidelity ${t.name} background.`,
      videoUrl: t.videoUrl || t.mediaUrl || null,
      imageUrl: t.imageUrl || t.thumbnailUrl || null,
    }));
  }, [dbThemes]);

  const storeItemsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'storeItems'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: dbStoreItems } = useCollection(storeItemsQuery);

  const boutiqueItems = useMemo(() => {
    return (dbStoreItems || []).map(item => ({
      ...item,
      type: item.category || item.type,
      description: item.description || `Premium ${item.name} asset.`,
      isDynamic: true,
      videoUrl: item.videoUrl || null,
      imageUrl: item.imageUrl || item.url || null,
    }));
  }, [dbStoreItems]);

  const frameItems = useMemo(() => {
    return boutiqueItems.filter(item => item.type === 'Frame' || item.category === 'Frame');
  }, [boutiqueItems]);

  // Bubble items sirf dynamic (Firestore se aane wale) rahenge, static wale hata diye
  const bubbleItems = useMemo(() => {
    return boutiqueItems.filter(item => item.type === 'Bubble' || item.category === 'Bubble');
  }, [boutiqueItems]);

  const waveItems = useMemo(() => STATIC_STORE_ITEMS.filter(i => i.type === 'Wave'), []);

  const idItems = useMemo(() => [
    { id: 'id-667276', name: 'Pink ID', type: 'ID', price: 3999999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 667276 Badge.', displayId: '667276', isPinkDiamond: true },
    { id: 'id-779261', name: 'Pink ID', type: 'ID', price: 1099999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 779261 Badge.', displayId: '779261', isPinkDiamond: true },
    { id: 'id-667788', name: 'Pink ID', type: 'ID', price: 2009999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 667788 Badge.', displayId: '667788', isPinkDiamond: true },
    { id: 'id-688992', name: 'Pink ID', type: 'ID', price: 7399999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 688992 Badge.', displayId: '688992', isPinkDiamond: true },
    { id: 'id-779999', name: 'Pink ID', type: 'ID', price: 7099999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 779999 Badge.', displayId: '779999', isPinkDiamond: true },
    { id: 'id-445500', name: 'Pink ID', type: 'ID', price: 6959999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 445500 Badge.', displayId: '445500', isPinkDiamond: true },
    { id: 'id-113377', name: 'Pink ID', type: 'ID', price: 9020555, durationDays: 7, description: 'Exclusive Premium Pink ID Number 113377 Badge.', displayId: '113377', isPinkDiamond: true },
    { id: 'id-117676', name: 'Pink ID', type: 'ID', price: 6089999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 117676 Badge.', displayId: '117676', isPinkDiamond: true },
    { id: 'id-223434', name: 'Pink ID', type: 'ID', price: 7999877, durationDays: 7, description: 'Exclusive Premium Pink ID Number 223434 Badge.', displayId: '223434', isPinkDiamond: true },
    { id: 'id-102020', name: 'Pink ID', type: 'ID', price: 2899999, durationDays: 7, description: 'Exclusive Premium Pink ID Number 102020 Badge.', displayId: '102020', isPinkDiamond: true },
    { id: 'id-800232', name: 'Pink ID', type: 'ID', price: 9750000, durationDays: 7, description: 'Exclusive Premium Pink ID Number 800232 Badge.', displayId: '800232', isPinkDiamond: true },
    { id: 'id-675747', name: 'Pink ID', type: 'ID', price: 1000599, durationDays: 7, description: 'Exclusive Premium Pink ID Number 675747 Badge.', displayId: '675747', isPinkDiamond: true },
    { id: 'id-189904', name: 'Silver ID', type: 'ID', price: 1500999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 189904 Badge.', displayId: '189904', isSilver: true },
    { id: 'id-122234', name: 'Silver ID', type: 'ID', price: 1990999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 122234 Badge.', displayId: '122234', isSilver: true },
    { id: 'id-189990', name: 'Silver ID', type: 'ID', price: 9030999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 189990 Badge.', displayId: '189990', isSilver: true },
    { id: 'id-162972', name: 'Silver ID', type: 'ID', price: 7130999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 162972 Badge.', displayId: '162972', isSilver: true },
    { id: 'id-000222', name: 'Silver ID', type: 'ID', price: 5130999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 000222 Badge.', displayId: '000222', isSilver: true },
    { id: 'id-234555', name: 'Silver ID', type: 'ID', price: 9230999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 234555 Badge.', displayId: '234555', isSilver: true },
    { id: 'id-897633', name: 'Silver ID', type: 'ID', price: 9930999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 897633 Badge.', displayId: '897633', isSilver: true },
    { id: 'id-144672', name: 'Silver ID', type: 'ID', price: 9999999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 144672 Badge.', displayId: '144672', isSilver: true },
    { id: 'id-666892', name: 'Silver ID', type: 'ID', price: 9899999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 666892 Badge.', displayId: '666892', isSilver: true },
    { id: 'id-111263', name: 'Silver ID', type: 'ID', price: 2099900, durationDays: 7, description: 'Exclusive Premium Silver ID Number 111263 Badge.', displayId: '111263', isSilver: true },
    { id: 'id-182910', name: 'Silver ID', type: 'ID', price: 3999999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 182910 Badge.', displayId: '182910', isSilver: true },
    { id: 'id-188889', name: 'Silver ID', type: 'ID', price: 4555990, durationDays: 7, description: 'Exclusive Premium Silver ID Number 188889 Badge.', displayId: '188889', isSilver: true },
    { id: 'id-105577', name: 'Silver ID', type: 'ID', price: 3057999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 105577 Badge.', displayId: '105577', isSilver: true },
    { id: 'id-977777', name: 'Silver ID', type: 'ID', price: 1059999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 977777 Badge.', displayId: '977777', isSilver: true },
    { id: 'id-233455', name: 'Silver ID', type: 'ID', price: 7089999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 233455 Badge.', displayId: '233455', isSilver: true },
    { id: 'id-778855', name: 'Silver ID', type: 'ID', price: 8999999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 778855 Badge.', displayId: '778855', isSilver: true },
    { id: 'id-982201', name: 'Silver ID', type: 'ID', price: 6999999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 982201 Badge.', displayId: '982201', isSilver: true },
    { id: 'id-721111', name: 'Silver ID', type: 'ID', price: 1399999, durationDays: 7, description: 'Exclusive Premium Silver ID Number 721111 Badge.', displayId: '721111', isSilver: true },
    { id: 'id-188899', name: 'Silver ID', type: 'ID', price: 1359998, durationDays: 7, description: 'Exclusive Premium Silver ID Number 188899 Badge.', displayId: '188899', isSilver: true },
    { id: 'id-888882', name: 'Silver ID', type: 'ID', price: 8888000, durationDays: 7, description: 'Exclusive Premium Silver ID Number 888882 Badge.', displayId: '888882', isSilver: true },
    { id: 'id-888888', name: 'sss', type: 'ID', price: 9999999, durationDays: 7, description: 'Exclusive VIP ID Number 888888 Badge.', displayId: '888888', variant: 'red' },
    { id: 'id-666666', name: 'sss', type: 'ID', price: 9999999, durationDays: 7, description: 'Exclusive VIP ID Number 666666 Badge.', displayId: '666666', variant: 'red' },
    { id: 'id-676767', name: 'sss', type: 'ID', price: 6999999, durationDays: 7, description: 'Exclusive VIP ID Number 676767 Badge.', displayId: '676767', variant: 'red' },
    { id: 'id-111111', name: 'sss', type: 'ID', price: 9999999, durationDays: 7, description: 'Exclusive VIP ID Number 111111 Badge.', displayId: '111111', variant: 'red' },
    { id: 'id-999999', name: 'sss', type: 'ID', price: 7000000, durationDays: 7, description: 'Exclusive VIP ID Number 999999 Badge.', displayId: '999999', variant: 'red' },
    { id: 'id-777777', name: 'sss', type: 'ID', price: 5500000, durationDays: 7, description: 'Exclusive VIP ID Number 777777 Badge.', displayId: '777777', variant: 'red' },
    { id: 'id-122334', name: 'sss', type: 'ID', price: 4000000, durationDays: 7, description: 'Exclusive VIP ID Number 122334 Badge.', displayId: '122334', variant: 'red' },
    { id: 'id-989898', name: 'sss', type: 'ID', price: 7900000, durationDays: 7, description: 'Exclusive VIP ID Number 989898 Badge.', displayId: '989898', variant: 'red' },
    { id: 'id-232323', name: 'sss', type: 'ID', price: 6900000, durationDays: 7, description: 'Exclusive VIP ID Number 232323 Badge.', displayId: '232323', variant: 'red' },
    { id: 'id-111222', name: 'sss', type: 'ID', price: 9900000, durationDays: 7, description: 'Exclusive VIP ID Number 111222 Badge.', displayId: '111222', variant: 'red' },
    { id: 'id-124456', name: 'sss', type: 'ID', price: 4000000, durationDays: 7, description: 'Exclusive VIP ID Number 124456 Badge.', displayId: '124456', variant: 'red' },
    { id: 'id-987449', name: 'sss', type: 'ID', price: 7900000, durationDays: 7, description: 'Exclusive VIP ID Number 987449 Badge.', displayId: '987449', variant: 'red' },
    { id: 'id-234787', name: 'sss', type: 'ID', price: 6900000, durationDays: 7, description: 'Exclusive VIP ID Number 234787 Badge.', displayId: '234787', variant: 'red' },
    { id: 'id-111333', name: 'sss', type: 'ID', price: 9900000, durationDays: 7, description: 'Exclusive VIP ID Number 111333 Badge.', displayId: '111333', variant: 'red' },
    { id: 'id-242424', name: 'sss', type: 'ID', price: 6900000, durationDays: 7, description: 'Exclusive VIP ID Number 242424 Badge.', displayId: '242424', variant: 'red' },
    { id: 'id-124455', name: 'sss', type: 'ID', price: 4000000, durationDays: 7, description: 'Exclusive VIP ID Number 124455 Badge.', displayId: '124455', variant: 'red' },
    { id: 'id-977789', name: 'sss', type: 'ID', price: 7900000, durationDays: 7, description: 'Exclusive VIP ID Number 977789 Badge.', displayId: '977789', variant: 'red' },
    { id: 'id-234578', name: 'sss', type: 'ID', price: 6900000, durationDays: 7, description: 'Exclusive VIP ID Number 234578 Badge.', displayId: '234578', variant: 'red' },
    { id: 'id-112223', name: 'sss', type: 'ID', price: 9900000, durationDays: 7, description: 'Exclusive VIP ID Number 112223 Badge.', displayId: '112223', variant: 'red' },
  ], []);

  // Entry items completely removed
  const entryItems = useMemo(() => [], []);

  const nonFrameBoutiqueItems = useMemo(() => {
    return boutiqueItems.filter(item => 
      item.type !== 'Frame' && 
      item.category !== 'Frame' && 
      item.type !== 'Bubble' && 
      item.category !== 'Bubble'
    );
  }, [boutiqueItems]);

  const allItems = useMemo(() => {
    return [...frameItems, ...bubbleItems, ...dynamicThemes, ...waveItems, ...idItems, ...entryItems, ...nonFrameBoutiqueItems];
  }, [frameItems, bubbleItems, dynamicThemes, waveItems, idItems, entryItems, nonFrameBoutiqueItems]);

  const configRef = useMemo(() => firestore ? doc(firestore, 'appConfig', 'global') : null, [firestore]);
  const { data: config } = useDoc(configRef);
  const storeNotForSale = (config?.storeNotForSale || {}) as Record<string, boolean>;

  const allItemsWithFlags = useMemo(() => {
    return allItems
      .map(item => ({ ...item, notForSale: !!storeNotForSale[item.id] }))
      .filter(item => !item.notForSale);
  }, [allItems, storeNotForSale]);

  const purchasedItems = useMemo(() => {
    const inventory = userProfile?.inventory as any;
    if (!inventory?.ownedItems) return [];
    const ownedIds = inventory.ownedItems;
    const expiryMap = inventory.expiries || {};
    
    const now = Timestamp.now();
    const validOwnedIds = ownedIds.filter((id: string) => {
      const expiry = expiryMap[id];
      if (!expiry) return true;
      return expiry.toDate() > now.toDate();
    });
    
    return allItemsWithFlags.filter(item => validOwnedIds.includes(item.id));
  }, [userProfile?.inventory, allItemsWithFlags]);

  const getItemExpiryDate = (itemId: string) => {
    const expiry = (userProfile?.inventory as any)?.expiries?.[itemId];
    if (!expiry) return null;
    return expiry.toDate();
  };

  useEffect(() => {
    if (!userProfile || !firestore || !user) return;

    const checkExpiryAndUnequip = async () => {
      const inventory = userProfile.inventory as any;
      const expiries = inventory?.expiries || {};
      const now = Timestamp.now();
      let needsUpdate = false;
      const updateData: any = { updatedAt: serverTimestamp() };
      
      const activeTypes = ['Frame', 'Theme', 'Bubble', 'Wave', 'ID', 'Entry'];
      
      for (const type of activeTypes) {
        const activeItemId = inventory?.[`active${type}`];
        if (activeItemId && activeItemId !== 'None') {
          const expiry = expiries[activeItemId as string];
          if (expiry && expiry.toDate() <= now.toDate()) {
            updateData[`inventory.active${type}`] = 'None';
            needsUpdate = true;
            console.log(`Auto-unequipped expired ${type}: ${activeItemId}`);
          }
        }
      }
      
      if (needsUpdate) {
        try {
          const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
          await updateDocumentNonBlocking(profileRef, updateData);
        } catch (error) {
          console.error('Auto-unequip error:', error);
        }
      }
    };
    
    checkExpiryAndUnequip();
    const interval = setInterval(checkExpiryAndUnequip, 60000);
    
    return () => clearInterval(interval);
  }, [userProfile, firestore, user]);

  const getCalculatedPrice = (basePrice: number, duration: number) => {
    if (duration === 7) return basePrice;
    return Math.floor((basePrice / 7) * 3);
  };

  const isItemOwnedAndValid = (itemId: string) => {
    const inventory = userProfile?.inventory as any;
    if (!inventory?.ownedItems) return false;
    if (!inventory.ownedItems.includes(itemId)) return false;
    
    const expiry = inventory.expiries?.[itemId];
    if (expiry && expiry.toDate() <= new Date()) return false;
    
    return true;
  };

  const hasVideo = (item: any): boolean => {
    if (!item.videoUrl) return false;
    return true;
  };

  const handlePurchase = async (item: any, duration: number) => {
    if (!userProfile || !user || !firestore || isProcessing) return;
    if (item?.notForSale) {
      toast({ variant: 'destructive', title: 'Not for sale', description: 'Ye item abhi store me available nahi hai.' });
      return;
    }
    const finalPrice = getCalculatedPrice(item.price, duration);

    if ((userProfile.wallet?.coins || 0) < finalPrice) {
      toast({ variant: 'destructive', title: 'Insufficient Coins', description: 'Aapke paas enough coins nahi hai.' });
      return;
    }

    setIsProcessing(true);
    try {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + duration);
      
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const userRef = doc(firestore, 'users', user.uid);
      
      const updateData = { 
        'wallet.coins': increment(-finalPrice), 
        'inventory.ownedItems': arrayUnion(item.id),
        [`inventory.expiries.${item.id}`]: Timestamp.fromDate(expiryDate),
        'updatedAt': serverTimestamp() 
      };

      await updateDocumentNonBlocking(profileRef, updateData);
      await updateDocumentNonBlocking(userRef, { 'wallet.coins': increment(-finalPrice), 'updatedAt': serverTimestamp() });
      
      toast({ title: 'Purchase Successful!', description: `${item.name} ko successfully khareed liya gaya.` });
      setPreviewItem(null);
    } catch (error) {
      console.error('Purchase error:', error);
      toast({ variant: 'destructive', title: 'Purchase Failed', description: 'Kuch error aa gaya. Dubara try karein.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEquipToggle = async (item: any) => {
    if (!userProfile || !user || !firestore || isProcessing) return;
    
    const expiry = (userProfile.inventory as any)?.expiries?.[item.id];
    if (expiry && expiry.toDate() <= new Date()) {
      toast({ variant: 'destructive', title: 'Item Expired', description: 'Ye item expire ho chuka hai. Dobara purchase karein.' });
      return;
    }
    
    setIsProcessing(true);
    try {
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const userRef = doc(firestore, 'users', user.uid);
      const field = `inventory.active${item.type}`;
      const isActive = userProfile.inventory?.[`active${item.type}` as keyof typeof userProfile.inventory] === item.id;
      
      const updateData: any = { 
        [field]: isActive ? 'None' : item.id, 
        updatedAt: serverTimestamp() 
      };
      
      if (item.type === 'Frame') {
        if (!isActive && (item.videoUrl || item.imageUrl)) {
          updateData['inventory.activeFrameMediaUrl'] = item.videoUrl || item.imageUrl || null;
        } else if (isActive) {
          updateData['inventory.activeFrameMediaUrl'] = null;
        }
      }
      
      if (item.type === 'Bubble') {
        if (!isActive && (item.videoUrl || item.imageUrl)) {
          updateData['inventory.activeBubbleMediaUrl'] = item.videoUrl || item.imageUrl || null;
        } else if (isActive) {
          updateData['inventory.activeBubbleMediaUrl'] = null;
        }
      }

      if (item.type === 'Entry') {
        if (!isActive && (item.videoUrl || item.imageUrl)) {
          updateData['inventory.activeEntryMediaUrl'] = item.videoUrl || item.imageUrl || null;
        } else if (isActive) {
          updateData['inventory.activeEntryMediaUrl'] = null;
        }
      }

      if (item.type === 'ID') {
        if (!isActive) {
          updateData['inventory.activeIdBadge'] = {
            id: item.id,
            displayId: item.displayId,
            isPinkDiamond: !!item.isPinkDiamond,
            isSilver: !!item.isSilver,
            variant: item.variant || null
          };
        } else if (isActive) {
          updateData['inventory.activeIdBadge'] = null;
        }
      }
      
      await updateDocumentNonBlocking(profileRef, updateData);
      await updateDocumentNonBlocking(userRef, updateData);
      
      toast({ 
        title: isActive ? `${item.type} Unequipped` : 'Item Equipped!', 
        description: isActive ? `${item.name} ko hata diya gaya.` : `${item.name} successfully equip ho gaya.`
      });
      setPreviewItem(null);
    } catch (error) {
      console.error('Equip error:', error);
      toast({ variant: 'destructive', title: 'Action Failed', description: 'Kuch error aa gaya. Dubara try karein.' });
    } finally {
      setIsProcessing(false);
    }
  };

  const getFrameDisplayImage = (item: any): string | null => {
    if (item.type !== 'Frame') return null;
    if (item.imageUrl) return item.imageUrl;
    if (item.videoUrl) return item.videoUrl;
    return null;
  };

  // Helper to render store card icon
  const renderStoreCardIcon = (item: any) => {
    // FRAME
    if (item.type === 'Frame') {
      const displayImage = getFrameDisplayImage(item);
      if (displayImage) {
        return (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden" style={{ background: 'transparent' }}>
            <DirectMedia 
              src={displayImage} 
              type="image"
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <FramePlaceholderIcon className="h-12 w-12" />;
    }
    
    // THEME
    if (item.type === 'Theme') {
      if (item.videoUrl || item.imageUrl) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden" style={{ background: 'transparent' }}>
            <DirectMedia 
              src={mediaUrl} 
              type={mediaType} 
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <Palette className={cn("h-12 w-12 opacity-50", item.color || "text-purple-400")} />;
    }
    
    // BUBBLE - NO SVG CARD, only imageUrl/videoUrl (static wale hata diye toh sirf dynamic wale aayenge jinke paas media hoga)
    if (item.type === 'Bubble') {
      if (item.videoUrl || item.imageUrl) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden" style={{ background: 'transparent' }}>
            <DirectMedia 
              src={mediaUrl} 
              type={mediaType} 
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <MessageSquare className="h-12 w-12 opacity-50 text-gray-400" />;
    }
    
    // WAVE
    if (item.type === 'Wave') {
      return <WaveCircleIcon colorClass={item.color} size="h-20 w-20" isLovelyShine={item.id === 'w-lovelyshine'} />;
    }
    
    // ID
    if (item.type === 'ID') {
      if (item.isPinkDiamond) return <PinkDiamondIDBadgeIcon number={item.displayId || ''} />;
      if (item.isSilver) return <SilverBlueIDBadgeIcon number={item.displayId || ''} />;
      return <IDBadgeIcon number={item.displayId || ''} />;
    }
    
    // ENTRY - NO SVG CARD, only imageUrl/videoUrl (sirf dynamic wale aayenge)
    if (item.type === 'Entry') {
      if (item.videoUrl || item.imageUrl) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden" style={{ background: 'transparent' }}>
            <DirectMedia 
              src={mediaUrl} 
              type={mediaType} 
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <Ticket className="h-12 w-12 opacity-50 text-gray-400" />;
    }
    
    if (item.icon) {
      return <item.icon className={cn("h-12 w-12 opacity-50", item.color)} />;
    }
    
    return <ShoppingBag className="h-12 w-12 opacity-50 text-gray-400" />;
  };

  // PREVIEW CARD ICON
  const renderPreviewIcon = (item: any) => {
    // THEME
    if (item.type === 'Theme') {
      if (item.videoUrl || item.imageUrl) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative w-full flex-1 flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent', maxHeight: '45vh' }}>
            <DirectMedia 
              src={mediaUrl} 
              type={mediaType} 
              className="w-auto h-auto max-w-full max-h-full"
              style={{ background: 'transparent', objectFit: 'contain' }}
            />
          </div>
        );
      }
      return <Palette className={cn("h-20 w-20 opacity-80", item.color || "text-purple-400")} />;
    }
    
    // ID
    if (item.type === 'ID') {
      return (
        <div className="scale-125 pt-2">
          {item.isPinkDiamond ? <PinkDiamondIDBadgeIcon number={item.displayId || ''} /> :
           item.isSilver ? <SilverBlueIDBadgeIcon number={item.displayId || ''} /> : 
           <IDBadgeIcon number={item.displayId || ''} />}
        </div>
      );
    }
    
    // FRAME
    if (item.type === 'Frame') {
      const mediaUrl = item.videoUrl || item.imageUrl;
      if (mediaUrl) {
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-36 w-36 flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <DirectMedia 
              src={mediaUrl} 
              type={mediaType}
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return (
        <div className="h-36 w-36 flex items-center justify-center">
          <FramePlaceholderIcon className="h-24 w-24" />
        </div>
      );
    }
    
    // BUBBLE - NO SVG CARD, only imageUrl/videoUrl
    if (item.type === 'Bubble') {
      if (item.videoUrl || item.imageUrl) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-36 w-36 flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <DirectMedia 
              src={mediaUrl} 
              type={mediaType} 
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <MessageSquare className="h-20 w-20 opacity-80 text-gray-400" />;
    }
    
    // WAVE
    if (item.type === 'Wave') {
      return <WaveCircleIcon colorClass={item.color} size="h-32 w-32" isLovelyShine={item.id === 'w-lovelyshine'} />;
    }
    
    // ENTRY - NO SVG CARD, only imageUrl/videoUrl
    if (item.type === 'Entry') {
      if (item.videoUrl) {
        return (
          <div className="relative h-36 w-36 flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <DirectMedia 
              src={item.videoUrl} 
              type="video"
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      if (item.imageUrl) {
        return (
          <div className="relative h-36 w-36 flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <DirectMedia 
              src={item.imageUrl} 
              type="image"
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <Ticket className="h-20 w-20 opacity-80 text-gray-400" />;
    }
    
    if (item.icon) {
      return <item.icon className={cn("h-20 w-20 opacity-80", item.color)} />;
    }
    
    return <ShoppingBag className="h-20 w-20 opacity-80 text-gray-400" />;
  };

  if (isProfileLoading) return (
    <div className="min-h-screen bg-gradient-to-br from-[#121A1F] via-[#0A0E12] to-[#050709] flex items-center justify-center">
      <Loader className="animate-spin h-8 w-8 text-[#FCD535]" />
    </div>
  );

  const storeItems = allItemsWithFlags;
  const mineItems = purchasedItems;

  const categories = ['Frame', 'Theme', 'Bubble', 'Wave', 'ID', 'Entry'];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#121A1F] via-[#0A0E12] to-[#050709] text-white pb-safe overflow-x-hidden">
      
      <div className="absolute top-0 left-0 right-0 h-[15vh] pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/25 via-purple-900/5 to-transparent" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-full bg-purple-500/10 rounded-[100%]" />
      </div>

      <div className="relative z-10 space-y-6 px-4 md:px-8 max-w-7xl mx-auto pt-16 pb-24">
        
        <header className="relative flex items-center justify-between border-b border-white/10 pb-6 min-h-[48px]">
          <button onClick={() => router.back()} className="p-2 bg-white/10 hover:bg-white/20 transition-colors text-white rounded-full">
            <ChevronLeft />
          </button>
          
          <h1 className="text-xl font-semibold text-white">
            {activeTab === 'Store' ? 'Store' : 'Mine'}
          </h1>
          
          <button 
            onClick={() => setActiveTab(activeTab === 'Store' ? 'Mine' : 'Store')}
            className="text-sm font-medium transition-colors px-3 py-1.5 rounded-full text-white hover:text-white/80"
          >
            {activeTab === 'Store' ? 'Mine' : 'Store'}
          </button>
        </header>

        {activeTab === 'Store' ? (
          <Tabs defaultValue="Frame" className="w-full">
            <div className="w-full overflow-x-auto no-scrollbar mb-6">
              <TabsList className="bg-transparent inline-flex min-w-full md:min-w-0 gap-2 border-b border-white/5 pb-1 rounded-none">
                {categories.map(cat => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat} 
                    className="rounded-none px-6 py-2 text-gray-400 font-medium whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-white relative data-[state=active]:after:absolute data-[state=active]:after:-bottom-[5px] data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-[3px] data-[state=active]:after:w-6 data-[state=active]:after:bg-white data-[state=active]:after:rounded-full transition-all"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {categories.map(category => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {storeItems.filter(i => i.type === category).map(item => (
                    <Card 
                      key={item.id} 
                      onClick={() => setPreviewItem(item)} 
                      className="overflow-hidden rounded-[1rem] bg-gradient-to-b from-[#18232D] to-[#0D141A] border border-[#23303D] shadow-xl transition-all cursor-pointer hover:scale-[1.02] hover:border-[#384A5D] active:scale-95 text-white relative"
                    >
                      {hasVideo(item) && (
                        <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                          <Play className="h-3.5 w-3.5 text-white fill-white" />
                        </div>
                      )}
                      
                      <div className="aspect-square flex items-center justify-center p-4 relative border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                        {renderStoreCardIcon(item)}
                      </div>
                      <CardHeader className="text-center p-3 pb-1">
                        <CardTitle className="text-sm font-normal text-gray-300 truncate">{item.name}</CardTitle>
                      </CardHeader>
                      <CardFooter className="flex flex-col gap-3 p-3 pt-1">
                        <div className="flex items-center justify-center gap-1.5 text-sm w-full">
                          <DollarCoinIcon className="h-4 w-4" />
                          <span className="text-[#FCD535] font-bold">{item.price.toLocaleString()}</span>
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
                {storeItems.filter(i => i.type === category).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ShoppingBag className="h-16 w-16 text-gray-500 mb-4" />
                    <p className="text-white text-lg">Is category me abhi koi item available nahi hai</p>
                    <p className="text-gray-400 text-sm mt-2">Baad me check karein, naye items add hote rahenge!</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <Tabs defaultValue="Frame" className="w-full">
            <div className="w-full overflow-x-auto no-scrollbar mb-6">
              <TabsList className="bg-transparent inline-flex min-w-full md:min-w-0 gap-2 border-b border-white/5 pb-1 rounded-none">
                {categories.map(cat => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat} 
                    className="rounded-none px-6 py-2 text-gray-400 font-medium whitespace-nowrap data-[state=active]:bg-transparent data-[state=active]:text-white relative data-[state=active]:after:absolute data-[state=active]:after:-bottom-[5px] data-[state=active]:after:left-1/2 data-[state=active]:after:-translate-x-1/2 data-[state=active]:after:h-[3px] data-[state=active]:after:w-6 data-[state=active]:after:bg-white data-[state=active]:after:rounded-full transition-all"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {categories.map(category => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {mineItems.filter(i => i.type === category).map(item => {
                    const expiryDate = getItemExpiryDate(item.id);
                    const expiryDateStr = expiryDate ? expiryDate.toLocaleDateString('en-IN') : 'Never';
                    
                    return (
                      <Card 
                        key={item.id} 
                        onClick={() => setPreviewItem(item)} 
                        className="overflow-hidden rounded-[1rem] bg-gradient-to-b from-[#18232D] to-[#0D141A] border border-[#23303D] shadow-xl transition-all cursor-pointer hover:scale-[1.02] hover:border-[#384A5D] active:scale-95 text-white relative"
                      >
                        {hasVideo(item) && (
                          <div className="absolute top-2 right-2 z-10 bg-black/60 backdrop-blur-sm rounded-full p-1.5 shadow-lg">
                            <Play className="h-3.5 w-3.5 text-white fill-white" />
                          </div>
                        )}
                        
                        <div className="aspect-square flex items-center justify-center p-4 relative border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                          {renderStoreCardIcon(item)}
                        </div>
                        <CardHeader className="text-center p-3 pb-0">
                          <CardTitle className="text-sm font-normal text-gray-300 truncate">{item.name}</CardTitle>
                        </CardHeader>
                        <CardFooter className="flex flex-col gap-1 p-3 pt-1">
                          <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                            <span>Expire:</span>
                            <span className="text-red-400">{expiryDateStr}</span>
                          </div>
                        </CardFooter>
                      </Card>
                    );
                  })}
                </div>
                {mineItems.filter(i => i.type === category).length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <ShoppingBag className="h-16 w-16 text-gray-500 mb-4" />
                    <p className="text-white text-lg">Aapne abhi koi {category} item nahi khareeda hai</p>
                    <p className="text-gray-400 text-sm mt-2">Store se kuch kharidein aur yahan dekhein!</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}

        {/* PREVIEW CARD */}
        {previewItem && (() => {
          const isOwnedAndValid = isItemOwnedAndValid(previewItem.id);
          const isCurrentlyEquipped = userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === previewItem.id;
          const isTheme = previewItem.type === 'Theme';
          
          return (
            <>
              <div className="fixed inset-0 bg-black/70 z-40 transition-opacity" onClick={() => setPreviewItem(null)} />
              
              <div 
                className={cn(
                  "fixed bottom-0 left-0 right-0 z-50 bg-[#141414] rounded-t-[24px] flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-full duration-300 ease-out",
                  isTheme ? "h-[70vh]" : "h-[40vh]"
                )}
              >
                
                <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-10">
                  <X size={24} />
                </button>

                <div className={cn(
                  "flex-1 overflow-hidden flex flex-col items-center",
                  isTheme ? "pt-2 pb-1 px-2" : "pt-8 pb-4 px-4 overflow-y-auto"
                )}>
                  {isTheme ? (
                    <div className="w-full flex-1 flex items-center justify-center overflow-hidden rounded-lg px-4" style={{ background: 'transparent' }}>
                      {renderPreviewIcon(previewItem)}
                    </div>
                  ) : (
                    <div className={cn(
                      "mb-4 scale-[1.1] flex items-center justify-center",
                      previewItem.type === 'ID' ? "" : "h-36 w-36 rounded-lg overflow-hidden"
                    )} style={{ background: 'transparent' }}>
                      {renderPreviewIcon(previewItem)}
                    </div>
                  )}

                  <h2 className={cn(
                    "font-medium text-white tracking-wide text-center",
                    isTheme ? "text-sm mt-1 mb-0.5" : "text-xl"
                  )}>
                    {previewItem.name}
                  </h2>
                  
                  {isOwnedAndValid && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Expires: {getItemExpiryDate(previewItem.id)?.toLocaleDateString('en-IN') || 'Never'}
                    </p>
                  )}
                </div>

                {isOwnedAndValid ? (
                  <div className="bg-[#222222] rounded-t-[20px] p-4 pb-6 flex-shrink-0">
                    <Button 
                      onClick={() => handleEquipToggle(previewItem)}
                      disabled={isProcessing}
                      className={cn(
                        "w-full rounded-full py-5 text-md font-medium tracking-wide shadow-lg transition-colors",
                        isProcessing && "opacity-70 cursor-not-allowed",
                        isCurrentlyEquipped
                          ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" 
                          : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                      )}
                    >
                      {isProcessing ? <Loader className="animate-spin h-4 w-4" /> : (isCurrentlyEquipped ? 'Unequip' : 'Equip')}
                    </Button>
                  </div>
                ) : (
                  <div className="bg-[#222222] rounded-t-[20px] p-4 pb-6 flex flex-col gap-3 flex-shrink-0">
                    <div className="flex gap-4 w-full justify-center">
                      {[3, 7].map(days => (
                        <button 
                          key={days}
                          onClick={() => setSelectedDuration(days)}
                          className={cn(
                            "relative border rounded-[10px] w-28 py-2 flex items-center justify-center transition-all",
                            selectedDuration === days ? "border-[#FCD535] bg-[#313131]" : "border-white/5 bg-[#222]"
                          )}
                        >
                          <span className={cn("text-sm", selectedDuration === days ? "text-white" : "text-gray-400")}>{days} Days</span>
                          {selectedDuration === days && (
                            <div className="absolute -bottom-1 -right-1 bg-[#FCD535] rounded-tl-md rounded-br-[10px] p-0.5">
                              <Check size={12} strokeWidth={3} className="text-black" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarCoinIcon className="w-5 h-5" />
                        <span className="text-[#FCD535] font-bold text-xl tracking-wide">
                          {getCalculatedPrice(previewItem.price, selectedDuration).toLocaleString()}
                        </span>
                      </div>

                      <Button 
                        onClick={() => handlePurchase(previewItem, selectedDuration)}
                        disabled={isProcessing}
                        className="rounded-full px-12 py-5 text-md font-medium tracking-wide shadow-lg transition-colors bg-[#FCD535] text-black hover:bg-[#e5c02b] disabled:opacity-70"
                      >
                        {isProcessing ? <Loader className="animate-spin h-4 w-4" /> : 'Buy'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
      }
