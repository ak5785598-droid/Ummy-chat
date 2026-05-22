'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ArrowLeft, Loader, AlertCircle, Monitor } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface NetMirrorWatchTogetherProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userId: string;
  isHost: boolean;
  onCloseForAll?: () => void;
}

const NETMIRROR_WEB_URL = 'https://netmirror.gg/5/en-in';

export function NetMirrorWatchTogether({ 
  open, 
  onOpenChange, 
  roomId, 
  userId, 
  isHost, 
  onCloseForAll 
}: NetMirrorWatchTogetherProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [movieTitle, setMovieTitle] = useState('');
  const [isOpening, setIsOpening] = useState(false);
  const [isExternalOpen, setIsExternalOpen] = useState(false);

  const netMirrorRef = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return doc(firestore, 'chatRooms', roomId, 'netmirror', 'state');
  }, [firestore, roomId]);

  const handleOpenNetMirror = useCallback(() => {
    setIsOpening(true);
    setIsExternalOpen(true);
    window.open(NETMIRROR_WEB_URL, '_blank');
    toast({
      title: 'NetMirror Opened',
      description: 'Switch back to this tab when ready to share.',
    });
    setIsOpening(false);
  }, [toast]);

  const handleShareToRoom = useCallback(() => {
    if (!netMirrorRef || !isHost || !movieTitle.trim()) return;
    setDoc(netMirrorRef, {
      movieTitle: movieTitle.trim(),
      movieUrl: NETMIRROR_WEB_URL,
      startedAt: serverTimestamp(),
      startedBy: userId,
      isActive: true,
      mode: 'watch-together',
    }, { merge: true });
    setMovieTitle('');
    toast({ 
      title: 'Shared to Room', 
      description: `${movieTitle} is now visible to all room members.`,
    });
  }, [netMirrorRef, isHost, movieTitle, userId, toast]);

  const handleStopSession = useCallback(() => {
    if (!netMirrorRef || !isHost) return;
    setDoc(netMirrorRef, {
      isActive: false,
      movieTitle: '',
      movieUrl: '',
    }, { merge: true });
    toast({ title: 'Session Ended', description: 'NetMirror session stopped for all.' });
  }, [netMirrorRef, isHost, toast]);

  const handleBackToRoom = useCallback(() => {
    if (isHost && onCloseForAll) {
      onCloseForAll();
    } else {
      onOpenChange(false);
    }
  }, [isHost, onCloseForAll, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setIsExternalOpen(false);
    }
  }, [open]);

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
            onClick={handleBackToRoom}
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            {/* Header with Back to Room Button */}
            <div className="p-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                    <span className="text-white font-black text-sm">N</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Watch Together</h2>
                    <p className="text-[10px] text-slate-400">NetMirror Session</p>
                  </div>
                </div>
                <button 
                  onClick={handleBackToRoom}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 text-xs font-bold transition-all active:scale-95"
                >
                  <ArrowLeft className="h-3 w-3" />
                  Back to Room
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Primary Action Button */}
              <button
                onClick={handleOpenNetMirror}
                disabled={isOpening}
                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isOpening ? (
                  <Loader className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <Monitor className="h-5 w-5" />
                    Open NetMirror in Browser
                  </>
                )}
              </button>

              {/* Instructions */}
              <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
                <p className="text-xs font-bold text-slate-300 mb-2">How it works:</p>
                <ol className="text-[11px] text-slate-400 space-y-1.5 list-decimal list-inside">
                  <li>Click button above to open NetMirror</li>
                  <li>Find the movie you want to watch</li>
                  <li>Enter movie title below and share to room</li>
                  <li>Users will see "Join" button in room</li>
                </ol>
              </div>

              {/* Host Share Section */}
              {isHost && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Share Movie to Room</p>
                  
                  <input
                    value={movieTitle}
                    onChange={e => setMovieTitle(e.target.value)}
                    placeholder="Enter movie/series name..."
                    className="w-full h-10 px-4 bg-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-slate-700"
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={handleShareToRoom}
                      disabled={!movieTitle.trim()}
                      className="flex-1 h-10 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Share to Room
                    </button>
                    <button
                      onClick={handleStopSession}
                      className="h-10 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-sm font-bold border border-slate-700 transition-colors active:scale-95"
                    >
                      Stop
                    </button>
                  </div>
                </div>
              )}

              {/* External Open Notice */}
              {isExternalOpen && (
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-blue-400 font-bold mb-1">NetMirror Opened in Browser</p>
                      <p className="text-[10px] text-blue-300/70">
                        Switch back to this tab after finding your movie. Click "Back to Room" when done.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Web Warning */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-xs text-amber-400 font-bold mb-1">Note</p>
                <p className="text-[10px] text-amber-300/70">
                  NetMirror web shows ads. For best experience, use the Android app.
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
