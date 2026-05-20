const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

// ─── Movie Types ───────────────────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  genre_ids: number[];
}

export interface TMDBMovieDetails extends TMDBMovie {
  genres: { id: number; name: string }[];
  runtime: number;
  tagline: string;
}

// ─── TV Show Types ─────────────────────────────────────────────────────────────

export interface TMDBTVShow {
  id: number;
  name: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export interface TMDBSeason {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  poster_path: string | null;
  air_date: string;
}

export interface TMDBEpisode {
  id: number;
  episode_number: number;
  name: string;
  overview: string;
  still_path: string | null;
  air_date: string;
  vote_average: number;
}

export interface TMDBTVDetails extends TMDBTVShow {
  genres: { id: number; name: string }[];
  seasons: TMDBSeason[];
  tagline?: string;
}

export interface TMDBSeasonDetails {
  season_number: number;
  name: string;
  episodes: TMDBEpisode[];
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

export function getPosterUrl(path: string | null, size: 'w92' | 'w185' | 'w342' | 'w500' | 'original' = 'w342') {
  if (!path) return '/placeholder-movie.png';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getStillUrl(path: string | null) {
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w300${path}`;
}

// ─── Movies ────────────────────────────────────────────────────────────────────

export async function getTrendingMovies(page = 1): Promise<{ movies: TMDBMovie[]; error?: string }> {
  if (!TMDB_API_KEY) {
    return { movies: [], error: 'API key not configured' };
  }
  try {
    const url = `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) return { movies: [], error: data.status_message || 'API error' };
    return { movies: data.results || [] };
  } catch (err: any) {
    return { movies: [], error: err.message };
  }
}

export async function searchMovies(query: string, page = 1): Promise<{ movies: TMDBMovie[]; error?: string }> {
  if (!TMDB_API_KEY) return { movies: [], error: 'API key not configured' };
  if (!query.trim()) return { movies: [] };
  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=en-US`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) return { movies: [], error: data.status_message || 'API error' };
    return { movies: data.results || [] };
  } catch (err: any) {
    return { movies: [], error: err.message };
  }
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`);
    if (!res.ok) throw new Error('TMDB API error');
    return await res.json();
  } catch (err) {
    return null;
  }
}

// ─── TV Shows ──────────────────────────────────────────────────────────────────

export async function getTrendingTV(page = 1): Promise<{ shows: TMDBTVShow[]; error?: string }> {
  if (!TMDB_API_KEY) return { shows: [], error: 'API key not configured' };
  try {
    const url = `${TMDB_BASE_URL}/trending/tv/week?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) return { shows: [], error: data.status_message || 'API error' };
    return { shows: data.results || [] };
  } catch (err: any) {
    return { shows: [], error: err.message };
  }
}

export async function searchTV(query: string, page = 1): Promise<{ shows: TMDBTVShow[]; error?: string }> {
  if (!TMDB_API_KEY) return { shows: [], error: 'API key not configured' };
  if (!query.trim()) return { shows: [] };
  try {
    const url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=en-US`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) return { shows: [], error: data.status_message || 'API error' };
    return { shows: data.results || [] };
  } catch (err: any) {
    return { shows: [], error: err.message };
  }
}

export async function getTVDetails(tvId: number): Promise<TMDBTVDetails | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}&language=en-US`);
    if (!res.ok) throw new Error('TMDB API error');
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function getTVSeasonDetails(tvId: number, seasonNumber: number): Promise<TMDBSeasonDetails | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}&language=en-US`);
    if (!res.ok) throw new Error('TMDB API error');
    return await res.json();
  } catch (err) {
    return null;
  }
}
