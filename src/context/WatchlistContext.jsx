/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../lib/api';

const WatchlistContext = createContext(null);

export function WatchlistProvider({ children }) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load watchlist items whenever user logs in or mounts
  useEffect(() => {
    async function loadWatchlist() {
      if (!user) {
        setWatchlist([]);
        return;
      }
      setLoading(true);
      try {
        const items = await api.fetchWatchlist();
        setWatchlist(items);
      } catch (err) {
        console.error('Failed to fetch watchlist in Context:', err);
      } finally {
        setLoading(false);
      }
    }
    loadWatchlist();
  }, [user]);

  const addToWatchlist = async (movie) => {
    if (!user) return;
    try {
      const newItem = await api.addToWatchlist(movie);
      // Append the new item locally
      setWatchlist((prev) => [newItem, ...prev]);
      showToast('Added to your watchlist');
    } catch (err) {
      console.error('Failed to add item in Context:', err);
      throw err;
    }
  };

  const removeFromWatchlist = async (movieId) => {
    if (!user) return;
    try {
      await api.removeFromWatchlist(movieId);
      // Filter out item locally
      setWatchlist((prev) => prev.filter((item) => Number(item.movie_id) !== Number(movieId)));
      showToast('Removed from watchlist');
    } catch (err) {
      console.error('Failed to remove item in Context:', err);
      throw err;
    }
  };

  const isInWatchlist = (movieId) => {
    return watchlist.some((item) => Number(item.movie_id) === Number(movieId));
  };

  const value = {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    isInWatchlist,
  };

  return <WatchlistContext.Provider value={value}>{children}</WatchlistContext.Provider>;
}

export function useWatchlistContext() {
  const context = useContext(WatchlistContext);
  if (!context) {
    throw new Error('useWatchlistContext must be used within a WatchlistProvider');
  }
  return context;
}
