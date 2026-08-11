const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const isGeminiConfigured = () => Boolean(API_BASE);

function describeContext(energy, watching, intent, obscurity, pacing, tone, worldCinema) {
  const energyMap = {
    low: 'running on empty - exhausted, low energy',
    mid: 'somewhere in between - not tired but not buzzing',
    high: 'fully charged - alert and ready for something engaging',
  };
  const watchingMap = {
    alone: 'watching alone',
    partner: 'watching with someone special',
    group: 'watching with a group',
  };
  const intentMap = {
    escape: 'wants to be transported somewhere completely different - pure escapism',
    relate: 'wants to feel understood, to see their experience reflected on screen',
    laugh: 'just wants to laugh and not think too hard',
    unsure: 'not sure what they need yet - open to anything that resonates',
  };

  const parts = [];
  if (energy && energyMap[energy]) parts.push(`Energy: ${energyMap[energy]}`);
  if (watching && watchingMap[watching]) parts.push(`Context: ${watchingMap[watching]}`);
  if (intent && intentMap[intent]) parts.push(`What they need: ${intentMap[intent]}`);

  if (obscurity === 'hidden_gems') parts.push('Preference: Deep cuts, indie gems, and hidden treasures.');
  if (obscurity === 'mainstream') parts.push('Preference: Widely acclaimed classics and well-known cinematic masterpieces.');
  if (pacing === 'slow') parts.push('Pacing Preference: Meditative, slow-burn, room to breathe.');
  if (pacing === 'brisk') parts.push('Pacing Preference: Tight, propulsive narrative pace.');
  if (tone === 'cozy') parts.push('Tone Preference: Warm, atmospheric, comforting texture.');
  if (tone === 'dark') parts.push('Tone Preference: Gritty, tense, noir, or psychologically intriguing.');
  if (tone === 'mind-bending') parts.push('Tone Preference: Surreal, existential, thought-provoking, visually unique.');
  if (worldCinema === 'focus') parts.push('Cultural Focus: Strongly emphasize international/non-Hollywood cinema.');

  return parts.join('\n');
}

function describeVibeTuning(vibeTuning = {}) {
  const labels = {
    hidden_gems: 'Hidden Gems',
    mainstream: 'Classics',
    slow: 'Slow Burn',
    brisk: 'Brisk Pace',
    cozy: 'Cozy & Warm',
    dark: 'Dark Noir',
    'mind-bending': 'Mind-Bending',
    focus: 'World Cinema',
  };

  return ['obscurity', 'pacing', 'tone', 'worldCinema']
    .map((key) => vibeTuning[key])
    .filter((value) => value && value !== 'all')
    .map((value) => labels[value] || value)
    .join(' + ');
}

export async function getRecommendationsFromGemini(
  mood,
  feelingText,
  type = 'movie',
  energy = null,
  watching = null,
  intent = null,
  vibeTuning = {},
  watchlistTitles = []
) {
  if (!isGeminiConfigured()) throw new Error('Recommendation API is not configured.');

  const {
    obscurity = 'all',
    pacing = 'all',
    tone = 'all',
    worldCinema = 'all',
  } = vibeTuning;

  const context = describeContext(energy, watching, intent, obscurity, pacing, tone, worldCinema);
  const vibe = describeVibeTuning(vibeTuning);
  const typeInstruction =
    type === 'series' ? 'Requested format: TV series only, no films.' :
    type === 'both' ? 'Requested format: mix films and TV series.' :
    'Requested format: films only, no TV series.';

  const response = await fetch(`${API_BASE}/movies/recommendations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mood,
      vibe,
      feelingText: [
        feelingText || '',
        typeInstruction,
        context,
      ].filter(Boolean).join('\n\n'),
      exclude: watchlistTitles,
    }),
  });

  const recommendations = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(recommendations?.error || `Recommendation API failed with status: ${response.status}`);
  }

  if (!Array.isArray(recommendations)) throw new Error('Recommendation API did not return an array.');
  return recommendations;
}

export async function generateMovieBlurb(
  movie,
  mood,
  feeling,
  energy = null,
  watching = null,
  intent = null,
  vibeTuning = {}
) {
  const movieId = movie.id || movie.movie_id;
  const cacheKey = `feelm_blurb_${movieId}_${mood || ''}_${vibeTuning.obscurity || ''}_${vibeTuning.tone || ''}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch {
    // localStorage fallback
  }

  if (!isGeminiConfigured()) throw new Error('Recommendation API is not configured.');

  const context = describeContext(
    energy,
    watching,
    intent,
    vibeTuning.obscurity,
    vibeTuning.pacing,
    vibeTuning.tone,
    vibeTuning.worldCinema
  );

  const response = await fetch(`${API_BASE}/movies/blurb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      movie,
      mood,
      feeling: [feeling || '', context].filter(Boolean).join('\n\n'),
    }),
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Blurb API failed with status: ${response.status}`);
  }

  const blurb = data?.blurb;
  if (!blurb) throw new Error('Blurb API returned an empty response.');

  try {
    localStorage.setItem(cacheKey, blurb);
  } catch {
    // localStorage read/write error handling
  }

  return blurb;
}
