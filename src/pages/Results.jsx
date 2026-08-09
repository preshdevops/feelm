import { useEffect, useState } from 'react';
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
  const watchlistTitles = watchlist ? watchlist.map((w) => w.movie_title) : [];

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [shuffleCount, setShuffleCount] = useState(0);

  // Interactive Vibe Tuning State
  const [vibeTuning, setVibeTuning] = useState({
    obscurity: 'all', // 'all' | 'hidden_gems' | 'mainstream'
    pacing: 'all',    // 'all' | 'slow' | 'brisk'
    tone: 'all',      // 'all' | 'cozy' | 'dark' | 'mind-bending'
    worldCinema: 'all'// 'all' | 'focus'
  });

  const selectedMood = moods.find((m) => m.id === moodId);

  useEffect(() => {
    async function fetchVibeMovies() {
      if (shuffleCount === 0 && vibeTuning.obscurity === 'all' && vibeTuning.pacing === 'all' && vibeTuning.tone === 'all' && vibeTuning.worldCinema === 'all') {
        const cachedResults = sessionStorage.getItem('feelm_results');
        const cachedMood = sessionStorage.getItem('feelm_results_mood') || '';
        const cachedFeeling = sessionStorage.getItem('feelm_results_feeling') || '';
        const cachedType = sessionStorage.getItem('feelm_results_type') || '';

        if (
          cachedResults &&
          cachedMood === (moodId || '') &&
          cachedFeeling === (feeling || '') &&
          cachedType === (type || '')
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
        }, 500);
        return;
      }

      try {
        let rawMovies = [];

        if (aiReady) {
          // Gemini AI recommendations flow with Vibe Tuning + Taste Anchors
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
          
          // Search each recommendation on TMDB in parallel
          const tmdbPromises = aiRecommendations.map(async (rec) => {
            const recType = rec.type || 'movie';
            let tmdbMovie = null;
            let tmdbTV = null;

            const shouldSearchTV = type === 'series' || (type === 'both' && recType !== 'movie');
            const shouldSearchMovie = type === 'movie' || (type === 'both' && recType !== 'series');

            if (shouldSearchMovie) {
              tmdbMovie = await searchMovie(rec.title);
            }
            if (shouldSearchTV) {
              tmdbTV = await searchTV(rec.title);
            }

            let match = null;
            let matchedType = 'movie';

            if (tmdbMovie && tmdbTV) {
              if (recType === 'series') {
                match = tmdbTV;
                matchedType = 'series';
              } else if (recType === 'movie') {
                match = tmdbMovie;
                matchedType = 'movie';
              } else if (tmdbTV.popularity > tmdbMovie.popularity) {
                match = tmdbTV;
                matchedType = 'series';
              } else {
                match = tmdbMovie;
                matchedType = 'movie';
              }
            } else if (tmdbTV) {
              match = tmdbTV;
              matchedType = 'series';
            } else if (tmdbMovie) {
              match = tmdbMovie;
              matchedType = 'movie';
            }

            if (match) {
              return {
                id: match.id,
                title: match.title || match.name,
                year: (match.release_date || match.first_air_date) 
                  ? new Date(match.release_date || match.first_air_date).getFullYear() 
                  : 'N/A',
                rating: match.vote_average ? Number(match.vote_average.toFixed(1)) : 'N/A',
                genre: getGenreNames(match.genre_ids),
                poster: match.poster_path 
                  ? `https://image.tmdb.org/t/p/w500${match.poster_path}`
                  : 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop',
                overview: match.overview || 'No overview available.',
                type: matchedType,
              };
            }
            return null;
          });

          const resolvedMovies = await Promise.all(tmdbPromises);
          rawMovies = resolvedMovies.filter(m => m !== null);
        } else if (tmdbOnly) {
          const randomPage = Math.floor(Math.random() * 15) + 1;
          rawMovies = await getTrendingMovies(randomPage);
        }

        if (rawMovies.length === 0) {
          throw new Error('No matching movies found.');
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
            console.warn('localStorage read failed');
          }

          if (!blurb && i < 5 && isGeminiConfigured()) {
            if (apiCallMade) {
              await new Promise((resolve) => setTimeout(resolve, 250));
            }

            try {
              blurb = await generateMovieBlurb(movie, moodLabel, feeling, energy, watching, intent, vibeTuning);
              if (blurb) {
                try {
                  localStorage.setItem(cacheKey, blurb);
                } catch {
                  console.warn('localStorage write failed');
                }
              }
              apiCallMade = true;
            } catch (err) {
              console.error(`Failed to generate blurb for movie "${movie.title}":`, err);
            }
          }

          enrichedMovies.push({
            ...movie,
            reason: blurb || movie.overview
          });

          setMovies([...enrichedMovies]);
        }

        sessionStorage.setItem('feelm_results', JSON.stringify(enrichedMovies));
        sessionStorage.setItem('feelm_results_mood', moodId || '');
        sessionStorage.setItem('feelm_results_feeling', feeling || '');
        sessionStorage.setItem('feelm_results_type', type || '');
      } catch (err) {
        console.error('Failed to load AI recommendations:', err);
        setError(err.message || 'Unable to retrieve film list.');
        const fallback = shuffleArray(placeholderMovies).slice(0, 6);
        setMovies(fallback);
      } finally {
        setLoading(false);
      }
    }

    fetchVibeMovies();
  }, [moodId, feeling, selectedMood, shuffleCount, type, energy, watching, intent, vibeTuning]);

  const handleShuffle = () => {
    setShuffleCount((prev) => prev + 1);
  };

  const updateVibeFilter = (key, value) => {
    setVibeTuning((prev) => ({
      ...prev,
      [key]: prev[key] === value ? 'all' : value,
    }));
  };

  const getDynamicTitle = () => {
    if (selectedMood) {
      return `Films for when you're feeling ${selectedMood.label.toLowerCase()}`;
    }
    if (feeling) {
      const cleanFeeling = feeling.split('Strictly avoid')[0].split('Only recommend')[0].trim();
      return `Films matching "${cleanFeeling}"`;
    }
    return 'Film recommendations';
  };

  return (
    <div className="page-container pt-20 pb-20">
      <div className="content-container">
        {/* Header Navigation */}
        <div className="flex items-center justify-between mb-10 animate-fade-in">
          <Link
            to="/"
            id="back-to-home"
            className="inline-flex items-center gap-1.5 text-cinema-500 hover:text-cinema-300 transition-colors duration-200 text-xs font-mono uppercase tracking-widest"
          >
            ← Back to moods
          </Link>

          {/* Shuffle Button Top Right */}
          <button
            onClick={handleShuffle}
            disabled={loading}
            className="px-4 py-2 border border-cinema-700/50 hover:border-cinema-500 text-xs text-cinema-300 uppercase tracking-widest transition-colors duration-200 font-mono disabled:opacity-30 disabled:hover:border-cinema-700/50"
          >
            {loading ? 'Refetching...' : 'Shuffle ↺'}
          </button>
        </div>

        {/* Dynamic Title */}
        <div className="mb-8 animate-fade-in">
          <h1 className="editorial-title font-display font-medium text-cinema-300 max-w-3xl leading-tight">
            {getDynamicTitle()}
          </h1>
          {error && (
            <p className="text-xs font-mono text-cinema-500 mt-3 uppercase tracking-wide">
              * Note: {error} (Curated collection loaded)
            </p>
          )}
        </div>

        {/* Interactive Vibe Tuning Controls */}
        <div className="mb-10 p-5 bg-cinema-900/60 border border-cinema-800/80 rounded-none animate-fade-in space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-cinema-400 uppercase tracking-widest">
              Vibe Tuning
            </span>
            {(vibeTuning.obscurity !== 'all' || vibeTuning.pacing !== 'all' || vibeTuning.tone !== 'all' || vibeTuning.worldCinema !== 'all') && (
              <button
                onClick={() => setVibeTuning({ obscurity: 'all', pacing: 'all', tone: 'all', worldCinema: 'all' })}
                className="text-[11px] font-mono text-accent hover:underline uppercase tracking-wider"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-mono">
            {/* Obscurity / Discovery Pills */}
            <button
              onClick={() => updateVibeFilter('obscurity', 'hidden_gems')}
              className={`px-3 py-1.5 border transition-all duration-200 ${
                vibeTuning.obscurity === 'hidden_gems'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-cinema-800 bg-cinema-950/80 text-cinema-400 hover:border-cinema-700 hover:text-cinema-300'
              }`}
            >
              ✨ Hidden Gems
            </button>
            <button
              onClick={() => updateVibeFilter('obscurity', 'mainstream')}
              className={`px-3 py-1.5 border transition-all duration-200 ${
                vibeTuning.obscurity === 'mainstream'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-cinema-800 bg-cinema-950/80 text-cinema-400 hover:border-cinema-700 hover:text-cinema-300'
              }`}
            >
              🎬 Acclaimed Classics
            </button>

            {/* Pacing Pills */}
            <button
              onClick={() => updateVibeFilter('pacing', 'slow')}
              className={`px-3 py-1.5 border transition-all duration-200 ${
                vibeTuning.pacing === 'slow'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-cinema-800 bg-cinema-950/80 text-cinema-400 hover:border-cinema-700 hover:text-cinema-300'
              }`}
            >
              ☕ Meditative / Slow
            </button>
            <button
              onClick={() => updateVibeFilter('pacing', 'brisk')}
              className={`px-3 py-1.5 border transition-all duration-200 ${
                vibeTuning.pacing === 'brisk'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-cinema-800 bg-cinema-950/80 text-cinema-400 hover:border-cinema-700 hover:text-cinema-300'
              }`}
            >
              ⚡ Brisk / Thrilling
            </button>

            {/* Tone Pills */}
            <button
              onClick={() => updateVibeFilter('tone', 'cozy')}
              className={`px-3 py-1.5 border transition-all duration-200 ${
                vibeTuning.tone === 'cozy'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-cinema-800 bg-cinema-950/80 text-cinema-400 hover:border-cinema-700 hover:text-cinema-300'
              }`}
            >
              ☁️ Cozy & Warm
            </button>
            <button
              onClick={() => updateVibeFilter('tone', 'dark')}
              className={`px-3 py-1.5 border transition-all duration-200 ${
                vibeTuning.tone === 'dark'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-cinema-800 bg-cinema-950/80 text-cinema-400 hover:border-cinema-700 hover:text-cinema-300'
              }`}
            >
              🌑 Dark Noir
            </button>
            <button
              onClick={() => updateVibeFilter('tone', 'mind-bending')}
              className={`px-3 py-1.5 border transition-all duration-200 ${
                vibeTuning.tone === 'mind-bending'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-cinema-800 bg-cinema-950/80 text-cinema-400 hover:border-cinema-700 hover:text-cinema-300'
              }`}
            >
              🌀 Mind-Bending
            </button>

            {/* World Cinema Pill */}
            <button
              onClick={() => updateVibeFilter('worldCinema', 'focus')}
              className={`px-3 py-1.5 border transition-all duration-200 ${
                vibeTuning.worldCinema === 'focus'
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-cinema-800 bg-cinema-950/80 text-cinema-400 hover:border-cinema-700 hover:text-cinema-300'
              }`}
            >
              🌍 World Cinema Focus
            </button>
          </div>
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
      {[...Array(6)].map((_, i) => (
        <div 
          key={i} 
          className="w-full aspect-[2/3] bg-cinema-900 border border-cinema-700/50 animate-pulse"
        />
      ))}
    </div>
  );
}
