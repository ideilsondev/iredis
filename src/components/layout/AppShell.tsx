import { useAppStore } from '../../stores/appStore';
import Ribbon from './Ribbon';
import CustomDialog from '../ui/CustomDialog';
import KeyTable from '../workspace/KeyTable';
import PubSubWorkspace from '../workspace/PubSubWorkspace';
import DashboardWorkspace from '../workspace/DashboardWorkspace';
import ConnectionList from '../connections/ConnectionList';
import { Database, Activity, BellRing, X } from 'lucide-react';
import { useEffect } from 'react';

export default function AppShell() {
  const { activeConnection, activeTab, inAppNotification, setInAppNotification } = useAppStore();

  // Auto-hide toast after 4s
  useEffect(() => {
    if (inAppNotification) {
      const timer = setTimeout(() => {
        setInAppNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [inAppNotification, setInAppNotification]);

  return (
    <div className="flex flex-col h-screen w-full bg-background overflow-hidden relative">
      <CustomDialog />
      <Ribbon />

      {/* Global In-App Toast Notification */}
      {inAppNotification && (
        <div className="absolute top-32 right-6 z-50 animate-in slide-in-from-right-4 fade-in duration-300">
          <div className="bg-card border-l-4 border-l-[#4F81BD] border border-border shadow-lg rounded-sm w-72 flex flex-col pointer-events-auto">
            <div className="flex items-center justify-between p-2 border-b border-border/50 bg-secondary/30">
              <span className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <BellRing size={12} className="text-[#4F81BD]" /> 
                {inAppNotification.title}
              </span>
              <button 
                onClick={() => setInAppNotification(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            </div>
            <div className="p-3 text-[13px] text-muted-foreground break-all">
              {inAppNotification.body}
            </div>
          </div>
        </div>
      )}
      
      {/* Main Workspace Area */}
      <main className="flex-1 overflow-hidden relative flex bg-card">
        {/* Connections Workspace is always accessible */}
        <div className={`flex-1 flex overflow-hidden ${activeTab === 'connections' ? '' : 'hidden'}`}>
          <div className="flex-1 overflow-auto p-4 bg-background">
            <ConnectionList />
          </div>
        </div>

        <div className={`flex-1 flex overflow-hidden ${activeTab === 'keys' ? '' : 'hidden'}`}>
          {activeConnection ? <KeyTable /> : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Database size={48} className="opacity-20 mb-4" />
              <p>Nenhuma conexão ativa. Vá em "Conexões" para conectar.</p>
            </div>
          )}
        </div>

        <div className={`flex-1 flex overflow-hidden ${activeTab === 'events' ? '' : 'hidden'}`}>
          {activeConnection ? <PubSubWorkspace /> : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <Activity size={48} className="opacity-20 mb-4" />
              <p>Nenhuma conexão ativa. Vá em "Conexões" para conectar.</p>
            </div>
          )}
        </div>

        <div className={`flex-1 flex overflow-hidden ${activeTab === 'dashboard' ? '' : 'hidden'}`}>
          <DashboardWorkspace />
        </div>
      </main>

      {/* Office 2010 Style Status Bar */}
      <footer className="h-6 bg-secondary border-t border-border flex items-center justify-between px-3 text-[11px] text-muted-foreground shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${activeConnection ? 'bg-green-500' : 'bg-red-500'}`} />
            {activeConnection ? `Conectado: ${activeConnection.name}` : 'Desconectado'}
          </span>
          {activeConnection && (
            <span className="flex items-center gap-1 opacity-80">
              <Activity size={12} /> {activeConnection.host}:{activeConnection.port}
            </span>
          )}
        </div>
        <div>
          iRedis v0.1.0
        </div>
      </footer>
    </div>
  );
}
