import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../../stores/appStore';
import { Activity, Server, Cpu, Users, HardDrive, Clock, Database } from 'lucide-react';
import { cn } from '../../lib/utils';

interface RedisInfoPayload {
  version: string;
  os: string;
  uptimeInDays: string;
  connectedClients: string;
  usedMemoryHuman: string;
  usedMemoryPeakHuman: string;
  usedMemoryBytes: number;
  usedMemoryPeakBytes: number;
  usedCpuSys: string;
  usedCpuUser: string;
  totalKeys: number;
}

export default function DashboardWorkspace() {
  const { activeConnection, activeTab } = useAppStore();
  const [info, setInfo] = useState<RedisInfoPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registeredConnections, setRegisteredConnections] = useState<number>(0);

  useEffect(() => {
    if (activeTab !== 'dashboard' || !activeConnection) return;

    const fetchInfo = async () => {
      try {
        // Fetch server info
        const result = await invoke<RedisInfoPayload>('get_server_info', {
          connectionId: activeConnection.id,
        });
        setInfo(result);
        
        // Fetch saved connections
        const conns = await invoke<any[]>('get_connections');
        setRegisteredConnections(conns.length);
        
        setError(null);
      } catch (err) {
        console.error('Failed to fetch Redis info:', err);
        setError(err as string);
      }
    };

    // Fetch immediately
    fetchInfo();

    // Poll every 3 seconds
    const interval = setInterval(fetchInfo, 3000);
    return () => clearInterval(interval);
  }, [activeConnection, activeTab]);

  if (!activeConnection) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground h-full">
        <Activity className="w-12 h-12 mb-4 opacity-20" />
        <p>Conecte-se a um servidor Redis para visualizar o Dashboard.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-6 flex flex-col items-center justify-center h-full">
        <div className="text-destructive font-semibold mb-2">Erro de Conexão</div>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  if (!info) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full text-muted-foreground animate-pulse">
        <Activity className="w-8 h-8 mb-4 opacity-50 animate-spin" />
        <p className="text-sm">Carregando métricas em tempo real...</p>
      </div>
    );
  }

  // Calculate Memory Percentage
  const peak = info.usedMemoryPeakBytes || 1; // avoid division by zero
  const memoryPercent = Math.min((info.usedMemoryBytes / peak) * 100, 100);

  return (
    <div className="flex-1 p-6 bg-background overflow-auto h-full space-y-6">
      
      <div className="flex items-center gap-4 mb-6">
        <div className="bg-primary/10 p-3 rounded-xl shadow-sm border border-primary/20">
          <Activity className="w-7 h-7 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Dashboard
            <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20">
              Online
            </span>
          </h2>
          <p className="text-sm text-muted-foreground">Monitoramento em tempo real do servidor <span className="font-medium text-foreground">{activeConnection.name}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        {/* Saved Connections Card (New) */}
        <div className="bg-gradient-to-br from-card to-secondary/30 border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-semibold text-muted-foreground">Conexões Salvas</span>
          </div>
          <div className="text-4xl font-bold text-foreground mt-auto">{registeredConnections}</div>
          <div className="text-xs text-muted-foreground mt-2">Bancos cadastrados no iRedis</div>
        </div>

        {/* Memory Card */}
        <div className="bg-gradient-to-br from-card to-secondary/30 border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex flex-col xl:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <HardDrive className="w-5 h-5 text-primary" />
            <span className="text-sm font-semibold text-muted-foreground">Uso de Memória</span>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{info.usedMemoryHuman}</div>
          <div className="text-xs text-muted-foreground mb-5">Pico Histórico: <span className="font-medium text-foreground">{info.usedMemoryPeakHuman}</span></div>
          
          <div className="mt-auto">
            <div className="flex justify-between text-[11px] mb-1.5 font-medium uppercase tracking-wider">
              <span className="text-muted-foreground">Uso vs Pico</span>
              <span className={memoryPercent > 80 ? "text-[#DC382D]" : "text-primary"}>{memoryPercent.toFixed(1)}%</span>
            </div>
            <div className="h-2.5 w-full bg-secondary/80 rounded-full overflow-hidden shadow-inner">
              <div 
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out",
                  memoryPercent > 80 ? "bg-gradient-to-r from-red-500 to-[#DC382D]" : "bg-gradient-to-r from-blue-400 to-primary"
                )}
                style={{ width: `${memoryPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Clients Card */}
        <div className="bg-gradient-to-br from-card to-secondary/30 border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-emerald-500" />
            <span className="text-sm font-semibold text-muted-foreground">Clientes Conectados</span>
          </div>
          <div className="text-4xl font-bold text-foreground mt-auto">{info.connectedClients}</div>
          <div className="text-xs text-muted-foreground mt-2">Sessões simultâneas ativas</div>
        </div>

        {/* Keys Card */}
        <div className="bg-gradient-to-br from-card to-secondary/30 border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-semibold text-muted-foreground">Total de Chaves</span>
          </div>
          <div className="text-4xl font-bold text-foreground mt-auto">{info.totalKeys.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground mt-2">Registros no DB selecionado</div>
        </div>

        {/* CPU Card */}
        <div className="bg-gradient-to-br from-card to-secondary/30 border border-border shadow-sm hover:shadow-md transition-shadow rounded-xl p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-semibold text-muted-foreground">Uso de CPU</span>
          </div>
          <div className="flex justify-between mt-auto mb-3 items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Sistema</span>
            <span className="font-bold text-lg">{info.usedCpuSys}</span>
          </div>
          <div className="flex justify-between items-end">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Usuário</span>
            <span className="font-bold text-lg">{info.usedCpuUser}</span>
          </div>
        </div>
      </div>

      {/* Info Details Panel */}
      <div className="bg-card border border-border shadow-sm rounded-xl p-6 mt-6">
        <div className="flex items-center gap-2 mb-6 border-b border-border/50 pb-4">
          <Server className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground tracking-tight">Informações do Host</h3>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-8">
          <div>
            <div className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Versão Redis</div>
            <div className="font-medium text-sm text-foreground">{info.version}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Sistema Operacional</div>
            <div className="font-medium text-sm text-foreground">{info.os}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Uptime (Dias)</div>
            <div className="font-medium text-sm text-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-primary" />
              {info.uptimeInDays}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Modo do Servidor</div>
            <div className="font-medium text-sm text-foreground">Standalone</div>
          </div>
        </div>
      </div>

    </div>
  );
}
