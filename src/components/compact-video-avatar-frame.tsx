'use client';

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

// ============================================================
// ⚡ SMART BLACK REMOVER - SIRF CANVAS RENDERS, NO OVERLAP ⚡
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRef = useRef<HTMLVideoElement | HTMLImageElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const processingRef = useRef(false);
  const [useCanvas, setUseCanvas] = useState(false);
  const [isProcessed, setIsProcessed] = useState(false);
  const hasProcessedRef = useRef(false);
  const mediaLoadedRef = useRef(false);

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
                  data[i + 3] = 0;
                }
              }
            }
          }
        }
      }
    }

    ctx.putImageData(imageData, 0, 0);
    processingRef.current = false;
    
    if (!hasProcessedRef.current) {
      hasProcessedRef.current = true;
      setIsProcessed(true);
    }

    if (type === 'video' && video) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => processFrame(video));
    }
  };

  useEffect(() => {
    if (type === 'image' && mediaRef.current && 'complete' in mediaRef.current) {
      const img = mediaRef.current as HTMLImageElement;
      if (img.complete) {
        mediaLoadedRef.current = true;
        const hasBlackBg = detectSolidBlackBg(img, img.naturalWidth, img.naturalHeight);
        setUseCanvas(hasBlackBg);
        if (hasBlackBg) {
          setTimeout(() => processFrame(), 100);
        }
      }
    }
  }, [src, type]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    mediaLoadedRef.current = true;
    const hasBlackBg = detectSolidBlackBg(img, img.naturalWidth, img.naturalHeight);
    setUseCanvas(hasBlackBg);
    if (hasBlackBg) {
      setTimeout(() => processFrame(), 100);
    }
  };

  const handleVideoReady = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    if (video.readyState >= 2) {
      mediaLoadedRef.current = true;
      const hasBlackBg = detectSolidBlackBg(video, video.videoWidth, video.videoHeight);
      setUseCanvas(hasBlackBg);
      if (hasBlackBg) {
        setTimeout(() => processFrame(video), 100);
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
      hasProcessedRef.current = false;
      mediaLoadedRef.current = false;
    };
  }, [src]);

  useEffect(() => {
    hasProcessedRef.current = false;
    setIsProcessed(false);
    setUseCanvas(false);
    mediaLoadedRef.current = false;
  }, [src]);

  if (type === 'video') {
    return (
      <div className={cn("relative", className)} style={style}>
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover"
          style={{ background: 'transparent' }}
        />
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={src}
          autoPlay
          muted
          loop
          playsInline
          className="hidden"
          onLoadedData={handleVideoReady}
          crossOrigin="anonymous"
        />
      </div>
    );
  }

  return (
    <div className={cn("relative", className)} style={style}>
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ background: 'transparent' }}
      />
      <img
        ref={mediaRef as React.RefObject<HTMLImageElement>}
        src={src}
        alt=""
        className="hidden"
        onLoad={handleImageLoad}
        crossOrigin="anonymous"
      />
    </div>
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
  
  useEffect(() => {
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
