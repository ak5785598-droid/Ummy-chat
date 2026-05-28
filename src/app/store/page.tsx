'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ShoppingBag, Sparkles, MessageSquare, Mic2, Star, Loader, ChevronLeft, Crown, Check, Palette, Heart, Zap, Eye, Circle, X, Activity, IdCard, Ticket, Home } from 'lucide-react';
import { useUser, useFirestore, updateDocumentNonBlocking, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { useUserProfile } from '@/hooks/use-user-profile';
import { doc, arrayUnion, increment, serverTimestamp, collection, query, orderBy, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { ChatMessageBubble } from '@/components/chat-message-bubble';

// --- FAST SMART BLACK BACKGROUND REMOVER (NO HANGING, NO GLITCH) ---
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
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasBlackBg, setHasBlackBg] = useState(false);
  const processingDoneRef = useRef(false);

  // FAST black background detection - sirf 1 baar, har frame nahi
  const detectBlackBgFast = useCallback((media: HTMLVideoElement | HTMLImageElement): boolean => {
    const canvas = document.createElement('canvas');
    const width = media.videoWidth || media.width;
    const height = media.videoHeight || media.height;
    
    if (width === 0 || height === 0) return false;
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    ctx.drawImage(media, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // FAST check - sirf corners aur edges check karo
    const checkCorner = (x: number, y: number): boolean => {
      const i = (y * width + x) * 4;
      return data[i] < 30 && data[i+1] < 30 && data[i+2] < 30;
    };

    const corners = [
      [0, 0], [width-1, 0], [0, height-1], [width-1, height-1],
      [Math.floor(width/2), 0], [0, Math.floor(height/2)],
      [Math.floor(width/2), height-1], [width-1, Math.floor(height/2)]
    ];

    let blackCount = 0;
    for (const [x, y] of corners) {
      if (checkCorner(x, y)) blackCount++;
    }
    
    return blackCount >= 6; // 6/8 corners black = solid black bg
  }, []);

  // Process image - ek baar, sync
  const processImage = useCallback((img: HTMLImageElement) => {
    if (processingDoneRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = img.width;
    const height = img.height;
    
    canvas.width = width;
    canvas.height = height;
    
    ctx.drawImage(img, 0, 0);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // FAST removal - sirf black pixels ko transparent
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 25 && data[i+1] < 25 && data[i+2] < 25) {
        data[i+3] = 0; // alpha = 0
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    processingDoneRef.current = true;
    setIsProcessing(false);
  }, []);

  // Process video - OFFLINE, ek baar (har frame nahi)
  const processVideoFrame = useCallback((video: HTMLVideoElement) => {
    if (processingDoneRef.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = video.videoWidth;
    const height = video.videoHeight;
    
    if (width === 0 || height === 0) return;
    
    canvas.width = width;
    canvas.height = height;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    
    // FAST removal
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] < 25 && data[i+1] < 25 && data[i+2] < 25) {
        data[i+3] = 0;
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    processingDoneRef.current = true;
    setIsProcessing(false);
  }, []);

  // Handle image load
  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (img.complete && img.naturalWidth > 0) {
      const hasBlack = detectBlackBgFast(img);
      setHasBlackBg(hasBlack);
      if (hasBlack) {
        setIsProcessing(true);
        setTimeout(() => processImage(img), 50);
      }
    }
  }, [detectBlackBgFast, processImage]);

  // Handle video load - ek baar frame capture
  const handleVideoLoad = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.readyState >= 2 && video.videoWidth > 0) {
      const hasBlack = detectBlackBgFast(video);
      setHasBlackBg(hasBlack);
      if (hasBlack) {
        setIsProcessing(true);
        // Capture pehla frame process karne ke liye
        video.currentTime = 0.1;
        video.onseeked = () => {
          processVideoFrame(video);
        };
      }
    }
  }, [detectBlackBgFast, processVideoFrame]);

  // Reset on src change
  useEffect(() => {
    processingDoneRef.current = false;
    setProcessedSrc(null);
    setHasBlackBg(false);
    setIsProcessing(false);
  }, [src]);

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
          onLoadedData={handleVideoLoad}
          className={hasBlackBg && processingDoneRef.current ? 'hidden' : 'w-full h-full object-cover'}
          style={{ display: (hasBlackBg && processingDoneRef.current) ? 'none' : 'block' }}
        />
        {hasBlackBg && (
          <canvas
            ref={canvasRef}
            className="w-full h-full object-cover"
            style={{ 
              display: processingDoneRef.current ? 'block' : 'none',
              background: 'transparent'
            }}
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
        className={hasBlackBg && processingDoneRef.current ? 'hidden' : 'w-full h-full object-cover'}
        style={{ display: (hasBlackBg && processingDoneRef.current) ? 'none' : 'block' }}
      />
      {hasBlackBg && (
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
          style={{ 
            display: processingDoneRef.current ? 'block' : 'none',
            background: 'transparent'
          }}
        />
      )}
    </div>
  );
};

// --- CUSTOM DOLLAR COIN ICON ---
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

// --- WAVE CIRCLE UI ---
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

// --- PINK DIAMOND ID BADGE ---
const PinkDiamondIDBadgeIcon = ({ number }: { number: string }) => (
  <div className="relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-2px] translate-x-[2px]">
    <div className="h-[36px] pl-[48px] pr-[20px] bg-gradient-to-r from-[#9D174D] to-[#DB2777] rounded-r-full border-[1px] border-t-[#F472B6] border-b-[#831843] border-r-[#F472B6] flex items-center shadow-[inset_0_2px_5px_rgba(255,255,255,0.3)] z-0">
      <span className="text-white font-bold text-xl tracking-[0.15em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none pt-[2px]">{number}</span>
    </div>
    <div className="absolute left-[-20px] z-10 w-[65px] h-[65px]">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="roseSilverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#FCE7F3" />
            <stop offset="50%" stopColor="#F9A8D4" />
            <stop offset="70%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>
          <linearGradient id="pinkGemInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="50%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#9D174D" />
          </linearGradient>
        </defs>
        <polygon points="50,2 96,28 86,78 50,96 14,78 4,28" fill="url(#roseSilverGrad)" stroke="#FFF1F2" strokeWidth="2.5" />
        <polygon points="50,14 84,34 76,72 50,84 24,72 16,34" fill="url(#pinkGemInnerGrad)" stroke="#FBCFE8" strokeWidth="1" />
        <path d="M50,14 L84,34 L50,50 Z" fill="rgba(255,255,255,0.3)" />
        <path d="M16,34 L50,14 L50,50 Z" fill="rgba(255,255,255,0.5)" />
        <text x="50" y="66" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="46" fill="url(#roseSilverGrad)" textAnchor="middle" filter="drop-shadow(2px 2px 3px rgba(0,0,0,0.8))">ID</text>
        <path d="M15,20 L18,10 L21,20 L31,23 L21,26 L18,36 L15,26 L5,23 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.8" />
        <path d="M80,75 L82,68 L84,75 L91,77 L84,79 L82,86 L80,79 L73,77 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.6" />
        <circle cx="85" cy="25" r="2.5" fill="#FFFFFF" className="animate-ping" opacity="0.7" />
      </svg>
    </div>
  </div>
);

// --- RED ID BADGE ICON ---
const IDBadgeIcon = ({ number }: { number: string }) => (
  <div className="relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-2px] translate-x-[2px]">
    <div className="h-[32px] pl-[42px] pr-[20px] bg-gradient-to-r from-[#D91B10] to-[#F13A24] rounded-r-full border-[1.5px] border-t-[#FF6B55] border-b-[#9D1109] border-r-[#FF6B55] flex items-center shadow-[inset_0_2px_4px_rgba(255,255,255,0.3)] z-0">
      <span className="text-white font-bold text-xl tracking-[0.15em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none pt-[2px]">{number}</span>
    </div>
    <div className="absolute left-[-15px] z-10 w-[54px] h-[54px]">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_8px_rgba(0,0,0,0.5)]">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1AA" />
            <stop offset="25%" stopColor="#FFD335" />
            <stop offset="50%" stopColor="#C98B13" />
            <stop offset="75%" stopColor="#FFD335" />
            <stop offset="100%" stopColor="#9E6100" />
          </linearGradient>
        </defs>
        <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="url(#goldGrad)" stroke="#FFE373" strokeWidth="3" />
        <polygon points="50,12 82,30 82,70 50,88 18,70 18,30" fill="#750600" />
        <text x="50" y="58" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="42" fill="url(#goldGrad)" textAnchor="middle" filter="drop-shadow(1px 2px 2px rgba(0,0,0,0.8))">ID</text>
        <text x="50" y="80" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="18" fill="url(#goldGrad)" textAnchor="middle" filter="drop-shadow(1px 1px 1px rgba(0,0,0,0.8))">SSS</text>
      </svg>
    </div>
  </div>
);

// --- SILVER BLUE ID BADGE ICON ---
const SilverBlueIDBadgeIcon = ({ number }: { number: string }) => (
  <div className="relative flex items-center drop-shadow-xl scale-[0.8] md:scale-100 sm:translate-x-[-2px] translate-x-[2px]">
    <div className="h-[36px] pl-[48px] pr-[20px] bg-gradient-to-r from-[#0C3E8A] to-[#1D5DC2] rounded-r-full border-[1px] border-t-[#4A85E6] border-b-[#072456] border-r-[#4A85E6] flex items-center shadow-[inset_0_2px_5px_rgba(255,255,255,0.3)] z-0">
      <span className="text-white font-bold text-xl tracking-[0.15em] drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] leading-none pt-[2px]">{number}</span>
    </div>
    <div className="absolute left-[-20px] z-10 w-[65px] h-[65px]">
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_5px_10px_rgba(0,0,0,0.6)]">
        <defs>
          <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="30%" stopColor="#E2E8F0" />
            <stop offset="50%" stopColor="#94A3B8" />
            <stop offset="70%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>
          <linearGradient id="gemInnerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#60A5FA" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>
        </defs>
        <polygon points="50,2 96,28 86,78 50,96 14,78 4,28" fill="url(#silverGrad)" stroke="#F8FAFC" strokeWidth="2.5" />
        <polygon points="50,14 84,34 76,72 50,84 24,72 16,34" fill="url(#gemInnerGrad)" stroke="#93C5FD" strokeWidth="1" />
        <path d="M50,14 L84,34 L50,50 Z" fill="rgba(255,255,255,0.3)" />
        <path d="M16,34 L50,14 L50,50 Z" fill="rgba(255,255,255,0.5)" />
        <text x="50" y="66" fontFamily="Impact, Arial Black, sans-serif" fontWeight="900" fontSize="46" fill="url(#silverGrad)" textAnchor="middle" filter="drop-shadow(2px 2px 3px rgba(0,0,0,0.8))">ID</text>
        <path d="M15,20 L18,10 L21,20 L31,23 L21,26 L18,36 L15,26 L5,23 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.8" />
        <path d="M80,75 L82,68 L84,75 L91,77 L84,79 L82,86 L80,79 L73,77 Z" fill="#FFFFFF" className="animate-pulse" opacity="0.6" />
        <circle cx="85" cy="25" r="2.5" fill="#FFFFFF" className="animate-ping" opacity="0.7" />
      </svg>
    </div>
  </div>
);

// --- ENTRY TICKET ICON ---
const EntryTicketIcon = ({ variant = 'golden', className = '' }: { variant?: string; className?: string }) => {
  if (variant === 'platinum') {
    return (
      <div className={cn("relative", className)}>
        <svg viewBox="0 0 120 60" className="w-full h-full drop-shadow-[0_4px_12px_rgba(147,197,253,0.6)]">
          <defs>
            <linearGradient id="platGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E2E8F0" />
              <stop offset="25%" stopColor="#F8FAFC" />
              <stop offset="50%" stopColor="#94A3B8" />
              <stop offset="75%" stopColor="#F1F5F9" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
          </defs>
          <rect x="5" y="5" width="110" height="50" rx="8" fill="url(#platGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
          <rect x="12" y="12" width="96" height="36" rx="4" fill="none" stroke="#93C5FD" strokeWidth="0.8" strokeDasharray="3 3" />
          <text x="60" y="33" fontFamily="Impact, Arial Black" fontSize="18" fill="#1E3A8A" textAnchor="middle" fontWeight="bold">ENTRY</text>
          <text x="60" y="43" fontFamily="Arial" fontSize="7" fill="#3B82F6" textAnchor="middle" letterSpacing="2">PLATINUM PASS</text>
          <circle cx="115" cy="30" r="6" fill="#1E293B" stroke="#93C5FD" strokeWidth="1" />
          <circle cx="115" cy="30" r="3" fill="#3B82F6" className="animate-pulse" />
          <path d="M25,48 L30,52 L35,48 L40,52 L45,48" stroke="#3B82F6" fill="none" strokeWidth="1.5" />
        </svg>
      </div>
    );
  }

  if (variant === 'diamond') {
    return (
      <div className={cn("relative", className)}>
        <svg viewBox="0 0 120 60" className="w-full h-full drop-shadow-[0_4px_15px_rgba(236,72,153,0.5)]">
          <defs>
            <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCE7F3" />
              <stop offset="30%" stopColor="#F9A8D4" />
              <stop offset="60%" stopColor="#F472B6" />
              <stop offset="100%" stopColor="#DB2777" />
            </linearGradient>
          </defs>
          <rect x="5" y="5" width="110" height="50" rx="8" fill="url(#diamondGrad)" stroke="#FBCFE8" strokeWidth="1.5" />
          <rect x="12" y="12" width="96" height="36" rx="4" fill="none" stroke="#FFF" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
          <text x="60" y="33" fontFamily="Impact, Arial Black" fontSize="18" fill="#831843" textAnchor="middle" fontWeight="bold">ENTRY</text>
          <text x="60" y="43" fontFamily="Arial" fontSize="7" fill="#9D174D" textAnchor="middle" letterSpacing="2">DIAMOND PASS</text>
          <circle cx="115" cy="30" r="6" fill="#4C0519" stroke="#F472B6" strokeWidth="1" />
          <circle cx="115" cy="30" r="3" fill="#EC4899" className="animate-pulse" />
          <path d="M20,15 L25,10 L30,15 Z" fill="#FFF" opacity="0.7" />
          <path d="M90,15 L95,10 L100,15 Z" fill="#FFF" opacity="0.7" />
        </svg>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      <svg viewBox="0 0 120 60" className="w-full h-full drop-shadow-[0_4px_12px_rgba(252,213,53,0.5)]">
        <defs>
          <linearGradient id="ticketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF1AA" />
            <stop offset="30%" stopColor="#FFD335" />
            <stop offset="60%" stopColor="#C98B13" />
            <stop offset="100%" stopColor="#9E6100" />
          </linearGradient>
        </defs>
        <rect x="5" y="5" width="110" height="50" rx="8" fill="url(#ticketGrad)" stroke="#FFE373" strokeWidth="1.5" />
        <rect x="12" y="12" width="96" height="36" rx="4" fill="none" stroke="#FFF" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.7" />
        <text x="60" y="33" fontFamily="Impact, Arial Black" fontSize="18" fill="#6B4E00" textAnchor="middle" fontWeight="bold">ENTRY</text>
        <text x="60" y="43" fontFamily="Arial" fontSize="7" fill="#6B4E00" textAnchor="middle" letterSpacing="2">GOLDEN PASS</text>
        <circle cx="115" cy="30" r="6" fill="#3D2D00" stroke="#FFD335" strokeWidth="1" />
        <circle cx="115" cy="30" r="3" fill="#FCD535" className="animate-pulse" />
      </svg>
    </div>
  );
};

// --- FRAME ICON FOR STORE CARDS ---
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

// --- STORE ITEMS ---
const STATIC_STORE_ITEMS = [
  { id: 'heart-bubble', name: 'Heart Bubble', type: 'Bubble', price: 14995, durationDays: 7, description: 'Pink gradient bubble with floating hearts.', icon: Heart, color: 'text-pink-500' },
  { id: 'love-bubble', name: 'Love Bubble', type: 'Bubble', price: 13495, durationDays: 7, description: 'Deep red romantic chat bubble.', icon: Heart, color: 'text-red-500' },
  { id: 'royal-gold-bubble', name: 'Royal Gold', type: 'Bubble', price: 75000, durationDays: 7, description: 'Exclusive premium gold trimmed bubble.', icon: Crown, color: 'text-yellow-400' },
  { id: 'w-lovelyshine', name: 'Lovely Shine', type: 'Wave', price: 59999, durationDays: 7, description: 'Magical blue glow with floating hearts.', icon: Activity, color: 'text-blue-400' },
  { id: 'w-waveflew', name: 'Waveflew', type: 'Wave', price: 10000, durationDays: 7, description: 'Premium 3D Glossy frequency wave.', icon: Activity, color: 'text-white' },
  { id: 'w-tonepink', name: 'Tone Pink', type: 'Wave', price: 30000, durationDays: 7, description: '3D Glossy Pink rhythmic frequency.', icon: Activity, color: 'text-pink-500' },
  { id: 'w-vox', name: 'Vox', type: 'Wave', price: 30500, durationDays: 7, description: 'Crystal blue 3D glossy voice wave.', icon: Activity, color: 'text-blue-500' },
  { id: 'w-reso', name: 'Reso', type: 'Wave', price: 20000, durationDays: 7, description: 'Neon green resonance 3D glossy wave.', icon: Activity, color: 'text-green-500' },
  { id: 'w-echo', name: 'Echo', type: 'Wave', price: 25999, durationDays: 7, description: 'Vibrant orange echo 3D glossy frequency.', icon: Activity, color: 'text-orange-500' },
];

// Auto-unequip check function
const checkAndAutoUnequip = async (userProfile: any, user: any, firestore: any, toast: any) => {
  if (!userProfile || !user || !firestore) return;
  
  const now = Timestamp.now();
  const inventory = userProfile.inventory || {};
  const expiries = inventory.expiries || {};
  let needsUpdate = false;
  const updateData: any = { updatedAt: serverTimestamp() };
  
  // Har type ke liye check karo
  const types = ['Frame', 'Theme', 'Bubble', 'Wave', 'ID', 'Entry'];
  
  for (const type of types) {
    const activeItem = inventory[`active${type}`];
    if (activeItem && activeItem !== 'None' && expiries[activeItem]) {
      const expiry = expiries[activeItem];
      if (expiry.toDate() < now.toDate()) {
        // Expired - unequip karo
        updateData[`inventory.active${type}`] = 'None';
        needsUpdate = true;
        toast?.({ 
          title: 'Item Expired', 
          description: `${activeItem} automatically unequipped (expired)`,
          variant: 'default'
        });
      }
    }
  }
  
  if (needsUpdate) {
    const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
    const userRef = doc(firestore, 'users', user.uid);
    await updateDocumentNonBlocking(profileRef, updateData);
    await updateDocumentNonBlocking(userRef, updateData);
  }
};

export default function StorePage() {
  const router = useRouter();
  const { user } = useUser();
  const { userProfile, isLoading: isProfileLoading } = useUserProfile(user?.uid);
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(7);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState<'store' | 'mine'>('store');

  // Auto-unequip check on mount and every minute
  useEffect(() => {
    if (userProfile && user && firestore) {
      checkAndAutoUnequip(userProfile, user, firestore, toast);
      
      const interval = setInterval(() => {
        checkAndAutoUnequip(userProfile, user, firestore, toast);
      }, 60000); // Har minute check karo
      
      return () => clearInterval(interval);
    }
  }, [userProfile, user, firestore, toast]);

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
      imageUrl: item.imageUrl || null,
    }));
  }, [dbStoreItems]);

  const frameItems = useMemo(() => {
    return boutiqueItems.filter(item => item.type === 'Frame' || item.category === 'Frame');
  }, [boutiqueItems]);

  const bubbleItems = useMemo(() => {
    const staticBubbles = STATIC_STORE_ITEMS.filter(i => i.type === 'Bubble');
    const dynamicBubbles = boutiqueItems.filter(item => item.type === 'Bubble' || item.category === 'Bubble');
    return [...staticBubbles, ...dynamicBubbles];
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

  const entryItems = useMemo(() => [
    { id: 'entry-golden', name: 'Golden Entry', type: 'Entry', price: 1000000, durationDays: 7, description: 'Premium Golden entry pass with exclusive golden trim.', variant: 'golden' },
    { id: 'entry-platinum', name: 'Platinum Entry', type: 'Entry', price: 2500000, durationDays: 7, description: 'Exclusive Platinum entry pass with diamond shine.', variant: 'platinum' },
    { id: 'entry-diamond', name: 'Diamond Entry', type: 'Entry', price: 5000000, durationDays: 7, description: 'Ultra Premium Diamond entry pass - rarest of all.', variant: 'diamond' },
  ], []);

  const nonFrameBoutiqueItems = useMemo(() => {
    return boutiqueItems.filter(item => item.type !== 'Frame' && item.category !== 'Frame' && item.type !== 'Bubble' && item.category !== 'Bubble');
  }, [boutiqueItems]);

  const allItems = useMemo(() => {
    return [...frameItems, ...bubbleItems, ...dynamicThemes, ...waveItems, ...idItems, ...entryItems, ...nonFrameBoutiqueItems];
  }, [frameItems, bubbleItems, dynamicThemes, waveItems, idItems, entryItems, nonFrameBoutiqueItems]);

  const configRef = useMemo(() => firestore ? doc(firestore, 'appConfig', 'global') : null, [firestore]);
  const { data: config } = useDoc(configRef);
  const storeNotForSale = (config?.storeNotForSale || {}) as Record<string, boolean>;

  const allItemsWithFlags = useMemo(() => {
    return allItems.map(item => ({ ...item, notForSale: !!storeNotForSale[item.id] }));
  }, [allItems, storeNotForSale]);

  // MINE tab items - sirf purchased items
  const purchasedItems = useMemo(() => {
    const ownedIds = userProfile?.inventory?.ownedItems || [];
    return allItemsWithFlags.filter(item => ownedIds.includes(item.id));
  }, [allItemsWithFlags, userProfile?.inventory?.ownedItems]);

  const getCalculatedPrice = (basePrice: number, duration: number) => {
    if (duration === 7) return basePrice;
    return Math.floor((basePrice / 7) * 3);
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
    
    // Check if item is expired
    const expiries = userProfile.inventory?.expiries || {};
    const expiry = expiries[item.id];
    if (expiry && expiry.toDate() < new Date()) {
      toast({ variant: 'destructive', title: 'Item Expired', description: `${item.name} expire ho chuka hai. Dobara purchase karo.` });
      return;
    }
    
    setIsProcessing(true);
    try {
      const profileRef = doc(firestore, 'users', user.uid, 'profile', user.uid);
      const userRef = doc(firestore, 'users', user.uid);
      let field = `inventory.active${item.type}`;
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

  // Helper to render store card icon
  const renderStoreCardIcon = (item: any) => {
    if (item.type === 'Frame') {
      if (item.isDynamic && (item.videoUrl || item.imageUrl)) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <SmartBlackRemover 
              src={mediaUrl} 
              type={mediaType} 
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <FramePlaceholderIcon className="h-12 w-12" />;
    }
    
    if (item.type === 'Theme') {
      if (item.videoUrl || item.imageUrl) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <SmartBlackRemover 
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
    
    if (item.type === 'Bubble') {
      if (item.videoUrl || item.imageUrl) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-full w-full flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <SmartBlackRemover 
              src={mediaUrl} 
              type={mediaType} 
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-[10px]">Hello</ChatMessageBubble>;
    }
    
    if (item.type === 'Wave') {
      return <WaveCircleIcon colorClass={item.color} size="h-20 w-20" isLovelyShine={item.id === 'w-lovelyshine'} />;
    }
    
    if (item.type === 'ID') {
      if (item.isPinkDiamond) return <PinkDiamondIDBadgeIcon number={item.displayId || ''} />;
      if (item.isSilver) return <SilverBlueIDBadgeIcon number={item.displayId || ''} />;
      return <IDBadgeIcon number={item.displayId || ''} />;
    }
    
    if (item.type === 'Entry') {
      return <EntryTicketIcon variant={item.variant} className="w-28 h-14" />;
    }
    
    if (item.icon) {
      return <item.icon className={cn("h-12 w-12 opacity-50", item.color)} />;
    }
    
    return <ShoppingBag className="h-12 w-12 opacity-50 text-gray-400" />;
  };

  // Helper to render preview icon - SQUARE for videos (not circle)
  const renderPreviewIcon = (item: any) => {
    if (item.type === 'Frame') {
      if (item.isDynamic && (item.videoUrl || item.imageUrl)) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-36 w-36 flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <SmartBlackRemover 
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
    
    if (item.type === 'Theme') {
      if (item.videoUrl || item.imageUrl) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-36 w-36 flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <SmartBlackRemover 
              src={mediaUrl} 
              type={mediaType} 
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <Palette className={cn("h-20 w-20 opacity-80", item.color || "text-purple-400")} />;
    }
    
    if (item.type === 'Bubble') {
      if (item.videoUrl || item.imageUrl) {
        const mediaUrl = item.videoUrl || item.imageUrl;
        const mediaType = item.videoUrl ? 'video' : 'image';
        return (
          <div className="relative h-36 w-36 flex items-center justify-center overflow-hidden rounded-lg" style={{ background: 'transparent' }}>
            <SmartBlackRemover 
              src={mediaUrl} 
              type={mediaType} 
              className="w-full h-full"
              style={{ background: 'transparent' }}
            />
          </div>
        );
      }
      return <ChatMessageBubble bubbleId={item.id} isMe={true} className="text-sm">Hello</ChatMessageBubble>;
    }
    
    if (item.type === 'Wave') {
      return <WaveCircleIcon colorClass={item.color} size="h-32 w-32" isLovelyShine={item.id === 'w-lovelyshine'} />;
    }
    
    if (item.type === 'ID') {
      return (
        <div className="scale-125 pt-2">
          {item.isPinkDiamond ? <PinkDiamondIDBadgeIcon number={item.displayId || ''} /> :
           item.isSilver ? <SilverBlueIDBadgeIcon number={item.displayId || ''} /> : 
           <IDBadgeIcon number={item.displayId || ''} />}
        </div>
      );
    }
    
    if (item.type === 'Entry') {
      return (
        <div className="scale-125">
          <EntryTicketIcon variant={item.variant} className="w-36 h-18" />
        </div>
      );
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

  // Current items to display based on active tab
  const currentItems = activeTab === 'store' ? allItemsWithFlags : purchasedItems;
  const currentHeading = activeTab === 'store' ? 'Store' : 'Mine';

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#121A1F] via-[#0A0E12] to-[#050709] text-white pb-safe overflow-x-hidden">
      
      {/* More Glossy Background Effect */}
      <div className="absolute top-0 left-0 right-0 h-[15vh] pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-600/30 via-purple-900/10 to-transparent" />
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-full bg-purple-500/15 rounded-[100%] blur-xl" />
        <div className="absolute bottom-[-20%] left-0 right-0 h-40 bg-gradient-to-t from-[#FCD535]/5 to-transparent" />
      </div>

      <div className="relative z-10 space-y-6 px-4 md:px-8 max-w-7xl mx-auto pt-16 pb-24">
        
        <header className="relative flex items-center justify-between border-b border-white/10 pb-6 min-h-[48px]">
          <button onClick={() => router.back()} className="p-2 bg-white/10 hover:bg-white/20 transition-all duration-300 text-white rounded-full backdrop-blur-sm">
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-[0_2px_15px_rgba(168,85,247,0.5)] bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
            {currentHeading}
          </h1>
          
          {/* Top Right Corner - Mine Tab Button */}
          <button 
            onClick={() => setActiveTab(activeTab === 'store' ? 'mine' : 'store')}
            className={cn(
              "p-2 transition-all duration-300 rounded-full backdrop-blur-sm flex items-center gap-2",
              activeTab === 'mine' 
                ? "bg-[#FCD535]/20 text-[#FCD535] border border-[#FCD535]/30" 
                : "bg-white/10 hover:bg-white/20 text-white"
            )}
          >
            {activeTab === 'store' ? (
              <>
                <Home className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">Mine</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">Store</span>
              </>
            )}
          </button>
        </header>

        {activeTab === 'store' ? (
          <Tabs defaultValue="All" className="w-full">
            <div className="w-full overflow-x-auto no-scrollbar mb-6">
              <TabsList className="bg-black/20 backdrop-blur-sm inline-flex min-w-full md:min-w-0 gap-2 border border-white/5 rounded-xl p-1">
                {['All', 'Frame', 'Theme', 'Bubble', 'Wave', 'ID', 'Entry'].map(cat => (
                  <TabsTrigger 
                    key={cat} 
                    value={cat} 
                    className="rounded-lg px-6 py-2 text-gray-300 font-medium whitespace-nowrap data-[state=active]:bg-[#FCD535]/20 data-[state=active]:text-[#FCD535] data-[state=active]:shadow-lg transition-all duration-300"
                  >
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {['All', 'Frame', 'Theme', 'Bubble', 'Wave', 'ID', 'Entry'].map(category => (
              <TabsContent key={category} value={category}>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                  {currentItems.filter(i => category === 'All' || i.type === category).map(item => (
                    <Card 
                      key={item.id} 
                      onClick={() => { if (!item.notForSale) setPreviewItem(item); }} 
                      className={cn(
                        "overflow-hidden rounded-2xl bg-gradient-to-b from-[#18232D] to-[#0D141A] border border-[#23303D] shadow-xl transition-all duration-300 text-white",
                        item.notForSale ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:scale-[1.02] hover:border-[#FCD535]/30 hover:shadow-[0_0_20px_rgba(252,213,53,0.1)] active:scale-95"
                      )}
                    >
                      <div className="aspect-square flex items-center justify-center p-4 relative border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
                        {renderStoreCardIcon(item)}
                      </div>
                      <CardHeader className="text-center p-3 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-200 truncate">{item.name}</CardTitle>
                      </CardHeader>
                      <CardFooter className="flex flex-col gap-3 p-3 pt-1">
                        <div className="flex items-center justify-center gap-1.5 text-sm w-full">
                          {item.notForSale ? (
                            <span className="text-red-400 font-black uppercase tracking-widest text-[10px]">Not for sale</span>
                          ) : (
                            <>
                              <DollarCoinIcon className="h-4 w-4" />
                              <span className="text-[#FCD535] font-bold">{item.price.toLocaleString()}</span>
                            </>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          // MINE TAB - sirf purchased items
          <div className="space-y-6">
            {purchasedItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <ShoppingBag className="h-16 w-16 text-gray-600 mb-4" />
                <p className="text-gray-400 text-lg">No items purchased yet</p>
                <p className="text-gray-500 text-sm">Go to Store tab to buy some cool items!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
                {purchasedItems.map(item => {
                  // Check if item is expired
                  const expiries = userProfile?.inventory?.expiries || {};
                  const expiry = expiries[item.id];
                  const isExpired = expiry && expiry.toDate() < new Date();
                  
                  return (
                    <Card 
                      key={item.id} 
                      onClick={() => setPreviewItem(item)} 
                      className={cn(
                        "overflow-hidden rounded-2xl bg-gradient-to-b from-[#18232D] to-[#0D141A] border border-[#23303D] shadow-xl transition-all duration-300 text-white cursor-pointer hover:scale-[1.02] hover:border-[#FCD535]/30 hover:shadow-[0_0_20px_rgba(252,213,53,0.1)]",
                        isExpired && "opacity-50"
                      )}
                    >
                      <div className="aspect-square flex items-center justify-center p-4 relative border-b border-white/5 bg-gradient-to-b from-white/[0.03] to-transparent">
                        {renderStoreCardIcon(item)}
                        {isExpired && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-2xl">
                            <span className="text-red-400 text-xs font-bold bg-black/50 px-2 py-1 rounded-full">Expired</span>
                          </div>
                        )}
                      </div>
                      <CardHeader className="text-center p-3 pb-1">
                        <CardTitle className="text-sm font-medium text-gray-200 truncate">{item.name}</CardTitle>
                      </CardHeader>
                      <CardFooter className="flex flex-col gap-2 p-3 pt-1">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
                          {expiry && (
                            <span>Expires: {expiry.toDate().toLocaleDateString()}</span>
                          )}
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PREVIEW CARD - Square for videos */}
        {previewItem && (
          <>
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 transition-all duration-300" onClick={() => setPreviewItem(null)} />
            
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-[#141414] to-[#1a1a1a] rounded-t-[28px] h-[45vh] flex flex-col shadow-[0_-10px_50px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-full duration-300 ease-out border-t border-white/10">
              
              <button onClick={() => setPreviewItem(null)} className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors z-10">
                <X size={24} />
              </button>

              <div className="flex-1 overflow-y-auto flex flex-col items-center pt-6 pb-4 px-4">
                <div className="mb-4 flex items-center justify-center h-36 w-36">
                  {renderPreviewIcon(previewItem)}
                </div>

                <h2 className="text-xl font-bold text-white tracking-wide bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">{previewItem.name}</h2>
                <p className="text-gray-400 text-sm text-center max-w-xs mt-1">{previewItem.description}</p>

                {/* Tab sirf tab dikhao jab item owned na ho */}
                {!userProfile?.inventory?.ownedItems?.includes(previewItem.id) && !previewItem.notForSale && (
                  <div className="flex gap-4 mt-4 w-full justify-center">
                    {[3, 7].map(days => (
                      <button 
                        key={days}
                        onClick={() => setSelectedDuration(days)}
                        className={cn(
                          "relative border rounded-xl w-28 py-2.5 flex items-center justify-center transition-all duration-200",
                          selectedDuration === days ? "border-[#FCD535] bg-[#FCD535]/10 shadow-lg" : "border-white/10 bg-black/40"
                        )}
                      >
                        <span className={cn("text-sm font-medium", selectedDuration === days ? "text-[#FCD535]" : "text-gray-400")}>{days} Days</span>
                        {selectedDuration === days && (
                          <div className="absolute -bottom-1 -right-1 bg-[#FCD535] rounded-tl-md rounded-br-xl p-0.5">
                            <Check size={10} strokeWidth={3} className="text-black" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* BOTTOM BAR */}
              <div className="bg-gradient-to-r from-[#1a1a1a] to-[#222222] rounded-t-[24px] p-4 pb-6 flex items-center justify-between border-t border-white/5">
                <div className="flex flex-col justify-center">
                  {userProfile?.inventory?.ownedItems?.includes(previewItem.id) ? (
                    (() => {
                      const expiries = userProfile.inventory?.expiries || {};
                      const expiry = expiries[previewItem.id];
                      const isExpired = expiry && expiry.toDate() < new Date();
                      
                      if (isExpired) {
                        return <span className="text-red-400 text-sm font-medium px-3 py-1 rounded-full bg-red-500/20">Expired - Buy Again</span>;
                      }
                      
                      return (
                        <span className={cn(
                          "text-sm font-medium px-3 py-1 rounded-full",
                          userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === previewItem.id
                            ? "bg-[#FCD535]/20 text-[#FCD535]"
                            : "bg-green-500/20 text-green-400"
                        )}>
                          {userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === previewItem.id
                            ? "Currently Equipped"
                            : "Owned"}
                        </span>
                      );
                    })()
                  ) : previewItem.notForSale ? (
                    <span className="text-red-400 text-sm font-medium px-3 py-1 rounded-full bg-red-500/20">Not For Sale</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <DollarCoinIcon className="w-5 h-5" />
                      <span className="text-[#FCD535] font-bold text-xl tracking-wide">
                        {getCalculatedPrice(previewItem.price, selectedDuration).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => {
                    const isOwned = userProfile?.inventory?.ownedItems?.includes(previewItem.id);
                    if (previewItem.notForSale) return;
                    
                    if (isOwned) {
                      // Check if expired
                      const expiries = userProfile?.inventory?.expiries || {};
                      const expiry = expiries[previewItem.id];
                      const isExpired = expiry && expiry.toDate() < new Date();
                      
                      if (isExpired) {
                        handlePurchase(previewItem, selectedDuration);
                      } else {
                        handleEquipToggle(previewItem);
                      }
                    } else {
                      handlePurchase(previewItem, selectedDuration);
                    }
                  }}
                  disabled={isProcessing || previewItem.notForSale}
                  className={cn(
                    "rounded-full px-12 py-5 text-md font-medium tracking-wide shadow-lg transition-all duration-300",
                    isProcessing && "opacity-70 cursor-not-allowed",
                    previewItem.notForSale && "opacity-50 cursor-not-allowed",
                    userProfile?.inventory?.ownedItems?.includes(previewItem.id)
                      ? (() => {
                          const expiries = userProfile?.inventory?.expiries || {};
                          const expiry = expiries[previewItem.id];
                          const isExpired = expiry && expiry.toDate() < new Date();
                          
                          if (isExpired) {
                            return "bg-[#FCD535] text-black hover:bg-[#e5c02b]";
                          }
                          
                          return userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === previewItem.id
                            ? "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30" 
                            : "bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30";
                        })()
                      : "bg-[#FCD535] text-black hover:bg-[#e5c02b] shadow-[0_0_20px_rgba(252,213,53,0.3)]" 
                  )}
                >
                  {isProcessing ? (
                    <Loader className="animate-spin h-4 w-4" />
                  ) : userProfile?.inventory?.ownedItems?.includes(previewItem.id) 
                    ? (() => {
                        const expiries = userProfile?.inventory?.expiries || {};
                        const expiry = expiries[previewItem.id];
                        const isExpired = expiry && expiry.toDate() < new Date();
                        
                        if (isExpired) return 'Buy Again';
                        return userProfile?.inventory?.[`active${previewItem.type}` as keyof typeof userProfile.inventory] === previewItem.id ? 'Unequip' : 'Equip';
                      })()
                    : 'Buy'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
  }
