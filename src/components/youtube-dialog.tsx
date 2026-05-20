'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { Search, X, Loader, Play, Link as LinkIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { YouTubePlayer } from './youtube-player';
import { useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, setDoc, onSnapshot } from 'firebase/firestore';

interface YouTubeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  userId: string;
  isHost: boolean;
  onCloseForAll?: () => void;
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

export function YouTubeDialog({ open, onOpenChange, roomId, userId, isHost, onCloseForAll }: YouTubeDialogProps) {
  const firestore = useFirestore();
  const [searchQuery, setSearchQuery] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [youtubeState, setYoutubeState] = useState<YouTubeState | null>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const dragControls = useDragControls();

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
        youtubeState?.videoId ? (
          /* FLOATING DRAGGABLE PLAYBACK CARD */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            drag
            dragListener={false}
            dragControls={dragControls}
            dragMomentum={false}
            className="fixed z-[99999] transform translate-z-0 w-[95vw] max-w-lg bg-slate-900 border border-slate-700/50 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col"
            style={{
              top: '25%',
              left: '2.5%',
            }}
          >
            {/* Custom Header with Drag control */}
            <div className="flex items-center justify-between px-3 py-2 bg-slate-900/95 border-b border-red-500/30 select-none">
              <div className="flex items-center gap-2 min-w-0">
                {/* Drag button */}
                <button
                  onPointerDown={(e) => dragControls.start(e)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white cursor-grab active:cursor-grabbing touch-none select-none"
                  title="Drag Player"
                >
                  <img src="https://img.icons8.com/ios-glyphs/30/ffffff/drag-reorder.png" className="h-4 w-4 opacity-70" alt="Drag" />
                </button>
                
                <Play className="h-4 w-4 text-red-500 fill-red-500 shrink-0" />
                <span className="text-xs font-bold text-white truncate max-w-[180px]">
                  {youtubeState.title || 'YouTube Player'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {isHost && (
                  <>
                    <button
                      onClick={() => setShowSearch(!showSearch)}
                      className={cn(
                        "p-1.5 rounded-full text-white/60 hover:text-white transition-all border",
                        showSearch ? "bg-red-600 border-red-600 text-white" : "hover:bg-white/10 border-white/10"
                      )}
                      title="Search Video"
                    >
                      <Search className="h-3.5 w-3.5" />
                    </button>
                    {onCloseForAll && (
                      <button
                        onClick={onCloseForAll}
                        className="px-2 py-0.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold active:scale-95 transition-all"
                      >
                        Stop For All
                      </button>
                    )}
                  </>
                )}
                
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-all active:scale-90 border border-white/10"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Compact Search/Paste interface inside floating card (Host Only) */}
            {isHost && showSearch && (
              <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2 animate-in slide-in-from-top-2 duration-200">
                {/* Search Bar */}
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchYouTube()}
                      placeholder="Search YouTube..."
                      className="w-full h-8 pl-9 pr-4 bg-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 border border-slate-700"
                    />
                  </div>
                  <button
                    onClick={searchYouTube}
                    disabled={isSearching}
                    className="h-8 px-3 bg-red-600 hover:bg-red-700 rounded-lg text-white text-xs font-bold disabled:opacity-50 transition-colors"
                  >
                    {isSearching ? <Loader className="h-3.5 w-3.5 animate-spin" /> : 'Search'}
                  </button>
                </div>

                {/* URL Input */}
                <div className="flex gap-2">
                  <input
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleUrlPaste()}
                    placeholder="Paste YouTube URL..."
                    className="flex-1 h-8 px-3 bg-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-red-500 border border-slate-700"
                  />
                  <button
                    onClick={handleUrlPaste}
                    className="h-8 px-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-white text-xs font-bold border border-slate-700 transition-colors"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Search Results */}
                {results.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 max-h-[160px] overflow-y-auto pt-1 no-scrollbar">
                    {results.map((v) => (
                      <button
                        key={v.id.videoId}
                        onClick={() => {
                          selectVideo(v);
                          setShowSearch(false);
                        }}
                        className="group relative rounded-lg overflow-hidden bg-slate-800 hover:ring-1 hover:ring-red-500 transition-all text-left"
                      >
                        <img
                          src={v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url}
                          alt={v.snippet.title}
                          className="w-full aspect-video object-cover"
                        />
                        <div className="p-1">
                          <p className="text-[10px] text-white truncate">{v.snippet.title}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Video Player */}
            <div className="relative w-full aspect-video bg-black">
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
            </div>
          </motion.div>
        ) : (
          /* STANDARD CENTERED MODAL DIALOG (SEARCH & SELECT) */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[99999] transform translate-z-0 flex items-center justify-center p-3 sm:p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => onOpenChange(false)}
            />
            
            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 z-10"
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
                  <h2 className="text-lg font-bold text-white">YouTube Player</h2>
                </div>

                {isHost ? (
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
                            className="group relative rounded-xl overflow-hidden bg-slate-800 hover:ring-2 hover:ring-red-500 transition-all active:scale-95 text-left"
                          >
                            <img
                              src={v.snippet.thumbnails.medium?.url || v.snippet.thumbnails.default?.url}
                              alt={v.snippet.title}
                              className="w-full aspect-video object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Play className="h-8 w-8 text-white animate-pulse" />
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
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-slate-500 text-sm gap-2">
                    <Play className="h-10 w-10 text-slate-700 animate-pulse" />
                    <p>Waiting for host to select a video...</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )
      )}
    </AnimatePresence>
  );
}
