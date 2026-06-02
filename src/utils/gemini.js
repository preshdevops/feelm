const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export const isGeminiConfigured = () => {
  return (
    GEMINI_API_KEY &&
    GEMINI_API_KEY !== 'your_gemini_key_here' &&
    GEMINI_API_KEY.trim() !== ''
  );
};

/**
 * Gets movie recommendations from Gemini based on the user's mood and feeling text.
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

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
      return recommendations;
    }
    
    throw new Error('Gemini did not return an array.');
  } catch (error) {
    console.error('Error fetching recommendations from Gemini:', error);
    throw error;
  }
}
