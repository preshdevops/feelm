import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { placeholderMovies } from '../utils/placeholderMovies';
import { getMovieDetails, isTmdbConfigured } from '../utils/tmdb';
import { moods } from '../utils/moods';
import { useAuth } from '../context/AuthContext';
import useWatchlist from '../hooks/useWatchlist';

export default function MovieDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [movie, setMovie] = useState(() => {
    if (location.state?.movie) {
      const m = location.state.movie;
      return {
        ...m,
        backdrop: m.backdrop || m.movie_backdrop || m.poster,
        genres: m.genres || m.genre || '',
      };
    }
    return null;
  });
  const [loading, setLoading] = useState(!location.state?.movie);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);

  const { user, setAuthModalOpen } = useAuth();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  const bookmarked = movie ? isInWatchlist(movie.id || movie.movie_id) : false;

  // Emotion / Mood reactive theme parsing
  const searchParams = new URLSearchParams(location.search);
  const activeMoodId = location.state?.mood || searchParams.get('mood');
  const activeMood = moods.find((m) => m.id === activeMoodId);

  const themeAccent = activeMood?.accentColor || '#C17B2F';
  const themeAmbient = activeMood?.ambientTint || 'rgba(193, 123, 47, 0.12)';

  const handleSaveClick = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      if (bookmarked) {
        await removeFromWatchlist(movie.id || movie.movie_id);
      } else {
        await addToWatchlist(movie);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist item:', err);
    }
  };

  useEffect(() => {
    async function loadDetails() {
      if (!location.state?.movie) {
        setLoading(true);
      }
      setError(null);

      const tmdbActive = isTmdbConfigured();

      if (!tmdbActive) {
        const mockMovie = placeholderMovies.find((m) => m.id === Number(id));
        if (mockMovie) {
          setMovie({
            ...mockMovie,
            tagline: 'A cinematic masterpiece matching your vibe.',
            cast: ['Lead Actor', 'Supporting Actor', 'Featured Guest'],
            trailerUrl: null,
          });
        } else {
          setError('Movie not found in library.');
        }
        setLoading(false);
        return;
      }

      try {
        const details = await getMovieDetails(id);
        if (details) {
          setMovie(details);
        } else {
          const mockMovie = placeholderMovies.find((m) => m.id === Number(id));
          if (mockMovie) {
            setMovie({
              ...mockMovie,
              tagline: 'A cinematic masterpiece matching your vibe.',
              cast: ['Lead Actor', 'Supporting Actor', 'Featured Guest'],
              trailerUrl: null,
            });
          } else {
            throw new Error('Movie details not found.');
          }
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
        if (!location.state?.movie) {
          setError(err.message || 'Error loading movie details.');
        }
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [id, location.state?.movie]);

  if (loading) {
    return (
      <div className="page-container min-h-screen flex items-center justify-center">
        <div className="animate-pulse space-y-6 w-full max-w-xl px-6">
          <div className="h-4 bg-cinema-800 rounded w-1/4" />
          <div className="h-10 bg-cinema-800 rounded w-3/4" />
          <div className="h-6 bg-cinema-800 rounded w-1/2" />
          <div className="h-24 bg-cinema-800 rounded w-full" />
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="page-container min-h-screen flex items-center justify-center">
        <div className="text-center space-y-6 px-6">
          <h1 className="font-display italic text-3xl text-cinema-300">Film not found</h1>
          <p className="text-cinema-400 font-light max-w-sm">{error || "We couldn't retrieve the details for this movie."}</p>
          <Link to="/" className="btn-editorial">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  const backdropSrc = movie.backdrop || movie.poster;
  const posterSrc = movie.poster || movie.backdrop;

  return (
    <div
      className="relative min-h-screen bg-cinema-950 text-cinema-300 overflow-hidden flex flex-col justify-between transition-colors duration-500"
      style={{
        '--accent': themeAccent,
        '--accent-hover': themeAccent,
      }}
    >
      {/* Crisp Full-Bleed Film Backdrop Image */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Layer 1: Dark Cinematic Mask */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/80 to-cinema-950/40 z-10" />
        {/* Layer 2: Reactive Emotion Ambient Tint */}
        <div
          className="absolute inset-0 z-20 pointer-events-none transition-colors duration-500"
          style={{ backgroundColor: themeAmbient }}
        />
        {/* Layer 3: Film Backdrop Poster Art */}
        <img
          src={backdropSrc}
          alt={movie.title}
          className="w-full h-full object-cover opacity-50 filter brightness-90 contrast-105 scale-105 transition-all duration-700"
        />
      </div>

      {/* Main Overlay Content */}
      <div className="relative z-10 w-full pt-20 pb-16 flex-grow flex flex-col justify-center">
        <div className="content-container w-full space-y-8">
          {/* Back Navigation & Emotion Badge */}
          <div className="flex items-center justify-between animate-fade-in">
            <button
              onClick={() => navigate(-1)}
              id="back-to-results"
              className="inline-flex items-center text-cinema-400 hover:text-cinema-200 transition-colors duration-200 text-xs font-mono uppercase tracking-widest cursor-pointer"
            >
              ← Back to results
            </button>

            {activeMood && (
              <span
                className="px-3 py-1 text-[10px] font-mono uppercase tracking-widest border transition-all duration-300 select-none"
                style={{
                  color: themeAccent,
                  borderColor: `${themeAccent}50`,
                  backgroundColor: `${themeAccent}15`,
                }}
              >
                Vibe: {activeMood.label}
              </span>
            )}
          </div>

          {/* Two-Column Film Layout (Poster + Details) */}
          <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr] gap-8 lg:gap-12 items-start animate-fade-in">
            {/* Left Column: Poster Image */}
            <div className="w-full max-w-[280px] mx-auto md:mx-0 aspect-[2/3] overflow-hidden border border-cinema-700/60 shadow-2xl bg-cinema-900 group">
              <img
                src={posterSrc}
                alt={movie.title}
                className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
              />
            </div>

            {/* Right Column: Film Info & Curation Details */}
            <div className="space-y-6">
              {/* Title & Rating */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs font-mono font-semibold uppercase tracking-widest"
                    style={{ color: themeAccent }}
                  >
                    ★ {movie.rating} rating
                  </span>
                </div>
                <h1 className="font-display italic font-semibold text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-cinema-300 tracking-tight leading-tight">
                  {movie.title}
                </h1>
                
                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-cinema-400 uppercase tracking-wider">
                  <span>{movie.year}</span>
                  <span>•</span>
                  <span>{movie.runtime}</span>
                  <span>•</span>
                  <span>{movie.genres}</span>
                  {movie.director && (
                    <>
                      <span>•</span>
                      <span>Dir: {movie.director}</span>
                    </>
                  )}
                </div>
              </div>

              {/* AI Vibe Match Quote */}
              {movie.reason && (
                <blockquote
                  className="border-l-2 pl-5 py-2 space-y-1 bg-cinema-900/40"
                  style={{ borderColor: themeAccent }}
                >
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cinema-500 block">
                    Curator Note
                  </span>
                  <p className="font-display italic text-base sm:text-xl text-cinema-200 leading-relaxed font-normal">
                    &ldquo;{movie.reason}&rdquo;
                  </p>
                </blockquote>
              )}

              {/* Overview / Synopsis */}
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cinema-500 block">
                  Synopsis
                </span>
                <p className="text-cinema-300 font-body text-sm sm:text-base leading-relaxed font-light">
                  {movie.overview}
                </p>
              </div>

              {/* Cast */}
              {movie.cast && movie.cast.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-cinema-500 block">
                    Starring
                  </span>
                  <p className="text-cinema-400 font-mono text-xs tracking-wide">
                    {movie.cast.join('   /   ')}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 pt-3">
                {movie.trailerUrl ? (
                  <button
                    id="watch-trailer-btn"
                    onClick={() => setShowTrailer(true)}
                    className="px-8 py-3.5 uppercase tracking-widest text-xs font-semibold text-cinema-950 transition-all duration-300 cursor-pointer"
                    style={{ backgroundColor: themeAccent }}
                  >
                    Watch Trailer →
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-6 py-3 border border-cinema-800 text-cinema-600 cursor-not-allowed text-xs uppercase tracking-widest font-mono"
                  >
                    No Trailer Available
                  </button>
                )}
                
                <button
                  id="save-movie-btn"
                  onClick={handleSaveClick}
                  className={`px-8 py-3.5 uppercase tracking-widest text-xs font-semibold transition-all duration-300 cursor-pointer ${
                    bookmarked
                      ? 'border bg-transparent'
                      : 'btn-editorial'
                  }`}
                  style={
                    bookmarked
                      ? { color: themeAccent, borderColor: themeAccent, backgroundColor: `${themeAccent}15` }
                      : {}
                  }
                >
                  {bookmarked ? 'Saved' : 'Save Film'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal (Minimalist Black Frame) */}
      {showTrailer && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cinema-950/95 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl aspect-video border border-cinema-700 bg-cinema-950">
            <button
              id="close-trailer-btn"
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-xs font-mono text-cinema-400 hover:text-cinema-300 uppercase tracking-widest transition-colors duration-200 cursor-pointer"
              aria-label="Close trailer"
            >
              Close ✕
            </button>
            <iframe
              src={`${movie.trailerUrl}?autoplay=1`}
              title={`${movie.title} Official Trailer`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
