
import { HelpRequest } from '../types';
import { APP_CONFIG } from '../utils/constants';

// MOCK DATA for fallback
const MOCK_REQUESTS: HelpRequest[] = [
  {
    id: '1',
    name: 'ตัวอย่าง: สมชาย ใจดี',
    phone: '081-234-5678',
    location: { lat: 7.0069, lng: 100.4747, address: 'ซอย 3 ถนนราษฎร์อุทิศ น้ำสูง 1 เมตร' },
    urgency: 'high',
    people: { adults: 2, children: 2, elderly: 0 },
    medicalNeeds: 0,
    pets: { dogs: 1, cats: 0, others: '' },
    details: 'มีเด็กเล็ก 2 คน ออกไม่ได้ น้ำท่วมชั้น 1 หมดแล้ว (ข้อมูลตัวอย่าง)',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    status: 'pending'
  }
];

export const sheetsService = {
  async getAllRequests(): Promise<HelpRequest[]> {
    const { GOOGLE_SCRIPT_URL } = APP_CONFIG;

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes("วาง_URL")) {
      console.warn("Sheets Service: Invalid URL, using mock data.");
      return MOCK_REQUESTS;
    }

    try {
      const fetchUrl = `${GOOGLE_SCRIPT_URL}?t=${new Date().getTime()}`;
      const controller = new AbortController();
      // Increase timeout to 60 seconds for slow Apps Script cold starts
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(fetchUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        
        if (!response.ok) throw new Error(`Sheet Connection Error: ${response.status}`);
        
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error("Invalid Data Format");
        
        const requestMap = new Map<string, HelpRequest>();

        data.forEach((item: any) => {
            const id = item.ID || item.id;
            const status = item.Status || item.status || 'pending';
            const timeRaw = item.Time || item.time || item.timestamp;
            const dataRaw = item.Data || item.data;

            if (!id) return;

            let timestamp = new Date();
            if (timeRaw) {
               const parsed = new Date(timeRaw);
               if (!isNaN(parsed.getTime())) timestamp = parsed;
            }

            if (dataRaw) {
                try {
                    let content = typeof dataRaw === 'string' && (dataRaw.startsWith('{') || dataRaw.startsWith('['))
                        ? JSON.parse(dataRaw) 
                        : dataRaw;
                    
                    const parsedItem: HelpRequest = {
                        id: id.toString(),
                        status,
                        timestamp,
                        ...content
                    };
                    
                    // Smart Merge: Keep newest timestamp
                    if (!requestMap.has(parsedItem.id) || parsedItem.timestamp >= requestMap.get(parsedItem.id)!.timestamp) {
                        requestMap.set(parsedItem.id, parsedItem);
                    }
                } catch (e) {
                    console.warn("Skipping malformed row:", id);
                }
            }
        });

        return Array.from(requestMap.values()).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      } catch (fetchError: any) {
         // Handle AbortError specifically for timeouts
         if (fetchError.name === 'AbortError' || fetchError.message?.includes('aborted')) {
            throw new Error("การเชื่อมต่อ Google Sheets ใช้เวลานานเกินไป (Timeout 60s) - กรุณาลองใหม่");
         }
         throw fetchError;
      }

    } catch (error: any) {
      console.error("Sheets API Error:", error);
      throw error; 
    }
  },

  async submitRequest(request: HelpRequest): Promise<boolean> {
    const { GOOGLE_SCRIPT_URL } = APP_CONFIG;
    if (!GOOGLE_SCRIPT_URL) return false;

    try {
      const { id, status, timestamp, ...content } = request;
      const payload = {
        action: 'create',
        id,
        status: 'pending',
        timestamp,
        data: JSON.stringify(content)
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
         console.error("Submit Timeout: Google Sheets is taking too long to respond.");
      }
      console.error("Submit Error:", error);
      return false;
    }
  },

  async updateStatus(id: string, status: string): Promise<boolean> {
    const { GOOGLE_SCRIPT_URL } = APP_CONFIG;
    if (!GOOGLE_SCRIPT_URL) return false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStatus',
          id,
          status,
          timestamp: new Date()
        }),
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return true;
    } catch (error: any) {
       if (error.name === 'AbortError' || error.message?.includes('aborted')) {
         console.error("Update Status Timeout");
      }
      console.error("Status Update Error:", error);
      return false;
    }
  }
};
