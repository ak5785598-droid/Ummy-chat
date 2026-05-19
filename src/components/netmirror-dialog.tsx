'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader, Play, ExternalLink, Smartphone, Globe, AlertCircle } from 'lucide-react';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface NetMirrorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userId: string;
  isHost: boolean;
  onCloseForAll?: () => void;
}

interface NetMirrorState {
  movieTitle: string;
  movieUrl?: string;
  startedAt: any;
  startedBy: string;
  isActive: boolean;
}

const NETMIRROR_WEB_URL = 'https://netmirror.world';
const NETMIRROR_APP_PACKAGE = 'com.movie.NetMirror';

export function NetMirrorDialog({ open, onOpenChange, roomId, userId, isHost, onCloseForAll }: NetMirrorDialogProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [movieTitle, setMovieTitle] = useState('');
  const [movieUrl, setMovieUrl] = useState('');
  const [netMirrorState, setNetMirrorState] = useState<NetMirrorState | null>(null);
  const [iframeBlocked, setIframeBlocked] = useState(false);

  const netMirrorRef = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return doc(firestore, 'chatRooms', roomId, 'netmirror', 'state');
  }, [firestore, roomId]);

  useEffect(() => {
    if (!netMirrorRef) return;
    const unsub = onSnapshot(netMirrorRef, (snap) => {
      if (snap.exists()) {
        setNetMirrorState(snap.data() as NetMirrorState);
      } else {
        setNetMirrorState(null);
      }
    }, (err) => {
      console.warn('[NetMirror] Listener error:', err);
    });
    return () => unsub();
  }, [netMirrorRef]);

  const handleShareToRoom = useCallback(() => {
    if (!netMirrorRef || !isHost || !movieTitle.trim()) return;
    setDoc(netMirrorRef, {
      movieTitle: movieTitle.trim(),
      movieUrl: movieUrl.trim() || undefined,
      startedAt: serverTimestamp(),
      startedBy: userId,
      isActive: true,
    }, { merge: true });
    setMovieTitle('');
    setMovieUrl('');
  }, [netMirrorRef, isHost, movieTitle, movieUrl, userId]);

  const handleStopSession = useCallback(() => {
    if (!netMirrorRef || !isHost) return;
    setDoc(netMirrorRef, {
      isActive: false,
      movieTitle: '',
      movieUrl: '',
    }, { merge: true });
  }, [netMirrorRef, isHost]);

  const openNetMirrorApp = useCallback(() => {
    const appPackage = NETMIRROR_APP_PACKAGE;
    const playStoreUrl = `https://play.google.com/store/apps/details?id=${appPackage}`;
    
    // Check if user is on Android
    const isAndroid = /Android/i.test(navigator.userAgent);
    
    if (isAndroid) {
      // On Android: Try to open app via intent
      toast({
        title: 'Opening NetMirror App...',
        description: 'If app is not installed, Play Store will open.',
      });
      
      const intentUrl = `intent://#Intent;scheme=https;package=${appPackage};end`;
      window.location.href = intentUrl;
      
      // Fallback to Play Store if app not installed
      setTimeout(() => {
        window.open(playStoreUrl, '_blank');
      }, 2000);
    } else {
      // On Desktop/iOS: Open web version directly
      toast({
        title: 'Opening NetMirror Web',
        description: 'App is only available on Android. Opening web version...',
      });
      window.open(NETMIRROR_WEB_URL, '_blank');
    }
  }, [toast]);

  const openNetMirrorWeb = useCallback(() => {
    toast({
      title: 'Opening NetMirror Web',
      description: 'Note: Web version shows ads on every click.',
    });
    window.open(NETMIRROR_WEB_URL, '_blank');
  }, [toast]);

  const isWatching = netMirrorState?.isActive && netMirrorState.movieTitle;

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
              onClick={() => {
                if (isHost && onCloseForAll) {
                  onCloseForAll();
                } else {
                  onOpenChange(false);
                }
              }}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
                  <span className="text-white font-black text-sm">N</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">NetMirror</h2>
                  <p className="text-[10px] text-slate-400">Watch movies from 50+ OTT platforms</p>
                </div>
              </div>

              {/* Open Options */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={openNetMirrorApp}
                  className="flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 rounded-xl text-white font-bold text-sm transition-all active:scale-95 shadow-lg shadow-red-600/20"
                >
                  <Smartphone className="h-4 w-4" />
                  Open App
                </button>
                <button
                  onClick={openNetMirrorWeb}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-bold text-sm border border-slate-700 transition-all active:scale-95"
                >
                  <Globe className="h-4 w-4" />
                  Open Web
                </button>
              </div>

              {/* Web Warning */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <p className="text-xs text-amber-400 font-bold mb-1">⚠️ Web Version Notice</p>
                <p className="text-[10px] text-amber-300/70">
                  NetMirror web shows ads on every click. For best experience, use the Android app.
                </p>
              </div>

              {/* Host Share Section */}
              {isHost && (
                <div className="space-y-3 pt-2 border-t border-slate-800">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Share to Room</p>
                  
                  <div className="space-y-2">
                    <input
                      value={movieTitle}
                      onChange={e => setMovieTitle(e.target.value)}
                      placeholder="Movie/Series name..."
                      className="w-full h-10 px-4 bg-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-slate-700"
                    />
                    <input
                      value={movieUrl}
                      onChange={e => setMovieUrl(e.target.value)}
                      placeholder="NetMirror URL (optional)..."
                      className="w-full h-10 px-4 bg-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-slate-700"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleShareToRoom}
                      disabled={!movieTitle.trim()}
                      className="flex-1 h-10 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-colors active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Play className="h-4 w-4 fill-current" />
                      Share to Room
                    </button>
                    {isWatching && (
                      <button
                        onClick={handleStopSession}
                        className="h-10 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-sm font-bold border border-slate-700 transition-colors active:scale-95"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Active Session Display */}
              {isWatching && (
                <div className="p-4 bg-gradient-to-r from-red-600/20 to-red-800/20 border border-red-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-600 flex items-center justify-center shrink-0">
                      <span className="text-white font-black text-lg">N</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider">
                        {netMirrorState.startedBy === userId ? 'You' : 'Host'} is watching
                      </p>
                      <p className="text-sm font-bold text-white truncate">{netMirrorState.movieTitle}</p>
                      {netMirrorState.movieUrl && (
                        <a 
                          href={netMirrorState.movieUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[10px] text-red-300/70 hover:text-red-300 flex items-center gap-1 mt-1"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open Link
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Non-host waiting state */}
              {!isHost && !isWatching && (
                <div className="flex flex-col items-center justify-center h-32 text-slate-500 text-sm gap-2">
                  <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                    <span className="text-slate-600 font-black text-xl">N</span>
                  </div>
                  <p>Waiting for host to share a movie...</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
