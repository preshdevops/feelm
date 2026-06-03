import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useWatchlist from '../hooks/useWatchlist';

export default function MovieCard({ movie, watchlistMode = false }) {
  const { user, setAuthModalOpen } = useAuth();
  const { addToWatchlist, removeFromWatchlist, isInWatchlist } = useWatchlist();
  
  const bookmarked = isInWatchlist(movie.id || movie.movie_id);

  const handleBookmarkClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    try {
      if (bookmarked || watchlistMode) {
        await removeFromWatchlist(movie.id || movie.movie_id);
      } else {
        await addToWatchlist(movie);
      }
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  return (
    <Link
      to={`/movie/${movie.id || movie.movie_id}`}
      id={`movie-card-${movie.id || movie.movie_id}`}
      className="relative block w-full aspect-[2/3] overflow-hidden group bg-cinema-800 border border-white/10 transition-all duration-300"
    >
      {/* Media Type Badge (top left) */}
      {movie.type && (
        <span className="absolute top-3 left-3 z-20 px-2 py-1 bg-black/60 border border-white/10 text-[9px] font-mono uppercase tracking-widest text-white select-none">
          {movie.type === 'series' ? 'Series' : 'Film'}
        </span>
      )}

      {/* Bookmark / Remove Button (top right of poster) */}
      <button
        onClick={handleBookmarkClick}
        className="absolute top-3 right-3 z-20 w-8 h-8 flex items-center justify-center bg-black/60 hover:bg-black/85 border border-white/10 hover:border-white transition-all cursor-pointer"
        aria-label={watchlistMode ? "Remove from watchlist" : bookmarked ? "Remove from watchlist" : "Add to watchlist"}
      >
        {watchlistMode ? (
          <span className="text-white hover:text-accent text-xs font-mono font-semibold">✕</span>
        ) : (
          <svg 
            className={`w-3.5 h-3.5 transition-colors ${bookmarked ? 'fill-accent text-accent' : 'text-cinema-400 fill-none'}`} 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        )}
      </button>

      {/* Poster Image */}
      <img
        src={movie.poster || movie.movie_poster}
        alt={movie.title || movie.movie_title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/85 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
        <div className="space-y-2.5 translate-y-3 group-hover:translate-y-0 transition-transform duration-300 ease-out">
          {/* Title */}
          <h3 className="font-display italic text-lg sm:text-xl font-semibold text-white leading-snug">
            {movie.title || movie.movie_title}
          </h3>

          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs font-mono text-cinema-400">
            <span>{movie.year}</span>
            <span>•</span>
            <span className="text-accent font-semibold">★ {movie.rating || movie.movie_rating}</span>
          </div>

          {/* Vibe/Reason Blurb */}
          <p className="text-xs text-cinema-300 leading-relaxed font-light line-clamp-4">
            {movie.reason ? movie.reason : movie.overview}
          </p>
        </div>
      </div>
    </Link>
  );
}
