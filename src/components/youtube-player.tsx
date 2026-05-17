'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack } from 'lucide-react';
import { cn } from '@/lib/utils';

interface YouTubePlayerProps {
  videoId: string;
  title?: string;
  isPlaying: boolean;
  currentTime: number;
  volume: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onReady?: (player: any) => void;
  className?: string;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let apiLoaded = false;

function loadYouTubeAPI(): Promise<void> {
  if (apiLoaded && window.YT) return Promise.resolve();
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      apiLoaded = true;
      resolve();
      return;
    }
    window.onYouTubeIframeAPIReady = () => {
      apiLoaded = true;
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
}

export function YouTubePlayer({
  videoId,
  title,
  isPlaying,
  currentTime,
  volume,
  onPlay,
  onPause,
  onSeek,
  onVolumeChange,
  onReady,
  className,
}: YouTubePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [localTime, setLocalTime] = useState(0);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const isUpdatingRef = useRef(false);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      await loadYouTubeAPI();
      if (!mounted || !containerRef.current) return;

      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: '100%',
        height: '100%',
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          disablekb: 1,
          fs: 0,
        },
        events: {
          onReady: (event: any) => {
            if (!mounted) return;
            setIsPlayerReady(true);
            setDuration(event.target.getDuration?.() || 0);
            event.target.setVolume(volume);
            onReady?.(event.target);
          },
          onStateChange: (event: any) => {
            if (!mounted) return;
            if (event.data === window.YT.PlayerState.PLAYING) {
              setDuration(event.target.getDuration?.() || 0);
            }
          },
          onError: () => {
            console.warn('[YouTube] Player error');
          },
        },
      });
    };

    init();

    return () => {
      mounted = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [videoId]);

  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {}
  }, [isPlaying, isPlayerReady]);

  useEffect(() => {
    if (!playerRef.current || !isPlayerReady || isUpdatingRef.current) return;
    try {
      isUpdatingRef.current = true;
      playerRef.current.seekTo(currentTime, true);
      setLocalTime(currentTime);
      setTimeout(() => { isUpdatingRef.current = false; }, 500);
    } catch {
      isUpdatingRef.current = false;
    }
  }, [currentTime, isPlayerReady]);

  useEffect(() => {
    if (!playerRef.current || !isPlayerReady) return;
    try {
      playerRef.current.setVolume(isMuted ? 0 : volume);
    } catch {}
  }, [volume, isMuted, isPlayerReady]);

  useEffect(() => {
    if (!isPlayerReady || !isPlaying) return;
    const interval = setInterval(() => {
      if (playerRef.current && !isUpdatingRef.current) {
        const t = playerRef.current.getCurrentTime?.() || 0;
        setLocalTime(t);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlayerReady, isPlaying]);

  const handleTogglePlay = useCallback(() => {
    if (!playerRef.current || !isPlayerReady) return;
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }, [isPlaying, isPlayerReady, onPlay, onPause]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    onSeek(t);
    setLocalTime(t);
  }, [onSeek]);

  const handleToggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('w-full bg-black rounded-xl overflow-hidden', className)}>
      {/* Video Container */}
      <div className="relative aspect-video w-full bg-black">
        <div ref={containerRef} className="absolute inset-0" />
        
        {/* Video Title Overlay */}
        {title && (
          <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent">
            <p className="text-sm text-white font-medium truncate pr-8">{title}</p>
          </div>
        )}
      </div>

      {/* Controls Section */}
      <div className="p-3 bg-slate-900/95 backdrop-blur-sm space-y-3 border-t border-slate-800">
        {/* Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-12 text-right font-mono tabular-nums">
            {formatTime(localTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.5}
            value={localTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-slate-700 rounded-full appearance-none cursor-pointer accent-red-500 hover:accent-red-400 transition-all"
          />
          <span className="text-xs text-slate-400 w-12 font-mono tabular-nums">
            {formatTime(duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {/* Play/Pause */}
            <button 
              onClick={handleTogglePlay}
              className="p-2.5 rounded-full hover:bg-slate-800 active:scale-90 transition-all"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white" />
              )}
            </button>
            
            {/* Volume */}
            <button 
              onClick={handleToggleMute}
              className="p-2.5 rounded-full hover:bg-slate-800 active:scale-90 transition-all"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-white" />
              ) : (
                <Volume2 className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          {/* Skip Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSeek(Math.max(0, localTime - 10))}
              className="p-2.5 rounded-full hover:bg-slate-800 active:scale-90 transition-all"
            >
              <SkipBack className="h-5 w-5 text-white" />
            </button>
            
            <button
              onClick={() => onSeek(Math.min(duration, localTime + 10))}
              className="p-2.5 rounded-full hover:bg-slate-800 active:scale-90 transition-all"
            >
              <SkipForward className="h-5 w-5 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
