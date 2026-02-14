
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Explicitly define return type for market insights
export async function getMarketInsights(symbol: string): Promise<string> {
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

// Explicitly define return type for market news
export async function getMarketNews(): Promise<string[]> {
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
    // Ensure the output is safely parsed into a string array
    const parsed = JSON.parse(response.text || "[]");
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch (error) {
    console.error("Gemini News Error:", error);
    return ["Nifty reaches all-time high amid global rally", "RBI maintains interest rates, outlook positive", "Tech stocks lead market gains today"];
  }
}

/**
 * Fetches latest market prices for a list of symbols using Google Search Grounding.
 */
export async function fetchLiveMarketPrices(symbols: string[]): Promise<{ [key: string]: number } | null> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Search for the current market price (Last Traded Price / LTP) of these Indian stocks on NSE/BSE: ${symbols.join(', ')}. 
      Format your response strictly as a list of "SYMBOL: PRICE" (e.g., RELIANCE: 1265.50). Only return the list.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "";
    const priceMap: { [key: string]: number } = {};
    
    // Simple regex to extract Symbol and Price
    const lines = text.split('\n');
    lines.forEach(line => {
      const match = line.match(/([A-Z0-9]+):\s*([\d,.]+)/);
      if (match) {
        const symbol = match[1];
        const price = parseFloat(match[2].replace(/,/g, ''));
        if (!isNaN(price)) {
          priceMap[symbol] = price;
        }
      }
    });

    return priceMap;
  } catch (error) {
    console.error("Market Sync Error:", error);
    return null;
  }
}
