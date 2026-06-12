'use client';

import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// ⚡ GPU-ACCELERATED BLACK BG REMOVER (NO CPU LOOPS/CANVAS RENDER) ⚡
// ============================================================

export const SmartBlackRemover = ({ 
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
  const [isBlackBg, setIsBlackBg] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);

  const detectSolidBlackBg = (media: HTMLVideoElement | HTMLImageElement, width: number, height: number) => {
    if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height)) return false;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
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

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    try {
      const hasBlackBg = detectSolidBlackBg(img, img.naturalWidth, img.naturalHeight);
      setIsBlackBg(hasBlackBg);
    } catch (err) {
      console.warn('SmartBlackRemover: CORS/Canvas check failed', err);
    }
  };

  const handleVideoReady = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.readyState >= 2) {
      try {
        const hasBlackBg = detectSolidBlackBg(video, video.videoWidth, video.videoHeight);
        setIsBlackBg(hasBlackBg);
      } catch (err) {
        console.warn('SmartBlackRemover: CORS/Canvas check failed', err);
      }
    }
  };

  const finalStyle: React.CSSProperties = {
    ...style,
    ...(isBlackBg ? { mixBlendMode: 'screen' } : {})
  };

  if (type === 'video') {
    return (
      <video
        ref={mediaRef as React.RefObject<HTMLVideoElement>}
        src={src}
        autoPlay
        muted
        loop
        playsInline
        className={cn("w-full h-full object-cover", className)}
        style={finalStyle}
        onLoadedData={handleVideoReady}
        crossOrigin="anonymous"
      />
    );
  }

  return (
    <img
      ref={mediaRef as React.RefObject<HTMLImageElement>}
      src={src}
      alt=""
      className={cn("w-full h-full object-cover", className)}
      style={finalStyle}
      onLoad={handleImageLoad}
      crossOrigin="anonymous"
    />
  );
};

// ============================================================
// ⚡ COMPACT VIDEO AVATAR FRAME - USING SMART BLACK REMOVER ⚡
// ============================================================

export const CompactVideoAvatarFrame = ({ 
  frameMediaUrl, 
  children,
  avatarSize = 100 
}: { 
  frameMediaUrl: string | null | undefined; 
  children: React.ReactNode;
  avatarSize?: number;
}) => {
  const frameSize = avatarSize * 1.70;
  const isVideo = frameMediaUrl?.includes('.mp4') || frameMediaUrl?.includes('.webm') || frameMediaUrl?.includes('.mov') || frameMediaUrl?.includes('video');
  
  const [frameReady, setFrameReady] = useState(false);
  const prevFrameRef = useRef<string | null | undefined>(null);
  
  React.useEffect(() => {
    if (prevFrameRef.current !== frameMediaUrl) {
      setFrameReady(false);
      prevFrameRef.current = frameMediaUrl;
      const timer = setTimeout(() => setFrameReady(true), 300);
      return () => clearTimeout(timer);
    }
  }, [frameMediaUrl]);
  
  if (!frameMediaUrl) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex items-center justify-center" style={{ width: frameSize, height: frameSize }}>
      <div 
        className="absolute inset-0 z-[110] pointer-events-none overflow-visible"
        style={{ 
          opacity: frameReady ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      >
        <SmartBlackRemover 
          src={frameMediaUrl} 
          type={isVideo ? 'video' : 'image'} 
          className="w-full h-full"
        />
      </div>
      <div className="relative z-0 flex items-center justify-center" style={{ width: avatarSize, height: avatarSize }}>
        {children}
      </div>
    </div>
  );
};
