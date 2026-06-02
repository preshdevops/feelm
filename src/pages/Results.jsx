import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { placeholderMovies } from '../utils/placeholderMovies';
import { moods } from '../utils/moods';
import { isTmdbConfigured, searchMovie } from '../utils/tmdb';
import { isGeminiConfigured, getRecommendationsFromGemini } from '../utils/gemini';

// Helper to map TMDB genre IDs to strings
const TMDB_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

function getGenreNames(genreIds) {
  if (!genreIds || genreIds.length === 0) return 'Drama';
  return genreIds.slice(0, 2).map(id => TMDB_GENRES[id] || 'Drama').join(', ');
}

export default function Results() {
  const [searchParams] = useSearchParams();
  const moodId = searchParams.get('mood');
  const feeling = searchParams.get('feeling');

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const selectedMood = moods.find((m) => m.id === moodId);

  useEffect(() => {
    async function fetchVibeMovies() {
      setLoading(true);
      setError(null);

      const aiReady = isTmdbConfigured() && isGeminiConfigured();

      if (!aiReady) {
        // Fallback to Demo Mode
        setIsDemoMode(true);
        // Simulate local network delay
        setTimeout(() => {
          setMovies(placeholderMovies);
          setLoading(false);
        }, 800);
        return;
      }

      try {
        setIsDemoMode(false);
        // Get recommendations list from Gemini
        const moodLabel = selectedMood ? selectedMood.label : '';
        const aiRecommendations = await getRecommendationsFromGemini(moodLabel, feeling);
        
        // Search each recommendation on TMDB in parallel
        const moviePromises = aiRecommendations.map(async (rec) => {
          const tmdbMovie = await searchMovie(rec.title);
          if (tmdbMovie) {
            return {
              id: tmdbMovie.id,
              title: tmdbMovie.title,
              year: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : 'N/A',
              rating: tmdbMovie.vote_average ? Number(tmdbMovie.vote_average.toFixed(1)) : 'N/A',
              genre: getGenreNames(tmdbMovie.genre_ids),
              poster: tmdbMovie.poster_path 
                ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
                : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop',
              overview: tmdbMovie.overview || 'No overview available.',
              reason: rec.reason
            };
          }
          return null;
        });

        const resolvedMovies = await Promise.all(moviePromises);
        const filteredMovies = resolvedMovies.filter(m => m !== null);

        if (filteredMovies.length === 0) {
          throw new Error('No matching movies found on TMDB.');
        }

        setMovies(filteredMovies);
      } catch (err) {
        console.error('Failed to load AI recommendations:', err);
        setError(err.message || 'Something went wrong while generating recommendations.');
        // Fall back to Demo Mode
        setIsDemoMode(true);
        setMovies(placeholderMovies);
      } finally {
        setLoading(false);
      }
    }

    fetchVibeMovies();
  }, [moodId, feeling, selectedMood]);

  return (
    <div className="page-container pt-24 pb-16">
      <div className="content-container">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <Link
            to="/"
            id="back-to-home"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gold 
                       transition-colors duration-300 mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to moods</span>
          </Link>

          {/* Demo Mode Notice Banner */}
          {isDemoMode && (
            <div className="mb-6 p-4 rounded-xl border border-gold/20 bg-gold/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-gold font-semibold text-sm sm:text-base">🍿 Running in Demo Mode</h4>
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                  Set your <code className="text-gold">VITE_GEMINI_API_KEY</code> and <code className="text-gold">VITE_TMDB_API_KEY</code> in <code className="text-gold">.env.local</code> to fetch real-time AI recommendations.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-gold/20 text-gold-light border border-gold/30 font-medium self-start sm:self-center">
                Demo Active
              </span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h1 className="section-title">Your Picks</h1>
            {selectedMood && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm">
                <span>{selectedMood.emoji}</span>
                <span className="text-gray-300">{selectedMood.label} mood</span>
              </span>
            )}
            {feeling && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm">
                <span>💬</span>
                <span className="text-gray-300 line-clamp-1 max-w-[200px]">&ldquo;{feeling}&rdquo;</span>
              </span>
            )}
          </div>

          {!loading && !error && (
            <p className="text-gray-400 mt-3 text-lg">
              We found <span className="text-gold font-semibold">{movies.length} films</span> that match your vibe.
            </p>
          )}

          {error && (
            <p className="text-red-400 mt-3 text-sm">
              ⚠️ {error} — Falling back to static curation.
            </p>
          )}
        </div>

        {/* Dynamic content rendering */}
        {loading ? (
          <SkeletonLoader />
        ) : (
          <div
            id="movie-results-grid"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
          >
            {movies.map((movie, index) => (
              <div
                key={movie.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
              >
                <MovieCard movie={movie} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Cinematic skeleton animation card grid
function SkeletonLoader() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="bg-cinema-900/50 border border-white/5 rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-[2/3] bg-cinema-800" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-cinema-700 rounded w-3/4" />
            <div className="h-3 bg-cinema-800 rounded w-1/2" />
            <div className="h-10 bg-cinema-800/50 rounded w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}
