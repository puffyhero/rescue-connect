import { GoogleGenAI } from "@google/genai";
import { FloodData, GroundingChunk, HelpRequest } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

export const getFloodSituation = async (query: string): Promise<FloodData> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: "You are a helpful disaster monitoring assistant specifically for Hat Yai, Thailand. Provide concise, accurate summaries of the current flood situation based on search results. Use Thai language. Structure your answer with clear headings if possible.",
      },
    });

    const text = response.text || "ไม่สามารถดึงข้อมูลได้ในขณะนี้";
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || [];

    return {
      summary: text,
      groundingChunks: groundingChunks,
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
   try {
    const chat = ai.chats.create({
        model: MODEL_NAME,
        history: history,
        config: {
            tools: [{ googleSearch: {} }],
            systemInstruction: "You are a helpful assistant answering questions about the flood situation in Hat Yai. Always use Google Search to get the latest information. Answer in Thai. Be empathetic and precise."
        }
    });

    const response = await chat.sendMessage({ message });
    
    return {
        text: response.text || "ขออภัย เกิดข้อผิดพลาดในการประมวลผล",
        groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks as GroundingChunk[] || []
    };

   } catch (error) {
       console.error("Chat Error:", error);
       throw error;
   }
}

export const analyzeRescueRequests = async (requests: HelpRequest[]): Promise<string> => {
  try {
    // Filter only pending/assigned requests to analyze active situation
    const activeRequests = requests.filter(r => r.status !== 'completed');
    
    const prompt = `
      Analyze the following list of flood rescue requests in Hat Yai:
      ${JSON.stringify(activeRequests)}

      Please provide a "Tactical Rescue Summary" in Thai for the rescue command center.
      1. Summarize the total situation (Critical vs Normal).
      2. Group requests by location/areas (Look at address/details) to identify "Hotspots".
      3. Recommend prioritization: Which cases need immediate evacuation? **Pay special attention to 'medicalNeeds' (sick/disabled), 'people' (elderly, children) and 'pets'.**
      4. Highlight any special equipment needed (e.g., cages for pets, medical transport for disabled).
      
      Keep it concise, professional, and actionable for rescue teams.
    `;

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert emergency response coordinator. Analyze raw data and provide clear, life-saving tactical reports."
      }
    });

    return response.text || "ไม่สามารถวิเคราะห์ข้อมูลได้";
  } catch (error) {
    console.error("Analysis Error:", error);
    return "เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล";
  }
};