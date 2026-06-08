const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const isGeminiConfigured = () => {
  return (
    GROQ_API_KEY &&
    GROQ_API_KEY !== 'your_groq_key_here' &&
    GROQ_API_KEY.trim() !== ''
  );
};

export async function getRecommendationsFromGemini(mood, feelingText, type = 'movie', energy = null, watching = null, intent = null) {
  if (!isGeminiConfigured()) {
    throw new Error('Groq API Key is not configured.');
  }

  // Reference type parameter to satisfy linter (type filters are applied during TMDB search phase)
  if (type) {
    // type is movie/series/both
  }

  const prompt = `You are Feelm, a world-class film curator with deep 
knowledge of global cinema including Hollywood, Nollywood, and 
international films.

A user needs a film recommendation right now.
Mood: ${mood || 'not specified'}
How they're feeling: "${feelingText || 'not specified'}"
Energy level: ${energy || 'not specified'}  
Watching: ${watching || 'not specified'}
What they need: ${intent || 'not specified'}

Based on ALL of this context, return ONLY a raw JSON array of 6 
movie objects. No markdown, no explanation, no code blocks.
Each object must have only a "title" key.
Vary your picks — mix genres, eras, and origins. 
Include at least one non-Hollywood film.
Match the energy level: low energy = calm/slow-burn films, 
high energy = fast-paced/exciting films.
Match the intent: escape = fantasy/adventure/comedy, 
relate = drama/slice-of-life, laugh = comedy only.

Example:
[{"title":"Parasite"},{"title":"Living in Bondage"}]`;

  const apiURL = 'https://api.groq.com/openai/v1/chat/completions';
  
  const response = await fetch(apiURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Groq API failed with status: ${response.status}. Details: ${errText}`);
  }


  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  
  if (!text) {
    throw new Error('Empty response from Groq API.');
  }

  const recommendations = JSON.parse(text.trim());
  if (Array.isArray(recommendations)) {
    return recommendations;
  }
  
  throw new Error('Groq did not return an array.');
}

/**
 * Generates a custom 1-2 sentence recommendation reason/blurb for a specific movie based on user mood/feeling.
 * @param {Object} movie - Movie details from TMDB
 * @param {string} mood - Selected mood category
 * @param {string} feeling - Freeform user feeling input
 * @returns {Promise<string>} - The custom blurb text
 */
export async function generateMovieBlurb(movie, mood, feeling) {
  const movieId = movie.id || movie.movie_id;
  const cacheKey = `feelm_blurb_${movieId}`;

  // Check localStorage first
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      return cached;
    }
  } catch (e) {
    console.warn('localStorage read failed in generateMovieBlurb:', e);
  }

  if (!isGeminiConfigured()) {
    throw new Error('Groq API Key is not configured.');
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

  const apiURL = 'https://api.groq.com/openai/v1/chat/completions';
  
  const response = await fetch(apiURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    })
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Groq API failed with status: ${response.status}. Details: ${errText}`);
  }


  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  
  if (text) {
    const blurb = text.trim();
    try {
      localStorage.setItem(cacheKey, blurb);
    } catch (e) {
      console.warn('localStorage write failed in generateMovieBlurb:', e);
    }
    return blurb;
  }

  throw new Error(`Failed to generate blurb for "${movie.title}".`);
}
