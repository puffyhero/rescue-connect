import { GoogleGenAI } from "@google/genai";
import { FloodData, GroundingChunk, HelpRequest } from '../types';

// Check if API Key is available
const apiKey = process.env.API_KEY;
const isAiAvailable = !!apiKey && apiKey !== 'undefined' && apiKey !== '';

// Initialize only if key exists
const ai = isAiAvailable ? new GoogleGenAI({ apiKey: apiKey! }) : null;

const MODEL_NAME = 'gemini-2.5-flash';

// Fallback message when AI is offline
const AI_OFFLINE_MSG = "⚠️ ระบบ AI ไม่พร้อมใช้งาน (Offline Mode) - กรุณาตรวจสอบข้อมูลจากประกาศทางการ";

export const getFloodSituation = async (query: string): Promise<FloodData> => {
  if (!ai) {
    console.warn("Gemini API Key missing. Returning fallback data.");
    return {
      summary: `### ⚠️ AI Disconnected\n\nระบบไม่สามารถดึงสรุปข่าวล่าสุดได้ในขณะนี้ เนื่องจากไม่มีการเชื่อมต่อกับ Gemini API\n\nอย่างไรก็ตาม **ระบบรับแจ้งเหตุและแผนที่ยังคงทำงานได้ตามปกติ**\n\nกรุณาติดตามข่าวสารจาก:\n- [กรมอุตุนิยมวิทยา](https://www.tmd.go.th/)\n- [เทศบาลนครหาดใหญ่](https://www.hatyaicity.go.th/)`,
      groundingChunks: []
    };
  }

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
    // Return safe fallback instead of throwing to prevent UI crash
    return {
      summary: "ไม่สามารถเชื่อมต่อกับ AI ได้ในขณะนี้ (API Error) แต่ระบบแผนที่ยังทำงานปกติ",
      groundingChunks: []
    };
  }
};

export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], message: string) => {
   if (!ai) {
     return {
         text: "ขออภัยครับ ขณะนี้ระบบ AI ปิดการทำงาน (No API Key) ท่านสามารถดูแผนที่หรือแจ้งเหตุได้ที่แท็บเมนูด้านบนครับ",
         groundingChunks: []
     };
   }

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
       return {
           text: "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่ภายหลัง",
           groundingChunks: []
       };
   }
}

export const analyzeRescueRequests = async (requests: HelpRequest[]): Promise<string> => {
  if (!ai) {
      return "⚠️ ไม่สามารถวิเคราะห์ข้อมูลได้ (AI Offline) - กรุณาประเมินสถานการณ์จากรายการข้อมูลด้านล่างด้วยตนเอง";
  }

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