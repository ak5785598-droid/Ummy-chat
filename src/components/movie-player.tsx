'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Tv, ShieldAlert, RefreshCw } from 'lucide-react';

const SOURCES = [
  { build: (id: number, type: 'movie' | 'tv', s?: number, e?: number) =>
      type === 'tv' && s && e
        ? `https://vidlink.pro/tv/${id}/${s}/${e}?primaryColor=B20710&secondaryColor=170000&iconColor=B20710&title=true&poster=true&autoplay=true`
        : `https://vidlink.pro/movie/${id}?primaryColor=B20710&secondaryColor=170000&iconColor=B20710&title=true&poster=true&autoplay=true`,
    domain: 'vidlink.pro' },
  { build: (id: number, type: 'movie' | 'tv', s?: number, e?: number) =>
      type === 'tv' && s && e
        ? `https://embed.su/embed/tv/${id}/${s}/${e}`
        : `https://embed.su/embed/movie/${id}`,
    domain: 'embed.su' },
  { build: (id: number, type: 'movie' | 'tv', s?: number, e?: number) =>
      type === 'tv' && s && e
        ? `https://vidsrc.rip/embed/tv/${id}/${s}/${e}`
        : `https://vidsrc.rip/embed/movie/${id}`,
    domain: 'vidsrc.rip' },
];

interface MoviePlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tmdbId: number;
  title: string;
  posterPath?: string | null;
  // TV support
  mediaType?: 'movie' | 'tv';
  season?: number;
  episode?: number;
  episodeName?: string;
}

export function MoviePlayer({
  open,
  onOpenChange,
  tmdbId,
  title,
  posterPath,
  mediaType = 'movie',
  season,
  episode,
  episodeName,
}: MoviePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [sourceIndex, setSourceIndex] = useState(0);

  const source = SOURCES[sourceIndex];
  const videoUrl = source.build(tmdbId, mediaType, season, episode);

  const [adBlocked, setAdBlocked] = useState(0);
  const originalUrlRef = useRef(videoUrl);
  const popupBlockedRef = useRef(false);

  const cycleSource = useCallback(() => {
    setSourceIndex(prev => (prev + 1) % SOURCES.length);
  }, []);

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      originalUrlRef.current = videoUrl;
      popupBlockedRef.current = false;
    }
  }, [open, tmdbId, season, episode, sourceIndex]);

  // Block popups & redirects from embed sources
  useEffect(() => {
    if (!open) return;

    const originalOpen = window.open;
    (window as any).__originalOpen = originalOpen;

    // Block popups
    window.open = function (...args: Parameters<typeof window.open>) {
      popupBlockedRef.current = true;
      setAdBlocked(prev => prev + 1);
      return null;
    };

    // Block redirects (beforeunload)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (originalUrlRef.current) {
        e.preventDefault();
        e.returnValue = '';
        // Restore iframe
        if (iframeRef.current) {
          iframeRef.current.src = originalUrlRef.current;
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [open]);

  // Monitor iframe for ad redirects
  useEffect(() => {
    if (!open || !iframeRef.current) return;

    const checkInterval = setInterval(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const allowedDomains = SOURCES.map(s => s.domain);
      const isAllowedDomain = (url: string) => allowedDomains.some(d => url.includes(d));

      try {
        const currentSrc = iframe.src;
        const original = originalUrlRef.current;
        if (original && currentSrc !== original && !isAllowedDomain(currentSrc)) {
          iframe.src = original;
          setAdBlocked(prev => prev + 1);
        }
      } catch {
        // Cross-origin error means it's an external ad - restore
        if (iframeRef.current && originalUrlRef.current) {
          iframeRef.current.src = originalUrlRef.current;
          setAdBlocked(prev => prev + 1);
        }
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [open]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const subtitle = mediaType === 'tv' && season && episode
    ? `Season ${season} • Episode ${episode}${episodeName ? ` — ${episodeName}` : ''}`
    : 'Movie Mirror';

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[99999] transform translate-z-0 flex items-center justify-center p-3 sm:p-4"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            <div className="p-4 space-y-3 max-h-[85vh] overflow-y-auto">
              {/* Title */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${mediaType === 'tv' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' : 'bg-gradient-to-br from-purple-500 to-violet-700'}`}>
                    {mediaType === 'tv' ? <Tv className="h-4 w-4 text-white" /> : <Film className="h-4 w-4 text-white" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <p className="text-[10px] text-white/40">{subtitle}</p>
                  </div>
                </div>
                <button
                  onClick={cycleSource}
                  className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-white/60 hover:text-white transition-all active:scale-90"
                  title="Switch source"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                      <p className="text-xs text-white/50">
                        {mediaType === 'tv' ? 'Loading episode...' : 'Loading movie...'}
                      </p>
                    </div>
                  </div>
                )}
                {adBlocked > 0 && (
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-xs text-amber-400 px-2.5 py-1 rounded-full">
                    <ShieldAlert className="h-3 w-3" />
                    <span>{adBlocked} ad{adBlocked > 1 ? 's' : ''} blocked</span>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  key={`player-${mediaType}-${tmdbId}-${season}-${episode}-src${sourceIndex}`}
                  src={videoUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
