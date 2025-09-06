import { GoogleGenAI, Type } from "@google/genai";
import type { ExtractedData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
const model = "gemini-2.5-flash";

const parseJsonResponse = <T,>(jsonString: string): T | null => {
  try {
    const cleanedString = jsonString.replace(/^```json\s*|```\s*$/g, '');
    return JSON.parse(cleanedString) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e);
    console.error("Original string:", jsonString);
    return null;
  }
};

export const extractKeywords = async (text: string): Promise<ExtractedData> => {
  const prompt = `
    Analyze the following text and extract up to 100 of the most important and relevant key concepts, topics, and entities. 
    For each keyword, provide a brief, one-sentence description.

    Respond ONLY with a JSON object matching this schema.

    Text to analyze:
    ---
    ${text}
    ---
  `;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywords: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: 'The keyword or concept.' },
                description: { type: Type.STRING, description: 'A brief description of the keyword.' }
              },
              required: ['name', 'description']
            }
          },
        },
        required: ['keywords']
      }
    }
  });

  const data = parseJsonResponse<ExtractedData>(response.text);
  if (!data || !data.keywords) {
    throw new Error("Failed to parse keyword extraction response from Gemini.");
  }
  return data;
};
