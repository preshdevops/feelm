import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import moviesRoutes from './routes/movies.js';
import { initDb } from './db/pool.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend client
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parser
app.use(express.json());

// Rate limiter for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many attempts. Please try again in 15 minutes.' }
});

// Routes mounts
app.use('/api/auth', authLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.use('/api/movies', moviesRoutes);

// Root health & status endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Feelm Express API server running on Cloudflare Workers.' });
});

// Start local Node.js server if executed directly
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production' && !process.env.CF_PAGES) {
  async function startServer() {
    try {
      await initDb();
      app.listen(PORT, () => {
        console.log(`Express server running locally on port ${PORT}`);
      });
    } catch (error) {
      console.error('Server startup failed:', error);
    }
  }
  startServer();
}

// Export native Cloudflare Workers httpServerHandler for Express
let cloudflareHandler;
try {
  const { httpServerHandler } = await import('cloudflare:node');
  cloudflareHandler = httpServerHandler({
    port: PORT,
    requestListener: app
  });
} catch (e) {
  // Graceful fallback for non-Cloudflare environments
  cloudflareHandler = {
    fetch: (req) => app(req)
  };
}

export default cloudflareHandler;
