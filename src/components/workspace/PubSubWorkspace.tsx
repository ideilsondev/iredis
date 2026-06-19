import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '../../stores/appStore';
import { subscribeToChannel, unsubscribeFromChannel, publishToChannel, PubSubMessage } from '../../api/pubsub';
import { listen } from '@tauri-apps/api/event';
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import { Send, Trash2, Eraser, Database, Activity } from 'lucide-react';

import SubscribeDialog from './SubscribeDialog';

export default function PubSubWorkspace() {
  const { activeConnection, savedChannels, saveChannel, removeSavedChannel, isNewChannelDialogOpen, setNewChannelDialogOpen } = useAppStore();
  const connId = activeConnection?.id;
  const currentSubscriptions = connId ? (savedChannels[connId] || []) : [];
  const [messages, setMessages] = useState<PubSubMessage[]>([]);
  const [publishChannel, setPublishChannel] = useState('');
  const [publishMessage, setPublishMessage] = useState('');
  
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const subsRef = useRef(currentSubscriptions);
  useEffect(() => {
    subsRef.current = currentSubscriptions;
  }, [currentSubscriptions]);

  // Automatically subscribe to saved channels when connection becomes active
  useEffect(() => {
    if (!connId) return;
    
    currentSubscriptions.forEach(ch => {
      subscribeToChannel(connId, ch).catch(console.error);
    });

    return () => {
      // Cleanup subscriptions only on actual unmount (disconnect)
      subsRef.current.forEach(ch => {
        unsubscribeFromChannel(ch).catch(console.error);
      });
    };
  }, [connId]);

  useEffect(() => {
    let unmounted = false;
    
    const setupListener = async () => {
      const unlisten = await listen<PubSubMessage>('pubsub-message', async (event) => {
        const payload = event.payload;
        if (!unmounted) {
          setMessages((prev) => [...prev, payload]);
          
          const currentStore = useAppStore.getState();
          if (currentStore.activeTab !== 'events') {
            currentStore.incrementUnreadEvents();
          }
        
          // Trigger Native OS Notification and In-App Visual Toast
          try {
            const currentStore = useAppStore.getState();
            currentStore.setInAppNotification({
              title: `Canal: ${payload.channel}`,
              body: payload.payload.length > 50 ? payload.payload.substring(0, 50) + '...' : payload.payload
            });
            
            // Auto clear toast after 4s (handled in AppShell)
            
            let permissionGranted = await isPermissionGranted();
            if (!permissionGranted) {
              const permission = await requestPermission();
              permissionGranted = permission === 'granted';
            }
            if (permissionGranted) {
              sendNotification({ 
                title: `Canal: ${payload.channel}`, 
                body: payload.payload.length > 50 ? payload.payload.substring(0, 50) + '...' : payload.payload,
              });
            }
          } catch (e) {
            console.error('Falha ao enviar notificação:', e);
          }
        }
      });
      return unlisten;
    };

    const unlistenPromise = setupListener();

    return () => {
      unmounted = true;
      unlistenPromise.then((f) => f());
    };
  }, []); // Run only once on mount

  const handleSubscribe = async (newChannel: string) => {
    if (!connId) return;
    try {
      await subscribeToChannel(connId, newChannel);
      saveChannel(connId, newChannel);
      setPublishChannel(newChannel);
      setNewChannelDialogOpen(false);
    } catch (err) {
      alert(`Erro: ${err}`);
    }
  };

  const handleUnsubscribe = async (channel: string) => {
    try {
      await unsubscribeFromChannel(channel);
      if (connId) {
        removeSavedChannel(connId, channel);
      }
    } catch (err) {
      alert(`Erro: ${err}`);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publishChannel.trim() || !publishMessage.trim()) return;
    try {
      await publishToChannel(publishChannel, publishMessage);
      setPublishMessage('');
    } catch (err) {
      alert(`Erro ao publicar: ${err}`);
    }
  };

  if (!activeConnection) return null;

  return (
    <div className="flex flex-col w-full h-full bg-background relative z-0">
      {/* Active Connection Banner */}
      <div className="bg-secondary/40 px-4 py-2 border-b border-border flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <Database size={15} className="text-[#DC382D]" />
          <span className="font-semibold text-[13px] text-foreground">{activeConnection.name}</span>
        </div>
        <span className="text-[12px] font-mono text-muted-foreground opacity-80 border-l border-border pl-3">
          {activeConnection.host}:{activeConnection.port}
        </span>
        {activeConnection.isDefault && (
          <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-sm border border-border ml-1">Padrão</span>
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left Panel - Subscriptions */}
        <div className="w-72 border-r border-border bg-card flex flex-col shrink-0">
          <div className="p-2 border-b border-border bg-secondary/20 font-medium text-[13px] text-foreground flex items-center gap-2">
            <Activity size={14} className="text-[#4F81BD]" />
            Canais Inscritos
          </div>

          <div className="flex-1 overflow-auto bg-card">
            <table className="w-full text-left border-collapse select-none">
              <tbody>
                {currentSubscriptions.map(ch => (
                  <tr 
                    key={ch} 
                    onClick={() => setPublishChannel(ch)}
                    className={`border-b border-border/50 hover:bg-secondary/30 transition-colors group cursor-default ${publishChannel === ch ? 'bg-primary/5' : ''}`}
                  >
                    <td className="py-2 px-3">
                      <span className="text-[13px] font-mono text-foreground truncate max-w-[200px] block" title={ch}>{ch}</span>
                    </td>
                    <td className="py-1 px-2 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleUnsubscribe(ch); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-all"
                        title="Desinscrever"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {currentSubscriptions.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-6 text-center text-xs text-muted-foreground italic">
                      Nenhum canal ativo
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Main Panel - Messages & Publish */}
        <div className="flex-1 flex flex-col min-w-0 bg-background">
          <div className="flex justify-between items-center p-2 border-b border-border bg-secondary/20 shrink-0">
            <div className="text-[13px] font-medium text-foreground px-2">Monitor de Eventos</div>
            <button 
              onClick={() => setMessages([])} 
              className="flex items-center gap-1.5 px-3 py-1 text-xs bg-secondary hover:bg-muted border border-border rounded-sm text-foreground transition-colors disabled:opacity-50"
              disabled={messages.length === 0}
            >
              <Eraser size={13} /> Limpar Log
            </button>
          </div>

          {/* Messages Log (Standard Style) */}
          <div className="flex-1 overflow-auto p-4 bg-card text-foreground font-mono text-[13px] relative selection:bg-primary/20">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground italic select-none">
                Aguardando mensagens...
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="mb-1 flex items-start gap-3 hover:bg-secondary/30 p-1 -mx-1 rounded transition-colors break-all">
                  <span className="text-muted-foreground/70 shrink-0 select-none">[{new Date(msg.timestamp).toLocaleTimeString()}]</span>
                  <span 
                    className="text-[#4F81BD] font-bold shrink-0 select-none cursor-pointer hover:underline" 
                    onClick={() => setPublishChannel(msg.channel)}
                    title={`Publicar em ${msg.channel}`}
                  >
                    [{msg.channel}]
                  </span>
                  <span className="whitespace-pre-wrap flex-1 text-foreground/90">{msg.payload}</span>
                </div>
              ))
            )}
            <div ref={endOfMessagesRef} />
          </div>

          {/* Publish Footer */}
          <div className="p-2 border-t border-border bg-secondary/20 shrink-0 flex items-center">
            <form onSubmit={handlePublish} className="flex gap-2 w-full">
              <input 
                type="text" 
                placeholder="Canal destino..." 
                value={publishChannel}
                onChange={(e) => setPublishChannel(e.target.value)}
                className="w-48 px-3 py-1.5 text-[13px] bg-input border border-border rounded-sm focus:bg-background outline-none font-mono"
              />
              <input 
                type="text" 
                placeholder="Escreva a mensagem para publicar..." 
                value={publishMessage}
                onChange={(e) => setPublishMessage(e.target.value)}
                className="flex-1 px-3 py-1.5 text-[13px] bg-input border border-border rounded-sm focus:bg-background outline-none"
              />
              <button 
                type="submit" 
                className="bg-[#4F81BD] text-white px-4 py-1.5 text-[13px] rounded-sm hover:brightness-110 flex items-center gap-2 border border-[#1F497D] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                disabled={!publishChannel || !publishMessage}
              >
                <Send size={14} /> Publicar
              </button>
            </form>
          </div>
        </div>
      </div>

      {isNewChannelDialogOpen && (
        <SubscribeDialog 
          onClose={() => setNewChannelDialogOpen(false)}
          onSuccess={handleSubscribe}
        />
      )}
    </div>
  );
}
