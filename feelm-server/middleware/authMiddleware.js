import jwt from 'jsonwebtoken';

export default async function authMiddleware(c, next) {
  const authHeader = c.req.header('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authorization token missing' }, 401);
  }

  const token = authHeader.split(' ')[1];
  const JWT_SECRET = c.env?.JWT_SECRET || process.env.JWT_SECRET || 'a_long_random_string_change_this';

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    c.set('user', {
      id: decoded.id,
      email: decoded.email
    });
    await next();
  } catch (error) {
    console.error('JWT verification error:', error);
    return c.json({ error: 'Invalid or expired authorization token' }, 401);
  }
}
