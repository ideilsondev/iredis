import { useEffect, useState, useMemo } from 'react';
import { getConnections, setActiveConnection as setActiveConnectionDb, deleteConnection, ConnectionRecord } from '../../api/connections';
import { useAppStore } from '../../stores/appStore';
import { useDialogStore } from '../../stores/dialogStore';
import { Database, Check, Search, Edit2, Trash2 } from 'lucide-react';
import ConnectionForm from './ConnectionForm';
import DraggableWindow from '../ui/DraggableWindow';

export default function ConnectionList() {
  const [connections, setConnections] = useState<ConnectionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const { activeConnection, setActiveConnection, isConnectionFormOpen, editingConn, setConnectionFormOpen } = useAppStore();
  const { showDialog } = useDialogStore();

  const fetchConnections = async () => {
    try {
      const data = await getConnections();
      setConnections(data);
      // Auto-connect to default if no active connection exists
      if (!activeConnection && data.length > 0) {
        const defaultConn = data.find(c => c.isDefault);
        if (defaultConn) {
          handleSelect(defaultConn);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleSelect = async (conn: ConnectionRecord) => {
    try {
      await setActiveConnectionDb(conn.id);
      setActiveConnection(conn);
    } catch (e) {
      showDialog({
        title: 'Falha ao Conectar',
        message: String(e),
        type: 'error'
      });
    }
  };

  const handleDelete = (id: string, name: string) => {
    showDialog({
      title: 'Confirmar Exclusão',
      message: `Deseja realmente remover a conexão "${name}"?`,
      type: 'confirm',
      confirmText: 'Excluir',
      onConfirm: async () => {
        try {
          await deleteConnection(id);
          if (activeConnection?.id === id) setActiveConnection(null);
          await fetchConnections();
        } catch (e) {
          showDialog({ title: 'Erro', message: String(e), type: 'error' });
        }
      }
    });
  };

  const openEditForm = (conn: ConnectionRecord) => {
    setConnectionFormOpen(true, conn);
  };

  const filteredConnections = useMemo(() => {
    if (!searchQuery) return connections;
    const q = searchQuery.toLowerCase();
    return connections.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.host.toLowerCase().includes(q)
    );
  }, [connections, searchQuery]);

  return (
    <div className="flex flex-col gap-4 relative">
      <div className="flex justify-between items-center">
        {connections.length > 0 ? (
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Pesquisar conexões..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-input border border-border rounded-sm pl-9 pr-3 py-1.5 text-[13px] text-foreground focus:bg-secondary outline-none"
            />
          </div>
        ) : <div />}
      </div>

      <div className="border border-border bg-card rounded-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-secondary/50 border-b border-border text-xs text-muted-foreground uppercase">
              <th className="py-2 px-4 font-medium w-8">Ativa</th>
              <th className="py-2 px-4 font-medium">Nome</th>
              <th className="py-2 px-4 font-medium">Host</th>
              <th className="py-2 px-4 font-medium">Porta</th>
              <th className="py-2 px-4 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {connections.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground italic">
                  Nenhuma conexão configurada.
                </td>
              </tr>
            ) : filteredConnections.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground italic">
                  Nenhuma conexão encontrada para "{searchQuery}".
                </td>
              </tr>
            ) : (
              filteredConnections.map(conn => (
                <tr key={conn.id} className={`border-b border-border last:border-0 hover:bg-secondary/30 transition-colors ${activeConnection?.id === conn.id ? 'bg-[#DC382D]/5' : ''}`}>
                  <td className="py-2 px-4">
                    {activeConnection?.id === conn.id && <Check size={16} className="text-[#DC382D]" />}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-[#4F81BD]" />
                      <span className="text-[13px] font-medium text-foreground">{conn.name}</span>
                      {conn.isDefault && <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded-sm border border-border">Padrão</span>}
                    </div>
                  </td>
                  <td className="py-2 px-4 text-[13px] text-muted-foreground">{conn.host}</td>
                  <td className="py-2 px-4 text-[13px] text-muted-foreground">{conn.port}</td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={() => handleSelect(conn)}
                        disabled={activeConnection?.id === conn.id}
                        className="px-2 py-1 text-xs bg-secondary text-foreground rounded-sm hover:bg-muted border border-border disabled:opacity-50"
                      >
                        Conectar
                      </button>
                      <button 
                        onClick={() => openEditForm(conn)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-sm transition-colors"
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(conn.id, conn.name)}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-sm transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isConnectionFormOpen && (
        <DraggableWindow 
          title={editingConn ? 'Editar Conexão' : 'Nova Conexão'} 
          onClose={() => setConnectionFormOpen(false)}
          width="w-[500px]"
        >
          <ConnectionForm 
            initialData={editingConn} 
            onSuccess={() => {
              setConnectionFormOpen(false);
              fetchConnections();
            }} 
            onCancel={() => setConnectionFormOpen(false)}
          />
        </DraggableWindow>
      )}
    </div>
  );
}
