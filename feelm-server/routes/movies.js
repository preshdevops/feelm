import { Hono } from 'hono';
import { getPool } from '../db/pool.js';

const router = new Hono();

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

const MOOD_GENRE_MAP = {
  happy: 35,
  sad: 18,
  stressed: 53,
  romantic: 10749,
  adventurous: 12,
  bored: 9648,
  inspired: 99,
  scared: 27,
};

const getPosterUrl = (path, size = 'w500') => {
  if (!path) return 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=500&auto=format&fit=crop';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

const getBackdropUrl = (path, size = 'original') => {
  if (!path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1200&auto=format&fit=crop';
  return `https://image.tmdb.org/t/p/${size}${path}`;
};

/**
 * GET /mood-backdrop
 * Fetches backdrop images from TMDB for a specific mood ID.
 * Always returns 200 status with { backdrops: [] } on any error or missing data.
 */
router.get('/mood-backdrop', async (c) => {
  const mood = c.req.query('mood');
  if (!mood || !MOOD_GENRE_MAP[mood]) {
    return c.json({ backdrops: [] }, 200);
  }

  const TMDB_API_KEY = c.env?.TMDB_API_KEY || process.env.TMDB_API_KEY;
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_key_here') {
    return c.json({ backdrops: [] }, 200);
  }

  try {
    const genreId = MOOD_GENRE_MAP[mood];
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=1&language=en-US`;
    
    const response = await fetch(url);
    if (!response.ok) {
      return c.json({ backdrops: [] }, 200);
    }

    const data = await response.json();
    const results = (data.results || []).filter((item) => item.backdrop_path);

    if (results.length === 0) {
      return c.json({ backdrops: [] }, 200);
    }

    // Shuffle results (Fisher-Yates)
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }

    const backdrops = results.slice(0, 5).map((item) => ({
      url: `https://image.tmdb.org/t/p/original${item.backdrop_path}`,
      title: item.title,
    }));

    return c.json({ backdrops }, 200);
  } catch (error) {
    console.error('Backend: Error fetching mood-backdrop:', error);
    return c.json({ backdrops: [] }, 200);
  }
});

/**
 * POST /classify-mood
 * Classifies user typed text into one of the preset mood IDs using Gemini.
 * Fails silently with { moodId: null } on any error.
 */
router.post('/classify-mood', async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json({ moodId: null });
  }

  const { text } = body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    return c.json({ moodId: null });
  }

  const GEMINI_API_KEY = c.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_key_here') {
    return c.json({ moodId: null });
  }

  const validMoods = ["happy", "sad", "stressed", "romantic", "adventurous", "bored", "inspired", "scared"];

  const prompt = `
    You are a sentiment and mood classification AI.
    Given the user's typed description of how they are feeling:
    "${text.trim()}"

    Classify the vibe into EXACTLY ONE of the following valid mood IDs:
    ${JSON.stringify(validMoods)}

    If the text matches or strongly relates to one of these mood IDs, return raw JSON in the exact format:
    { "moodId": "<matching_mood_id>" }

    If nothing matches reasonably well, return raw JSON:
    { "moodId": null }

    CRITICAL: Do not wrap your response in markdown code blocks. Return raw JSON only.
  `;

  for (const model of GEMINI_MODELS) {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        }),
      });

      if (response.status === 404) {
        continue;
      }

      if (!response.ok) {
        continue;
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        continue;
      }

      const parsed = JSON.parse(rawText.trim());
      const moodId = parsed?.moodId;

      if (moodId && validMoods.includes(moodId)) {
        return c.json({ moodId });
      } else {
        return c.json({ moodId: null });
      }
    } catch (error) {
      console.error(`Backend: Error in classify-mood with model ${model}:`, error);
    }
  }

  return c.json({ moodId: null });
});

/**
 * POST /recommendations
 * Gets movie recommendations (list of titles) from Gemini based on user mood/feeling text.
 */
router.post('/recommendations', async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch (err) {
    // Fallback if empty or invalid JSON
  }
  const { mood, feelingText, vibe, exclude = [] } = body || {};
  const GEMINI_API_KEY = c.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_key_here') {
    return c.json({ error: 'Gemini API Key is not configured on the server.' }, 500);
  }

  const moodKey = typeof mood === 'string' ? mood.trim() : '';
  const vibeKey = typeof vibe === 'string' ? vibe.trim() : '';
  const requestExclude = Array.isArray(exclude)
    ? exclude.filter((title) => typeof title === 'string' && title.trim())
    : [];
  let recentExcludes = [];

  try {
    const pool = getPool(c.env);
    const result = await pool.query(
      `SELECT title
       FROM (
         SELECT DISTINCT ON (LOWER(title)) title, created_at
         FROM recent_recommendations
         WHERE mood = $1 AND vibe = $2
         ORDER BY LOWER(title), created_at DESC
       ) recent_titles
       ORDER BY created_at DESC
       LIMIT 40`,
      [moodKey, vibeKey]
    );
    recentExcludes = result.rows.map((row) => row.title).filter(Boolean);
  } catch (error) {
    console.error('Backend: Error fetching recent recommendation exclusions:', error);
  }

  // Random flavor nudges so repeated calls don't converge on the same "safe" picks
  const eras = ['1970s-80s', '1990s', '2000s', '2010s', 'the last 3 years'];
  const flavors = ['a hidden gem', 'a cult favorite', 'a critically acclaimed but under-the-radar pick', 'an emotionally resonant festival darling'];
  const randomEra = eras[Math.floor(Math.random() * eras.length)];
  const randomFlavor = flavors[Math.floor(Math.random() * flavors.length)];
  const seed = crypto.randomUUID();

  const recentExcludeClause = recentExcludes.length
    ? `\nHard exclusion list for this mood + vibe combo: ${JSON.stringify(recentExcludes)}`
    : '';
  const requestExcludeClause = requestExclude.length
    ? `\nAlso do NOT recommend any of these titles already shown in this user flow: ${JSON.stringify(requestExclude)}`
    : '';

  const prompt = `
    You are a premium film curator AI named "Feelm" with an A24 & Letterboxd sensibility.
    [session:${seed}]
    Randomization seed: ${seed}
    Era nudge: ${randomEra}
    Based on the following request:
    Selected Mood Category: ${moodKey || 'None specified'}
    Tune Vibe Filter: ${vibeKey || 'None specified'}
    User's feeling description: "${feelingText || 'None specified'}"

    Please recommend 10 candidate movies that match this vibe.
    Lean toward ${randomFlavor}, and include at least one film from ${randomEra}.

    CRITICAL RULES:
    1. STRICTLY AVOID repeating surface-level default AI picks (such as Amélie, Inception, Interstellar, The Grand Budapest Hotel, Parasite, Fight Club, or Shawshank Redemption) unless specifically requested.
    2. This prompt runs thousands of times, so do not cluster around your top 2-3 go-to answers for this mood/vibe. Push beyond the obvious safe recommendations.
    3. Deliver a genuinely unexpected, deeply matching set of films balancing eras and world cinema (including non-Hollywood picks like Nollywood, Asian, French, European).
    4. You must not include titles from the hard exclusion list because they were already shown recently to users with this same mood + vibe.${recentExcludeClause}${requestExcludeClause}

    You MUST respond with a valid JSON array of objects containing ONLY the "title" of the movie.
    Example format:
    [
      { "title": "Aftersun" },
      { "title": "In the Mood for Love" }
    ]

    Do not wrap your output in markdown code blocks. Return raw JSON only.
  `;

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

    try {
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 1.0,
            topP: 0.97,
          },
        }),
      });

      if (response.status === 404) continue;
      if (!response.ok) throw new Error(`Gemini API failed with status: ${response.status}`);

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('Empty response from Gemini API.');

      const recommendations = JSON.parse(text.trim());
      if (Array.isArray(recommendations)) {
        for (let i = recommendations.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [recommendations[i], recommendations[j]] = [recommendations[j], recommendations[i]];
        }

        const finalRecommendations = recommendations.slice(0, 6);
        const finalTitles = finalRecommendations
          .map((movie) => movie?.title)
          .filter((title) => typeof title === 'string' && title.trim());

        if (finalTitles.length) {
          try {
            const pool = getPool(c.env);
            await pool.query(
              `INSERT INTO recent_recommendations (mood, vibe, title)
               SELECT $1, $2, unnest($3::text[])`,
              [moodKey, vibeKey, finalTitles]
            );
            await pool.query("DELETE FROM recent_recommendations WHERE created_at < NOW() - INTERVAL '2 hours'");
          } catch (error) {
            console.error('Backend: Error recording recent recommendations:', error);
          }
        }

        return c.json(finalRecommendations);
      }
      throw new Error('Gemini did not return an array.');
    } catch (error) {
      console.error(`Backend: Error with model ${model}:`, error);
      lastError = error;
    }
  }

  return c.json({ error: lastError?.message || 'All Gemini model fallbacks failed.' }, 500);
});

/**
 * POST /search
 * Searches TMDB for a movie by title.
 */
router.post('/search', async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const { title } = body || {};
  const TMDB_API_KEY = c.env?.TMDB_API_KEY || process.env.TMDB_API_KEY;

  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_key_here') {
    return c.json({ error: 'TMDB API Key is not configured on the server.' }, 500);
  }

  if (!title) {
    return c.json({ error: 'Title is required' }, 400);
  }

  try {
    const apiURL = `https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&language=en-US&page=1`;
    const response = await fetch(apiURL);
    if (!response.ok) {
      throw new Error(`TMDB search failed with status: ${response.status}`);
    }
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return c.json(data.results[0]);
    }
    return c.json(null);
  } catch (error) {
    console.error(`Backend: Error searching movie "${title}" on TMDB:`, error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * GET /details/:id
 * Fetches movie details, credits, and videos for a specific movie ID.
 */
router.get('/details/:id', async (c) => {
  const id = c.req.param('id');
  const TMDB_API_KEY = c.env?.TMDB_API_KEY || process.env.TMDB_API_KEY;

  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_key_here') {
    return c.json({ error: 'TMDB API Key is not configured on the server.' }, 500);
  }

  try {
    const apiURL = `https://api.themoviedb.org/3/movie/${id}?api_key=${TMDB_API_KEY}&append_to_response=videos,credits&language=en-US`;
    const response = await fetch(apiURL);
    if (!response.ok) {
      throw new Error(`TMDB details fetch failed with status: ${response.status}`);
    }
    const movie = await response.json();

    const director = movie.credits?.crew?.find(
      (member) => member.job === 'Director'
    )?.name || 'Unknown Director';

    const trailer = movie.videos?.results?.find(
      (video) => video.site === 'YouTube' && video.type === 'Trailer'
    );

    const formatted = {
      id: movie.id,
      title: movie.title,
      year: movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A',
      rating: movie.vote_average ? Number(movie.vote_average.toFixed(1)) : 'N/A',
      genres: movie.genres ? movie.genres.map((g) => g.name).join(', ') : 'Drama',
      poster: getPosterUrl(movie.poster_path),
      backdrop: getBackdropUrl(movie.backdrop_path),
      overview: movie.overview || 'No overview available.',
      director,
      runtime: movie.runtime ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m` : 'N/A',
      tagline: movie.tagline || '',
      trailerUrl: trailer ? `https://www.youtube.com/embed/${trailer.key}` : null,
      cast: movie.credits?.cast?.slice(0, 5).map((c) => c.name) || [],
    };

    return c.json(formatted);
  } catch (error) {
    console.error(`Backend: Error fetching movie details for ID ${id}:`, error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /blurb
 * Generates custom AI vibe match blurb.
 */
router.post('/blurb', async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch (err) {
    return c.json({ error: 'Invalid JSON body' }, 400);
  }
  const { movie, mood, feeling } = body || {};
  const GEMINI_API_KEY = c.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_key_here') {
    return c.json({ error: 'Gemini API Key is not configured on the server.' }, 500);
  }

  if (!movie || !movie.title) {
    return c.json({ error: 'Movie is required' }, 400);
  }

  const prompt = `
    You are a premium film critic and recommendation AI named "Feelm" (A24 meets Letterboxd aesthetic).
    Write a warm, empathetic 1-2 sentence vibe match explanation explaining why the film "${movie.title}" (${movie.year || ''}) fits a user who is:
    Mood: ${mood || 'None specified'}
    Feeling Description: "${feeling || 'None specified'}"
    
    Here is the film's overview for reference: "${movie.overview}"
    
    Guidelines:
    - Focus on the vibe, theme, or mood matching.
    - Speak directly to the user (e.g. "This film's cozy atmosphere will help you unwind...").
    - Do not mention "Gemini", "AI", or "TMDB".
    - Keep it short (max 2 sentences, under 30 words).
    - Return ONLY the raw blurb text. Do not wrap in markdown or quotes.
  `;

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
      const response = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.6,
          },
        }),
      });

      if (response.status === 404) {
        continue;
      }

      if (!response.ok) {
        throw new Error(`Status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        return c.json({ blurb: text.trim() });
      }
    } catch (error) {
      console.error(`Backend: Error with model ${model} in generateMovieBlurb:`, error);
      lastError = error;
    }
  }

  return c.json({ error: lastError?.message || 'All models failed to generate blurb.' }, 500);
});

export default router;
