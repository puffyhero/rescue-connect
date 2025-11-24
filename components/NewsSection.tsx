
import React, { useState } from 'react';
import { FloodData, LoadingState } from '../types';

interface NewsSectionProps {
  data: FloodData | null;
  loading: LoadingState;
}

// Helper to determine icon and label based on URL
const getSourceInfo = (url: string) => {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    
    if (hostname.includes('facebook')) return { icon: 'fa-facebook', color: 'text-blue-600', label: 'Facebook' };
    if (hostname.includes('twitter') || hostname.includes('x.com')) return { icon: 'fa-twitter', color: 'text-sky-500', label: 'X (Twitter)' };
    if (hostname.includes('youtube')) return { icon: 'fa-youtube', color: 'text-red-600', label: 'YouTube' };
    if (hostname.includes('tiktok')) return { icon: 'fa-tiktok', color: 'text-black', label: 'TikTok' };
    if (hostname.endsWith('.go.th')) return { icon: 'fa-building-columns', color: 'text-yellow-700', label: 'หน่วยงานรัฐ' };
    if (hostname.includes('tmd.go.th')) return { icon: 'fa-cloud-showers-heavy', color: 'text-blue-500', label: 'กรมอุตุฯ' };
    
    // Major Thai News Outlets
    const newsDomains = ['thairath', 'matichon', 'dailynews', 'thaipbs', 'pptvhd36', 'khaosod', 'bangkokbiznews', 'sanook', 'kapook'];
    if (newsDomains.some(d => hostname.includes(d))) {
      return { icon: 'fa-newspaper', color: 'text-emerald-600', label: 'สำนักข่าว' };
    }

    return { icon: 'fa-globe', color: 'text-slate-400', label: hostname };
  } catch {
    return { icon: 'fa-link', color: 'text-slate-400', label: 'Link' };
  }
};

export const NewsSection: React.FC<NewsSectionProps> = ({ data, loading }) => {
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  if (loading === 'loading' || !data) return null;

  // Filter valid chunks and remove duplicates based on URL
  const validChunks = data.groundingChunks
    .filter(c => c.web?.uri && c.web?.title)
    .filter((v, i, a) => a.findIndex(t => t.web?.uri === v.web?.uri) === i); // Unique

  if (validChunks.length === 0) return null;

  // Sort chunks based on selection (assuming API returns relevant/newest first)
  const sortedChunks = sortOrder === 'newest' 
    ? validChunks 
    : [...validChunks].reverse();

  return (
    <div className="space-y-3 mt-6">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
          <i className="fas fa-rss mr-2"></i> แหล่งข้อมูลอ้างอิง
        </h3>
        
        <div className="flex items-center space-x-3">
          <div className="flex items-center bg-white rounded-md border border-slate-200 px-2 py-1 shadow-sm">
            <i className={`fas fa-sort-amount-${sortOrder === 'newest' ? 'down' : 'up'} text-slate-400 text-xs mr-2`}></i>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
              className="text-xs border-none p-0 text-slate-600 focus:ring-0 bg-transparent cursor-pointer font-medium outline-none"
            >
              <option value="newest">ล่าสุด (Relevance)</option>
              <option value="oldest">เก่าที่สุด</option>
            </select>
          </div>
          <span className="text-xs text-slate-400">{validChunks.length} รายการ</span>
        </div>
      </div>
      
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sortedChunks.map((chunk, index) => {
          const { uri, title } = chunk.web!;
          const source = getSourceInfo(uri);

          return (
            <a
              key={`${uri}-${index}`}
              href={uri}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex flex-col bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all duration-200 overflow-hidden p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center ${source.color} group-hover:scale-110 transition-transform`}>
                   <i className={`fab ${source.icon} text-lg ${source.icon.startsWith('fa-') && !source.icon.startsWith('fa-facebook') ? 'fas' : ''}`}></i>
                </div>
                <div className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  {source.label}
                </div>
              </div>

              <h4 className="text-sm font-medium text-slate-800 group-hover:text-blue-700 leading-snug line-clamp-2 mb-2 min-h-[2.5em]">
                {title}
              </h4>

              <div className="mt-auto pt-2 border-t border-slate-100 flex items-center text-xs text-slate-400 group-hover:text-blue-500">
                <span className="truncate max-w-[80%]">{new URL(uri).hostname}</span>
                <i className="fas fa-arrow-right ml-auto transform group-hover:translate-x-1 transition-transform"></i>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
};
