const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// List of Gemini models to try in sequence to handle 404 (model availability) errors
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

export const isGeminiConfigured = () => {
  return (
    GEMINI_API_KEY &&
    GEMINI_API_KEY !== 'your_gemini_key_here' &&
    GEMINI_API_KEY.trim() !== ''
  );
};

/**
 * Gets movie recommendations (list of titles) from Gemini based on the user's mood and feeling text.
 * @param {string} mood - Selected mood label (e.g., Happy, Sad, Stressed)
 * @param {string} feelingText - Freeform user input describing how they feel
 * @returns {Promise<Array<{title: string}>>}
 */
export async function getRecommendationsFromGemini(mood, feelingText) {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API Key is not configured.');
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

  let lastError = null;

  for (const model of GEMINI_MODELS) {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
      console.log(`Attempting list query using model: ${model}`);
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
            temperature: 0.7,
          },
        }),
      });

      if (response.status === 404) {
        console.warn(`Model ${model} returned 404. Trying fallback...`);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Gemini API failed with status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Empty response from Gemini API.');
      }

      const recommendations = JSON.parse(text.trim());
      if (Array.isArray(recommendations)) {
        return recommendations;
      }
      
      throw new Error('Gemini did not return an array.');
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      lastError = error;
    }
  }

  throw lastError || new Error('All Gemini model fallbacks failed.');
}

/**
 * Generates a custom 1-2 sentence recommendation reason/blurb for a specific movie based on user mood/feeling.
 * @param {Object} movie - Movie details from TMDB
 * @param {string} mood - Selected mood category
 * @param {string} feeling - Freeform user feeling input
 * @returns {Promise<string>} - The custom blurb text
 */
export async function generateMovieBlurb(movie, mood, feeling) {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API Key is not configured.');
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

  for (const model of GEMINI_MODELS) {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
      console.log(`Attempting blurb query for "${movie.title}" using model: ${model}`);
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
        return text.trim();
      }
    } catch (error) {
      console.error(`Error with model ${model} in generateMovieBlurb:`, error);
    }
  }

  throw new Error(`All models failed to generate blurb for "${movie.title}".`);
}
