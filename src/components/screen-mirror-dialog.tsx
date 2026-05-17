'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, Monitor, Wifi, WifiOff, Users, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScreenMirrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userId: string;
  isHost: boolean;
  startScreenShare: (quality: '480p' | '720p' | '1080p', target: { type: 'all' | 'specific', uid?: string, name?: string }) => Promise<void>;
  stopScreenShare: () => Promise<void>;
  isScreenSharing: boolean;
  remoteScreenTrack: any;
  participants: Array<{ uid: string; name: string; avatarUrl?: string; isHost?: boolean }>;
}

export function ScreenMirrorDialog({
  open,
  onOpenChange,
  roomId,
  userId,
  isHost,
  startScreenShare,
  stopScreenShare,
  isScreenSharing,
  remoteScreenTrack,
  participants,
}: ScreenMirrorDialogProps) {
  const [quality, setQuality] = useState<'480p' | '720p' | '1080p'>('720p');
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [selectedTarget, setSelectedTarget] = useState<{ uid: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
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

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTargetType('all');
      setSelectedTarget(null);
      setSearchQuery('');
    }
  }, [open]);

  const handleStart = async () => {
    setIsStarting(true);
    try {
      const target = targetType === 'all' 
        ? { type: 'all' as const }
        : { type: 'specific' as const, uid: selectedTarget?.uid, name: selectedTarget?.name };
      await startScreenShare(quality, target);
    } catch (e) {
      console.error('[ScreenMirror] Failed to start:', e);
    } finally {
      setIsStarting(false);
    }
  };

  const handleStop = async () => {
    setIsStopping(true);
    try {
      await stopScreenShare();
    } catch (e) {
      console.error('[ScreenMirror] Failed to stop:', e);
    } finally {
      setIsStopping(false);
    }
  };

  const filteredParticipants = participants.filter(p => 
    p.uid !== userId && (
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uid.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

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
                <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Monitor className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Screen Mirror</h2>
                  <p className="text-xs text-slate-400">Share your screen with room</p>
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
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" 
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

              {/* Target Selection (Host only, when not sharing) */}
              {isHost && !isScreenSharing && (
                <div className="space-y-3">
                  <label className="text-sm text-slate-400 font-medium">Share With</label>
                  
                  {/* Target Type Toggle */}
                  <div className="flex bg-slate-800 p-1 rounded-xl">
                    <button
                      onClick={() => setTargetType('all')}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                        targetType === 'all' 
                          ? "bg-blue-600 text-white shadow-lg" 
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <Users className="h-4 w-4" />
                      All Users
                    </button>
                    <button
                      onClick={() => setTargetType('specific')}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                        targetType === 'specific' 
                          ? "bg-blue-600 text-white shadow-lg" 
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      <User className="h-4 w-4" />
                      Specific User
                    </button>
                  </div>

                  {/* Specific User Selection */}
                  {targetType === 'specific' && (
                    <div className="space-y-2">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          placeholder="Search by name or ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      {/* User List */}
                      <div className="max-h-40 overflow-y-auto space-y-1 rounded-xl border border-slate-800 bg-slate-800/50 p-1">
                        {filteredParticipants.length === 0 ? (
                          <p className="text-center text-xs text-slate-500 py-4">No users found</p>
                        ) : (
                          filteredParticipants.map((p) => (
                            <button
                              key={p.uid}
                              onClick={() => setSelectedTarget({ uid: p.uid, name: p.name })}
                              className={cn(
                                "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all text-left",
                                selectedTarget?.uid === p.uid
                                  ? "bg-blue-600/20 border border-blue-500/50"
                                  : "hover:bg-slate-700/50 border border-transparent"
                              )}
                            >
                              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                {p.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{p.name}</p>
                                <p className="text-[10px] text-slate-500 truncate">{p.uid}</p>
                              </div>
                              {selectedTarget?.uid === p.uid && (
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                              )}
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Target Summary */}
                  <div className="p-3 bg-slate-800/50 rounded-xl text-xs text-slate-400">
                    {targetType === 'all' ? (
                      <p>Screen will be shared with <span className="text-blue-400 font-bold">all room members</span></p>
                    ) : selectedTarget ? (
                      <p>Screen will be shared with <span className="text-blue-400 font-bold">{selectedTarget.name}</span> only</p>
                    ) : (
                      <p>Select a user to share with</p>
                    )}
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
                    <Loader className="h-10 w-10 animate-spin text-blue-500" />
                    <p className="text-sm">Sharing your screen...</p>
                    <p className="text-xs text-slate-600">
                      Quality: {quality} • {targetType === 'all' ? 'All users' : selectedTarget?.name || 'Selecting...'}
                    </p>
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
                        {isHost ? 'Select quality and target, then tap Start' : 'Screen share will appear here'}
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
                      disabled={isStarting || (targetType === 'specific' && !selectedTarget)}
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center gap-2"
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
                  <span className="text-blue-400 mt-0.5">•</span>
                  <p>Screen + Audio will be shared with selected target</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
                  <p>Microphone audio will also be transmitted</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-blue-400 mt-0.5">•</span>
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
