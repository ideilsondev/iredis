import { useEffect, useState } from 'react';
import { scanKeys, deleteKey } from '../../api/keys';
import { useAppStore } from '../../stores/appStore';
import { Search, RefreshCw, Key, Edit2, Trash2, Database } from 'lucide-react';
import { useDialogStore } from '../../stores/dialogStore';
import NewKeyDialog from '../keys/NewKeyDialog';
import KeyEditorModal from '../keys/KeyEditorModal';

export default function KeyTable() {
  const { activeConnection, activeKey, setActiveKey, isNewKeyDialogOpen, setNewKeyDialogOpen } = useAppStore();
  const { showDialog } = useDialogStore();
  
  const [keys, setKeys] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [pattern, setPattern] = useState('*');
  const [loading, setLoading] = useState(false);

  const fetchKeys = async (reset: boolean = false) => {
    if (!activeConnection) return;
    
    try {
      setLoading(true);
      const currentCursor = reset ? 0 : cursor;
      // Fetch more keys at once for table view
      const res = await scanKeys(pattern, currentCursor, 500);
      
      if (reset) {
        setKeys(res.keys);
      } else {
        setKeys(prev => Array.from(new Set([...prev, ...res.keys])));
      }
      setCursor(res.cursor);
    } catch (e) {
      showDialog({ title: 'Erro de Leitura', message: String(e), type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeConnection) {
      fetchKeys(true);
    } else {
      setKeys([]);
      setCursor(0);
    }
  }, [activeConnection]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchKeys(true);
  };

  const handleDeleteKey = (e: React.MouseEvent, keyToDelete: string) => {
    e.stopPropagation();
    showDialog({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja apagar a chave:\n${keyToDelete}?`,
      type: 'confirm',
      confirmText: 'Excluir',
      onConfirm: async () => {
        try {
          await deleteKey(keyToDelete);
          showDialog({ title: 'Sucesso', message: 'Chave excluída com sucesso.', type: 'success' });
          fetchKeys(true);
        } catch (error) {
          showDialog({ title: 'Erro', message: String(error), type: 'error' });
        }
      }
    });
  };

  if (!activeConnection) return null;

  return (
    <div className="flex flex-col w-full h-full bg-background relative">
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

      {/* Table Toolbar */}
      <div className="flex justify-between items-center p-2 border-b border-border bg-secondary/20 shrink-0">
        <form onSubmit={handleSearch} className="relative flex items-center w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <input 
            type="text" 
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="Pesquisar chave (ex: user:*)"
            className="w-full pl-9 pr-8 py-1.5 text-[13px] bg-input border border-border rounded-sm focus:bg-background outline-none"
          />
          <button 
            type="button" 
            onClick={() => fetchKeys(true)}
            className="absolute right-1 p-1.5 hover:bg-muted rounded-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
        </form>
        <div className="text-xs text-muted-foreground pr-2">
          {keys.length} chave(s) carregada(s)
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto bg-card">
        <table className="w-full text-left border-collapse select-none">
          <thead>
            <tr className="bg-secondary/50 border-b border-border text-xs text-muted-foreground uppercase sticky top-0 z-10">
              <th className="py-2 px-4 font-medium w-10 text-center">#</th>
              <th className="py-2 px-4 font-medium">Nome da Chave</th>
              <th className="py-2 px-4 font-medium w-24 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {keys.length === 0 && !loading ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-sm text-muted-foreground italic">
                  Nenhuma chave encontrada.
                </td>
              </tr>
            ) : (
              keys.map((k, index) => (
                <tr 
                  key={k} 
                  onDoubleClick={() => setActiveKey(k)}
                  className={`border-b border-border/50 hover:bg-secondary/30 transition-colors group cursor-default ${activeKey === k ? 'bg-primary/5' : ''}`}
                >
                  <td className="py-2 px-4 text-xs text-muted-foreground text-center">
                    {index + 1}
                  </td>
                  <td className="py-2 px-4">
                    <div className="flex items-center gap-2">
                      <Key size={14} className="text-[#4F81BD]" />
                      <span className="text-[13px] font-mono text-foreground truncate max-w-2xl">{k}</span>
                    </div>
                  </td>
                  <td className="py-1 px-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => setActiveKey(k)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-sm transition-colors"
                        title="Editar/Visualizar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteKey(e, k)}
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
            
            {/* Loading Indicator */}
            {loading && (
              <tr>
                <td colSpan={3} className="py-4 text-center text-xs text-muted-foreground">
                  Carregando...
                </td>
              </tr>
            )}
            
            {/* Load More Row */}
            {cursor !== 0 && !loading && (
              <tr>
                <td colSpan={3} className="py-2 text-center border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <button 
                    onClick={() => fetchKeys(false)}
                    className="w-full py-1 text-xs text-[#4F81BD] hover:underline"
                  >
                    Carregar mais registros...
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isNewKeyDialogOpen && (
        <NewKeyDialog 
          onClose={() => setNewKeyDialogOpen(false)}
          onSuccess={(newKey) => {
            fetchKeys(true);
            setActiveKey(newKey);
          }}
        />
      )}

      {/* When activeKey is set, open KeyEditorModal */}
      {activeKey && (
        <KeyEditorModal 
          onClose={() => setActiveKey(null)} 
          onDeleted={() => {
            setActiveKey(null);
            fetchKeys(true); // refresh after delete
          }}
        />
      )}
    </div>
  );
}
