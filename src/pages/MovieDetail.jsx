import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { placeholderMovies } from '../utils/placeholderMovies';
import { getMovieDetails, isTmdbConfigured } from '../utils/tmdb';
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
        // Fallback to mock data directly
        const mockMovie = placeholderMovies.find((m) => m.id === Number(id));
        if (mockMovie) {
          setMovie({
            ...mockMovie,
            tagline: 'A cinematic masterpiece matching your vibe.',
            cast: ['Lead Actor', 'Supporting Actor', 'Featured Guest'],
            trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Default demo trailer
          });
        } else {
          setError('Movie not found in demo library.');
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
              trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
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
      <div className="page-container min-h-screen bg-cinema-950 flex items-center justify-center">
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
      <div className="page-container min-h-screen bg-cinema-950 flex items-center justify-center">
        <div className="text-center space-y-6 px-6">
          <h1 className="font-display italic text-3xl text-white">Film not found</h1>
          <p className="text-cinema-400 font-light max-w-sm">{error || "We couldn't retrieve the details for this movie."}</p>
          <Link to="/" className="btn-editorial">
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-cinema-950 text-white overflow-hidden flex flex-col justify-between">
      {/* Full bleed blurred backdrop image */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/75 z-10" /> {/* Dark overlay overlay */}
        <img
          src={movie.backdrop}
          alt=""
          className="w-full h-full object-cover blur-3xl opacity-20 scale-105"
        />
      </div>

      {/* Main Overlay Content */}
      <div className="relative z-10 w-full pt-20 pb-16 flex-grow flex flex-col justify-center">
        <div className="content-container w-full space-y-12">
          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            id="back-to-results"
            className="inline-flex items-center text-cinema-500 hover:text-white transition-colors duration-200 text-xs font-mono uppercase tracking-widest"
          >
            ← Back to results
          </button>

          {/* Main Info */}
          <div className="max-w-3xl space-y-8 animate-fade-in">
            {/* Title Block */}
            <div className="space-y-4">
              <span className="text-xs uppercase tracking-widest text-accent font-mono font-semibold">
                ★ {movie.rating} rating
              </span>
              <h1 className="font-display italic font-semibold text-4xl sm:text-5xl md:text-6xl text-white tracking-tight leading-tight">
                {movie.title}
              </h1>
              
              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-mono text-cinema-400 uppercase tracking-wider pt-2">
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

            {/* Gemini Pull Quote / Explanation (if present) */}
            {movie.reason && (
              <blockquote className="border-l border-accent/60 pl-6 py-2 space-y-1 my-6">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cinema-500 block">AI Vibe Match</span>
                <p className="font-display italic text-lg sm:text-2xl text-white/90 leading-relaxed">
                  &ldquo;{movie.reason}&ldquo;
                </p>
              </blockquote>
            )}

            {/* Overview / Synopsis */}
            <div className="space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-widest text-cinema-500 block">Synopsis</span>
              <p className="text-cinema-300 font-body text-base sm:text-lg leading-relaxed font-light">
                {movie.overview}
              </p>
            </div>

            {/* Cast section */}
            {movie.cast && movie.cast.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-cinema-500 block">Starring</span>
                <p className="text-cinema-400 font-mono text-xs sm:text-sm tracking-wide">
                  {movie.cast.join('   /   ')}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              {movie.trailerUrl ? (
                <button
                  id="watch-trailer-btn"
                  onClick={() => setShowTrailer(true)}
                  className="btn-accent px-8 py-3.5 uppercase tracking-widest text-xs font-semibold"
                >
                  Watch Trailer →
                </button>
              ) : (
                <button
                  disabled
                  className="px-6 py-3 border border-white/5 text-cinema-600 cursor-not-allowed text-xs uppercase tracking-widest font-mono"
                >
                  No Trailer Available
                </button>
              )}
              
              <button
                id="save-movie-btn"
                onClick={handleSaveClick}
                className={`px-8 py-3.5 uppercase tracking-widest text-xs font-semibold rounded-none transition-all duration-300 ease-out ${
                  bookmarked
                    ? 'bg-accent/10 text-accent border border-accent hover:bg-accent/20'
                    : 'btn-editorial'
                }`}
              >
                {bookmarked ? 'Saved' : 'Save Film'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal (Minimalist Black Frame) */}
      {showTrailer && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-4xl aspect-video border border-cinema-700 bg-black">
            {/* Close button */}
            <button
              id="close-trailer-btn"
              onClick={() => setShowTrailer(false)}
              className="absolute -top-10 right-0 text-xs font-mono text-cinema-400 hover:text-white uppercase tracking-widest transition-colors duration-200"
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
