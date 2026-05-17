'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Film, Play, X } from 'lucide-react';
import { getPosterUrl } from '@/lib/tmdb';

interface MovieSyncBannerProps {
  visible: boolean;
  movieTitle: string;
  posterPath?: string | null;
  startedBy: string;
  onJoin: () => void;
  onDismiss: () => void;
}

export function MovieSyncBanner({
  visible,
  movieTitle,
  posterPath,
  startedBy,
  onJoin,
  onDismiss,
}: MovieSyncBannerProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-16 left-4 right-4 z-[150] pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="pointer-events-auto bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-purple-500/30 shadow-2xl shadow-purple-500/10 overflow-hidden"
          >
            <div className="flex items-center gap-3 p-3">
              {posterPath && (
                <img
                  src={getPosterUrl(posterPath, 'w185')}
                  alt={movieTitle}
                  className="h-12 w-8 rounded-lg object-cover shrink-0"
                />
              )}
              {!posterPath && (
                <div className="h-12 w-8 rounded-lg bg-purple-600/20 flex items-center justify-center shrink-0">
                  <Film className="h-4 w-4 text-purple-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">
                  {startedBy} is watching
                </p>
                <p className="text-sm font-bold text-white truncate">{movieTitle}</p>
              </div>
              <button
                onClick={onJoin}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold text-xs transition-all active:scale-95 shrink-0"
              >
                <Play className="h-3 w-3 fill-current" />
                Join
              </button>
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-all active:scale-90 shrink-0"
              >
                <X className="h-4 w-4 text-white/40" />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
