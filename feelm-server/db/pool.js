import pg from 'pg';

const { Pool } = pg;

let cachedPool = null;

/**
 * Returns a cached or newly initialized pg.Pool using Cloudflare Hyperdrive's connection string.
 * @param {object} env - Hono context env object (c.env) containing HYPERDRIVE binding.
 * @returns {Pool}
 */
export function getPool(env) {
  if (cachedPool) {
    return cachedPool;
  }

  const connectionString = env?.HYPERDRIVE?.connectionString || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Hyperdrive connection string is not available.');
  }

  cachedPool = new Pool({
    connectionString,
  });

  return cachedPool;
}

/**
 * Initializes the database tables if they do not exist.
 * Must be called explicitly with a valid pool instance or env object.
 * @param {Pool|object} poolOrEnv - pg.Pool instance or c.env object
 */
export async function initDb(poolOrEnv) {
  const pool = poolOrEnv && typeof poolOrEnv.query === 'function' ? poolOrEnv : getPool(poolOrEnv);

  const usersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `;

  const watchlistTableQuery = `
    CREATE TABLE IF NOT EXISTS watchlist (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      movie_id INTEGER NOT NULL,
      movie_title TEXT NOT NULL,
      movie_poster TEXT,
      movie_rating NUMERIC,
      added_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, movie_id)
    );
  `;

  try {
    const client = await pool.connect();
    console.log('Connected to PostgreSQL database successfully.');
    
    // Create users table
    await client.query(usersTableQuery);
    console.log('Verified/created "users" table.');
    
    // Create watchlist table
    await client.query(watchlistTableQuery);
    console.log('Verified/created "watchlist" table.');
    
    client.release();
  } catch (error) {
    console.error('Failed to initialize database tables:', error);
    throw error;
  }
}
