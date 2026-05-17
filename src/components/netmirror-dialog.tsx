'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, Monitor, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetMirrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userId: string;
  isHost: boolean;
  startScreenShare: (quality: '480p' | '720p' | '1080p') => Promise<void>;
  stopScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  remoteScreenTrack: any;
}

export function NetMirrorDialog({
  open,
  onOpenChange,
  roomId,
  userId,
  isHost,
  startScreenShare,
  stopScreenShare,
  isScreenSharing,
  remoteScreenTrack,
}: NetMirrorDialogProps) {
  const [quality, setQuality] = useState<'480p' | '720p' | '1080p'>('720p');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Display remote screen share
  useEffect(() => {
    if (remoteScreenTrack && videoRef.current) {
      remoteScreenTrack.play(videoRef.current);
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [remoteScreenTrack]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      await startScreenShare(quality);
    } catch (e) {
      console.error('[NetMirror] Failed to start:', e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await stopScreenShare();
    } catch (e) {
      console.error('[NetMirror] Failed to stop:', e);
    } finally {
      setIsStopping(false);
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
          {/* Backdrop - 30% dark, no blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            {/* Close Button */}
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Header */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-purple-600 flex items-center justify-center">
                  <Monitor className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">NetMirror</h2>
                  <p className="text-xs text-slate-400">Screen Sharing</p>
                </div>
                {isScreenSharing && (
                  <div className="ml-auto flex items-center gap-1.5 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
                    <Wifi className="h-3 w-3 text-green-400" />
                    <span className="text-xs font-bold text-green-400 uppercase">Live</span>
                  </div>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Quality Selector (Host only, when not sharing) */}
              {isHost && !isScreenSharing && (
                <div className="space-y-2">
                  <label className="text-sm text-slate-400 font-medium">Quality</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['480p', '720p', '1080p'] as const).map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuality(q)}
                        className={cn(
                          "py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95",
                          quality === q 
                            ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30" 
                            : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                        )}
                      >
                        {q}
                        {q === '720p' && <span className="block text-[10px] opacity-70">Recommended</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Screen Preview / Remote View */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden relative border border-slate-800">
                {remoteScreenTrack ? (
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-contain"
                    autoPlay
                    playsInline
                  />
                ) : isScreenSharing ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                    <Loader className="h-10 w-10 animate-spin text-purple-500" />
                    <p className="text-sm">Sharing your screen...</p>
                    <p className="text-xs text-slate-600">Quality: {quality}</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                    <div className="relative">
                      <Monitor className="h-16 w-16 text-slate-700" />
                      <WifiOff className="h-5 w-5 text-slate-600 absolute -bottom-1 -right-1 bg-black rounded-full p-0.5" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">
                        {isHost ? 'Start mirroring to share your screen' : 'Waiting for host to start...'}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        {isHost ? 'Select quality and tap Start' : 'Screen share will appear here'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Controls (Host only) */}
              {isHost && (
                <div className="flex gap-2">
                  {!isScreenSharing ? (
                    <button
                      onClick={handleStart}
                      disabled={isStarting}
                      className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-bold disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isStarting ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Monitor className="h-5 w-5" />
                          Start Mirroring
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={handleStop}
                      disabled={isStopping}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-700 rounded-xl text-white font-bold disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isStopping ? (
                        <>
                          <Loader className="h-5 w-5 animate-spin" />
                          Stopping...
                        </>
                      ) : (
                        <>
                          <WifiOff className="h-5 w-5" />
                          Stop Mirroring
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Info */}
              <div className="p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <p>Screen + Audio will be shared with all room members</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <p>Microphone audio will also be transmitted</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-purple-400 mt-0.5">•</span>
                  <p>Use 720p for better performance on mobile devices</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
