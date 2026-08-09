import { Hono } from 'hono';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import moviesRoutes from './routes/movies.js';

dotenv.config();

const app = new Hono();

const corsOrigin = process.env.CORS_ORIGIN || 'https://feelms.vercel.app';

app.use('*', cors({
  origin: corsOrigin,
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Route mounts (supporting both /api/* and /* paths)
app.route('/api/auth', authRoutes);
app.route('/auth', authRoutes);

app.route('/api/watchlist', watchlistRoutes);
app.route('/watchlist', watchlistRoutes);

app.route('/api/movies', moviesRoutes);
app.route('/movies', moviesRoutes);

// Health check endpoint
app.get('/', (c) => {
  return c.json({ message: 'Feelm Express API server running on Cloudflare Workers.' });
});

// Global Hono error-handling middleware
app.onError((err, c) => {
  console.error('Hono error handled:', err);
  const status = err.status || err.statusCode || 500;
  return c.json({
    error: err.message || 'Internal Server Error',
  }, status);
});

export default app;
