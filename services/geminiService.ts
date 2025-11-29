import { GoogleGenAI } from "@google/genai";
import { KeywordResult } from "../types";

// Initialize Gemini
// NOTE: In a real production app, you might want to proxy this through a backend
// to keep the key secure, or ask the user for their key if it's a client-side tool.
// For this demo, we assume process.env.API_KEY is available or we handle the missing key gracefully.

export async function analyzeKeywordsWithGemini(keywords: string[], mode: 'cluster' | 'intent' | 'expand') {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please set REACT_APP_GEMINI_API_KEY or allow user input.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const modelId = "gemini-2.5-flash"; // Fast model for bulk analysis

  const subset = keywords.slice(0, 100); // Limit for demo purposes
  const listStr = subset.join('\n');

  let prompt = "";
  if (mode === 'cluster') {
    prompt = `Group the following SEO keywords into semantic clusters. Return a JSON object where keys are cluster names and values are arrays of keywords.\n\nKeywords:\n${listStr}`;
  } else if (mode === 'intent') {
    prompt = `Analyze the search intent (Informational, Transactional, Navigational, Commercial) for the following keywords. Return a JSON object where keys are keywords and values are intents.\n\nKeywords:\n${listStr}`;
  } else if (mode === 'expand') {
    prompt = `Generate 10 new, high-value long-tail keyword variations based on this list, focused on Persian/Farsi markets if applicable. Return a JSON array of strings.\n\nList:\n${listStr}`;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
