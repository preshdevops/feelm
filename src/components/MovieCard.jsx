import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      id={`movie-card-${movie.id}`}
      className="movie-card group block"
    >
      {/* Poster */}
      <div className="relative aspect-[2/3] overflow-hidden">
        <div className="absolute inset-0 bg-cinema-800 animate-pulse-soft" />
        <img
          src={movie.poster}
          alt={movie.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover
                     group-hover:scale-110 transition-transform duration-700 ease-out"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/20 to-transparent 
                        opacity-60 group-hover:opacity-80 transition-opacity duration-300" />

        {/* Rating badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 
                        rounded-lg glass text-sm font-semibold">
          <span className="text-gold">★</span>
          <span className="text-white">{movie.rating}</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-white text-base sm:text-lg 
                       group-hover:text-gold transition-colors duration-300 line-clamp-1">
          {movie.title}
        </h3>
        <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-400">
          <span>{movie.year}</span>
          <span className="w-1 h-1 rounded-full bg-gray-600" />
          <span className="line-clamp-1">{movie.genre}</span>
        </div>
        <p className="mt-2 text-sm text-gray-500 line-clamp-2 leading-relaxed">
          {movie.overview}
        </p>
      </div>
    </Link>
  );
}
