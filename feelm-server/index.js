import { httpServerHandler } from 'cloudflare:node';
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import moviesRoutes from './routes/movies.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser
app.use(express.json());

// Support both /api/* and root /* route mounts for flexible frontend client URLs
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/watchlist', watchlistRoutes);
app.use('/watchlist', watchlistRoutes);

app.use('/api/movies', moviesRoutes);
app.use('/movies', moviesRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Feelm Express API server running on Cloudflare Workers.' });
});

// Call app.listen so Node.js http module registers listener on PORT 5000 required by cloudflare:node
app.listen(PORT);

// Create Express HTTP handler for Cloudflare Workers
const expressHandler = httpServerHandler({
  port: PORT,
  requestListener: app
});

// Export Cloudflare Worker fetch handler with guaranteed Edge CORS & Error Protection
export default {
  async fetch(request, env, ctx) {
    const origin = request.headers.get('origin') || '*';

    const corsHeaders = {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    };

    // 1. Handle preflight OPTIONS requests directly at Cloudflare Edge
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // 2. Delegate request to Express app
      const response = await expressHandler.fetch(request, env, ctx);

      // 3. Guarantee CORS response headers match the requesting origin
      const headers = new Headers(response.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (err) {
      console.error('Cloudflare Worker Exception caught:', err);
      return new Response(
        JSON.stringify({ error: err.message || 'Worker server execution error' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }
  }
};
