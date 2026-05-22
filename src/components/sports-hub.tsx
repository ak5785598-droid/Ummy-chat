'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader, ShieldAlert, Football, Trophy, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IframeMatch {
  server: string;
  url: string;
}

interface Match {
  slug: string;
  tag: string;
  kickoff: string;
  endTime: string;
  league: string;
  poster?: string;
  iframes: IframeMatch[];
}

interface SportsData {
  [category: string]: Match[] | boolean | number | string;
}

interface SportsHubProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SPORT_META: Record<string, { label: string; emoji: string }> = {
  football: { label: 'Football', emoji: '⚽' },
  basketball: { label: 'Basketball', emoji: '🏀' },
  amfootball: { label: 'American Football', emoji: '🏈' },
  cricket: { label: 'Cricket', emoji: '🏏' },
  hockey: { label: 'Hockey', emoji: '🏒' },
  tennis: { label: 'Tennis', emoji: '🎾' },
  baseball: { label: 'Baseball', emoji: '⚾' },
  fight: { label: 'Fighting (UFC/Boxing)', emoji: '🥊' },
  race: { label: 'Racing (F1/MotoGP)', emoji: '🏎️' },
  rugby: { label: 'Rugby', emoji: '🏉' },
  badminton: { label: 'Badminton', emoji: '🏸' },
  volleyball: { label: 'Volleyball', emoji: '🏐' },
  other: { label: 'Other Sports', emoji: '🎯' },
};

const API_BASE = 'https://api.embedsportex.site/api/streams';

function getMatchStatus(kickoff: string, endTime: string): 'live' | 'upcoming' | 'ended' {
  const now = Date.now();
  const start = new Date(kickoff.replace(' ', 'T') + '+07:00').getTime();
  const end = new Date(endTime.replace(' ', 'T') + '+07:00').getTime();
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}

export function SportsHub({ open, onOpenChange }: SportsHubProps) {
  const [sportsData, setSportsData] = useState<SportsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [adBlocked, setAdBlocked] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const originalUrlRef = useRef<string>('');
  const popupBlockedRef = useRef(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}?cache=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        setSportsData(data);
      } else {
        setError('API returned unsuccessful response');
      }
    } catch (e: any) {
      setError(e.message || 'Failed to fetch sports data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setSelectedCategory(null);
      setSelectedMatch(null);
      setAdBlocked(0);
      fetchData();
    }
  }, [open, fetchData]);

  const categories = sportsData
    ? Object.keys(SPORT_META).filter(cat => {
        const matches = sportsData[cat];
        return Array.isArray(matches) && matches.length > 0;
      })
    : [];

  const matchesForCategory = selectedCategory && sportsData
    ? (sportsData[selectedCategory] as Match[] || [])
    : [];

  // Ad protection for iframe
  useEffect(() => {
    if (!selectedMatch) return;

    const originalOpen = window.open;
    window.open = function (...args: Parameters<typeof window.open>) {
      popupBlockedRef.current = true;
      setAdBlocked(prev => prev + 1);
      return null;
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (originalUrlRef.current) {
        e.preventDefault();
        e.returnValue = '';
        if (iframeRef.current) {
          iframeRef.current.src = originalUrlRef.current;
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [selectedMatch]);

  // Monitor iframe for redirects
  useEffect(() => {
    if (!selectedMatch || !iframeRef.current) return;

    const checkInterval = setInterval(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      try {
        const currentSrc = iframe.src;
        const original = originalUrlRef.current;
        const isAllowed = currentSrc.includes('streams.embedsportex.site') || currentSrc.includes('embedsportex.site');
        if (original && currentSrc !== original && !isAllowed) {
          iframe.src = original;
          setAdBlocked(prev => prev + 1);
        }
      } catch {
        if (iframeRef.current && originalUrlRef.current) {
          iframeRef.current.src = originalUrlRef.current;
          setAdBlocked(prev => prev + 1);
        }
      }
    }, 4000);

    return () => clearInterval(checkInterval);
  }, [selectedMatch]);

  const handlePlayMatch = (match: Match) => {
    const streamUrl = match.iframes[0]?.url;
    if (streamUrl) {
      originalUrlRef.current = streamUrl;
      popupBlockedRef.current = false;
      setSelectedMatch(match);
    }
  };

  const handleClosePlayer = () => {
    setSelectedMatch(null);
    setAdBlocked(0);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center pointer-events-none">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="absolute inset-0 bg-black/40 pointer-events-auto"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.2, ease: 'easeInOut' }}
            className="relative w-full max-w-[500px] bg-[#121212] rounded-t-[2rem] border-t border-white/10 shadow-2xl pointer-events-auto overflow-hidden flex flex-col"
            style={{ height: '80vh', maxHeight: '80vh' }}
          >
            {/* Pull Bar */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mt-4 mb-2 shrink-0" />

            {selectedMatch ? (
              // PLAYER VIEW
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
                  <button onClick={handleClosePlayer} className="p-1 hover:scale-110 transition-transform">
                    <ChevronLeft className="h-6 w-6 text-white/60" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-white truncate">{selectedMatch.tag}</h3>
                    <p className="text-[10px] text-white/40 truncate">{selectedMatch.league}</p>
                  </div>
                </div>
                <div className="flex-1 relative bg-black">
                  {adBlocked > 0 && (
                    <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/70 backdrop-blur-sm text-xs text-amber-400 px-2.5 py-1 rounded-full">
                      <ShieldAlert className="h-3 w-3" />
                      <span>{adBlocked} ad{adBlocked > 1 ? 's' : ''} blocked</span>
                    </div>
                  )}
                  <iframe
                    ref={iframeRef}
                    key={selectedMatch.slug}
                    src={selectedMatch.iframes[0]?.url || ''}
                    className="w-full h-full border-0"
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            ) : selectedCategory ? (
              // MATCH LIST VIEW
              <div className="flex flex-col h-full">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0">
                  <button onClick={() => setSelectedCategory(null)} className="p-1 hover:scale-110 transition-transform">
                    <ChevronLeft className="h-6 w-6 text-white/60" />
                  </button>
                  <h2 className="text-lg font-bold text-white">
                    {SPORT_META[selectedCategory]?.emoji} {SPORT_META[selectedCategory]?.label || selectedCategory}
                  </h2>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-3">
                  {matchesForCategory.length === 0 && (
                    <div className="text-center py-12 text-white/40">
                      <p className="text-sm font-medium">No live or upcoming matches</p>
                      <p className="text-xs mt-1">Check back later for events.</p>
                    </div>
                  )}
                  {matchesForCategory.map((match) => {
                    const status = getMatchStatus(match.kickoff, match.endTime);
                    const isLive = status === 'live';
                    return (
                      <button
                        key={match.slug}
                        onClick={() => handlePlayMatch(match)}
                        className="w-full flex items-start gap-3 p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all text-left border border-white/5 active:scale-[0.98]"
                      >
                        {match.poster && (
                          <div className="relative h-16 w-24 rounded-lg overflow-hidden shrink-0 bg-black/30">
                            <img src={match.poster} className="h-full w-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <div className="h-8 w-8 rounded-full bg-black/60 flex items-center justify-center">
                                <Trophy className={`h-4 w-4 ${isLive ? 'text-green-400' : 'text-white'}`} />
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isLive && (
                              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse shrink-0" />
                            )}
                            <p className="text-xs font-bold text-white truncate">{match.tag}</p>
                          </div>
                          <p className="text-[10px] text-white/40 mt-1">{match.league}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className={cn(
                              "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full",
                              isLive
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-white/10 text-white/40'
                            )}>
                              {isLive ? 'LIVE' : 'Upcoming'}
                            </span>
                            <span className="text-[9px] text-white/30">{match.kickoff}</span>
                          </div>
                          {match.iframes.length > 1 && (
                            <p className="text-[9px] text-white/30 mt-1">
                              {match.iframes.length} server options
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              // CATEGORY GRID VIEW
              <div className="flex flex-col h-full">
                <div className="px-4 py-3 border-b border-white/10 shrink-0">
                  <h2 className="text-lg font-bold text-white">Sports Hub</h2>
                  <p className="text-[10px] text-white/40 mt-0.5">Live sports from around the world</p>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar p-4">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader className="h-6 w-6 text-white/40 animate-spin" />
                    </div>
                  ) : error ? (
                    <div className="text-center py-12 text-white/40">
                      <p className="text-sm font-medium">Failed to load sports</p>
                      <p className="text-xs mt-1">{error}</p>
                      <button onClick={fetchData} className="mt-4 px-4 py-2 bg-white/10 rounded-full text-xs text-white font-bold">
                        Retry
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {categories.map((cat) => {
                        const meta = SPORT_META[cat];
                        return (
                          <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all active:scale-95 border border-white/5"
                          >
                            <span className="text-2xl">{meta?.emoji || '🎯'}</span>
                            <span className="text-[10px] font-bold text-white/70 text-center leading-tight">
                              {meta?.label || cat}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
