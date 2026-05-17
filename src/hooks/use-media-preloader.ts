'use client';

import { useEffect, useRef, useCallback } from 'react';

// Global cache to persist across component re-renders
const videoCache = new Map<string, HTMLVideoElement>();
const imageCache = new Map<string, HTMLImageElement>();

interface UseMediaPreloaderOptions {
  enabled?: boolean;
  maxConcurrent?: number;
}

export function useMediaPreloader(options: UseMediaPreloaderOptions = {}) {
  const { enabled = true, maxConcurrent = 3 } = options;
  const activeRequestsRef = useRef(0);
  const queueRef = useRef<Array<() => void>>([]);

  const preloadVideo = useCallback((url: string): Promise<HTMLVideoElement | null> => {
    if (!url || !enabled) return Promise.resolve(null);
    
    // Return cached video if already loaded
    if (videoCache.has(url)) {
      return Promise.resolve(videoCache.get(url) || null);
    }

    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'auto';
      video.muted = true;
      video.playsInline = true;
      video.style.display = 'none';
      
      const onLoaded = () => {
        videoCache.set(url, video);
        activeRequestsRef.current--;
        processQueue();
        resolve(video);
      };

      const onError = () => {
        activeRequestsRef.current--;
        processQueue();
        resolve(null);
      };

      video.addEventListener('loadeddata', onLoaded, { once: true });
      video.addEventListener('error', onError, { once: true });
      
      video.src = url;
      video.load();
      
      // Small play to ensure browser caches the media
      video.play().catch(() => {});
    });
  }, [enabled]);

  const preloadImage = useCallback((url: string): Promise<string | null> => {
    if (!url || !enabled) return Promise.resolve(null);
    
    if (imageCache.has(url)) {
      return Promise.resolve(url);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        imageCache.set(url, img);
        activeRequestsRef.current--;
        processQueue();
        resolve(url);
      };
      
      img.onerror = () => {
        activeRequestsRef.current--;
        processQueue();
        resolve(null);
      };
      
      img.src = url;
    });
  }, [enabled]);

  const processQueue = useCallback(() => {
    if (queueRef.current.length > 0 && activeRequestsRef.current < maxConcurrent) {
      const next = queueRef.current.shift();
      if (next) {
        activeRequestsRef.current++;
        next();
      }
    }
  }, [maxConcurrent]);

  const preloadBatch = useCallback((urls: { video?: string[]; image?: string[] }) => {
    const allTasks: Array<() => Promise<void>> = [];

    if (urls.video) {
      urls.video.forEach(url => {
        allTasks.push(async () => {
          await preloadVideo(url);
        });
      });
    }

    if (urls.image) {
      urls.image.forEach(url => {
        allTasks.push(async () => {
          await preloadImage(url);
        });
      });
    }

    // Add to queue and process
    allTasks.forEach(task => {
      queueRef.current.push(async () => {
        await task();
      });
    });

    // Start processing
    while (queueRef.current.length > 0 && activeRequestsRef.current < maxConcurrent) {
      const next = queueRef.current.shift();
      if (next) {
        activeRequestsRef.current++;
        next();
      }
    }
  }, [preloadVideo, preloadImage, maxConcurrent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Stop all cached videos to free resources
      videoCache.forEach(video => {
        video.pause();
        video.src = '';
        video.load();
      });
      videoCache.clear();
      imageCache.clear();
    };
  }, []);

  return {
    preloadVideo,
    preloadImage,
    preloadBatch,
    videoCache,
    imageCache,
  };
}

// Utility to get cached video for immediate playback
export function getCachedVideo(url: string): HTMLVideoElement | null {
  return videoCache.get(url) || null;
}

// Utility to check if URL is cached
export function isMediaCached(url: string, type: 'video' | 'image'): boolean {
  if (type === 'video') return videoCache.has(url);
  return imageCache.has(url);
}
