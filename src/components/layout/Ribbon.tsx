import { useAppStore } from '../../stores/appStore';
import { FileText, Radio, Database, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function Ribbon() {
  const { setConnectionFormOpen, setNewKeyDialogOpen, setNewChannelDialogOpen, activeConnection, activeTab, setActiveTab, unreadEvents } = useAppStore();

  return (
    <header className="w-full bg-secondary border-b border-border select-none">
      {/* Tabs Row */}
      <nav className="flex px-2 pt-2 gap-1 border-b border-border/50">
        <button 
          onClick={() => setActiveTab('connections')}
          className={cn(
            "px-4 py-1.5 text-xs rounded-t border-t border-x transition-colors z-10 -mb-px",
            activeTab === 'connections'
              ? "bg-background border-border text-foreground" 
              : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Conexões
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={cn(
            "px-4 py-1.5 text-xs rounded-t border-t border-x transition-colors z-10 -mb-px relative flex items-center gap-2",
            activeTab === 'dashboard'
              ? "bg-background border-border text-foreground" 
              : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Dashboard
        </button>
        <button 
          onClick={() => setActiveTab('keys')}
          className={cn(
            "px-4 py-1.5 text-xs rounded-t border-t border-x transition-colors z-10 -mb-px",
            activeTab === 'keys'
              ? "bg-background border-border text-foreground" 
              : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Chaves
        </button>
        <button 
          onClick={() => setActiveTab('events')}
          className={cn(
            "px-4 py-1.5 text-xs rounded-t border-t border-x transition-colors z-10 -mb-px relative flex items-center gap-2",
            activeTab === 'events'
              ? "bg-background border-border text-foreground" 
              : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          Eventos (Pub/Sub)
          {unreadEvents > 0 && (
            <span className="bg-[#DC382D] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
              {unreadEvents > 99 ? '99+' : unreadEvents}
            </span>
          )}
        </button>
      </nav>
      
      {/* Ribbon Content Row (Home) */}
      <div className="flex p-2 gap-4 bg-background min-h-[92px]">
          <div className="flex flex-col items-center gap-1 pr-4 border-r border-border">
            <div className="flex gap-1">
              {activeTab === 'connections' ? (
                <button 
                  onClick={() => setConnectionFormOpen(true)}
                  className="flex flex-col items-center p-2 hover:bg-muted rounded text-xs min-w-[60px]"
                >
                  <Database className="w-6 h-6 mb-1 text-[#4F81BD]" />
                  Nova Conexão
                </button>
              ) : activeTab === 'keys' ? (
                <button 
                  onClick={() => setNewKeyDialogOpen(true)}
                  disabled={!activeConnection}
                  className="flex flex-col items-center p-2 hover:bg-muted rounded text-xs min-w-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-6 h-6 mb-1 text-[#4F81BD]" />
                  Nova Chave
                </button>
              ) : activeTab === 'events' ? (
                <button 
                  onClick={() => setNewChannelDialogOpen(true)}
                  disabled={!activeConnection}
                  className="flex flex-col items-center p-2 hover:bg-muted rounded text-xs min-w-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Radio className="w-6 h-6 mb-1 text-[#4F81BD]" />
                  Novo Canal
                </button>
              ) : activeTab === 'dashboard' ? (
                <button 
                  disabled={!activeConnection}
                  className="flex flex-col items-center p-2 hover:bg-muted rounded text-xs min-w-[60px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Activity className="w-6 h-6 mb-1 text-[#4F81BD]" />
                  Estatísticas
                </button>
              ) : null}
            </div>
            <span className="text-[11px] text-muted-foreground uppercase tracking-wider">Operações</span>
          </div>
        </div>
    </header>
  );
}
