import { Hono } from 'hono';
import { getPool } from '../db/pool.js';

const router = new Hono();

const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

async function ensureRecentRecommendationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS recent_recommendations (
      mood TEXT NOT NULL,
      vibe TEXT NOT NULL,
      title TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS recent_recommendations_mood_vibe_created_at_idx
      ON recent_recommendations (mood, vibe, created_at DESC)
  `);
}

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
 * Helper to build TMDB /discover/movie query URL from structured filters.
 */
function buildTmdbDiscoverUrl(filters, apiKey, page = 1) {
  const baseUrl = 'https://api.themoviedb.org/3/discover/movie';
  const params = new URLSearchParams();

  params.append('api_key', apiKey);
  params.append('language', 'en-US');
  params.append('page', page.toString());
  params.append('include_adult', 'false');
  params.append('include_video', 'false');

  if (filters.genre_ids && Array.isArray(filters.genre_ids) && filters.genre_ids.length > 0) {
    params.append('with_genres', filters.genre_ids.join(','));
  }

  if (filters.excluded_genre_ids && Array.isArray(filters.excluded_genre_ids) && filters.excluded_genre_ids.length > 0) {
    params.append('without_genres', filters.excluded_genre_ids.join(','));
  }

  const minVote = typeof filters.min_vote_average === 'number' ? filters.min_vote_average : 6.0;
  const minCount = typeof filters.min_vote_count === 'number' ? filters.min_vote_count : 100;
  params.append('vote_average.gte', minVote.toFixed(1));
  params.append('vote_count.gte', minCount.toString());

  if (filters.release_year_range?.gte) {
    params.append('primary_release_date.gte', `${filters.release_year_range.gte}-01-01`);
  }
  if (filters.release_year_range?.lte) {
    params.append('primary_release_date.lte', `${filters.release_year_range.lte}-12-31`);
  }

  if (filters.runtime_preference?.gte) {
    params.append('with_runtime.gte', filters.runtime_preference.gte.toString());
  }
  if (filters.runtime_preference?.lte) {
    params.append('with_runtime.lte', filters.runtime_preference.lte.toString());
  }

  params.append('sort_by', filters.sort_by || 'popularity.desc');

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Ranks candidates from TMDB using a weighted scoring algorithm.
 */
function rankCandidates(candidates, filters, obscurityPreference = 'all') {
  if (!candidates || !candidates.length) return [];

  const maxPopularity = Math.max(...candidates.map((c) => c.popularity || 1), 1);
  const targetKeywords = (filters.keyword_themes || []).map((k) => String(k).toLowerCase());

  let wRating = 0.40;
  let wSimilarity = 0.40;
  let wPopularity = 0.20;

  if (obscurityPreference === 'hidden_gems') {
    wRating = 0.55;
    wSimilarity = 0.35;
    wPopularity = 0.10;
  } else if (obscurityPreference === 'mainstream') {
    wRating = 0.30;
    wSimilarity = 0.30;
    wPopularity = 0.40;
  }

  return candidates
    .map((movie) => {
      const voteAvg = movie.vote_average || 0;
      const normRating = Math.min(Math.max((voteAvg - 5.0) / 5.0, 0), 1);
      const normPopularity = Math.log(1 + (movie.popularity || 0)) / Math.log(1 + maxPopularity);

      const overviewText = (movie.overview || '').toLowerCase();
      const titleText = (movie.title || '').toLowerCase();
      let keywordHits = 0;

      targetKeywords.forEach((kw) => {
        if (overviewText.includes(kw) || titleText.includes(kw)) {
          keywordHits += 1;
        }
      });

      const normSimilarity = targetKeywords.length > 0
        ? Math.min(keywordHits / Math.min(targetKeywords.length, 3), 1.0)
        : 0.5;

      let obscurityJitter = 0;
      if (obscurityPreference === 'hidden_gems' && (movie.popularity || 0) > 150) {
        obscurityJitter = -0.25;
      }

      const randomJitter = (Math.random() - 0.5) * 0.05;
      const finalScore =
        (wSimilarity * normSimilarity) +
        (wRating * normRating) +
        (wPopularity * normPopularity) +
        obscurityJitter +
        randomJitter;

      return {
        ...movie,
        score: finalScore,
        matchScore: Math.round(finalScore * 100),
      };
    })
    .sort((a, b) => b.score - a.score);
}

/**
 * POST /recommendations
 * 1. User mood input -> Gemini classifies into structured JSON parameters (NO titles generated).
 * 2. Query TMDB /discover/movie with parameters to fetch candidate pool.
 * 3. Rank candidates by weighted score & apply Postgres exclusion list.
 * 4. Return top N TMDB candidates to user.
 */
router.post('/recommendations', async (c) => {
  let body = {};
  try {
    body = await c.req.json();
  } catch (err) {
    // Fallback if empty or invalid JSON
  }

  const { mood, feelingText, vibe, obscurity = 'all', exclude = [] } = body || {};
  const GEMINI_API_KEY = c.env?.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const TMDB_API_KEY = c.env?.TMDB_API_KEY || process.env.TMDB_API_KEY;

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_key_here') {
    return c.json({ error: 'Gemini API Key is not configured on the server.' }, 500);
  }
  if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_key_here') {
    return c.json({ error: 'TMDB API Key is not configured on the server.' }, 500);
  }

  const moodKey = typeof mood === 'string' ? mood.trim() : '';
  const vibeKey = typeof vibe === 'string' ? vibe.trim() : '';
  const requestExclude = Array.isArray(exclude)
    ? exclude.filter((title) => typeof title === 'string' && title.trim())
    : [];

  // 1. Fetch Shared Exclusion List from Hyperdrive Postgres
  const recentExcludes = new Set();
  try {
    const pool = getPool(c.env);
    await ensureRecentRecommendationsTable(pool);
    const result = await pool.query(
      `SELECT title
       FROM (
         SELECT DISTINCT ON (LOWER(title)) title, created_at
         FROM recent_recommendations
         WHERE mood = $1 AND vibe = $2
         ORDER BY LOWER(title), created_at DESC
       ) recent_titles
       ORDER BY created_at DESC
       LIMIT 50`,
      [moodKey, vibeKey]
    );
    result.rows.forEach((row) => {
      if (row.title) recentExcludes.add(row.title.toLowerCase().trim());
    });
  } catch (error) {
    console.error('Backend: Error fetching recent recommendation exclusions:', error);
  }

  requestExclude.forEach((title) => {
    recentExcludes.add(title.toLowerCase().trim());
  });

  // Random flavor nudges so repeated calls don't produce static filter sets
  const eras = ['1970s-80s', '1990s', '2000s', '2010s', 'the last 3 years'];
  const flavors = ['a hidden gem', 'a cult favorite', 'a critically acclaimed under-the-radar pick', 'an emotionally resonant indie darling'];
  const randomEra = eras[Math.floor(Math.random() * eras.length)];
  const randomFlavor = flavors[Math.floor(Math.random() * flavors.length)];
  const seed = crypto.randomUUID();

  const validTmdbGenres = `
  28: Action, 12: Adventure, 16: Animation, 35: Comedy, 80: Crime,
  99: Documentary, 18: Drama, 10751: Family, 14: Fantasy, 36: History,
  27: Horror, 10402: Music, 9648: Mystery, 10749: Romance, 878: Sci-Fi,
  10770: TV Movie, 53: Thriller, 10752: War, 37: Western
  `;

  const prompt = `
    You are an expert film curator and database query translator for "Feelm".
    Your task: Convert the user's emotional state, vibe selections, and text description into structured TMDB query parameters.
    Session ID: ${seed}
    Era Nudge: ${randomEra}
    Flavor Nudge: ${randomFlavor}

    Input Request:
    - Selected Mood Category: ${moodKey || 'None specified'}
    - Tune Vibe Filter: ${vibeKey || 'None specified'}
    - User's feeling description: "${feelingText || 'None specified'}"

    Available TMDB Genre Mapping:
    ${validTmdbGenres}

    CRITICAL RULES:
    1. DO NOT generate movie titles, actor names, or director names.
    2. Choose 1 to 3 TMDB genre IDs that best match the vibe.
    3. Generate 4 to 8 thematic keywords in 'keyword_themes' (e.g. "isolation", "neon-lit", "melancholy", "coming-of-age").
    4. Set 'min_vote_average' between 5.5 and 7.5 based on how niche/experimental the mood is.
    5. Return raw JSON matching the JSON schema.
  `;

  const responseSchema = {
    type: 'OBJECT',
    properties: {
      genre_ids: {
        type: 'ARRAY',
        items: { type: 'INTEGER' },
        description: 'TMDB numeric genre IDs matching the user vibe',
      },
      excluded_genre_ids: {
        type: 'ARRAY',
        items: { type: 'INTEGER' },
      },
      keyword_themes: {
        type: 'ARRAY',
        items: { type: 'STRING' },
        description: 'Atmospheric and thematic keywords for candidate scoring',
      },
      tone: {
        type: 'STRING',
        enum: ['cozy', 'dark', 'mind-bending', 'melancholic', 'lighthearted', 'tense', 'balanced'],
      },
      pacing: {
        type: 'STRING',
        enum: ['slow', 'brisk', 'moderate'],
      },
      min_vote_average: { type: 'NUMBER' },
      min_vote_count: { type: 'INTEGER' },
      release_year_range: {
        type: 'OBJECT',
        properties: {
          gte: { type: 'INTEGER' },
          lte: { type: 'INTEGER' },
        },
      },
      runtime_preference: {
        type: 'OBJECT',
        properties: {
          gte: { type: 'INTEGER' },
          lte: { type: 'INTEGER' },
        },
      },
      sort_by: {
        type: 'STRING',
        enum: ['popularity.desc', 'vote_average.desc', 'primary_release_date.desc'],
      },
      confidence: { type: 'NUMBER' },
    },
    required: ['genre_ids', 'keyword_themes', 'min_vote_average', 'min_vote_count', 'sort_by'],
  };

  let filters = null;
  let lastError = null;

  // 2. Call Gemini to classify mood into structured JSON filters
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
            responseSchema: responseSchema,
            temperature: 0.7,
          },
        }),
      });

      if (response.status === 404) continue;
      if (!response.ok) throw new Error(`Gemini API failed with status: ${response.status}`);

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error('Empty response from Gemini API.');

      filters = JSON.parse(rawText.trim());
      if (filters && Array.isArray(filters.genre_ids)) {
        break;
      }
    } catch (error) {
      console.error(`Backend: Error classifying mood with model ${model}:`, error);
      lastError = error;
    }
  }

  // Fallback filters if Gemini call fails
  if (!filters || !Array.isArray(filters.genre_ids)) {
    filters = {
      genre_ids: [18], // Drama fallback
      keyword_themes: ['atmospheric', 'character study'],
      min_vote_average: 6.0,
      min_vote_count: 50,
      sort_by: 'popularity.desc',
    };
  }

  // 3. Harvest TMDB Candidates via /discover/movie (Pages 1 & 2)
  const candidatePool = [];
  const pagesToFetch = [1, 2];

  await Promise.all(
    pagesToFetch.map(async (page) => {
      try {
        const discoverUrl = buildTmdbDiscoverUrl(filters, TMDB_API_KEY, page);
        const res = await fetch(discoverUrl);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.results)) {
            candidatePool.push(...data.results);
          }
        }
      } catch (err) {
        console.error(`Backend: TMDB Discover page ${page} fetch error:`, err);
      }
    })
  );

  if (candidatePool.length === 0) {
    // Retry with broader discovery if page harvest returned zero
    try {
      const fallbackUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&vote_count.gte=100&page=1`;
      const res = await fetch(fallbackUrl);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.results)) {
          candidatePool.push(...data.results);
        }
      }
    } catch (err) {
      console.error('Backend: TMDB Fallback discover error:', err);
    }
  }

  // 4. Apply Exclusion List & Rank Candidates
  const nonExcludedCandidates = candidatePool.filter(
    (movie) => movie.title && !recentExcludes.has(movie.title.toLowerCase().trim())
  );

  const poolToRank = nonExcludedCandidates.length >= 6 ? nonExcludedCandidates : candidatePool;
  const rankedCandidates = rankCandidates(poolToRank, filters, obscurity);
  const finalRecommendations = rankedCandidates.slice(0, 6);

  // 5. Record final recommendations in Postgres recent_recommendations table
  const finalTitles = finalRecommendations
    .map((m) => m.title)
    .filter((t) => typeof t === 'string' && t.trim());

  if (finalTitles.length) {
    try {
      const pool = getPool(c.env);
      await ensureRecentRecommendationsTable(pool);
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
