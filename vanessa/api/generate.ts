// This is a Vercel Serverless Function
// It runs on the SERVER, so process.env.API_KEY is available
import { GoogleGenAI } from "@google/genai";

export default async function handler(req, res) {
  // 1. Get the prompt from the client's request
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    // 2. Initialize Google AI
    // This is safe because it's on the server
    // --- THIS IS THE NEW, CORRECT LINE ---
    const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    // 3. Call the Gemini API using the new SDK structure
    const result = await genAI.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [{ parts: [{ text: prompt }] }],
});

const response = result.response;
const text = response.text();

    // 4. Send the API's response back to the browser
    res.status(200).json({ text });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error generating content" });
  }
}
