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

const BROWSE_URL = 'https://net22.cc/home?utm_source=room_player';

export function NetMirrorPlayer({ open, onOpenChange, movieUrl, movieTitle, startedBy, currentUserId }: NetMirrorPlayerProps) {
  const [tabOpened, setTabOpened] = useState(false);
  const [adBlocked, setAdBlocked] = useState(0);
  const adBlockedRef = useRef(0);

  const isHost = startedBy === currentUserId;

  useEffect(() => {
    if (!open) {
      setTabOpened(false);
    }
  }, [open]);

  const openInNewTab = useCallback(() => {
    const url = movieUrl || BROWSE_URL;
    window.open(url, '_blank');
    setTabOpened(true);
  }, [movieUrl]);

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
            className="relative w-full max-w-lg bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shrink-0 shadow-lg shadow-red-600/20">
                  <span className="text-white font-black text-base">N</span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-white truncate">{movieTitle || 'NetMirror'}</h3>
                  <p className="text-xs text-white/40 truncate">
                    {isHost ? '🎬 You are watching' : `🎬 ${startedBy} is watching`}
                  </p>
                </div>
              </div>

              {/* Main Content */}
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700/50 flex flex-col items-center justify-center">
                <div className="flex flex-col items-center gap-3 p-4 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/20">
                    <Monitor className="h-8 w-8 text-white" />
                  </div>
                  <p className="text-white font-bold text-lg">{movieTitle || 'NetMirror'}</p>
                  <p className="text-xs text-slate-400">50+ OTT platforms - Movies & Series</p>

                  {tabOpened ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-sm text-green-400 font-bold">
                        <span>✓</span>
                        <span>Opened in new tab</span>
                      </div>
                      <p className="text-[10px] text-slate-500">Switch to the new tab to browse movies</p>
                      <button onClick={openInNewTab} className="mt-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white text-xs font-bold transition-all active:scale-95">
                        Open Again
                      </button>
                    </div>
                  ) : (
                    <button onClick={openInNewTab} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-white text-sm font-bold transition-all active:scale-95 shadow-lg shadow-red-600/30">
                      <ExternalLink className="h-5 w-5" />
                      {isHost ? 'Open & Browse Movies' : 'Join & Watch'}
                    </button>
                  )}

                  {adBlocked > 0 && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-400">
                      <ShieldAlert className="h-3 w-3" />
                      <span>{adBlocked} ad{adBlocked > 1 ? 's' : ''} blocked</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-500 text-center pt-1">
                Opens in a new tab — switch back to room when done
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
