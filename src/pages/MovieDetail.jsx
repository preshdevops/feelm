import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { placeholderMovies } from '../utils/placeholderMovies';
import { getMovieDetails, isTmdbConfigured } from '../utils/tmdb';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);

  useEffect(() => {
    async function loadDetails() {
      setLoading(true);
      setError(null);

      // Check if TMDB is configured
      const tmdbActive = isTmdbConfigured();

      if (!tmdbActive) {
        setIsDemoMode(true);
        // Look up in placeholders (cast/trailer aren't there, so we mock them)
        const mockMovie = placeholderMovies.find((m) => m.id === Number(id));
        if (mockMovie) {
          setMovie({
            ...mockMovie,
            tagline: 'A cinematic masterpiece matching your vibe.',
            cast: ['Lead Actor 1', 'Supporting Actor 2', 'Featured Guest 3'],
            trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Demo trailer
          });
        } else {
          setError('Movie not found in demo library.');
        }
        setLoading(false);
        return;
      }

      try {
        setIsDemoMode(false);
        const details = await getMovieDetails(id);
        if (details) {
          setMovie(details);
        } else {
          // If search failed but it's a number, try looking up in mock
          const mockMovie = placeholderMovies.find((m) => m.id === Number(id));
          if (mockMovie) {
            setIsDemoMode(true);
            setMovie({
              ...mockMovie,
              tagline: 'A cinematic masterpiece matching your vibe.',
              cast: ['Lead Actor 1', 'Supporting Actor 2', 'Featured Guest 3'],
              trailerUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            });
          } else {
            throw new Error('Movie details not found on TMDB.');
          }
        }
      } catch (err) {
        console.error('Failed to load movie details:', err);
        setError(err.message || 'Error loading movie details.');
      } finally {
        setLoading(false);
      }
    }

    loadDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="page-container pt-24 pb-16">
        <div className="content-container">
          <div className="animate-pulse space-y-8">
            <div className="h-[40vh] bg-cinema-900 rounded-2xl" />
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-48 sm:w-64 h-72 bg-cinema-900 rounded-xl" />
              <div className="flex-1 space-y-4">
                <div className="h-8 bg-cinema-900 rounded w-1/3" />
                <div className="h-4 bg-cinema-900 rounded w-1/4" />
                <div className="h-20 bg-cinema-900 rounded w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="page-container pt-24 pb-16">
        <div className="content-container text-center py-32">
          <span className="text-6xl mb-6 block">🎞️</span>
          <h1 className="font-display font-bold text-3xl text-white mb-4">Movie Not Found</h1>
          <p className="text-gray-400 mb-8">{error || "We couldn't find the film you're looking for."}</p>
          <Link to="/" className="btn-primary inline-flex">
            <span className="relative z-10">Go Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Backdrop Section */}
      <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-cinema-900" />
        <img
          src={movie.backdrop}
          alt={`${movie.title} backdrop`}
          className="absolute inset-0 w-full h-full object-cover opacity-35"
        />
        {/* Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-950/80 via-transparent to-transparent" />
      </div>

      {/* Main content body */}
      <div className="relative -mt-48 sm:-mt-64 pb-16">
        <div className="content-container">
          {/* Back button */}
          <Link
            to="/results"
            id="back-to-results"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gold 
                       transition-colors duration-300 mb-6 group relative z-10"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to results</span>
          </Link>

          {/* Demo Mode Notice Banner */}
          {isDemoMode && (
            <div className="mb-8 p-4 rounded-xl border border-gold/20 bg-gold/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 animate-fade-in">
              <div>
                <h4 className="text-gold font-semibold text-sm sm:text-base">🍿 Running in Demo Mode</h4>
                <p className="text-gray-400 text-xs sm:text-sm mt-0.5">
                  Set your <code className="text-gold">VITE_TMDB_API_KEY</code> in <code className="text-gold">.env.local</code> to fetch real-time movie details.
                </p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded bg-gold/20 text-gold-light border border-gold/30 font-medium self-start sm:self-center">
                Demo Active
              </span>
            </div>
          )}

          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 animate-fade-in">
            {/* Poster Card */}
            <div className="flex-shrink-0 w-48 sm:w-56 md:w-64 mx-auto md:mx-0 relative z-10">
              <div className="relative rounded-2xl overflow-hidden shadow-cinema-lg border border-white/10
                              hover:shadow-gold transition-shadow duration-500">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>
            </div>

            {/* Info details */}
            <div className="flex-1 min-w-0">
              {movie.tagline && (
                <p className="text-gold font-display italic text-sm sm:text-base tracking-wide mb-2 uppercase">
                  &ldquo;{movie.tagline}&rdquo;
                </p>
              )}

              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-3">
                {movie.title}
              </h1>

              {/* Meta information */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg glass text-sm font-semibold">
                  <span className="text-gold">★</span>
                  <span className="text-white">{movie.rating}</span>
                </span>
                <span className="text-gray-400">{movie.year}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span className="text-gray-400">{movie.runtime}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span className="text-gray-400">{movie.genres}</span>
              </div>

              {/* Director & Cast */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Directed by</span>
                  <p className="text-white font-medium mt-1">{movie.director}</p>
                </div>
                {movie.cast && movie.cast.length > 0 && (
                  <div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Starring</span>
                    <p className="text-white font-medium mt-1 line-clamp-1">
                      {movie.cast.join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Overview */}
              <div className="mb-8">
                <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Overview</span>
                <p className="text-gray-300 mt-2 leading-relaxed text-base sm:text-lg">{movie.overview}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                {movie.trailerUrl ? (
                  <button
                    id="watch-trailer-btn"
                    onClick={() => setShowTrailer(true)}
                    className="btn-primary"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Watch Trailer
                    </span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-6 py-3 rounded-xl border border-white/5 bg-white/5 text-gray-500 cursor-not-allowed font-display font-semibold"
                  >
                    No Trailer Available
                  </button>
                )}
                
                <button
                  id="save-movie-btn"
                  className="px-6 py-3 rounded-xl glass glass-hover font-display font-semibold
                             flex items-center gap-2 text-gray-300 hover:text-gold"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" 
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trailer Modal Overlay */}
      {showTrailer && movie.trailerUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-cinema-950/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-4xl aspect-video glass overflow-hidden rounded-2xl shadow-cinema-lg">
            {/* Close button */}
            <button
              id="close-trailer-btn"
              onClick={() => setShowTrailer(false)}
              className="absolute -top-1 -right-1 z-10 w-10 h-10 bg-cinema-950 border border-white/10 rounded-full flex items-center justify-center text-white hover:text-gold hover:border-gold/30 transition-all duration-300"
              aria-label="Close trailer"
            >
              ✕
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
