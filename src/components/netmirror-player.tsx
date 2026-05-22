'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, AlertTriangle } from 'lucide-react';

const NETMIRROR_HOME = 'https://netmirror.gg/4/en-in';
const ALLOWED_DOMAIN = 'netmirror.gg';

interface NetMirrorPlayerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movieUrl: string;
  movieTitle: string;
  startedBy: string;
  currentUserId: string;
}

export function NetMirrorPlayer({ open, onOpenChange, movieUrl, movieTitle, startedBy, currentUserId }: NetMirrorPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const originalUrlRef = useRef(NETMIRROR_HOME);
  const [isLoading, setIsLoading] = useState(true);
  const [blockedNavCount, setBlockedNavCount] = useState(0);

  useEffect(() => {
    if (open) setIsLoading(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const checkInterval = setInterval(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      try {
        const currentSrc = iframe.src;
        if (!currentSrc.includes(ALLOWED_DOMAIN)) {
          iframe.src = originalUrlRef.current;
          setBlockedNavCount(prev => prev + 1);
          setIsLoading(true);
        }
      } catch {
        if (iframeRef.current) {
          iframeRef.current.src = originalUrlRef.current;
          setBlockedNavCount(prev => prev + 1);
          setIsLoading(true);
        }
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [open]);

  const openExternal = useCallback(() => {
    window.open('https://netmirror.gg/4/en-in', '_blank');
  }, []);

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
                <button onClick={openExternal} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-lg text-white text-xs font-bold transition-all active:scale-95 shrink-0 shadow-lg shadow-red-600/20">
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open in Browser
                </button>
              </div>

              <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    <div className="h-8 w-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                  </div>
                )}
                {blockedNavCount > 0 && (
                  <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-yellow-900/80 backdrop-blur-sm text-xs text-yellow-300 px-2.5 py-1 rounded-full">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Use &quot;Open in Browser&quot; to sign in ({blockedNavCount})</span>
                  </div>
                )}
                <iframe
                  ref={iframeRef}
                  key={`netmirror-${open}`}
                  src={NETMIRROR_HOME}
                  className="w-full h-full border-0"
                  allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                  allowFullScreen
                  onLoad={() => setIsLoading(false)}
                />
              </div>

              <p className="text-[10px] text-slate-500 text-center">
                Browse movies with language selector in the player. Sign in required — use <strong>Open in Browser</strong>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
