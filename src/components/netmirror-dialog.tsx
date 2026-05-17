'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, Monitor } from 'lucide-react';

interface NetMirrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHost: boolean;
}

const NETMIRROR_URL = 'https://netmirror.world';

export function NetMirrorDialog({ open, onOpenChange, isHost }: NetMirrorDialogProps) {
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
          {/* Backdrop - same as YouTube */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Dialog Container - same structure as YouTube */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col max-h-[85vh]"
          >
            {/* Close Button */}
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Header */}
            <div className="p-4 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Monitor className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">NetMirror</h2>
                  <p className="text-xs text-slate-400">Movies & Series</p>
                </div>
              </div>
            </div>

            {/* Iframe Container */}
            <div className="flex-1 bg-black relative min-h-[400px] sm:min-h-0">
              <iframe
                src={NETMIRROR_URL}
                className="w-full h-full border-0"
                allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
                title="NetMirror Streaming"
              />
              
              {/* Loading State Overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 pointer-events-none z-0">
                <Loader className="h-10 w-10 animate-spin text-purple-500 mb-3" />
                <p className="text-sm text-slate-400">Loading NetMirror...</p>
              </div>
            </div>

            {/* Info Footer */}
            <div className="p-3 bg-slate-800/50 text-xs text-slate-400 space-y-1 shrink-0 border-t border-slate-800">
              <div className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <p>Browse and watch movies/series directly</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-purple-400 mt-0.5">•</span>
                <p>Use NetMirror's built-in player for best experience</p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
