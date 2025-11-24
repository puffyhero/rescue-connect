
import React, { useState } from 'react';
import { Header } from './components/Header';
import { FloodStatus } from './components/FloodStatus';
import { NewsSection } from './components/NewsSection';
import { ChatBot } from './components/ChatBot';
import { RequestForm } from './components/RequestForm';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLogin } from './components/AdminLogin';
import { MapDashboard } from './components/MapDashboard';
import { useFloodMonitor } from './hooks/useFloodMonitor';
import { APP_CONFIG } from './utils/constants';

export default function App() {
  // 1. Determine Mode (Check URL param OR Debug Flag)
  const [isAdminMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('mode') === 'admin' || APP_CONFIG.IS_DEBUG_MODE;
    }
    return false;
  });

  // 2. State & Logic (via Hook)
  const { situation, requests } = useFloodMonitor(isAdminMode);
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'chat' | 'request' | 'admin'>(
    isAdminMode ? 'admin' : 'request'
  );
  
  // Auth State: Only true if Debug Mode is ON, otherwise must login
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(APP_CONFIG.IS_DEBUG_MODE);

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto bg-white shadow-xl overflow-hidden md:border-x md:border-slate-200">
      <Header 
        onRefresh={situation.refresh} 
        isLoading={situation.loading === 'loading'} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        isAdminMode={isAdminMode}
      />
      
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'dashboard' && (
           <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 scrollbar-hide">
             <FloodStatus data={situation.data} loading={situation.loading} />
             <NewsSection data={situation.data} loading={situation.loading} />
           </div>
        )}
        
        {activeTab === 'map' && (
          <MapDashboard 
            requests={requests.data} 
            onRefresh={requests.refresh} 
            isLoading={requests.loading} 
            error={requests.error}
          />
        )}
        
        {activeTab === 'chat' && <ChatBot />}

        {activeTab === 'request' && !isAdminMode && (
          <RequestForm onSubmit={requests.add} />
        )}

        {activeTab === 'admin' && isAdminMode && (
          <>
            {!isAdminAuthenticated ? (
              <AdminLogin onLogin={() => setIsAdminAuthenticated(true)} />
            ) : (
              <AdminDashboard 
                requests={requests.data} 
                onUpdateStatus={requests.updateStatus} 
                onRefresh={requests.refresh}
                onAddRequest={requests.add}
                isLoading={requests.loading}
                error={requests.error}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
