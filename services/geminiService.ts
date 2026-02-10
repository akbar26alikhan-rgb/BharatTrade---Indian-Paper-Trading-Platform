
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getMarketInsights(symbol: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Provide a quick 3-sentence trading insight for the Indian stock ${symbol}. Include a technical trend, a potential catalyst, and a risk factor. Format as plain text.`,
      config: {
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text || "Market insights currently unavailable.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to fetch AI insights.";
  }
}

export async function getMarketNews() {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate 3 realistic brief news headlines affecting the Indian stock market (NSE/BSE) today. Format as a JSON array of strings.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) {
    return ["Nifty reaches all-time high amid global rally", "RBI maintains interest rates, outlook positive", "Tech stocks lead market gains today"];
  }
}
