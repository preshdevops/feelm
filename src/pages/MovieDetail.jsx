import { useParams, Link } from 'react-router-dom';
import { placeholderMovies } from '../utils/placeholderMovies';

export default function MovieDetail() {
  const { id } = useParams();
  const movie = placeholderMovies.find((m) => m.id === Number(id));

  if (!movie) {
    return (
      <div className="page-container pt-24 pb-16">
        <div className="content-container text-center py-32">
          <span className="text-6xl mb-6 block">🎞️</span>
          <h1 className="font-display font-bold text-3xl text-white mb-4">Movie Not Found</h1>
          <p className="text-gray-400 mb-8">We couldn't find the film you're looking for.</p>
          <Link to="/" className="btn-primary inline-flex">
            <span className="relative z-10">Go Home</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Backdrop */}
      <div className="relative h-[50vh] sm:h-[60vh] overflow-hidden">
        <div className="absolute inset-0 bg-cinema-900" />
        <img
          src={movie.backdrop}
          alt={`${movie.title} backdrop`}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-cinema-950 via-cinema-950/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-cinema-950/80 to-transparent" />
      </div>

      {/* Content */}
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

          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 animate-fade-in">
            {/* Poster */}
            <div className="flex-shrink-0 w-48 sm:w-56 md:w-64 mx-auto md:mx-0">
              <div className="relative rounded-2xl overflow-hidden shadow-cinema-lg border border-white/10
                              hover:shadow-gold transition-shadow duration-500">
                <img
                  src={movie.poster}
                  alt={movie.title}
                  className="w-full aspect-[2/3] object-cover"
                />
              </div>
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-white mb-3">
                {movie.title}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg glass text-sm font-semibold">
                  <span className="text-gold">★</span>
                  <span className="text-white">{movie.rating}</span>
                </span>
                <span className="text-gray-400">{movie.year}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span className="text-gray-400">{movie.runtime}</span>
                <span className="w-1 h-1 rounded-full bg-gray-600" />
                <span className="text-gray-400">{movie.genre}</span>
              </div>

              {/* Director */}
              <div className="mb-6">
                <span className="text-sm text-gray-500 uppercase tracking-wider">Directed by</span>
                <p className="text-white font-medium mt-1">{movie.director}</p>
              </div>

              {/* Overview */}
              <div className="mb-8">
                <span className="text-sm text-gray-500 uppercase tracking-wider">Overview</span>
                <p className="text-gray-300 mt-2 leading-relaxed text-lg">{movie.overview}</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3">
                <button
                  id="watch-trailer-btn"
                  className="btn-primary"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Watch Trailer
                  </span>
                </button>
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
    </div>
  );
}
