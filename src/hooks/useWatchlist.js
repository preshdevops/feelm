import { useWatchlistContext } from '../context/WatchlistContext';

/**
 * Custom hook to consume the shared watchlist context.
 * Communicates with backend endpoints.
 */
export default function useWatchlist() {
  return useWatchlistContext();
}
