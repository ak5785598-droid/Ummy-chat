'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, ExternalLink } from 'lucide-react';

interface NetMirrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHost: boolean;
}

const NETMIRROR_URL = 'https://netmirror.gg';

export function NetMirrorDialog({ open, onOpenChange, isHost }: NetMirrorDialogProps) {
  const [isLoading, setIsLoading] = useState(true);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] bg-black"
        >
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 3H8L16 13V3H19V21H16L8 11V21H5V3Z" fill="currentColor"/>
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">NetMirror</h2>
                <p className="text-[10px] text-slate-400">Movies & Series</p>
              </div>
            </div>
            <button 
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Iframe Container - Full Screen */}
          <div className="w-full h-full bg-black relative">
            <iframe
              src={NETMIRROR_URL}
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals allow-downloads"
              title="NetMirror Streaming"
              onLoad={() => setIsLoading(false)}
            />
            
            {/* Loading State Overlay */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-0">
                <Loader className="h-10 w-10 animate-spin text-red-500 mb-3" />
                <p className="text-sm text-slate-400">Loading NetMirror...</p>
              </div>
            )}
          </div>

          {/* Bottom Info Bar */}
          <div className="absolute bottom-0 left-0 right-0 z-10 p-3 bg-gradient-to-t from-black/80 to-transparent">
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ExternalLink className="h-3 w-3" />
              <span>For best experience, download the NetMirror APK</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
