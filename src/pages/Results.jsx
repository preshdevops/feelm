import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { placeholderMovies } from '../utils/placeholderMovies';
import { moods } from '../utils/moods';
import { isTmdbConfigured, searchMovie, getTrendingMovies } from '../utils/tmdb';
import { isGeminiConfigured, getRecommendationsFromGemini, generateMovieBlurb } from '../utils/gemini';

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

// Fisher-Yates shuffle helper for Demo Mode
const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

export default function Results() {
  const [searchParams] = useSearchParams();
  const moodId = searchParams.get('mood');
  const feeling = searchParams.get('feeling');

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shuffleCount, setShuffleCount] = useState(0);

  const selectedMood = moods.find((m) => m.id === moodId);

  useEffect(() => {
    async function fetchVibeMovies() {
      setLoading(true);
      setError(null);

      const aiReady = isTmdbConfigured() && isGeminiConfigured();
      const tmdbOnly = isTmdbConfigured() && !isGeminiConfigured();

      if (!aiReady && !tmdbOnly) {
        // Full Demo Mode (no keys) - Shuffle local mock array
        setTimeout(() => {
          setMovies(shuffleArray(placeholderMovies));
          setLoading(false);
        }, 600);
        return;
      }

      try {
        let rawMovies = [];

        if (aiReady) {
          // Gemini AI recommendations flow
          const moodLabel = selectedMood ? selectedMood.label : '';
          
          // Seed the prompt with a shuffle marker if shuffling to force new results
          const shuffleSeed = shuffleCount > 0 
            ? ` (Provide completely different suggestions than previous attempts. Shuffle key: ${Math.random()})` 
            : '';
          
          const aiRecommendations = await getRecommendationsFromGemini(
            moodLabel, 
            (feeling || '') + shuffleSeed
          );
          
          // Search each recommendation on TMDB in parallel (using TMDB search)
          const tmdbPromises = aiRecommendations.map(async (rec) => {
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
              };
            }
            return null;
          });

          const resolvedMovies = await Promise.all(tmdbPromises);
          rawMovies = resolvedMovies.filter(m => m !== null);
        } else if (tmdbOnly) {
          // TMDB-only configuration (no Gemini key) - Fetch randomized page of trending
          const randomPage = Math.floor(Math.random() * 15) + 1;
          rawMovies = await getTrendingMovies(randomPage);
        }

        if (rawMovies.length === 0) {
          throw new Error('No matching movies found.');
        }

        // Sequential Gemini blurb generation with 500ms delay & localStorage caching
        const enrichedMovies = [];
        const moodLabel = selectedMood ? selectedMood.label : '';
        let apiCallMade = false;

        for (let i = 0; i < rawMovies.length; i++) {
          const movie = rawMovies[i];
          const cacheKey = `feelm-blurb-${movie.id}`;
          let blurb = null;

          try {
            blurb = localStorage.getItem(cacheKey);
          } catch (e) {
            console.warn('localStorage read failed:', e);
          }

          // If not in cache and Gemini is configured, fetch blurb sequentially with delay
          if (!blurb && isGeminiConfigured()) {
            if (apiCallMade) {
              await new Promise((resolve) => setTimeout(resolve, 500));
            }

            try {
              blurb = await generateMovieBlurb(movie, moodLabel, feeling);
              if (blurb) {
                try {
                  localStorage.setItem(cacheKey, blurb);
                } catch (e) {
                  console.warn('localStorage write failed:', e);
                }
              }
              apiCallMade = true;
            } catch (err) {
              console.error(`Failed to generate blurb for movie "${movie.title}":`, err);
            }
          }

          enrichedMovies.push({
            ...movie,
            reason: blurb || movie.overview // fallback to overview if blurb fails or Gemini is unavailable
          });

          // Update state progressively so that recommendations render sequentially!
          setMovies([...enrichedMovies]);
        }
      } catch (err) {
        console.error('Failed to load AI recommendations:', err);
        setError(err.message || 'Unable to retrieve film list.');
        // Graceful fallback to shuffled local placeholders
        setMovies(shuffleArray(placeholderMovies));
      } finally {
        setLoading(false);
      }
    }

    fetchVibeMovies();
  }, [moodId, feeling, selectedMood, shuffleCount]);

  const handleShuffle = () => {
    setShuffleCount((prev) => prev + 1);
  };

  const getDynamicTitle = () => {
    if (selectedMood) {
      return `Films for when you're feeling ${selectedMood.label.toLowerCase()}`;
    }
    if (feeling) {
      // Clean up filters text from display title
      const cleanFeeling = feeling.split('Strictly avoid')[0].split('Only recommend')[0].trim();
      return `Films matching "${cleanFeeling}"`;
    }
    return 'Film recommendations';
  };

  return (
    <div className="page-container pt-20 pb-20 bg-cinema-950">
      <div className="content-container">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-12 animate-fade-in">
          <Link
            to="/"
            id="back-to-home"
            className="inline-flex items-center gap-1.5 text-cinema-500 hover:text-white transition-colors duration-200 text-xs font-mono uppercase tracking-widest"
          >
            ← Back to moods
          </Link>

          {/* Shuffle Button Top Right */}
          <button
            onClick={handleShuffle}
            disabled={loading}
            className="px-4 py-2 border border-white/10 hover:border-white text-xs text-white uppercase tracking-widest transition-colors duration-200 font-mono disabled:opacity-30 disabled:hover:border-white/10"
          >
            {loading ? 'Refetching...' : 'Shuffle ↺'}
          </button>
        </div>

        {/* Dynamic Title */}
        <div className="mb-12 animate-fade-in">
          <h1 className="editorial-title font-display font-medium text-white max-w-3xl leading-tight">
            {getDynamicTitle()}
          </h1>
          {error && (
            <p className="text-xs font-mono text-cinema-500 mt-3 uppercase tracking-wide">
              * Note: {error} (Static curation loaded)
            </p>
          )}
        </div>

        {/* Dynamic Grid: 5 columns on desktop, 2 on mobile */}
        {loading ? (
          <SkeletonLoader />
        ) : (
          <div
            id="movie-results-grid"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
          >
            {movies.map((movie, index) => (
              <div
                key={`${movie.id}-${index}`}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'both' }}
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

// Flat film-festival styled skeleton loading grid
function SkeletonLoader() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
      {[...Array(5)].map((_, i) => (
        <div 
          key={i} 
          className="w-full aspect-[2/3] bg-cinema-900 border border-white/5 animate-pulse"
        />
      ))}
    </div>
  );
}
