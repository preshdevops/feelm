import { useSearchParams, Link } from 'react-router-dom';
import MovieCard from '../components/MovieCard';
import { placeholderMovies } from '../utils/placeholderMovies';
import { moods } from '../utils/moods';

export default function Results() {
  const [searchParams] = useSearchParams();
  const moodId = searchParams.get('mood');
  const feeling = searchParams.get('feeling');

  const selectedMood = moods.find((m) => m.id === moodId);

  return (
    <div className="page-container pt-24 pb-16">
      <div className="content-container">
        {/* Header */}
        <div className="mb-10 animate-fade-in">
          <Link
            to="/"
            id="back-to-home"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-gold 
                       transition-colors duration-300 mb-6 group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            <span className="text-sm font-medium">Back to moods</span>
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h1 className="section-title">Your Picks</h1>
            {selectedMood && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm">
                <span>{selectedMood.emoji}</span>
                <span className="text-gray-300">{selectedMood.label} mood</span>
              </span>
            )}
            {feeling && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm">
                <span>💬</span>
                <span className="text-gray-300 line-clamp-1 max-w-[200px]">&ldquo;{feeling}&rdquo;</span>
              </span>
            )}
          </div>

          <p className="text-gray-400 mt-3 text-lg">
            We found <span className="text-gold font-semibold">{placeholderMovies.length} films</span> that match your vibe.
          </p>
        </div>

        {/* Movie grid */}
        <div
          id="movie-results-grid"
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
        >
          {placeholderMovies.map((movie, index) => (
            <div
              key={movie.id}
              className="animate-slide-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'both' }}
            >
              <MovieCard movie={movie} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
