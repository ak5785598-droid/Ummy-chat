'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, Loader, Play, Crown, Film, Tv, Radio,
  Star, ChevronLeft, ChevronRight, ChevronDown
} from 'lucide-react';
import {
  getTrendingMovies, searchMovies, getPosterUrl,
  getTrendingTV, searchTV, getTVDetails, getTVSeasonDetails,
  type TMDBMovie, type TMDBTVShow, type TMDBTVDetails, type TMDBEpisode,
} from '@/lib/tmdb';
import { useToast } from '@/hooks/use-toast';

// ─── Types ─────────────────────────────────────────────────────────────────────

export type MediaTab = 'movies' | 'series' | 'live';

interface EntertainmentHubDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHost: boolean;
  onPlayMovieForRoom?: (movie: TMDBMovie) => void;
  onWatchMoviePersonal?: (movie: TMDBMovie) => void;
  onWatchTVPersonal?: (show: TMDBTVShow, season: number, episode: number, episodeName?: string) => void;
  onPlayTVForRoom?: (show: TMDBTVShow, season: number, episode: number, episodeName?: string) => void;
  defaultTab?: MediaTab;
}

// ─── Live Sports Links ──────────────────────────────────────────────────────────

const LIVE_SPORTS = [
  { id: 'cricket', emoji: '🏏', name: 'Cricket Live', desc: 'IPL, ICC, T20', url: 'https://www.crictime.com', color: 'from-green-600 to-emerald-700' },
  { id: 'football', emoji: '⚽', name: 'Football Live', desc: 'EPL, Champions League', url: 'https://www.tarjetarojadirecta.homes', color: 'from-blue-600 to-indigo-700' },
  { id: 'kabaddi', emoji: '🤼', name: 'Kabaddi Live', desc: 'PKL & more', url: 'https://www.crictime.com', color: 'from-orange-600 to-red-700' },
  { id: 'basketball', emoji: '🏀', name: 'Basketball', desc: 'NBA Live', url: 'https://www.sportsurge.net', color: 'from-orange-500 to-amber-600' },
  { id: 'tennis', emoji: '🎾', name: 'Tennis Live', desc: 'Grand Slam events', url: 'https://www.sportsurge.net', color: 'from-yellow-500 to-lime-600' },
  { id: 'sports', emoji: '🏆', name: 'All Sports', desc: 'Every live sport', url: 'https://www.sportsurge.net', color: 'from-purple-600 to-violet-700' },
];

// ─── Helper: Poster Card ────────────────────────────────────────────────────────

function PosterCard({ title, posterPath, year, rating, onClick }: {
  title: string;
  posterPath: string | null;
  year?: string;
  rating?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col gap-1.5 active:scale-95 transition-all text-left"
    >
      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-800">
        <img
          src={getPosterUrl(posterPath, 'w185')}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <Play className="h-3 w-3 text-white fill-white" />
            <span className="text-[9px] font-bold text-white">Watch</span>
          </div>
        </div>
        {rating && rating > 0 && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 rounded-md px-1 py-0.5">
            <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
            <span className="text-[9px] font-bold text-white">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>
      <p className="text-[10px] font-medium text-white/80 truncate leading-tight">{title}</p>
      {year && <p className="text-[9px] text-white/30">{year}</p>}
    </button>
  );
}

// ─── Episode Picker ──────────────────────────────────────────────────────────────

function EpisodePicker({ show, onSelect, onBack }: {
  show: TMDBTVShow;
  onSelect: (season: number, episode: number, episodeName: string) => void;
  onBack: () => void;
}) {
  const [tvDetails, setTVDetails] = useState<TMDBTVDetails | null>(null);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState<TMDBEpisode[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [showSeasonMenu, setShowSeasonMenu] = useState(false);

  useEffect(() => {
    (async () => {
      setLoadingDetails(true);
      const details = await getTVDetails(show.id);
      setTVDetails(details);
      setLoadingDetails(false);
      if (details && details.seasons.length > 0) {
        const firstReal = details.seasons.find(s => s.season_number > 0) || details.seasons[0];
        setSelectedSeason(firstReal.season_number);
      }
    })();
  }, [show.id]);

  useEffect(() => {
    if (!tvDetails) return;
    (async () => {
      setLoadingEpisodes(true);
      const seasonData = await getTVSeasonDetails(show.id, selectedSeason);
      setEpisodes(seasonData?.episodes || []);
      setLoadingEpisodes(false);
    })();
  }, [show.id, selectedSeason, tvDetails]);

  const realSeasons = tvDetails?.seasons.filter(s => s.season_number > 0) || [];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-slate-800 shrink-0">
        <button onClick={onBack} className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all active:scale-90">
          <ChevronLeft className="h-4 w-4 text-white" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <img
            src={getPosterUrl(show.poster_path, 'w92')}
            alt={show.name}
            className="h-10 w-7 rounded-lg object-cover shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">{show.name}</p>
            <p className="text-[10px] text-white/40">{tvDetails ? `${realSeasons.length} Season${realSeasons.length !== 1 ? 's' : ''}` : '...'}</p>
          </div>
        </div>

        {/* Season Selector */}
        {realSeasons.length > 0 && (
          <div className="relative shrink-0">
            <button
              onClick={() => setShowSeasonMenu(v => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded-xl text-xs font-bold text-purple-300 transition-all"
            >
              S{selectedSeason}
              <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {showSeasonMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="absolute right-0 top-full mt-1 z-50 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto"
                >
                  {realSeasons.map(s => (
                    <button
                      key={s.season_number}
                      onClick={() => { setSelectedSeason(s.season_number); setShowSeasonMenu(false); }}
                      className={`w-full px-4 py-2 text-xs font-medium text-left transition-colors ${selectedSeason === s.season_number ? 'bg-purple-600 text-white' : 'text-white/70 hover:bg-slate-700'}`}
                    >
                      Season {s.season_number} ({s.episode_count} ep)
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Episodes List */}
      <div className="flex-1 overflow-y-auto py-3 space-y-2">
        {loadingDetails || loadingEpisodes ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-7 w-7 text-purple-400 animate-spin" />
          </div>
        ) : episodes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-white/30">
            <Tv className="h-8 w-8 mb-2" />
            <p className="text-sm">No episodes found</p>
          </div>
        ) : (
          episodes.map(ep => (
            <button
              key={ep.episode_number}
              onClick={() => onSelect(selectedSeason, ep.episode_number, ep.name)}
              className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-purple-500/30 transition-all active:scale-[0.98] group text-left"
            >
              <div className="h-8 w-8 rounded-lg bg-purple-600/20 border border-purple-500/20 flex items-center justify-center shrink-0 group-hover:bg-purple-600/40 transition-colors">
                <span className="text-xs font-bold text-purple-300">{ep.episode_number}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{ep.name}</p>
                {ep.air_date && (
                  <p className="text-[9px] text-white/30">{new Date(ep.air_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                )}
              </div>
              <Play className="h-3.5 w-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Dialog ────────────────────────────────────────────────────────────────

export function EntertainmentHubDialog({
  open,
  onOpenChange,
  isHost,
  onPlayMovieForRoom,
  onWatchMoviePersonal,
  onWatchTVPersonal,
  onPlayTVForRoom,
  defaultTab = 'movies',
}: EntertainmentHubDialogProps) {
  const [activeTab, setActiveTab] = useState<MediaTab>(defaultTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Movie state
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);

  // TV state
  const [shows, setShows] = useState<TMDBTVShow[]>([]);
  const [selectedShow, setSelectedShow] = useState<TMDBTVShow | null>(null);
  const [showEpisodePicker, setShowEpisodePicker] = useState(false);

  const { toast } = useToast();
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Load content on tab/open ──────────────────────────────────────────────────

  const loadMovies = useCallback(async () => {
    setIsLoading(true);
    const result = await getTrendingMovies(1);
    setMovies(result.movies);
    setIsLoading(false);
  }, []);

  const loadShows = useCallback(async () => {
    setIsLoading(true);
    const result = await getTrendingTV(1);
    setShows(result.shows);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!open) return;
    setSearchQuery('');
    setSelectedMovie(null);
    setSelectedShow(null);
    setShowEpisodePicker(false);
    if (activeTab === 'movies') loadMovies();
    else if (activeTab === 'series') loadShows();
  }, [open, activeTab]);

  // ── Search ────────────────────────────────────────────────────────────────────

  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (!q) {
      if (activeTab === 'movies') loadMovies();
      else if (activeTab === 'series') loadShows();
      return;
    }
    setIsSearching(true);
    if (activeTab === 'movies') {
      const r = await searchMovies(q);
      setMovies(r.movies);
    } else {
      const r = await searchTV(q);
      setShows(r.shows);
    }
    setIsSearching(false);
  };

  // ── Movie actions ─────────────────────────────────────────────────────────────

  const handleWatchMoviePersonal = () => {
    if (!selectedMovie) return;
    onWatchMoviePersonal?.(selectedMovie);
    setSelectedMovie(null);
  };

  const handlePlayMovieForRoom = () => {
    if (!selectedMovie) return;
    onPlayMovieForRoom?.(selectedMovie);
    setSelectedMovie(null);
    onOpenChange(false);
    toast({ title: '🎬 Movie Mirror Synced', description: `${selectedMovie.title} is now playing for the room.` });
  };

  // ── TV actions ────────────────────────────────────────────────────────────────

  const handleSelectShow = (show: TMDBTVShow) => {
    setSelectedShow(show);
    setShowEpisodePicker(true);
  };

  const handleEpisodeSelect = (season: number, episode: number, episodeName: string) => {
    if (!selectedShow) return;
    setShowEpisodePicker(false);
    // Open action sheet with episode selection
    setSelectedEpisodeChoice({ season, episode, episodeName });
  };

  const [selectedEpisodeChoice, setSelectedEpisodeChoice] = useState<{
    season: number; episode: number; episodeName: string;
  } | null>(null);

  const handleWatchEpisodePersonal = () => {
    if (!selectedShow || !selectedEpisodeChoice) return;
    onWatchTVPersonal?.(selectedShow, selectedEpisodeChoice.season, selectedEpisodeChoice.episode, selectedEpisodeChoice.episodeName);
    setSelectedShow(null);
    setSelectedEpisodeChoice(null);
  };

  const handlePlayEpisodeForRoom = () => {
    if (!selectedShow || !selectedEpisodeChoice) return;
    onPlayTVForRoom?.(selectedShow, selectedEpisodeChoice.season, selectedEpisodeChoice.episode, selectedEpisodeChoice.episodeName);
    setSelectedShow(null);
    setSelectedEpisodeChoice(null);
    onOpenChange(false);
    toast({ title: '📺 Series Synced', description: `${selectedShow.name} S${selectedEpisodeChoice.season}E${selectedEpisodeChoice.episode} is playing for the room.` });
  };

  const tabs: { id: MediaTab; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'movies', label: 'Movies', icon: <Film className="h-3.5 w-3.5" />, color: 'from-purple-600 to-violet-600' },
    { id: 'series', label: 'Series', icon: <Tv className="h-3.5 w-3.5" />, color: 'from-blue-600 to-cyan-600' },
    { id: 'live', label: 'Live', icon: <Radio className="h-3.5 w-3.5" />, color: 'from-red-600 to-rose-600' },
  ];

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 flex flex-col"
            style={{ maxHeight: '88vh' }}
          >
            {/* Close */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Header */}
            <div className="px-5 pt-5 pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600 flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg">🎬</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Entertainment Hub</h2>
                  <p className="text-xs text-slate-400">Movies • Series • Live Sports</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setSearchQuery(''); setSelectedMovie(null); setSelectedShow(null); setShowEpisodePicker(false); setSelectedEpisodeChoice(null); }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                      activeTab === tab.id
                        ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                        : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Search bar — only for movies & series */}
            {activeTab !== 'live' && (
              <div className="px-4 py-3 shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                    placeholder={activeTab === 'movies' ? 'Search movies...' : 'Search TV shows...'}
                    className="flex-1 h-10 px-4 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition-all active:scale-95"
                  >
                    {isSearching ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">

              {/* ── MOVIES TAB ─────────────────────────────────────────────── */}
              {activeTab === 'movies' && (
                isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader className="h-8 w-8 text-purple-400 animate-spin" />
                    <p className="text-xs text-white/40">Loading movies...</p>
                  </div>
                ) : movies.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <Film className="h-10 w-10 text-white/20" />
                    <p className="text-sm text-white/40">No movies found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {movies.map(movie => (
                      <PosterCard
                        key={movie.id}
                        title={movie.title}
                        posterPath={movie.poster_path}
                        year={movie.release_date ? String(new Date(movie.release_date).getFullYear()) : undefined}
                        rating={movie.vote_average}
                        onClick={() => setSelectedMovie(movie)}
                      />
                    ))}
                  </div>
                )
              )}

              {/* ── SERIES TAB ─────────────────────────────────────────────── */}
              {activeTab === 'series' && (
                showEpisodePicker && selectedShow ? (
                  <EpisodePicker
                    show={selectedShow}
                    onSelect={handleEpisodeSelect}
                    onBack={() => { setShowEpisodePicker(false); setSelectedShow(null); }}
                  />
                ) : isLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                    <p className="text-xs text-white/40">Loading series...</p>
                  </div>
                ) : shows.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-2">
                    <Tv className="h-10 w-10 text-white/20" />
                    <p className="text-sm text-white/40">No shows found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {shows.map(show => (
                      <PosterCard
                        key={show.id}
                        title={show.name}
                        posterPath={show.poster_path}
                        year={show.first_air_date ? String(new Date(show.first_air_date).getFullYear()) : undefined}
                        rating={show.vote_average}
                        onClick={() => handleSelectShow(show)}
                      />
                    ))}
                  </div>
                )
              )}

              {/* ── LIVE TAB ───────────────────────────────────────────────── */}
              {activeTab === 'live' && (
                <div className="py-2 space-y-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                    <p className="text-xs text-amber-400 font-bold mb-1">⚠️ Live Sports Notice</p>
                    <p className="text-[10px] text-amber-300/70">
                      Live streams open in browser. Availability depends on match schedule. Use a browser for best experience.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {LIVE_SPORTS.map(sport => (
                      <button
                        key={sport.id}
                        onClick={() => {
                          toast({ title: `Opening ${sport.name}`, description: 'Opening in browser...' });
                          window.open(sport.url, '_blank');
                        }}
                        className={`flex flex-col items-start gap-1.5 p-4 rounded-2xl bg-gradient-to-br ${sport.color} text-white active:scale-95 transition-all shadow-lg`}
                      >
                        <span className="text-3xl">{sport.emoji}</span>
                        <div>
                          <p className="text-sm font-bold leading-tight">{sport.name}</p>
                          <p className="text-[10px] opacity-70">{sport.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </motion.div>

          {/* ── MOVIE ACTION SHEET ──────────────────────────────────────────── */}
          <AnimatePresence>
            {selectedMovie && !showEpisodePicker && activeTab === 'movies' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[210] flex items-end justify-center"
              >
                <motion.div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setSelectedMovie(null)}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="relative w-full max-w-md bg-slate-900 rounded-t-2xl overflow-hidden border border-slate-700/50 shadow-2xl"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={getPosterUrl(selectedMovie.poster_path, 'w185')}
                        alt={selectedMovie.title}
                        className="h-20 w-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-bold text-white">{selectedMovie.title}</h3>
                        {selectedMovie.release_date && (
                          <p className="text-xs text-white/40 mt-0.5">{new Date(selectedMovie.release_date).getFullYear()}</p>
                        )}
                        {selectedMovie.overview && (
                          <p className="text-xs text-white/50 mt-2 line-clamp-3 leading-relaxed">{selectedMovie.overview}</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={handleWatchMoviePersonal}
                        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Play className="h-4 w-4 fill-white" />
                        Watch Now
                      </button>
                      {isHost && onPlayMovieForRoom && (
                        <button
                          onClick={handlePlayMovieForRoom}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Crown className="h-4 w-4" />
                          Play for Room
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedMovie(null)}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 font-bold text-sm transition-all active:scale-95"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── TV EPISODE ACTION SHEET ─────────────────────────────────────── */}
          <AnimatePresence>
            {selectedEpisodeChoice && selectedShow && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[210] flex items-end justify-center"
              >
                <motion.div
                  className="absolute inset-0 bg-black/50"
                  onClick={() => setSelectedEpisodeChoice(null)}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="relative w-full max-w-md bg-slate-900 rounded-t-2xl overflow-hidden border border-slate-700/50 shadow-2xl"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={getPosterUrl(selectedShow.poster_path, 'w185')}
                        alt={selectedShow.name}
                        className="h-20 w-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                          Season {selectedEpisodeChoice.season} • Episode {selectedEpisodeChoice.episode}
                        </p>
                        <h3 className="text-base font-bold text-white mt-0.5">{selectedEpisodeChoice.episodeName}</h3>
                        <p className="text-xs text-white/40 mt-0.5">{selectedShow.name}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <button
                        onClick={handleWatchEpisodePersonal}
                        className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-xl text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Play className="h-4 w-4 fill-white" />
                        Watch Now
                      </button>
                      {isHost && onPlayTVForRoom && (
                        <button
                          onClick={handlePlayEpisodeForRoom}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Crown className="h-4 w-4" />
                          Play for Room
                        </button>
                      )}
                      <button
                        onClick={() => { setSelectedEpisodeChoice(null); setShowEpisodePicker(true); }}
                        className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 font-bold text-sm transition-all active:scale-95"
                      >
                        ← Back to Episodes
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
