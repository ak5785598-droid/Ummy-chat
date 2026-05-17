const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || '';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

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

function getPosterUrl(path: string | null, size: 'w185' | 'w342' | 'w500' | 'original' = 'w342') {
  if (!path) return '/placeholder-movie.png';
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export async function getTrendingMovies(page = 1): Promise<{ movies: TMDBMovie[]; error?: string }> {
  if (!TMDB_API_KEY) {
    console.error('[TMDB] API key is missing');
    return { movies: [], error: 'API key not configured' };
  }
  try {
    const url = `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`;
    console.log('[TMDB] Fetching:', url.replace(TMDB_API_KEY, '***'));
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error('[TMDB] API error:', data.status_message || res.statusText);
      return { movies: [], error: data.status_message || 'API error' };
    }
    console.log('[TMDB] Got', data.results?.length || 0, 'trending movies');
    return { movies: data.results || [] };
  } catch (err: any) {
    console.error('[TMDB] Fetch failed:', err.message);
    return { movies: [], error: err.message };
  }
}

export async function searchMovies(query: string, page = 1): Promise<{ movies: TMDBMovie[]; error?: string }> {
  if (!TMDB_API_KEY) {
    console.error('[TMDB] API key is missing');
    return { movies: [], error: 'API key not configured' };
  }
  if (!query.trim()) return { movies: [] };
  try {
    const url = `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=en-US`;
    console.log('[TMDB] Searching:', url.replace(TMDB_API_KEY, '***'));
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) {
      console.error('[TMDB] Search error:', data.status_message || res.statusText);
      return { movies: [], error: data.status_message || 'API error' };
    }
    console.log('[TMDB] Found', data.results?.length || 0, 'movies for:', query);
    return { movies: data.results || [] };
  } catch (err: any) {
    console.error('[TMDB] Search failed:', err.message);
    return { movies: [], error: err.message };
  }
}

export async function getMovieDetails(movieId: number): Promise<TMDBMovieDetails | null> {
  if (!TMDB_API_KEY) return null;
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}&language=en-US`
    );
    if (!res.ok) throw new Error('TMDB API error');
    return await res.json();
  } catch (err) {
    console.error('Failed to fetch movie details:', err);
    return null;
  }
}

export { getPosterUrl };
