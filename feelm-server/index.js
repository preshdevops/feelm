import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import watchlistRoutes from './routes/watchlist.js';
import { initDb } from './db/pool.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend client
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json());

// Routes mounts
app.use('/api/auth', authRoutes);
app.use('/api/watchlist', watchlistRoutes);

// Root test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Feelm API server running.' });
});

// Run table creation & start server listening
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup failed due to database error:', error);
    process.exit(1);
  }
}

startServer();
