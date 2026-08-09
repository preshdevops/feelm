import { httpServerHandler } from 'cloudflare:node';
import express from 'express';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import moviesRoutes from './routes/movies.js';
import { initDb } from './db/pool.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic CORS Middleware for Cloudflare Workers & Vercel Frontend
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Body parser
app.use(express.json());

// Routes mounts
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/movies', moviesRoutes);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Feelm Express API server running on Cloudflare Workers.' });
});

// Export Cloudflare Worker fetch handler for Express natively
export default httpServerHandler({
  port: PORT,
  requestListener: app
});
