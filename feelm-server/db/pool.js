import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let sslConfig;

if (process.env.DB_CA_CERT) {
  sslConfig = {
    rejectUnauthorized: true,
    ca: process.env.DB_CA_CERT
  };
} else {
  // local dev — look for ca.crt file
  const caPath = ['./ca.crt', './ca.pem'].find(p => fs.existsSync(p));
  if (!caPath) {
    console.error('FATAL: No CA certificate found.');
    process.exit(1);
  }
  sslConfig = {
    rejectUnauthorized: true,
    ca: fs.readFileSync(caPath).toString()
  };
}


export const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'defaultdb',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD,
  ssl: sslConfig
});

/**
 * Initializes the database tables if they do not exist.
 */
export async function initDb() {
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
    console.log('Connected to Aiven PostgreSQL database successfully.');
    
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
