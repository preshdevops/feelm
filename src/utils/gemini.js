const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// List of Gemini models to try in sequence to handle 404 (model availability) errors
const GEMINI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

export const isGeminiConfigured = () => {
  return (
    GEMINI_API_KEY &&
    GEMINI_API_KEY !== 'your_gemini_key_here' &&
    GEMINI_API_KEY.trim() !== ''
  );
};

/**
 * Gets movie recommendations from Gemini based on the user's mood and feeling text.
 * Tries multiple model versions to robustly bypass model-specific 404 errors.
 * @param {string} mood - Selected mood label (e.g., Happy, Sad, Stressed)
 * @param {string} feelingText - Freeform user input describing how they feel
 * @returns {Promise<Array<{title: string, reason: string}>>}
 */
export async function getRecommendationsFromGemini(mood, feelingText) {
  if (!isGeminiConfigured()) {
    throw new Error('Gemini API Key is not configured.');
  }

  const prompt = `
    You are a premium, empathetic movie recommendation AI named "Feelm".
    The user is asking for movie recommendations.
    
    Selected Mood Category: ${mood || 'None specified'}
    User's description of how they feel: "${feelingText || 'None specified'}"
    
    Please recommend 5 to 7 movies that perfectly match this exact vibe, emotional state, or mood request.
    
    For each movie, provide:
    1. "title": The precise name of the movie (e.g. "The Grand Budapest Hotel").
    2. "reason": A warm, personalized 1-2 sentence explanation of why this movie fits the user's current mood and description. Do not mention TMDB or Gemini. Speak directly to the user's feeling.
    
    You MUST respond with a valid JSON array of objects.
    Example format:
    [
      {
        "title": "Interstellar",
        "reason": "Since you feel like exploring deep existential questions, this visual masterpiece will take you on an emotional journey through space and time, emphasizing human connection."
      }
    ]
    
    Do not wrap your output in markdown code blocks (like \`\`\`json). Return raw JSON only.
  `;

  let lastError = null;

  // Try models in order
  for (const model of GEMINI_MODELS) {
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    try {
      console.log(`Attempting Gemini recommendations using model: ${model}`);
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
        console.warn(`Model ${model} returned 404. Trying next fallback...`);
        continue; // Try next model
      }

      if (!response.ok) {
        throw new Error(`Gemini API failed with status: ${response.status}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error('Empty response from Gemini API.');
      }

      // Parse response
      const recommendations = JSON.parse(text.trim());
      if (Array.isArray(recommendations)) {
        console.log(`Successfully fetched recommendations using model: ${model}`);
        return recommendations;
      }
      
      throw new Error('Gemini did not return an array.');
    } catch (error) {
      console.error(`Error with model ${model}:`, error);
      lastError = error;
      // Continue loop to try fallback models
    }
  }

  // If all models failed, throw the last encountered error
  throw lastError || new Error('All Gemini model fallbacks failed.');
}
