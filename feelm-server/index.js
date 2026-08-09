import { httpServerHandler } from 'cloudflare:node';
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import moviesRoutes from './routes/movies.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware for parsing JSON bodies
app.use(express.json());

// Routes mounts
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/movies', moviesRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Feelm Express API server running on Cloudflare Workers.' });
});

// Create Express HTTP handler
const expressHandler = httpServerHandler({
  port: PORT,
  requestListener: app
});

// Export Cloudflare Worker fetch handler with guaranteed Edge CORS
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('origin') || '*';

    // 1. Handle browser preflight OPTIONS requests directly at Cloudflare Edge
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 2. Delegate request to Express app
    const response = await expressHandler.fetch(request, env, ctx);

    // 3. Guarantee CORS response headers match the requesting origin
    const headers = new Headers(response.headers);
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
};
