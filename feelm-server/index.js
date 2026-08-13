import { Hono } from 'hono';
import { cors } from 'hono/cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import moviesRoutes from './routes/movies.js';

dotenv.config();

const app = new Hono();

app.use('*', async (c, next) => {
  const configuredOrigin = c.env?.CORS_ORIGIN || process.env.CORS_ORIGIN || 'https://feelms.vercel.app';

  const allowedOrigins = [
    'https://feelms.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    configuredOrigin,
  ].filter(Boolean);

  const corsMiddleware = cors({
    origin: (origin) => {
      if (!origin) return 'https://feelms.vercel.app';
      if (allowedOrigins.some((allowed) => allowed === '*' || origin.startsWith(allowed.replace(/\/$/, '')))) {
        return origin;
      }
      return 'https://feelms.vercel.app';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  return corsMiddleware(c, next);
});

// Explicit preflight OPTIONS handler
app.options('*', (c) => {
  const origin = c.req.header('Origin') || 'https://feelms.vercel.app';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
});

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

// Global Hono error-handling middleware with explicit CORS headers
app.onError((err, c) => {
  console.error('Hono error handled:', err);
  const status = err.status || err.statusCode || 500;
  const origin = c.req.header('Origin') || '*';
  return c.json(
    { error: err.message || 'Internal Server Error' },
    status,
    {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    }
  );
});

export default app;
