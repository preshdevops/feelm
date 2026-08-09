const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';

export const isGeminiConfigured = () => {
  return (
    GROQ_API_KEY &&
    GROQ_API_KEY !== 'your_groq_key_here' &&
    GROQ_API_KEY.trim() !== ''
  );
};

async function callGroq(prompt, temperature = 0.85) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Groq API failed with status: ${response.status}. ${errText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from Groq.');
  return text.trim();
}

function describeContext(energy, watching, intent, obscurity, pacing, tone, worldCinema) {
  const energyMap = {
    low: 'running on empty — exhausted, low energy',
    mid: 'somewhere in between — not tired but not buzzing',
    high: 'fully charged — alert and ready for something engaging'
  };
  const watchingMap = {
    alone: 'watching alone',
    partner: 'watching with someone special',
    group: 'watching with a group'
  };
  const intentMap = {
    escape: 'wants to be transported somewhere completely different — pure escapism',
    relate: 'wants to feel understood, to see their experience reflected on screen',
    laugh: 'just wants to laugh and not think too hard',
    unsure: 'not sure what they need yet — open to anything that resonates'
  };

  const parts = [];
  if (energy && energyMap[energy]) parts.push(`Energy: ${energyMap[energy]}`);
  if (watching && watchingMap[watching]) parts.push(`Context: ${watchingMap[watching]}`);
  if (intent && intentMap[intent]) parts.push(`What they need: ${intentMap[intent]}`);

  // Interactive Vibe Tuning additions
  if (obscurity === 'hidden_gems') parts.push('Preference: Deep cuts, indie gems, and hidden treasures (avoid predictable top-10 list staples).');
  if (obscurity === 'mainstream') parts.push('Preference: Widely acclaimed classics and well-known cinematic masterpieces.');
  if (pacing === 'slow') parts.push('Pacing Preference: Meditative, slow-burn, room to breathe.');
  if (pacing === 'brisk') parts.push('Pacing Preference: Tight, propulsive narrative pace.');
  if (tone === 'cozy') parts.push('Tone Preference: Warm, atmospheric, comforting texture.');
  if (tone === 'dark') parts.push('Tone Preference: Gritty, tense, noir, or psychologically intriguing.');
  if (tone === 'mind-bending') parts.push('Tone Preference: Surreal, existential, thought-provoking, visually unique.');
  if (worldCinema === 'focus') parts.push('Cultural Focus: Strongly emphasize international/non-Hollywood cinema (Nollywood, Asian, European, African, Latin American).');

  return parts.join('\n');
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
  if (!isGeminiConfigured()) throw new Error('Groq API key not configured.');

  const {
    obscurity = 'all',
    pacing = 'all',
    tone = 'all',
    worldCinema = 'all'
  } = vibeTuning;

  const context = describeContext(energy, watching, intent, obscurity, pacing, tone, worldCinema);

  const typeInstruction =
    type === 'series' ? 'Recommend TV series only — no films.' :
    type === 'both'   ? 'Mix films and TV series. For series, add "type": "series" to the object.' :
                        'Recommend films only — no TV series.';

  const watchlistContext = watchlistTitles && watchlistTitles.length > 0
    ? `User's saved taste anchors: [${watchlistTitles.slice(0, 5).join(', ')}]. Use these as subtle aesthetic indicators without repeating them.`
    : '';

  const prompt = `You are Feelm — an exceptionally discerning, deeply human film curator with an A24 & Letterboxd sensibility. You understand cinema as texture, rhythm, color, and emotional atmosphere—not just plot tags.

A user needs a curated recommendation list right now. Read their full emotional landscape:

Mood Category: ${mood || 'not specified'}
${feelingText ? `In their own words: "${feelingText}"` : ''}
${context ? `\n${context}` : ''}
${watchlistContext ? `\n${watchlistContext}` : ''}

${typeInstruction}

CRITICAL ANTI-CLICHÉ RULES:
1. STRICTLY AVOID repeating surface-level default AI picks (such as Amelie, Inception, Interstellar, The Grand Budapest Hotel, Parasite, Fight Club, or Shawshank Redemption) unless specifically requested.
2. Deliver a genuinely unexpected, deeply matching set of 6 titles.
3. Balance across eras (don't make every pick from 2020–2024). Include at least 2 non-Hollywood films (Nollywood, Japanese, Korean, French, Nigerian, Nordic, etc.).
4. Focus on tone, visual style, pacing, and emotional resonance.

Return ONLY a raw JSON array. No markdown code blocks. No explanations.
Each object has only a "title" key (and optionally "type": "series" if it's a TV series).

Example: [{"title":"Aftersun"},{"title":"In the Mood for Love"},{"title":"Perfect Days"}]`;

  const text = await callGroq(prompt, 0.88);

  const clean = text.replace(/```json|```/g, '').trim();
  const recommendations = JSON.parse(clean);

  if (!Array.isArray(recommendations)) throw new Error('Groq did not return an array.');
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
  } catch (e) {
    // localStorage fallback
  }

  if (!isGeminiConfigured()) throw new Error('Groq API key not configured.');

  const context = describeContext(energy, watching, intent, vibeTuning.obscurity, vibeTuning.pacing, vibeTuning.tone, vibeTuning.worldCinema);

  const prompt = `You are an atmospheric film curator for Feelm writing a personal 1-2 sentence recommendation note for "${movie.title}" (${movie.year || ''}).

User state:
Mood: ${mood || 'not specified'}
${feeling ? `Description: "${feeling}"` : ''}
${context ? `Context:\n${context}` : ''}

Film overview: "${movie.overview}"

Write 1–2 sentences explaining WHY this film's aesthetic, rhythm, or mood fits their exact state right now. Speak directly to atmosphere, texture, or visual/audio feeling rather than re-summarizing the plot. Sound like an articulate friend who knows cinema intimately.

Rules:
- Max 32 words.
- Do NOT say "This film..." or "Amélie...".
- Return ONLY raw text — no quotes, no labels.`;

  const blurb = await callGroq(prompt, 0.75);

  try {
    localStorage.setItem(cacheKey, blurb);
  } catch (e) {
    // localStorage read/write error handling
  }

  return blurb;
}
