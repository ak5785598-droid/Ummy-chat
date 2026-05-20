'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film } from 'lucide-react';

interface MoviePlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tmdbId: number;
  title: string;
  posterPath?: string | null;
}

export function MoviePlayer({ open, onOpenChange, tmdbId, title, posterPath }: MoviePlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const videoUrl = `https://vidlink.pro/movie/${tmdbId}?primaryColor=B20710&secondaryColor=170000&iconColor=B20710&title=true&poster=true&autoplay=true`;

  useEffect(() => {
    if (open) {
      setIsLoading(true);
    }
  }, [open, tmdbId]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4"
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
              {/* Movie Title */}
              <div className="flex items-center justify-center pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
                    <Film className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{title}</h3>
                    <p className="text-[10px] text-white/40">Movie Mirror</p>
                  </div>
                </div>
              </div>

              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
                      <p className="text-xs text-white/50">Loading movie...</p>
                    </div>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  key={`vidlink-${tmdbId}`}
                  src={videoUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
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
