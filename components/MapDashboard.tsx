
import React, { useEffect, useRef, useMemo } from 'react';
import { HelpRequest, UrgencyLevel } from '../types';
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

  // Calculate Stats for Active Requests only
  const stats = useMemo(() => {
    const activeRequests = requests.filter(r => ['pending', 'in_progress', 'assigned'].includes(r.status));
    
    return {
        total: activeRequests.length,
        breakdown: {
            critical: activeRequests.filter(r => r.urgency === 'critical').length,
            high: activeRequests.filter(r => r.urgency === 'high').length,
            medium: activeRequests.filter(r => r.urgency === 'medium').length,
            low: activeRequests.filter(r => r.urgency === 'low').length,
        }
    };
  }, [requests]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Define global function for popup clicks
    (window as any).copyMapCoords = (lat: number, lng: number) => {
        const text = `${lat},${lng}`;
        navigator.clipboard.writeText(text)
            .then(() => alert(`คัดลอกพิกัดเรียบร้อย:\n${text}\n\nนำไปค้นหาใน Google Maps ได้เลย`))
            .catch(() => alert('ไม่สามารถคัดลอกได้ กรุณาจดเอง'));
    };

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

            const totalPeople = req.people.adults + req.people.children + req.people.elderly;
            
            // Generate Detailed breakdown strings
            const peopleBreakdown = [];
            if (req.people.adults > 0) peopleBreakdown.push(`${req.people.adults} ผู้ใหญ่`);
            if (req.people.children > 0) peopleBreakdown.push(`${req.people.children} เด็ก`);
            if (req.people.elderly > 0) peopleBreakdown.push(`<span class="text-red-600 font-bold">${req.people.elderly} ผู้สูงอายุ</span>`);

            const petBreakdown = [];
            if (req.pets.dogs > 0) petBreakdown.push(`${req.pets.dogs} สุนัข`);
            if (req.pets.cats > 0) petBreakdown.push(`${req.pets.cats} แมว`);
            if (req.pets.others) petBreakdown.push(`${req.pets.others}`);

            const popupContent = `
                <div class="font-sans min-w-[240px]">
                    <div class="flex justify-between items-start mb-2 border-b border-slate-100 pb-2">
                        <strong class="text-sm block text-slate-800 pr-2">${req.name}</strong>
                         <span class="text-[10px] px-2 py-0.5 rounded-full border bg-slate-50 text-slate-500 border-slate-200 whitespace-nowrap">${statusStyle.label}</span>
                    </div>
                    
                    <div class="space-y-2 mb-3">
                        <!-- People Section -->
                        <div class="flex items-start text-xs text-slate-700 bg-slate-50/50 p-1.5 rounded">
                            <div class="w-6 shrink-0 text-center pt-0.5"><i class="fas fa-users text-blue-500 text-sm"></i></div>
                            <div class="flex-1">
                                <div class="font-bold mb-0.5">รวม ${totalPeople} คน</div>
                                <div class="text-slate-500 text-[11px] leading-tight">
                                   ${peopleBreakdown.join(' • ') || '-'}
                                </div>
                                ${req.medicalNeeds > 0 ? `<div class="mt-1 text-red-600 font-bold text-[10px] bg-red-50 border border-red-100 px-1 rounded inline-block"><i class="fas fa-heartbeat"></i> ป่วย/พิการ ${req.medicalNeeds} คน</div>` : ''}
                            </div>
                        </div>

                        <!-- Pets Section -->
                        ${petBreakdown.length > 0 ? `
                        <div class="flex items-start text-xs text-slate-700 bg-slate-50/50 p-1.5 rounded">
                             <div class="w-6 shrink-0 text-center pt-0.5"><i class="fas fa-paw text-orange-500 text-sm"></i></div>
                             <div class="flex-1">
                                <div class="font-bold mb-0.5">สัตว์เลี้ยง</div>
                                <div class="text-slate-500 text-[11px] leading-tight">
                                   ${petBreakdown.join(' • ')}
                                </div>
                             </div>
                        </div>` : ''}
                    </div>

                    <div class="text-xs mb-3 text-slate-600 bg-white p-2 rounded border border-slate-200 italic shadow-sm">
                        <i class="fas fa-quote-left text-slate-300 mr-1"></i>${req.details}
                    </div>
                    
                    <button 
                        onclick="window.copyMapCoords(${req.location.lat}, ${req.location.lng})"
                        class="w-full flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 hover:border-slate-400 text-xs font-bold py-2 rounded transition-all shadow-sm group"
                    >
                        <i class="fas fa-copy group-hover:text-blue-500 transition-colors"></i> คัดลอกพิกัด GPS
                    </button>
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

    // Cleanup global function
    return () => {
        delete (window as any).copyMapCoords;
    };

  }, [requests]);

  return (
    <div className="flex flex-col h-full bg-slate-100 relative">
        {/* Legend */}
        <div className="absolute top-4 right-4 z-[400] bg-white/90 backdrop-blur p-3 rounded-lg shadow-md border border-slate-200 text-xs space-y-2 min-w-[140px] hidden md:block">
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

        {/* Bottom Summary Bar */}
        <div className="absolute bottom-8 left-4 right-4 md:left-1/2 md:right-auto md:-translate-x-1/2 z-[400]">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 px-6 py-3 flex justify-between md:justify-center items-center gap-6 overflow-x-auto scrollbar-hide max-w-full">
                {/* Total */}
                <div className="flex flex-col items-center min-w-[60px] border-r border-slate-200 pr-6 shrink-0">
                     <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">เคสทั้งหมด</span>
                     <span className="text-3xl font-bold text-slate-800 leading-none mt-1">{stats.total}</span>
                </div>
                
                {/* Breakdown by Urgency */}
                <div className="flex space-x-4 shrink-0">
                    {(['critical', 'high', 'medium', 'low'] as UrgencyLevel[]).map((level) => {
                        const count = stats.breakdown[level];
                        const config = URGENCY_CONFIG[level];
                        return (
                            <div key={level} className="flex flex-col items-center min-w-[30px]">
                                 <div className="flex items-center space-x-1.5 mb-1">
                                    <span className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: config.mapColor}}></span>
                                 </div>
                                 <span className="font-bold text-xl leading-none" style={{color: count > 0 ? config.mapColor : '#94a3b8'}}>
                                    {count}
                                 </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>

        <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
};
