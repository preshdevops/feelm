const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';

export const isGeminiConfigured = () => {
  return (
    GROQ_API_KEY &&
    GROQ_API_KEY !== 'your_groq_key_here' &&
    GROQ_API_KEY.trim() !== ''
  );
};

async function callGroq(prompt, temperature = 0.8) {
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

// Maps raw param values to human-readable strings for the prompt
function describeContext(energy, watching, intent) {
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
  return parts.join('\n');
}

export async function getRecommendationsFromGemini(
  mood, feelingText, type = 'movie',
  energy = null, watching = null, intent = null
) {
  if (!isGeminiConfigured()) throw new Error('Groq API key not configured.');

  const context = describeContext(energy, watching, intent);

  const typeInstruction =
    type === 'series' ? 'Recommend TV series only — no films.' :
    type === 'both'   ? 'Mix films and TV series. For series, add "type": "series" to the object.' :
                        'Recommend films only — no TV series.';

  const prompt = `You are Feelm — a deeply human film curator who understands that what someone needs to watch right now is rarely about genre alone. It's about where they are emotionally.

A user needs a recommendation RIGHT NOW. Read their full situation carefully:

Mood: ${mood || 'not specified'}
${feelingText ? `In their own words: "${feelingText}"` : ''}
${context ? `\n${context}` : ''}

${typeInstruction}

Your job: recommend 6 titles that genuinely fit THIS person in THIS moment — not just the mood label. Think about pacing, emotional register, what the film asks of its audience, and whether that matches their energy and intent right now.

Rules:
- At least 2 non-Hollywood picks (Nollywood, Korean, French, Japanese, Nigerian, etc.)
- Vary the eras — don't stack everything from the last 5 years
- If energy is low, avoid films that demand intense concentration or are emotionally exhausting
- If intent is "escape", lean toward propulsive narratives and worlds worth getting lost in
- If intent is "relate", lean toward intimate character studies and emotionally honest stories
- If watching with a partner or group, avoid films that are too slow or solitary in feeling

Return ONLY a raw JSON array. No markdown. No explanation. No code blocks.
Each object has only a "title" key (and optionally "type": "series" if it's a TV series).

Example: [{"title":"Parasite"},{"title":"The Secret Life of Walter Mitty"},{"title":"Living in Bondage: Breaking Free"}]`;

  const text = await callGroq(prompt, 0.85);

  // Strip any accidental markdown fences
  const clean = text.replace(/```json|```/g, '').trim();
  const recommendations = JSON.parse(clean);

  if (!Array.isArray(recommendations)) throw new Error('Groq did not return an array.');
  return recommendations;
}

export async function generateMovieBlurb(movie, mood, feeling, energy = null, watching = null, intent = null) {
  const movieId = movie.id || movie.movie_id;
  const cacheKey = `feelm_blurb_${movieId}_${mood || ''}_${energy || ''}_${intent || ''}`;

  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) return cached;
  } catch (e) {
    // localStorage unavailable, continue
  }

  if (!isGeminiConfigured()) throw new Error('Groq API key not configured.');

  const context = describeContext(energy, watching, intent);

  const prompt = `You are writing a personal recommendation note for someone about to watch "${movie.title}" (${movie.year || ''}).

Their situation right now:
Mood: ${mood || 'not specified'}
${feeling ? `How they described it: "${feeling}"` : ''}
${context || ''}

Film overview: "${movie.overview}"

Write 1–2 sentences that speak directly to WHY this film fits them right now — not what the film is about, but what it will give them given where they are emotionally. Be specific to their situation. Sound like a friend who knows both them and cinema well, not a critic or an algorithm.

Keep it under 35 words. Return only the text — no quotes, no labels, no explanation.`;

  const blurb = await callGroq(prompt, 0.75);

  try {
    localStorage.setItem(cacheKey, blurb);
  } catch (e) {
    // localStorage unavailable
  }

  return blurb;
}
