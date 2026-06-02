const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

export const isGeminiConfigured = () => {
  return (
    GROQ_API_KEY &&
    GROQ_API_KEY !== 'your_groq_key_here' &&
    GROQ_API_KEY.trim() !== ''
  );
};

/**
 * Gets movie recommendations (list of titles) from Groq based on the user's mood and feeling text.
 * @param {string} mood - Selected mood label (e.g., Happy, Sad, Stressed)
 * @param {string} feelingText - Freeform user input describing how they feel
 * @returns {Promise<Array<{title: string}>>}
 */
export async function getRecommendationsFromGemini(mood, feelingText) {
  if (!isGeminiConfigured()) {
    throw new Error('Groq API Key is not configured.');
  }

  const prompt = `
    You are a premium film curator AI named "Feelm".
    Based on the following request:
    Selected Mood Category: ${mood || 'None specified'}
    User's feeling description: "${feelingText || 'None specified'}"
    
    Please recommend 5 to 7 movies that match this vibe.
    
    You MUST respond with a valid JSON array of objects containing ONLY the "title" of the movie.
    Example format:
    [
      {
        "title": "Interstellar"
      },
      {
        "title": "The Grand Budapest Hotel"
      }
    ]
    
    Do not wrap your output in markdown code blocks. Return raw JSON only.
  `;

  const apiURL = 'https://api.groq.com/openai/v1/chat/completions';
  
  const response = await fetch(apiURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    throw new Error(`Groq API failed with status: ${response.status}`);
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
      model: 'llama3-8b-8192',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6
    })
  });

  if (!response.ok) {
    throw new Error(`Status: ${response.status}`);
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
