import { Link } from 'react-router-dom';

export default function MovieCard({ movie }) {
  return (
    <Link
      to={`/movie/${movie.id}`}
      id={`movie-card-${movie.id}`}
      className="relative block w-full aspect-[2/3] overflow-hidden group bg-cinema-800 border border-white/10 transition-all duration-300"
    >
      {/* Poster Image */}
      <img
        src={movie.poster}
        alt={movie.title}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/85 flex flex-col justify-end p-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-in-out">
        <div className="space-y-2.5 translate-y-3 group-hover:translate-y-0 transition-transform duration-300 ease-out">
          {/* Title */}
          <h3 className="font-display italic text-lg sm:text-xl font-semibold text-white leading-snug">
            {movie.title}
          </h3>

          {/* Meta Info */}
          <div className="flex items-center gap-2 text-xs font-mono text-cinema-400">
            <span>{movie.year}</span>
            <span>•</span>
            <span className="text-accent font-semibold">★ {movie.rating}</span>
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
