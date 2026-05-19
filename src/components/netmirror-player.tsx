'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, RefreshCw, AlertCircle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetMirrorPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieUrl?: string;
  movieTitle?: string;
  isHost?: boolean;
  onCloseForAll?: () => void;
}

const DEFAULT_NETMIRROR_URL = 'https://netmirror.world';

export function NetMirrorPlayer({ 
  open, 
  onOpenChange, 
  movieUrl,
  movieTitle,
  isHost,
  onCloseForAll 
}: NetMirrorPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const loadTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUrl = movieUrl || DEFAULT_NETMIRROR_URL;

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      setIsBlocked(false);
      setRetryCount(0);
      
      // Timeout to detect if iframe is blocked
      loadTimeoutRef.current = setTimeout(() => {
        setIsBlocked(true);
        setIsLoading(false);
      }, 5000);
    }
    
    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [open, currentUrl]);

  const handleIframeLoad = () => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }
    setIsLoading(false);
    setIsBlocked(false);
  };

  const handleIframeError = () => {
    setIsBlocked(true);
    setIsLoading(false);
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setIsLoading(true);
    setIsBlocked(false);
  };

  const handleOpenInBrowser = () => {
    window.open(currentUrl, '_blank');
  };

  const handleClose = () => {
    if (isHost && onCloseForAll) {
      onCloseForAll();
    } else {
      onOpenChange(false);
    }
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
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={handleClose}
          />

          {/* Player Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-4xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            {/* Close Button */}
            <button 
              onClick={handleClose}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                  <span className="text-white font-black text-sm">N</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold text-white truncate">
                    {movieTitle || 'NetMirror'}
                  </h2>
                  <p className="text-[10px] text-slate-400">
                    {movieUrl ? 'Custom URL' : 'Browse & Watch'}
                  </p>
                </div>
                <button
                  onClick={handleOpenInBrowser}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold transition-all active:scale-95"
                >
                  <ExternalLink className="h-3 w-3" />
                  Browser
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="p-4">
              {/* Loading State */}
              {isLoading && (
                <div className="aspect-video bg-black rounded-xl flex flex-col items-center justify-center gap-3">
                  <Loader className="h-10 w-10 text-red-500 animate-spin" />
                  <p className="text-sm text-white/50">Loading NetMirror...</p>
                  <p className="text-xs text-white/30">This may take a few seconds</p>
                </div>
              )}

              {/* Blocked/Error State */}
              {isBlocked && !isLoading && (
                <div className="aspect-video bg-black rounded-xl flex flex-col items-center justify-center gap-4 p-6">
                  <div className="h-16 w-16 rounded-full bg-red-500/20 flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-white mb-1">Embedding Restricted</p>
                    <p className="text-xs text-white/50 max-w-md">
                      NetMirror doesn't allow embedding in iframes. Please open it in a new browser tab.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleRetry}
                      className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Retry
                    </button>
                    <button
                      onClick={handleOpenInBrowser}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-bold transition-all active:scale-95"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in Browser
                    </button>
                  </div>
                </div>
              )}

              {/* Iframe Player */}
              {!isBlocked && (
                <div className={cn(
                  "relative aspect-video bg-black rounded-xl overflow-hidden",
                  isLoading ? "opacity-0" : "opacity-100"
                )}>
                  <iframe
                    key={`netmirror-${retryCount}`}
                    ref={iframeRef}
                    src={currentUrl}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                    onLoad={handleIframeLoad}
                    onError={handleIframeError}
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                  />
                  
                  {/* Loading Overlay (fades out) */}
                  {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader className="h-8 w-8 text-red-500 animate-spin" />
                    </div>
                  )}
                </div>
              )}

              {/* Info Footer */}
              <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-white/30">
                <span>NetMirror Web Player</span>
                <span>•</span>
                <span>Ads may appear</span>
                <span>•</span>
                <button 
                  onClick={handleOpenInBrowser}
                  className="text-red-400 hover:text-red-300 underline"
                >
                  Open externally for best experience
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
