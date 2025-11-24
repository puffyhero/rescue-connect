
import React, { useState } from 'react';
import { HelpRequest, UrgencyLevel, RequestStatus } from '../types';
import { analyzeRescueRequests } from '../services/gemini';
import { STATUS_CONFIG, URGENCY_CONFIG } from '../utils/constants';
import { generateCSV, downloadFile, formatDate } from '../utils/helpers';
import ReactMarkdown from 'react-markdown';
import { RequestForm } from './RequestForm';

interface AdminDashboardProps {
  requests: HelpRequest[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
  onRefresh: () => void;
  onAddRequest: (request: HelpRequest) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ requests, onUpdateStatus, onRefresh, onAddRequest, isLoading, error }) => {
  const [filter, setFilter] = useState<'all' | UrgencyLevel>('all');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const filteredRequests = requests.filter(r => filter === 'all' || r.urgency === filter);
  
  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
    critical: requests.filter(r => r.urgency === 'critical' && r.status !== 'completed' && r.status !== 'cancelled').length
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeRescueRequests(requests);
      setAnalysis(result);
    } catch {
        setAnalysis("เกิดข้อผิดพลาดในการวิเคราะห์");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleExport = (type: 'csv' | 'json') => {
    const dateStr = new Date().toISOString().slice(0,13);
    if (type === 'csv') {
      downloadFile(generateCSV(requests), `rescue-data-${dateStr}.csv`, 'text/csv');
    } else {
      downloadFile(JSON.stringify(requests, null, 2), `rescue-data-${dateStr}.json`, 'application/json');
    }
    setShowExportMenu(false);
  };

  const handleManualAdd = (newRequest: HelpRequest) => {
      onAddRequest(newRequest);
      // Modal closing is handled inside RequestForm via onCancel prop or here if we preferred. 
      // But RequestForm calls onCancel after submit if isAdmin is true, so we just pass the close logic there.
  };

  const handleCopyCoords = (lat: number, lng: number) => {
      const text = `${lat},${lng}`;
      navigator.clipboard.writeText(text)
        .then(() => alert(`คัดลอกพิกัดแล้ว: ${text}`))
        .catch(() => alert('Copy Failed'));
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 relative">
      {/* Header Stats */}
      <div className="bg-white p-4 shadow-sm border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between z-20">
        <div className="flex space-x-6">
            {[
              { label: 'รอช่วยเหลือ', val: stats.pending, color: 'text-red-600' },
              { label: 'กำลังทำ', val: stats.inProgress, color: 'text-blue-600' },
              { label: 'สำเร็จ', val: stats.completed, color: 'text-green-600' }
            ].map((s, i) => (
              <div key={i} className="text-center min-w-[60px]">
                <p className="text-[10px] text-slate-500 uppercase font-bold">{s.label}</p>
                <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              </div>
            ))}
             <div className="text-center min-w-[60px] pl-4 border-l">
                <p className="text-[10px] text-red-700 uppercase font-bold">วิกฤต!</p>
                <p className="text-2xl font-bold text-red-700">{stats.critical}</p>
            </div>
        </div>
        
        <div className="flex space-x-2">
            <button onClick={() => setIsAddModalOpen(true)} className="px-3 py-2 rounded-lg bg-green-600 text-white shadow-sm hover:bg-green-700">
                <i className="fas fa-plus md:mr-2"></i> <span className="hidden md:inline">เพิ่มเคส</span>
            </button>
            <button onClick={onRefresh} className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
                <i className={`fas fa-sync-alt ${isLoading ? 'animate-spin' : ''}`}></i>
            </button>
            <div className="relative">
                <button onClick={() => setShowExportMenu(!showExportMenu)} className="px-4 py-2 bg-slate-700 text-white rounded-lg shadow-sm">
                    <i className="fas fa-file-export md:mr-2"></i> <span className="hidden md:inline">Export</span>
                </button>
                {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border z-50">
                        <button onClick={() => handleExport('csv')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm border-b">CSV</button>
                        <button onClick={() => handleExport('json')} className="w-full text-left px-4 py-3 hover:bg-slate-50 text-sm">JSON</button>
                    </div>
                )}
            </div>
            <button onClick={handleAnalyze} disabled={isAnalyzing} className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm">
                {isAnalyzing ? <i className="fas fa-spinner animate-spin"></i> : <><i className="fas fa-magic md:mr-2"></i> <span className="hidden md:inline">AI</span></>}
            </button>
        </div>
      </div>

      {showExportMenu && <div className="fixed inset-0 z-10" onClick={() => setShowExportMenu(false)}></div>}

      {error && <div className="m-4 p-4 bg-red-50 border-red-200 text-red-700 rounded-lg">{error}</div>}
      
      {analysis && (
        <div className="m-4 p-4 bg-indigo-50 border-indigo-200 rounded-lg shadow-sm relative">
            <button onClick={() => setAnalysis(null)} className="absolute top-2 right-3 text-indigo-400"><i className="fas fa-times"></i></button>
            <div className="prose prose-sm prose-indigo"><ReactMarkdown>{analysis}</ReactMarkdown></div>
        </div>
      )}

      {/* Filters */}
      <div className="px-4 pt-4 pb-2 flex space-x-2 overflow-x-auto">
        <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded-full text-xs border ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-white'}`}>ทั้งหมด</button>
        {(Object.keys(URGENCY_CONFIG) as UrgencyLevel[]).map(key => (
           <button key={key} onClick={() => setFilter(key)} className={`px-3 py-1 rounded-full text-xs border ${filter === key ? 'bg-slate-800 text-white' : 'bg-white'}`}>
             {URGENCY_CONFIG[key].label}
           </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredRequests.map(req => {
            const uConf = URGENCY_CONFIG[req.urgency];
            const sConf = STATUS_CONFIG[req.status];
            const totalPeople = req.people.adults + req.people.children + req.people.elderly;

            // Build Stats Display
            const peopleDetails = [
                req.people.adults > 0 ? `${req.people.adults} ผู้ใหญ่.` : null,
                req.people.children > 0 ? `${req.people.children} เด็ก.` : null,
                req.people.elderly > 0 ? `${req.people.elderly} สูงวัย.` : null
            ].filter(Boolean);

            const petDetails = [
                req.pets.dogs > 0 ? `${req.pets.dogs} หมา` : null,
                req.pets.cats > 0 ? `${req.pets.cats} แมว` : null,
                req.pets.others
            ].filter(Boolean);

            return (
                <div key={req.id} className={`rounded-lg border shadow-sm p-4 ${sConf.bg} ${['completed','cancelled'].includes(req.status) ? 'opacity-60' : ''}`}>
                    <div className="flex justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold border ${uConf.bg} ${uConf.text} ${uConf.border}`}>{uConf.label}</span>
                        <span className="text-xs text-slate-400">{formatDate(req.timestamp)}</span>
                    </div>
                    
                    <h4 className="font-bold text-slate-800">{req.name}</h4>

                    {/* Detailed Breakdown Badges */}
                    <div className="flex flex-wrap gap-2 my-2">
                        {/* People Badge */}
                        <div className="text-xs bg-slate-50 border border-slate-200 rounded px-2 py-1 flex items-center text-slate-700">
                            <i className="fas fa-users text-blue-500 mr-1.5"></i>
                            <span className="mr-2 font-bold">{totalPeople} คน:</span>
                            <span className="text-slate-500 text-[10px]">
                                {peopleDetails.length > 0 ? peopleDetails.join(' / ') : '-'}
                            </span>
                        </div>

                        {/* Elderly/Medical Alert */}
                        {(req.people.elderly > 0 || req.medicalNeeds > 0) && (
                             <div className="text-xs bg-red-50 border border-red-100 text-red-700 rounded px-2 py-1 flex items-center font-bold animate-pulse">
                                <i className="fas fa-exclamation-circle mr-1.5"></i>
                                {req.people.elderly > 0 && `สูงวัย ${req.people.elderly} `}
                                {req.medicalNeeds > 0 && `ป่วย/พิการ ${req.medicalNeeds}`}
                            </div>
                        )}

                        {/* Pets Badge */}
                        {petDetails.length > 0 && (
                            <div className="text-xs bg-orange-50 border border-orange-100 text-orange-800 rounded px-2 py-1 flex items-center">
                                <i className="fas fa-paw mr-1.5"></i>
                                <span className="text-[10px]">{petDetails.join(' / ')}</span>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-slate-600 mt-2 bg-white p-2 rounded border border-slate-100/50">
                        <i className="fas fa-info-circle text-slate-300 mr-1"></i> {req.details || 'ไม่มีรายละเอียดเพิ่มเติม'}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-slate-200/50 mt-3 gap-2">
                        <div className="flex space-x-2 flex-1">
                            <a href={`tel:${req.phone}`} className="flex items-center justify-center text-slate-700 hover:text-white hover:bg-green-600 border border-slate-300 hover:border-green-600 px-3 py-1.5 rounded-lg transition-all text-sm font-bold shadow-sm group">
                                <i className="fas fa-phone-alt mr-2 text-green-600 group-hover:text-white"></i> 
                                <span className="hidden sm:inline">{req.phone}</span>
                                <span className="sm:hidden">โทร</span>
                            </a>
                            <button 
                                onClick={() => handleCopyCoords(req.location.lat, req.location.lng)}
                                className="flex items-center justify-center px-3 py-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors shadow-sm"
                                title="คัดลอกพิกัด GPS"
                            >
                                <i className="fas fa-map-marker-alt"></i>
                            </button>
                        </div>
                        
                        <div className="relative min-w-[130px]">
                            <select 
                                value={req.status}
                                onChange={(e) => onUpdateStatus(req.id, e.target.value as RequestStatus)}
                                className={`w-full appearance-none pl-8 pr-8 py-1.5 rounded-lg text-xs font-bold border focus:ring-2 ${sConf.color} bg-white border-slate-200 shadow-sm`}
                            >
                                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <i className={`fas ${sConf.icon} absolute left-3 top-2 pointer-events-none ${sConf.color} text-xs`}></i>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Manual Add Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg h-[85vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]">
                  <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center shrink-0">
                      <h3 className="font-bold text-lg"><i className="fas fa-plus-circle mr-2"></i> เพิ่มเคสช่วยเหลือ (Manual)</h3>
                      <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                          <i className="fas fa-times text-xl"></i>
                      </button>
                  </div>
                  <div className="flex-1 overflow-hidden relative">
                     <RequestForm 
                        onSubmit={handleManualAdd} 
                        isAdmin={true} 
                        onCancel={() => setIsAddModalOpen(false)}
                     />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
