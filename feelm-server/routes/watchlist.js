import express from 'express';
import { pool } from '../db/pool.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply authorization check to all watchlist endpoints
router.use(authMiddleware);

// GET /api/watchlist - Returns all watchlist items for user
router.get('/', async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      'SELECT id, movie_id, movie_title, movie_poster, movie_rating, added_at FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC',
      [userId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return res.status(500).json({ error: 'Database error fetching watchlist' });
  }
});

// POST /api/watchlist - Inserts movie item into watchlist
router.post('/', async (req, res) => {
  const userId = req.user.id;
  const { movie_id, movie_title, movie_poster, movie_rating } = req.body;

  if (!movie_id || !movie_title) {
    return res.status(400).json({ error: 'Movie ID and movie title are required' });
  }

  try {
    // Insert with ON CONFLICT DO NOTHING or handle unique constraint
    const result = await pool.query(
      `INSERT INTO watchlist (user_id, movie_id, movie_title, movie_poster, movie_rating)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, movie_id) DO UPDATE SET added_at = NOW()
       RETURNING id, movie_id, movie_title, movie_poster, movie_rating, added_at`,
      [userId, movie_id, movie_title, movie_poster || null, movie_rating || null]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return res.status(500).json({ error: 'Database error adding to watchlist' });
  }
});

// DELETE /api/watchlist/:movieId - Removes item by movie_id
router.delete('/:movieId', async (req, res) => {
  const userId = req.user.id;
  const { movieId } = req.params;

  if (!movieId) {
    return res.status(400).json({ error: 'Movie ID is required' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2 RETURNING id',
      [userId, parseInt(movieId, 10)]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Watchlist item not found' });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting from watchlist:', error);
    return res.status(500).json({ error: 'Database error deleting from watchlist' });
  }
});

export default router;
