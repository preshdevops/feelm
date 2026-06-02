const BASE_URL = 'http://localhost:5000/api';

/**
 * Helper to perform HTTP requests with auth headers.
 * @param {string} endpoint - API path (e.g. '/auth/login')
 * @param {Object} options - fetch options
 */
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('feelm_token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('feelm_token');
    window.location.href = '/';
    return;
  }

  const data = await response.json();


  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

export const api = {
  // Auth endpoints
  async login(email, password) {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(email, password) {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Watchlist endpoints
  async fetchWatchlist() {
    return apiRequest('/watchlist', {
      method: 'GET',
    });
  },

  async addToWatchlist(movie) {
    return apiRequest('/watchlist', {
      method: 'POST',
      body: JSON.stringify({
        movie_id: movie.id || movie.movie_id,
        movie_title: movie.title || movie.movie_title,
        movie_poster: movie.poster || movie.movie_poster,
        movie_rating: movie.rating || movie.movie_rating,
      }),
    });
  },

  async removeFromWatchlist(movieId) {
    return apiRequest(`/watchlist/${movieId}`, {
      method: 'DELETE',
    });
  },
};
