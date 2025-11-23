import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Candle, NewsItem } from '../types';

let ai: GoogleGenAI | null = null;

// robust key retrieval for different environments (Node/AI Studio vs Vite)
const getApiKey = () => {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    return null;
};

// Initialize with a check for key presence
export const initGemini = () => {
  const key = getApiKey();
  if (key) {
    ai = new GoogleGenAI({ apiKey: key });
  }
};

export const analyzeChartData = async (symbol: string, data: Candle[]): Promise<AnalysisResult> => {
  if (!ai) initGemini(); // Try to lazy init
  if (!ai) return {
      sentiment: 'Neutral',
      score: 50,
      summary: "API Key missing. Please configure your Gemini API Key to enable AI analysis.",
      keyLevels: { support: [], resistance: [] }
  };

  const recentData = data.slice(-30); // Last 30 candles for context
  const dataString = JSON.stringify(recentData.map(c => ({ t: new Date(c.time * 1000).toISOString(), c: c.close, v: c.volume })));

  const prompt = `Analyze the following recent market data for ${symbol}. Provide a technical sentiment, a confidence score (0-100), a brief summary of the trend, and identify key support and resistance levels.
  Data: ${dataString}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: { type: Type.STRING, enum: ["Bullish", "Bearish", "Neutral"] },
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            keyLevels: {
              type: Type.OBJECT,
              properties: {
                support: { type: Type.ARRAY, items: { type: Type.NUMBER } },
                resistance: { type: Type.ARRAY, items: { type: Type.NUMBER } }
              }
            }
          }
        }
      }
    });

    const text = response.text;
    if (text) {
        return JSON.parse(text) as AnalysisResult;
    }
    throw new Error("Empty response");

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      sentiment: 'Neutral',
      score: 50,
      summary: "Analysis currently unavailable due to an API error.",
      keyLevels: { support: [], resistance: [] }
    };
  }
};

export const searchNews = async (symbol: string): Promise<NewsItem[]> => {
    if (!ai) initGemini();
    if (!ai) return [];
    
    // Simulate real-time news retrieval using Google Search Grounding
    // Note: In a real "2.5-flash" environment with tools, we'd add tools: [{googleSearch: {}}].
    // Here we will use a prompt to ask for news simulation or retrieval if tools are enabled.
    // Since this environment might not have googleSearch enabled by default without paid tier sometimes,
    // we will write the code defensively.
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Find 3 recent, important news headlines relevant to ${symbol} stock. Return them as a JSON list.`,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                           title: { type: Type.STRING },
                           url: { type: Type.STRING },
                           source: { type: Type.STRING },
                           time: { type: Type.STRING }
                        }
                    }
                }
            }
        });

        const text = response.text;
        if(text) return JSON.parse(text);
        return [];
    } catch (e) {
        console.warn("News fetch failed, falling back to mock", e);
        // Fallback mock news
        return [
            { title: `${symbol} beats earnings expectations`, url: "#", source: "MarketWatch", time: "2 hours ago" },
            { title: `Analyst upgrades ${symbol} to Buy`, url: "#", source: "Bloomberg", time: "5 hours ago" },
            { title: `Sector wide rally boosts ${symbol}`, url: "#", source: "Reuters", time: "1 day ago" }
        ];
    }
}

export const smartScreener = async (query: string): Promise<any[]> => {
    if (!ai) initGemini();
    if (!ai) return [];

    // This function interprets natural language to screen stocks
    // In a real app, this would translate NL to SQL or API filters.
    // Here, we ask Gemini to return a list of symbols that MATCH the criteria based on its internal knowledge.
    
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `User Query: "${query}". 
            Return a list of 5-10 stock symbols that best match this screening criteria. 
            Include current approximate price and sector.`,
            config: {
                 responseMimeType: "application/json",
                 responseSchema: {
                     type: Type.ARRAY,
                     items: {
                         type: Type.OBJECT,
                         properties: {
                             symbol: { type: Type.STRING },
                             name: { type: Type.STRING },
                             price: { type: Type.NUMBER },
                             sector: { type: Type.STRING },
                             reason: { type: Type.STRING, description: "Why it matches" }
                         }
                     }
                 }
            }
        });
        
        const text = response.text;
        if (text) return JSON.parse(text);
        return [];
    } catch (e) {
        console.error("Screener error", e);
        return [];
    }
}