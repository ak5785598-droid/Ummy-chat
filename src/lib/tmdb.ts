const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
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

export async function getTrendingMovies(page = 1): Promise<TMDBMovie[]> {
  if (!TMDB_API_KEY) return [];
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&page=${page}&language=en-US`
    );
    if (!res.ok) throw new Error('TMDB API error');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Failed to fetch trending movies:', err);
    return [];
  }
}

export async function searchMovies(query: string, page = 1): Promise<TMDBMovie[]> {
  if (!TMDB_API_KEY || !query.trim()) return [];
  try {
    const res = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}&language=en-US`
    );
    if (!res.ok) throw new Error('TMDB API error');
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Failed to search movies:', err);
    return [];
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
