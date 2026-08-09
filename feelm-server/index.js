import { httpServerHandler } from 'cloudflare:node';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import moviesRoutes from './routes/movies.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS using the cors package before express.json() and routes
const corsOptions = {
  origin: process.env.CORS_ORIGIN || 'https://feelms.vercel.app',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Route mounts (supporting both /api/* and /* paths)
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

// Global Express error-handling middleware
app.use((err, req, res, next) => {
  console.error('Express error handled:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// Direct default export of httpServerHandler without wrapping
export default httpServerHandler({
  port: PORT,
  requestListener: app,
});
