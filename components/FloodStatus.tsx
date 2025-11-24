import React from 'react';
import ReactMarkdown from 'react-markdown';
import { FloodData, LoadingState } from '../types';

interface FloodStatusProps {
  data: FloodData | null;
  loading: LoadingState;
}

export const FloodStatus: React.FC<FloodStatusProps> = ({ data, loading }) => {
  if (loading === 'loading') {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-200 rounded w-full"></div>
          <div className="h-4 bg-slate-200 rounded w-5/6"></div>
          <div className="h-4 bg-slate-200 rounded w-4/6"></div>
        </div>
      </div>
    );
  }

  if (loading === 'error') {
    return (
      <div className="bg-red-50 rounded-xl border border-red-200 p-6 text-red-700 flex items-center space-x-4">
        <i className="fas fa-exclamation-triangle text-2xl"></i>
        <div>
          <h3 className="font-bold">เกิดข้อผิดพลาด</h3>
          <p>ไม่สามารถโหลดข้อมูลได้ โปรดลองใหม่อีกครั้ง</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="font-bold text-slate-800 flex items-center">
          <i className="fas fa-info-circle text-blue-500 mr-2"></i>
          รายงานสถานการณ์ล่าสุด
        </h2>
        <span className="text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
           อัปเดตโดย AI
        </span>
      </div>
      <div className="p-6 prose prose-slate max-w-none prose-headings:text-slate-800 prose-p:text-slate-600 prose-strong:text-slate-900 prose-a:text-blue-600">
        <ReactMarkdown>{data.summary}</ReactMarkdown>
      </div>
    </div>
  );
};