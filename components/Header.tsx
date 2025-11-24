
import React from 'react';

interface HeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  activeTab: 'dashboard' | 'map' | 'chat' | 'request' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'map' | 'chat' | 'request' | 'admin') => void;
  isAdminMode: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onRefresh, isLoading, activeTab, setActiveTab, isAdminMode }) => {
  return (
    <header className={`${isAdminMode ? 'bg-slate-800' : 'bg-blue-600'} text-white shadow-md z-10 shrink-0 transition-colors duration-300`}>
      <div className="px-4 py-4 md:px-6">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm ${isAdminMode ? 'bg-red-500' : 'bg-white/20'}`}>
                {isAdminMode ? <i className="fas fa-shield-alt text-xl"></i> : <i className="fas fa-life-ring text-xl"></i>}
            </div>
            <div>
              <h1 className="text-xl font-bold leading-tight">
                {isAdminMode ? 'Hat Yai Command Center' : 'Hat Yai Flood Monitor'}
              </h1>
              <p className="text-blue-100 text-xs opacity-80">
                {isAdminMode ? 'ระบบบริหารจัดการภัยพิบัติ (เจ้าหน้าที่)' : 'ศูนย์ประสานงานช่วยเหลือผู้ประสบภัย'}
              </p>
            </div>
          </div>
          {activeTab === 'dashboard' && !isAdminMode && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-2 rounded-full hover:bg-white/10 transition-all ${isLoading ? 'animate-spin' : ''}`}
              aria-label="Refresh data"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          )}
        </div>

        <nav className="flex space-x-1 overflow-x-auto scrollbar-hide">
          {/* Common Tabs: Map & Chat */}
          {!isAdminMode && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'border-white text-white bg-white/10'
                  : 'border-transparent text-blue-100 hover:bg-white/5'
              }`}
            >
              <i className="fas fa-chart-line mr-1"></i> ภาพรวม
            </button>
          )}

          {/* Admin Tab (Only visible in Admin Mode) */}
          {isAdminMode && (
             <button
              onClick={() => setActiveTab('admin')}
              className={`flex-1 min-w-[100px] py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'admin'
                  ? 'border-white text-white bg-white/10'
                  : 'border-transparent text-slate-300 hover:bg-white/5'
              }`}
            >
              <i className="fas fa-users-cog mr-1"></i> จัดการเคส
            </button>
          )}

          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'map'
                ? 'border-white text-white bg-white/10'
                : 'border-transparent text-blue-100 hover:bg-white/5'
            }`}
          >
            <i className="fas fa-map-marked-alt mr-1"></i> แผนที่
          </button>

          {/* Request Tab (Hidden in Admin Mode to reduce clutter/errors) */}
          {!isAdminMode && (
            <button
              onClick={() => setActiveTab('request')}
              className={`flex-1 min-w-[100px] py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === 'request'
                  ? 'border-red-400 text-white bg-red-500/20'
                  : 'border-transparent text-red-100 hover:bg-white/5'
              }`}
            >
              <i className="fas fa-exclamation-circle mr-1 text-red-300"></i> แจ้งเหตุ
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 min-w-[80px] py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
              activeTab === 'chat'
                ? 'border-white text-white bg-white/10'
                : 'border-transparent text-blue-100 hover:bg-white/5'
            }`}
          >
            <i className="fas fa-robot mr-1"></i> AI
          </button>
        </nav>
      </div>
    </header>
  );
};
