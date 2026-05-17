'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Loader, Play, Crown, Film, Star } from 'lucide-react';
import { getTrendingMovies, searchMovies, getPosterUrl, type TMDBMovie } from '@/lib/tmdb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface MovieBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isHost: boolean;
  onPlayForRoom?: (movie: TMDBMovie) => void;
  onWatchPersonal?: (movie: TMDBMovie) => void;
}

export function MovieBrowserDialog({
  open,
  onOpenChange,
  isHost,
  onPlayForRoom,
  onWatchPersonal,
}: MovieBrowserDialogProps) {
  const [movies, setMovies] = useState<TMDBMovie[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<TMDBMovie | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { toast } = useToast();
  const apiKeyMissing = !process.env.NEXT_PUBLIC_TMDB_API_KEY;

  const fetchTrending = useCallback(async () => {
    setIsLoading(true);
    const result = await getTrendingMovies(1);
    if (result.error) {
      setApiError(result.error);
      toast({ variant: 'destructive', title: 'Movies Error', description: result.error });
    } else {
      setApiError(null);
    }
    setMovies(result.movies);
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    if (open && !searchQuery) {
      fetchTrending();
    }
  }, [open, fetchTrending, searchQuery]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchTrending();
      return;
    }
    setIsSearching(true);
    const result = await searchMovies(searchQuery, 1);
    if (result.error) {
      toast({ variant: 'destructive', title: 'Search Error', description: result.error });
    }
    setMovies(result.movies);
    setIsSearching(false);
  };

  const handleMovieSelect = (movie: TMDBMovie) => {
    setSelectedMovie(movie);
    setShowActions(true);
  };

  const handleWatchPersonal = () => {
    if (selectedMovie && onWatchPersonal) {
      onWatchPersonal(selectedMovie);
      setSelectedMovie(null);
      setShowActions(false);
    }
  };

  const handlePlayForRoom = () => {
    if (selectedMovie && onPlayForRoom) {
      onPlayForRoom(selectedMovie);
      setSelectedMovie(null);
      setShowActions(false);
      onOpenChange(false);
      toast({ title: 'Movie Synced', description: `${selectedMovie.title} is now playing for the room.` });
    }
  };

  const handleCloseActions = () => {
    setSelectedMovie(null);
    setShowActions(false);
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
          className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-slate-900 rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 max-h-[85vh] flex flex-col"
          >
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 transition-all active:scale-90"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            <div className="p-5 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-violet-700 flex items-center justify-center">
                  <Film className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Movies</h2>
                  <p className="text-xs text-slate-400">Browse & watch full movies</p>
                </div>
              </div>
            </div>

            <div className="p-4 pb-2 shrink-0">
              <div className="flex gap-2">
                <Input
                  placeholder="Search movies..."
                  className="flex-1 bg-white/5 border-white/10 h-10 rounded-xl text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isSearching ? <Loader className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {apiKeyMissing && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl mb-4">
                  <p className="text-xs text-amber-400 font-bold mb-1">API Key Missing</p>
                  <p className="text-xs text-amber-300/70">NEXT_PUBLIC_TMDB_API_KEY is not set in Vercel environment variables.</p>
                  <p className="text-[10px] text-white/30 mt-2">Go to Vercel Dashboard → Settings → Environment Variables → Add the key → Redeploy.</p>
                </div>
              )}
              {apiError && !apiKeyMissing && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-4">
                  <p className="text-xs text-red-400 font-bold mb-1">API Error</p>
                  <p className="text-xs text-red-300/70">{apiError}</p>
                  <p className="text-[10px] text-white/30 mt-2">Add NEXT_PUBLIC_TMDB_API_KEY to Vercel env vars and redeploy.</p>
                </div>
              )}
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader className="h-8 w-8 text-purple-400 animate-spin" />
                  <p className="text-xs text-white/40">Loading movies...</p>
                </div>
              ) : movies.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Film className="h-10 w-10 text-white/20" />
                  <p className="text-sm text-white/40">No movies found</p>
                  <p className="text-xs text-white/20">Try a different search term</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {movies.map((movie) => (
                    <button
                      key={movie.id}
                      onClick={() => handleMovieSelect(movie)}
                      className="group flex flex-col gap-1.5 active:scale-95 transition-all"
                    >
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-slate-800">
                        <img
                          src={getPosterUrl(movie.poster_path, 'w185')}
                          alt={movie.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex items-center gap-1">
                            <Play className="h-3 w-3 text-white" />
                            <span className="text-[9px] font-bold text-white">Watch</span>
                          </div>
                        </div>
                        {movie.vote_average > 0 && (
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/70 rounded-md px-1 py-0.5">
                            <Star className="h-2.5 w-2.5 text-yellow-400 fill-yellow-400" />
                            <span className="text-[9px] font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] font-medium text-white/80 truncate leading-tight">
                        {movie.title}
                      </p>
                      {movie.release_date && (
                        <p className="text-[9px] text-white/30">
                          {new Date(movie.release_date).getFullYear()}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Movie Actions Sheet */}
          <AnimatePresence>
            {showActions && selectedMovie && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[210] flex items-end justify-center"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                  onClick={handleCloseActions}
                />
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: 0 }}
                  exit={{ y: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  className="relative w-full max-w-md bg-slate-900 rounded-t-2xl overflow-hidden shadow-2xl border border-slate-700/50"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start gap-4">
                      <img
                        src={getPosterUrl(selectedMovie.poster_path, 'w185')}
                        alt={selectedMovie.title}
                        className="h-20 w-14 rounded-lg object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-white">{selectedMovie.title}</h3>
                        {selectedMovie.release_date && (
                          <p className="text-xs text-white/40 mt-0.5">
                            {new Date(selectedMovie.release_date).getFullYear()}
                          </p>
                        )}
                        {selectedMovie.overview && (
                          <p className="text-xs text-white/50 mt-2 line-clamp-3 leading-relaxed">
                            {selectedMovie.overview}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={handleWatchPersonal}
                        className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                      >
                        <Play className="h-4 w-4" />
                        Watch Now
                      </button>

                      {isHost && onPlayForRoom && (
                        <button
                          onClick={handlePlayForRoom}
                          className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 rounded-xl text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                        >
                          <Crown className="h-4 w-4" />
                          Play for Room
                        </button>
                      )}

                      <button
                        onClick={handleCloseActions}
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
        </motion.div>
      )}
    </AnimatePresence>
  );
}
