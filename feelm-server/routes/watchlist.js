import { Hono } from 'hono';
import { getPool } from '../db/pool.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = new Hono();

// Apply authorization check to all watchlist endpoints
router.use('*', authMiddleware);

// GET / - Returns all watchlist items for user
router.get('/', async (c) => {
  const user = c.get('user');
  const userId = user.id;

  try {
    const pool = getPool(c.env);
    const result = await pool.query(
      'SELECT id, movie_id, movie_title, movie_poster, movie_rating, added_at FROM watchlist WHERE user_id = $1 ORDER BY added_at DESC',
      [userId]
    );
    return c.json(result.rows);
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return c.json({ error: 'Database error fetching watchlist' }, 500);
  }
});

// POST / - Inserts movie item into watchlist
router.post('/', async (c) => {
  const user = c.get('user');
  const userId = user.id;

  let body;
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { movie_id, movie_title, movie_poster, movie_rating } = body || {};

  if (!movie_id || !movie_title) {
    return c.json({ error: 'Movie ID and movie title are required' }, 400);
  }

  try {
    const pool = getPool(c.env);
    // Insert with ON CONFLICT DO NOTHING or handle unique constraint
    const result = await pool.query(
      `INSERT INTO watchlist (user_id, movie_id, movie_title, movie_poster, movie_rating)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, movie_id) DO UPDATE SET added_at = NOW()
       RETURNING id, movie_id, movie_title, movie_poster, movie_rating, added_at`,
      [userId, movie_id, movie_title, movie_poster || null, movie_rating || null]
    );

    return c.json(result.rows[0], 201);
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return c.json({ error: 'Database error adding to watchlist' }, 500);
  }
});

// DELETE /:movieId - Removes item by movie_id
router.delete('/:movieId', async (c) => {
  const user = c.get('user');
  const userId = user.id;
  const movieId = c.req.param('movieId');

  if (!movieId) {
    return c.json({ error: 'Movie ID is required' }, 400);
  }

  try {
    const pool = getPool(c.env);
    const result = await pool.query(
      'DELETE FROM watchlist WHERE user_id = $1 AND movie_id = $2 RETURNING id',
      [userId, parseInt(movieId, 10)]
    );

    if (result.rows.length === 0) {
      return c.json({ error: 'Watchlist item not found' }, 404);
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting from watchlist:', error);
    return c.json({ error: 'Database error deleting from watchlist' }, 500);
  }
});

export default router;
