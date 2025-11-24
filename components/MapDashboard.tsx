
import React, { useEffect, useRef } from 'react';
import { HelpRequest } from '../types';
import { URGENCY_CONFIG, STATUS_CONFIG, APP_CONFIG } from '../utils/constants';

declare const L: any;

interface MapDashboardProps {
  requests: HelpRequest[];
  onRefresh?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export const MapDashboard: React.FC<MapDashboardProps> = ({ requests, onRefresh, isLoading, error }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map
    if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current).setView([APP_CONFIG.DEFAULT_CENTER.lat, APP_CONFIG.DEFAULT_CENTER.lng], 13);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap contributors, © CartoDB'
        }).addTo(map);

        mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clean up old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    // Filter active requests
    const activeRequests = requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled');

    activeRequests.forEach(req => {
        if (req.location.lat && req.location.lng) {
            const urgencyStyle = URGENCY_CONFIG[req.urgency];
            const statusStyle = STATUS_CONFIG[req.status];
            
            // Logic: Fill = Urgency, Border = Status
            const marker = L.circleMarker([req.location.lat, req.location.lng], {
                color: statusStyle.borderColor,
                fillColor: urgencyStyle.mapColor,
                fillOpacity: 0.8,
                weight: req.status === 'pending' ? 2 : 4,
                radius: urgencyStyle.mapRadius
            }).addTo(map);

            const popupContent = `
                <div class="font-sans">
                    <strong class="text-sm block mb-1">${req.name}</strong>
                    <div class="flex gap-1 mb-1">
                        <span class="text-xs px-2 py-0.5 rounded text-white" style="background:${urgencyStyle.mapColor}">${urgencyStyle.label}</span>
                        <span class="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">${statusStyle.label}</span>
                    </div>
                    <p class="text-xs mt-1 text-slate-600">${req.details}</p>
                </div>
            `;

            marker.bindPopup(popupContent);
            markersRef.current.push(marker);
        }
    });

    if (markersRef.current.length > 0) {
        const group = L.featureGroup(markersRef.current);
        map.fitBounds(group.getBounds().pad(0.1));
    }

  }, [requests]);

  return (
    <div className="flex flex-col h-full bg-slate-100 relative">
        {/* Legend */}
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur p-3 rounded-lg shadow-md border border-slate-200 text-xs space-y-2 min-w-[140px]">
            <div className="font-bold mb-1 text-slate-700">ความรุนแรง (สีพื้น)</div>
            {Object.values(URGENCY_CONFIG).map((u, idx) => (
                <div key={idx} className="flex items-center">
                    <span className="w-3 h-3 rounded-full mr-2 border border-slate-300" style={{backgroundColor: u.mapColor}}></span> 
                    {u.label}
                </div>
            ))}
            
            <div className="border-t border-slate-200 pt-2 mt-2 font-bold text-slate-700">สถานะ (ขอบสี)</div>
             <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-slate-200 mr-2 border-2 border-white shadow-sm"></span> รอการช่วยเหลือ</div>
             <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-slate-200 mr-2 border-2 border-blue-600"></span> กำลังดำเนินการ</div>
             <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-slate-200 mr-2 border-2 border-yellow-600"></span> ประสานงานต่อ</div>
        </div>

        {/* Controls */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col space-y-2">
             <button
                onClick={onRefresh}
                className={`bg-white/90 backdrop-blur p-2 rounded-lg shadow-md border border-slate-200 hover:bg-white transition-colors ${error ? 'text-red-500 border-red-200' : 'text-slate-600 hover:text-blue-600'}`}
            >
                <i className={`fas fa-sync-alt text-lg ${isLoading ? 'animate-spin' : ''}`}></i>
            </button>
            
            {error && (
                <div className="bg-red-500 text-white p-2 rounded-lg shadow-md text-xs max-w-[150px]">
                    <i className="fas fa-exclamation-triangle mr-1"></i> เชื่อมต่อไม่ได้
                </div>
            )}
        </div>

        <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
