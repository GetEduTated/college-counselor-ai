// This runs in the BROWSER
// It does NOT use the @google/genai library

/**
 * Sends a prompt to our *own* server's API route.
 * @param {string} prompt - The user's prompt.
 * @returns {Promise<string>} - The AI-generated text.
 */
export async function sendPromptToBackend(prompt: string): Promise<string> {
  try {
    // 1. Call our /api/generate endpoint
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch from backend");
    }

    // 2. Get the JSON response and return the text
    const data = await response.json();
    return data.text;

  } catch (error) {
    console.error("Error in sendPromptToBackend:", error);
    return "Sorry, I'm having trouble connecting. Please try again later.";
  }
}
