
import { GoogleGenAI, Type } from "@google/genai";
import { BGMStyle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes an image/frame to suggest appropriate BGM styles.
 */
export const analyzeVisualMood = async (base64Image: string): Promise<{ mood: string, styles: BGMStyle[] }> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } },
            { text: "Act as a film scorer specializing in atmospheric, post-rock, and documentary music. Analyze this video frame. Identify the atmosphere (e.g., 'Solitary Landscape', 'Quiet Emotion'). Then, select exactly 2-3 music styles from this restricted list: Post-Rock, Cinematic, Minimal, Ambient, Orchestral. Do NOT suggest Electronic, Jazz, Lofi, or Pop. Return JSON." }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mood: { type: Type.STRING },
            styles: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            }
          },
          required: ["mood", "styles"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Visual Analysis Error:", error);
    // Fallback
    return { mood: "Ethereal", styles: [BGMStyle.AMBIENT, BGMStyle.POST_ROCK] };
  }
};

/**
 * Provides smart search suggestions.
 */
export const smartSearchHelp = async (query: string): Promise<string[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `User wants soothing, atmospheric, post-rock BGM for a video with idea: "${query}". Suggest 4 abstract, emotional keywords (e.g., "Healing", "Distance", "Fading"). Do not suggest rhythmic terms. Return JSON array of strings.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const text = response.text || "[]";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Search Suggestion Error:", error);
    return [];
  }
};
