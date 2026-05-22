'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Monitor, ShieldAlert } from 'lucide-react';

interface NetMirrorPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieUrl: string;
  movieTitle: string;
  startedBy: string;
  currentUserId: string;
}

const PROXY_URL = '/api/netmirror-proxy?url=';

export function NetMirrorPlayer({ open, onOpenChange, movieUrl, movieTitle, startedBy, currentUserId }: NetMirrorPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [adBlocked, setAdBlocked] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const originalUrlRef = useRef(PROXY_URL + encodeURIComponent(movieUrl || ''));

  useEffect(() => {
    if (open) {
      setIsLoading(true);
      originalUrlRef.current = PROXY_URL + encodeURIComponent(movieUrl || '');
    }
  }, [open, movieUrl]);

  useEffect(() => {
    if (!open) return;

    const originalOpen = window.open;
    window.open = (...args: Parameters<typeof window.open>) => {
      setAdBlocked(prev => prev + 1);
      return originalOpen(...args);
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !iframeRef.current) return;

    const checkInterval = setInterval(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      try {
        const currentSrc = iframe.src;
        const original = originalUrlRef.current;
        if (original && currentSrc !== original && !currentSrc.includes('api/netmirror-proxy')) {
          iframe.src = original;
          setAdBlocked(prev => prev + 1);
        }
      } catch {
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

  const openDirect = useCallback(() => {
    window.open(movieUrl || 'https://netmirror.gg/4/en-in', '_blank');
  }, [movieUrl]);

  if (!open) return null;

  const isHost = startedBy === currentUserId;

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
              {/* Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0">
                    <span className="text-white font-black text-sm">N</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{movieTitle || 'NetMirror'}</h3>
                    <p className="text-[10px] text-white/40 truncate">
                      {isHost ? 'You are watching' : `${startedBy} is watching`}
                    </p>
                  </div>
                </div>
                <button onClick={openDirect} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white text-xs font-bold transition-all active:scale-95 shrink-0 shadow-lg shadow-red-600/20">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open
                </button>
              </div>

              {/* Iframe */}
              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
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
                  src={PROXY_URL + encodeURIComponent(movieUrl || '')}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  onLoad={handleIframeLoad}
                />
              </div>

              <p className="text-[10px] text-slate-500 text-center">
                Use <strong>Open</strong> button to sign in and watch in a new tab
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
