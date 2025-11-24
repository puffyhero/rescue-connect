
import { useState, useEffect, useCallback } from 'react';
import { getFloodSituation } from '../services/gemini';
import { sheetsService } from '../services/sheets';
import { FloodData, LoadingState, HelpRequest } from '../types';
import { APP_CONFIG } from '../utils/constants';

export const useFloodMonitor = (isAdminMode: boolean) => {
  const [situationData, setSituationData] = useState<FloodData | null>(null);
  const [situationLoading, setSituationLoading] = useState<LoadingState>('idle');
  
  const [requests, setRequests] = useState<HelpRequest[]>([]);
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);

  // 1. Fetch Flood Situation (Gemini)
  const fetchSituation = useCallback(async () => {
    setSituationLoading('loading');
    try {
      const result = await getFloodSituation("สถานการณ์น้ำท่วมหาดใหญ่ล่าสุดตอนนี้เป็นอย่างไรบ้าง ขอสรุปพื้นที่ได้รับผลกระทบ ระดับน้ำ และการแจ้งเตือน");
      setSituationData(result);
      setSituationLoading('success');
    } catch (error) {
      console.error("Failed to fetch situation", error);
      setSituationLoading('error');
    }
  }, []);

  // 2. Fetch Requests (Sheets)
  const fetchRequests = useCallback(async (showLoading = false) => {
    if (showLoading) setRequestLoading(true);
    setRequestError(null);
    try {
      const data = await sheetsService.getAllRequests();
      setRequests(data);
    } catch (err: any) {
      console.error("Fetch Request Error:", err);
      setRequestError(err.message || "ไม่สามารถเชื่อมต่อ Google Sheets ได้");
    } finally {
      if (showLoading) setRequestLoading(false);
    }
  }, []);

  // Initial Load & Polling
  useEffect(() => {
    fetchSituation();
    fetchRequests(true);

    const interval = setInterval(() => {
        fetchRequests(false); // Silent update
    }, APP_CONFIG.REFRESH_RATE_MS);

    return () => clearInterval(interval);
  }, [fetchSituation, fetchRequests]);

  // Handlers
  const handleNewRequest = async (request: HelpRequest) => {
    // Optimistic Update
    setRequests(prev => [request, ...prev]);
    await sheetsService.submitRequest(request);
    // Delay refresh slightly to ensure sheet is updated
    setTimeout(() => fetchRequests(false), 2000);
  };

  const handleUpdateStatus = async (id: string, status: HelpRequest['status']) => {
    // Optimistic Update
    setRequests(prev => prev.map(req => 
      req.id === id 
        ? { ...req, status, timestamp: new Date() } 
        : req
    ));
    await sheetsService.updateStatus(id, status);
  };

  return {
    situation: {
      data: situationData,
      loading: situationLoading,
      refresh: fetchSituation
    },
    requests: {
      data: requests,
      loading: requestLoading,
      error: requestError,
      refresh: () => fetchRequests(true),
      add: handleNewRequest,
      updateStatus: handleUpdateStatus
    }
  };
};
