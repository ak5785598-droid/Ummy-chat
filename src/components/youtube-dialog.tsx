'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader, Play, Link as LinkIcon } from 'lucide-react';
import { YouTubePlayer } from './youtube-player';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';

interface YouTubeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userId: string;
  isHost: boolean;
}

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default: { url: string };
      medium: { url: string };
      high: { url: string };
    };
  };
}

interface YouTubeState {
  videoId: string;
  title: string;
  thumbnail: string;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  startedAt: any;
  lastUpdated: any;
  requestedBy: string;
}

const YOUTUBE_API_KEY = 'AIzaSyCpgMk-aZA6EzMBeSjPN9QVGeKvK1Pyduo';

export function YouTubeDialog({ open, onOpenChange, roomId, userId, isHost }: YouTubeDialogProps) {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [youtubeState, setYoutubeState] = useState<YouTubeState | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  const youtubeRef = useMemoFirebase(() => {
    if (!firestore || !roomId) return null;
    return doc(firestore, 'chatRooms', roomId, 'youtube', 'state');
  }, [firestore, roomId]);

  useEffect(() => {
    if (!youtubeRef) return;
    const unsub = onSnapshot(youtubeRef, (snap) => {
      if (snap.exists()) {
        setYoutubeState(snap.data() as YouTubeState);
      } else {
        setYoutubeState(null);
      }
    }, (err) => {
      console.warn('[YouTube] Listener error:', err);
    });
    return () => unsub();
  }, [youtubeRef]);

  const searchYouTube = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&maxResults=12&key=${YOUTUBE_API_KEY}`
      );
      const data = await res.json();
      if (data.items) setResults(data.items);
    } catch (e) {
      console.error('[YouTube] Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const extractVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const handleUrlPaste = useCallback(() => {
    const vid = extractVideoId(urlInput.trim());
    if (vid && youtubeRef && isHost) {
      setDoc(youtubeRef, {
        videoId: vid,
        title: '',
        thumbnail: `https://i.ytimg.com/vi/${vid}/default.jpg`,
        isPlaying: false,
        currentTime: 0,
        volume: 80,
        startedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        requestedBy: userId,
      }, { merge: true });
      setUrlInput('');
    }
  }, [urlInput, youtubeRef, isHost, userId]);

  const selectVideo = useCallback((video: YouTubeVideo) => {
    if (!youtubeRef || !isHost) return;
    setDoc(youtubeRef, {
      videoId: video.id.videoId,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
      isPlaying: false,
      currentTime: 0,
      volume: youtubeState?.volume || 80,
      startedAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      requestedBy: userId,
    }, { merge: true });
  }, [youtubeRef, isHost, userId, youtubeState]);

  const handlePlay = useCallback(() => {
    if (!youtubeRef || !isHost) return;
    setDoc(youtubeRef, {
      isPlaying: true,
      startedAt: serverTimestamp(),
      currentTime: youtubeState?.currentTime || 0,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  }, [youtubeRef, isHost, youtubeState]);

  const handlePause = useCallback(() => {
    if (!youtubeRef || !isHost || !playerReady) return;
    setDoc(youtubeRef, {
      isPlaying: false,
      currentTime: youtubeState?.currentTime || 0,
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  }, [youtubeRef, isHost, youtubeState, playerReady]);

  const handleSeek = useCallback((time: number) => {
    if (!youtubeRef || !isHost) return;
    setDoc(youtubeRef, {
      currentTime: time,
      startedAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    }, { merge: true });
  }, [youtubeRef, isHost]);

  const handleVolume = useCallback((vol: number) => {
    if (!youtubeRef || !isHost) return;
    setDoc(youtubeRef, { volume: vol, lastUpdated: serverTimestamp() }, { merge: true });
  }, [youtubeRef, isHost]);

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
          {/* Backdrop - light dim so room clearly visible */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30"
            onClick={() => onOpenChange(false)}
          />
          
          {/* Video Container - centered */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50"
          >
            {/* Close button */}
            <button 
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-sm transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Content area */}
            <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center gap-3 pb-2 border-b border-slate-800">
                <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
                  <Play className="h-4 w-4 text-white fill-white" />
                </div>
                <h2 className="text-lg font-bold text-white">YouTube</h2>
              </div>

              {isHost && (
                <>
                  {/* Search Bar */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && searchYouTube()}
                        placeholder="Search YouTube..."
                        className="w-full h-10 pl-10 pr-4 bg-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-slate-700"
                      />
                    </div>
                    <button
                      onClick={searchYouTube}
                      disabled={isSearching}
                      className="h-10 px-4 bg-red-600 hover:bg-red-700 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-colors active:scale-95"
                    >
                      {isSearching ? <Loader className="h-4 w-4 animate-spin" /> : 'Search'}
                    </button>
                  </div>

                  {/* URL Input */}
                  <div className="flex gap-2">
                    <input
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleUrlPaste()}
                      placeholder="Or paste YouTube URL..."
                      className="flex-1 h-10 px-4 bg-slate-800 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500/50 border border-slate-700"
                    />
                    <button
                      onClick={handleUrlPaste}
                      className="h-10 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-sm font-bold border border-slate-700 transition-colors active:scale-95"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Search Results */}
                  {results.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {results.map((v) => (
                        <button
                          key={v.id.videoId}
                          onClick={() => selectVideo(v)}
                          className="group relative rounded-xl overflow-hidden bg-slate-800 hover:ring-2 hover:ring-red-500 transition-all active:scale-95"
                        >
                          <img
                            src={v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url}
                            alt={v.snippet.title}
                            className="w-full aspect-video object-cover"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Play className="h-8 w-8 text-white" />
                          </div>
                          <div className="p-2">
                            <p className="text-xs text-white truncate">{v.snippet.title}</p>
                            <p className="text-[10px] text-slate-400 truncate">{v.snippet.channelTitle}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* Video Player */}
              {youtubeState?.videoId ? (
                <YouTubePlayer
                  videoId={youtubeState.videoId}
                  title={youtubeState.title}
                  isPlaying={youtubeState.isPlaying}
                  currentTime={youtubeState.currentTime}
                  volume={youtubeState.volume || 80}
                  onPlay={handlePlay}
                  onPause={handlePause}
                  onSeek={handleSeek}
                  onVolumeChange={handleVolume}
                  onReady={() => setPlayerReady(true)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
                  <Play className="h-10 w-10 text-slate-700" />
                  <p>{isHost ? 'Search or paste a YouTube URL to start' : 'Waiting for host to select a video...'}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
