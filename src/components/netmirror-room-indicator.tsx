'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { InAppBrowser } from '@capacitor/inappbrowser';

interface NetMirrorRoomIndicatorProps {
  isActive: boolean;
  movieTitle: string;
  startedBy: string;
  currentUserId: string;
  onDismiss: () => void;
}

const openNetMirrorUrl = async (url: string) => {
  if (Capacitor.isNativePlatform()) {
    await InAppBrowser.openInSystemBrowser({
      url,
      options: {
        android: {
          showTitle: true,
          hideToolbarOnScroll: false,
        },
        iOS: {
          closeButtonText: 2,
        },
      },
    });
  } else {
    window.open(url, '_blank');
  }
};

export function NetMirrorRoomIndicator({ 
  isActive, 
  movieTitle, 
  startedBy, 
  currentUserId,
  onDismiss 
}: NetMirrorRoomIndicatorProps) {
  const handleJoinClick = async () => {
    await openNetMirrorUrl('https://netmirror.world');
  };

  if (!isActive || !movieTitle) return null;

  const isHost = startedBy === currentUserId;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed right-3 top-20 z-50"
        >
          <div className="bg-slate-900/95 backdrop-blur-sm border border-red-500/30 rounded-xl shadow-lg shadow-red-500/10 overflow-hidden max-w-[200px]">
            {/* Header */}
            <div className="px-3 py-2 bg-gradient-to-r from-red-600/20 to-red-800/20 border-b border-red-500/20">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 rounded bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                  <span className="text-white font-black text-[8px]">N</span>
                </div>
                <p className="text-[9px] font-bold text-red-400 uppercase tracking-wider">
                  {isHost ? 'You' : 'Host'} is watching
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-3 space-y-2">
              <p className="text-xs font-bold text-white truncate">{movieTitle}</p>
              
              <div className="flex gap-1.5">
                <button
                  onClick={handleJoinClick}
                  className="flex-1 h-7 bg-red-600 hover:bg-red-700 rounded-lg text-white text-[10px] font-bold transition-colors active:scale-95 flex items-center justify-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  Join
                </button>
                <button
                  onClick={onDismiss}
                  className="h-7 px-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white/60 text-[10px] font-bold transition-colors active:scale-95"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
