import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../db/pool.js';
import dotenv from 'dotenv';

dotenv.config();

const router = new Hono();
const JWT_SECRET = process.env.JWT_SECRET || 'a_long_random_string_change_this';

// POST /register
router.post('/register', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { email, password } = body || {};

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }

  try {
    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existingUser.rows.length > 0) {
      return c.json({ error: 'Email is already registered' }, 400);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user into database
    const newUser = await pool.query(
      'INSERT INTO users (email, password) VALUES ($1, $2) RETURNING id, email',
      [email.toLowerCase().trim(), hashedPassword]
    );

    const user = newUser.rows[0];

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    }, 201);
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ error: 'Database error during registration' }, 500);
  }
});

// POST /login
router.post('/login', async (c) => {
  let body;
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }

  const { email, password } = body || {};

  if (!email || !password) {
    return c.json({ error: 'Email and password are required' }, 400);
  }

  try {
    // Find user by email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (result.rows.length === 0) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const user = result.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return c.json({
      token,
      user: {
        id: user.id,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Database error during login' }, 500);
  }
});

export default router;
