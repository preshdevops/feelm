const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export const isTmdbConfigured = () => {
  return (
    TMDB_API_KEY &&
    TMDB_API_KEY !== 'your_tmdb_key_here' &&
    TMDB_API_KEY.trim() !== ''
  );
};

export const getPosterUrl = (path, size = 'w500') => {
  if (!path) return 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

export const getBackdropUrl = (path, size = 'original') => {
  if (!path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

/**
 * Searches TMDB for a movie by title.
 * @param {string} title
 * @returns {Promise<Object|null>}
 */
export async function searchMovie(title) {
  if (!isTmdbConfigured()) {
    throw new Error('TMDB API Key is not configured.');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1`
    );
    if (!response.ok) {
      throw new Error(`TMDB search failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      // Return the best match (usually index 0 is most relevant)
      return data.results[0];
    }
    return null;
  } catch (error) {
    console.error(`Error searching movie "${title}" on TMDB:`, error);
    return null;
  }
}

/**
 * Fetches full details, credits, and videos for a specific movie ID.
 * @param {number|string} id
 * @returns {Promise<Object|null>}
 */
export async function getMovieDetails(id) {
  if (!isTmdbConfigured()) {
    throw new Error('TMDB API Key is not configured.');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits&language=en-US`
    );
    if (!response.ok) {
      throw new Error(`TMDB details fetch failed with status: ${response.status}`);
    }
    const movie = await response.json();

    // Find director
    const director = movie.credits?.crew?.find(
      (member) => member.job === 'Director'
    )?.name || 'Unknown Director';

    // Find official YouTube trailer
    const trailer = movie.videos?.results?.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer'
    );

    return {
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A',
      rating: movie.vote_average ? Number(movie.vote_average.toFixed(1)) : 'N/A',
      genres: movie.genres ? movie.genres.map((g) => g.name).join(', ') : 'Drama',
      poster: getPosterUrl(movie.poster_path),
      backdrop: getBackdropUrl(movie.backdrop_path),
      overview: movie.overview || 'No overview available.',
      director,
      runtime: movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A',
      tagline: movie.tagline || '',
      trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
      cast: movie.credits?.cast?.slice(0, 5).map((c) => c.name) || [],
    };
  } catch (error) {
    console.error(`Error fetching movie details for ID ${id}:`, error);
    return null;
  }
}

/**
 * Fetches popular trending movies as a fallback.
 * @returns {Promise<Array>}
 */
export async function getTrendingMovies(page = 1) {
  if (!isTmdbConfigured()) {
    throw new Error('TMDB API Key is not configured.');
  }

  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/trending/movie/week?api_key=${TMDB_API_KEY}&language=en-US&page=${page}`
    );
    if (!response.ok) {
      throw new Error(`TMDB trending failed with status: ${response.status}`);
    }
    const data = await response.json();
    return data.results.slice(0, 10).map((movie) => ({
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A',
      rating: movie.vote_average ? Number(movie.vote_average.toFixed(1)) : 'N/A',
      genre: 'Drama', // Search detail fetches genre later
      poster: getPosterUrl(movie.poster_path),
      backdrop: getBackdropUrl(movie.backdrop_path),
      overview: movie.overview,
    }));
  } catch (error) {
    console.error('Error fetching trending movies:', error);
    return [];
  }
}
