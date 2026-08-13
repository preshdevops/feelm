import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { placeholderMovies } from '../utils/placeholderMovies';
import { moods } from '../utils/moods';
import { isTmdbConfigured, searchMovie, searchTV, getTrendingMovies } from '../utils/tmdb';
import { isGeminiConfigured, getRecommendationsFromGemini, generateMovieBlurb } from '../utils/gemini';
import useWatchlist from '../hooks/useWatchlist';

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
  const type = searchParams.get('type') || 'movie';
  const energy = searchParams.get('energy');
  const watching = searchParams.get('watching');
  const intent = searchParams.get('intent');

  const { watchlist } = useWatchlist();
  const watchlistTitles = useMemo(
    () => (watchlist ? watchlist.map((w) => w.movie_title) : []),
    [watchlist]
  );

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shuffleCount, setShuffleCount] = useState(0);

  // Interactive Vibe Tuning State (Clean Typographic Filters)
  const [vibeTuning, setVibeTuning] = useState({
    obscurity: 'all', // 'all' | 'hidden_gems' | 'mainstream'
    pacing: 'all',    // 'all' | 'slow' | 'brisk'
    tone: 'all',      // 'all' | 'cozy' | 'dark' | 'mind-bending'
    worldCinema: 'all'// 'all' | 'focus'
  });

  const selectedMood = moods.find((m) => m.id === moodId);
  const vibeSignature = JSON.stringify(vibeTuning);

  useEffect(() => {
    async function fetchVibeMovies() {
      if (shuffleCount === 0 && vibeTuning.obscurity === 'all' && vibeTuning.pacing === 'all' && vibeTuning.tone === 'all' && vibeTuning.worldCinema === 'all') {
        const cachedResults = sessionStorage.getItem('feelm_results');
        const cachedMood = sessionStorage.getItem('feelm_results_mood') || '';
        const cachedFeeling = sessionStorage.getItem('feelm_results_feeling') || '';
        const cachedType = sessionStorage.getItem('feelm_results_type') || '';
        const cachedVibe = sessionStorage.getItem('feelm_results_vibe') || '';

        if (
          cachedResults &&
          cachedMood === (moodId || '') &&
          cachedFeeling === (feeling || '') &&
          cachedType === (type || '') &&
          cachedVibe === vibeSignature
        ) {
          try {
            const parsed = JSON.parse(cachedResults);
            if (parsed && parsed.length > 0) {
              setMovies(parsed);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.error('Error parsing cached results:', e);
          }
        }
      }

      setLoading(true);
      setError(null);

      const aiReady = isTmdbConfigured() && isGeminiConfigured();
      const tmdbOnly = isTmdbConfigured() && !isGeminiConfigured();

      if (!aiReady && !tmdbOnly) {
        // Smart fallback filtering on rich placeholder dataset
        setTimeout(() => {
          let filtered = [...placeholderMovies];

          if (moodId) {
            const moodMatches = filtered.filter((m) => m.moods && m.moods.includes(moodId));
            if (moodMatches.length >= 3) {
              filtered = moodMatches;
            }
          }

          if (vibeTuning.obscurity !== 'all') {
            filtered = filtered.filter((m) => m.obscurity === vibeTuning.obscurity);
          }
          if (vibeTuning.pacing !== 'all') {
            filtered = filtered.filter((m) => m.pacing === vibeTuning.pacing);
          }
          if (vibeTuning.tone !== 'all') {
            filtered = filtered.filter((m) => m.tone === vibeTuning.tone);
          }

          if (filtered.length === 0) {
            filtered = placeholderMovies;
          }

          const shuffled = shuffleArray(filtered).slice(0, 6);
          setMovies(shuffled);
          setLoading(false);
        }, 400);
        return;
      }

      try {
        let rawMovies = [];

        if (aiReady) {
          const moodLabel = selectedMood ? selectedMood.label : '';
          
          const shuffleSeed = shuffleCount > 0 
            ? ` (Provide fresh recommendations avoiding previous suggestions. Seed: ${Math.random()})` 
            : '';
          
          const aiRecommendations = await getRecommendationsFromGemini(
            moodLabel, 
            (feeling || '') + shuffleSeed,
            type,
            energy,
            watching,
            intent,
            vibeTuning,
            watchlistTitles
          );
          
          rawMovies = aiRecommendations.map((rec) => {
            if (!rec) return null;
            return {
              id: rec.id,
              title: rec.title || rec.name,
              year: (rec.release_date || rec.first_air_date)
                ? new Date(rec.release_date || rec.first_air_date).getFullYear()
                : 'N/A',
              rating: rec.vote_average ? Number(rec.vote_average.toFixed(1)) : 'N/A',
              genre: getGenreNames(rec.genre_ids),
              poster: rec.poster_path
                ? `https://image.tmdb.org/t/p/w500${rec.poster_path}`
                : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop',
              overview: rec.overview || 'No overview available.',
              type: rec.name ? 'series' : 'movie',
            };
          }).filter(Boolean);
        } else if (tmdbOnly) {
          const randomPage = Math.floor(Math.random() * 15) + 1;
          rawMovies = await getTrendingMovies(randomPage);
        }

        if (rawMovies.length === 0) {
          throw new Error('No matching films found.');
        }

        const enrichedMovies = [];
        const moodLabel = selectedMood ? selectedMood.label : '';
        let apiCallMade = false;

        for (let i = 0; i < rawMovies.length; i++) {
          const movie = rawMovies[i];
          const cacheKey = `feelm_blurb_${movie.id}_${vibeTuning.obscurity}_${vibeTuning.tone}`;
          let blurb = null;

          try {
            blurb = localStorage.getItem(cacheKey);
          } catch {
            // localStorage read fallback
          }

          if (!blurb && i < rawMovies.length && isGeminiConfigured()) {
            if (apiCallMade) {
              await new Promise((resolve) => setTimeout(resolve, 250));
            }

            try {
              blurb = await generateMovieBlurb(movie, moodLabel, feeling, energy, watching, intent, vibeTuning);
              if (blurb) {
                try {
                  localStorage.setItem(cacheKey, blurb);
                } catch {
                  // localStorage write fallback
                }
              }
              apiCallMade = true;
            } catch (err) {
              console.error(`Failed to generate blurb for movie "${movie.title}":`, err);
            }
          }

          enrichedMovies.push({
            ...movie,
            reason: blurb || 'Matched to your mood'
          });

          setMovies([...enrichedMovies]);
        }

        sessionStorage.setItem('feelm_results', JSON.stringify(enrichedMovies));
        sessionStorage.setItem('feelm_results_mood', moodId || '');
        sessionStorage.setItem('feelm_results_feeling', feeling || '');
        sessionStorage.setItem('feelm_results_type', type || '');
        sessionStorage.setItem('feelm_results_vibe', vibeSignature);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
        setError(err.message || 'Unable to retrieve film list.');
        const fallback = shuffleArray(placeholderMovies).slice(0, 6);
        setMovies(fallback);
      } finally {
        setLoading(false);
      }
    }

    fetchVibeMovies();
  }, [moodId, feeling, selectedMood, shuffleCount, type, energy, watching, intent, vibeTuning, vibeSignature, watchlistTitles]);

  const handleShuffle = () => {
    setShuffleCount((prev) => prev + 1);
  };

  const updateVibeFilter = (key, value) => {
    setVibeTuning((prev) => ({
      ...prev,
      [key]: prev[key] === value ? 'all' : value,
    }));
  };

  const hasActiveFilters = vibeTuning.obscurity !== 'all' || vibeTuning.pacing !== 'all' || vibeTuning.tone !== 'all' || vibeTuning.worldCinema !== 'all';

  const getDynamicTitle = () => {
    if (selectedMood) {
      return `Films for when you're feeling ${selectedMood.label.toLowerCase()}`;
    }
    if (feeling) {
      const cleanFeeling = feeling.split('Strictly avoid')[0].split('Only recommend')[0].trim();
      const truncated = cleanFeeling.length > 45 ? `${cleanFeeling.slice(0, 45)}...` : cleanFeeling;
      return `Films matching "${truncated}"`;
    }
    return 'Film recommendations';
  };

  return (
    <div className="page-container pt-20 pb-20">
      <div className="content-container">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <Link
            to="/"
            id="back-to-home"
            className="inline-flex items-center gap-1.5 text-cinema-500 hover:text-cinema-300 transition-colors duration-200 text-xs font-mono uppercase tracking-widest"
          >
            ← Back to moods
          </Link>

          {/* Shuffle Button */}
          <button
            onClick={handleShuffle}
            disabled={loading}
            className="px-4 py-2 border border-cinema-700/50 hover:border-cinema-500 text-xs text-cinema-300 uppercase tracking-widest transition-colors duration-200 font-mono disabled:opacity-30 disabled:hover:border-cinema-700/50 cursor-pointer"
          >
            {loading ? 'Curating...' : 'Shuffle ↺'}
          </button>
        </div>

        {/* Dynamic Title */}
        <div className="mb-6 animate-fade-in">
          <h1 className="editorial-title font-display font-medium text-cinema-300 max-w-3xl leading-tight">
            {getDynamicTitle()}
          </h1>
        </div>

        {/* Minimalist Typographic Vibe Tuning Bar */}
        <div className="mb-10 pb-6 border-b border-cinema-800/80 animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-cinema-500 uppercase tracking-widest">
              Tune Vibe
            </span>
            {hasActiveFilters && (
              <button
                onClick={() => setVibeTuning({ obscurity: 'all', pacing: 'all', tone: 'all', worldCinema: 'all' })}
                className="text-[10px] font-mono text-accent hover:underline uppercase tracking-widest cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-mono tracking-wider">
            {/* Obscurity / Discovery */}
            <button
              onClick={() => updateVibeFilter('obscurity', 'hidden_gems')}
              className={`px-3 py-1.5 border transition-all duration-200 cursor-pointer select-none uppercase ${
                vibeTuning.obscurity === 'hidden_gems'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-cinema-800 text-cinema-400 hover:border-cinema-600 hover:text-cinema-300 bg-transparent'
              }`}
            >
              Hidden Gems
            </button>
            <button
              onClick={() => updateVibeFilter('obscurity', 'mainstream')}
              className={`px-3 py-1.5 border transition-all duration-200 cursor-pointer select-none uppercase ${
                vibeTuning.obscurity === 'mainstream'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-cinema-800 text-cinema-400 hover:border-cinema-600 hover:text-cinema-300 bg-transparent'
              }`}
            >
              Classics
            </button>

            {/* Pacing */}
            <button
              onClick={() => updateVibeFilter('pacing', 'slow')}
              className={`px-3 py-1.5 border transition-all duration-200 cursor-pointer select-none uppercase ${
                vibeTuning.pacing === 'slow'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-cinema-800 text-cinema-400 hover:border-cinema-600 hover:text-cinema-300 bg-transparent'
              }`}
            >
              Slow Burn
            </button>
            <button
              onClick={() => updateVibeFilter('pacing', 'brisk')}
              className={`px-3 py-1.5 border transition-all duration-200 cursor-pointer select-none uppercase ${
                vibeTuning.pacing === 'brisk'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-cinema-800 text-cinema-400 hover:border-cinema-600 hover:text-cinema-300 bg-transparent'
              }`}
            >
              Brisk Pace
            </button>

            {/* Tone */}
            <button
              onClick={() => updateVibeFilter('tone', 'cozy')}
              className={`px-3 py-1.5 border transition-all duration-200 cursor-pointer select-none uppercase ${
                vibeTuning.tone === 'cozy'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-cinema-800 text-cinema-400 hover:border-cinema-600 hover:text-cinema-300 bg-transparent'
              }`}
            >
              Cozy & Warm
            </button>
            <button
              onClick={() => updateVibeFilter('tone', 'dark')}
              className={`px-3 py-1.5 border transition-all duration-200 cursor-pointer select-none uppercase ${
                vibeTuning.tone === 'dark'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-cinema-800 text-cinema-400 hover:border-cinema-600 hover:text-cinema-300 bg-transparent'
              }`}
            >
              Dark Noir
            </button>
            <button
              onClick={() => updateVibeFilter('tone', 'mind-bending')}
              className={`px-3 py-1.5 border transition-all duration-200 cursor-pointer select-none uppercase ${
                vibeTuning.tone === 'mind-bending'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-cinema-800 text-cinema-400 hover:border-cinema-600 hover:text-cinema-300 bg-transparent'
              }`}
            >
              Mind-Bending
            </button>

            {/* World Cinema */}
            <button
              onClick={() => updateVibeFilter('worldCinema', 'focus')}
              className={`px-3 py-1.5 border transition-all duration-200 cursor-pointer select-none uppercase ${
                vibeTuning.worldCinema === 'focus'
                  ? 'border-accent text-accent bg-accent/5'
                  : 'border-cinema-800 text-cinema-400 hover:border-cinema-600 hover:text-cinema-300 bg-transparent'
              }`}
            >
              World Cinema
            </button>
          </div>
        </div>

        {/* Dynamic Grid */}
        {loading ? (
          <SkeletonLoader />
        ) : (
          <>
            {error && (
              <p className="mb-5 text-xs font-mono uppercase tracking-widest text-cinema-500">
                {error}
              </p>
            )}
            <div
              id="movie-results-grid"
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6"
            >
              {movies.map((movie, index) => (
                <div
                  key={`${movie.id}-${index}`}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
                >
                  <MovieCard movie={movie} moodId={moodId} />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Flat film-festival styled skeleton loading grid
function SkeletonLoader() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className="w-full aspect-[2/3] bg-cinema-900 border border-cinema-700/50 animate-pulse"
        />
      ))}
    </div>
  );
}
