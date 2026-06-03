import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useWatchlist from '../hooks/useWatchlist';
import MovieCard from '../components/MovieCard';

export default function Watchlist() {
  const { user, loading: authLoading } = useAuth();
  const { watchlist, loading: listLoading } = useWatchlist();
  const navigate = useNavigate();

  // Redirect guest users to home page
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/', { replace: true });
    }
  }, [user, authLoading, navigate]);

  if (authLoading || !user) {
    return (
      <div className="page-container min-h-screen bg-cinema-950 flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-sm px-6">
          <div className="h-4 bg-cinema-800 rounded w-1/4" />
          <div className="h-8 bg-cinema-800 rounded w-3/4" />
        </div>
      </div>
    );
  }

  return (
    <div className="page-container pt-20 pb-20 bg-cinema-950 min-h-screen">
      <div className="content-container">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 animate-fade-in">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-cinema-500 hover:text-cinema-300 transition-colors duration-200 text-xs font-mono uppercase tracking-widest"
          >
            ← Back to moods
          </Link>
        </div>

        {/* Dynamic Title */}
        <div className="mb-12 animate-fade-in">
          <h1 className="editorial-title font-display font-medium text-cinema-300 max-w-3xl leading-tight">
            Your Watchlist
          </h1>
          {watchlist.length > 0 && (
            <p className="text-xs font-mono text-cinema-500 mt-3 uppercase tracking-wide">
              {watchlist.length} {watchlist.length === 1 ? 'film' : 'films'} saved
            </p>
          )}
        </div>

        {/* Dynamic watchlist rendering */}
        {listLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="w-full aspect-[2/3] bg-cinema-900 border border-cinema-700/50 animate-pulse"
              />
            ))}
          </div>
        ) : watchlist.length === 0 ? (
          /* Empty state */
          <div className="text-center py-24 space-y-4 animate-fade-in">
            <p className="text-cinema-400 font-light text-lg">
              Your watchlist is empty.
            </p>
            <div>
              <Link 
                to="/" 
                className="inline-flex text-accent hover:text-accent-hover font-body font-semibold text-sm uppercase tracking-widest transition-colors duration-200"
              >
                Start exploring →
              </Link>
            </div>
          </div>
        ) : (
          /* Watchlist Grid */
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {watchlist.map((movie, index) => (
              <div
                key={`${movie.movie_id}-${index}`}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <MovieCard 
                  movie={{
                    id: movie.movie_id,
                    title: movie.movie_title,
                    poster: movie.movie_poster,
                    rating: movie.movie_rating,
                    overview: 'Saved to your watchlist.',
                  }} 
                  watchlistMode={true}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
