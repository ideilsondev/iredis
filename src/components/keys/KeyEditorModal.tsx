import { useEffect, useState } from 'react';
import { useAppStore } from '../../stores/appStore';
import { getKeyType, getString, deleteKey, setString, getTtl } from '../../api/keys';
import { useDialogStore } from '../../stores/dialogStore';
import { Trash2 } from 'lucide-react';
import DraggableWindow from '../ui/DraggableWindow';
import { Textarea } from '../ui/Textarea';

interface KeyEditorModalProps {
  onClose: () => void;
  onDeleted: () => void;
}

export default function KeyEditorModal({ onClose, onDeleted }: KeyEditorModalProps) {
  const { activeKey } = useAppStore();
  const { showDialog } = useDialogStore();
  
  const [type, setType] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [originalValue, setOriginalValue] = useState<string>('');
  const [ttl, setTtl] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!activeKey) return;
    
    const fetchValue = async () => {
      setLoading(true);
      try {
        const keyType = await getKeyType(activeKey);
        setType(keyType);
        
        try {
          const ttlVal = await getTtl(activeKey);
          setTtl(ttlVal);
        } catch (e) {
          console.error("Failed to get TTL", e);
        }
        
        if (keyType === 'string') {
          const val = await getString(activeKey);
          setValue(val);
          setOriginalValue(val);
        } else {
          setValue('Editor for this type is not yet implemented.');
        }
      } catch (e) {
        showDialog({ title: 'Erro de Leitura', message: String(e), type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    
    fetchValue();
  }, [activeKey]);

  const handleDelete = () => {
    showDialog({
      title: 'Confirmar Exclusão',
      message: `Tem certeza que deseja apagar a chave:\n${activeKey}?`,
      type: 'confirm',
      confirmText: 'Excluir',
      onConfirm: async () => {
        try {
          await deleteKey(activeKey!);
          showDialog({ title: 'Sucesso', message: 'Chave excluída com sucesso.', type: 'success' });
          onDeleted(); // triggers close and refresh
        } catch (e) {
          showDialog({ title: 'Erro', message: String(e), type: 'error' });
        }
      }
    });
  };

  const handleSave = async () => {
    if (!activeKey || type !== 'string') return;
    setSaving(true);
    try {
      await setString(activeKey, value);
      setOriginalValue(value);
      showDialog({ title: 'Sucesso', message: 'Valor salvo com sucesso!', type: 'success' });
    } catch (e) {
      showDialog({ title: 'Erro ao Salvar', message: String(e), type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = value !== originalValue;

  if (!activeKey) return null;

  return (
    <DraggableWindow title="Visualizador de Chave" onClose={onClose} width="w-[600px]" height="600px">
      <div className="flex-1 flex flex-col h-full bg-card overflow-hidden">
        
        {/* Key Info Banner */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-secondary/10 shrink-0">
          <div className="flex flex-col">
            <span className="font-mono text-sm text-foreground font-medium select-all">{activeKey}</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-[#4F81BD] uppercase font-bold tracking-wider">{type || 'Loading...'}</span>
              {ttl !== null && (
                <>
                  <span className="text-muted-foreground/40">•</span>
                  <span className={`text-[11px] uppercase font-bold tracking-wider ${ttl > 0 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {ttl > 0 ? `TTL: ${ttl}s` : ttl === -1 ? 'Não expira' : 'Não encontrado'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Carregando valor...
            </div>
          ) : (
            <div className="flex flex-col gap-2 h-full relative">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor da Chave</label>
              <Textarea 
                value={value}
                onChange={(e) => setValue(e.target.value)}
                readOnly={type !== 'string'}
                className="h-full p-4 font-mono resize-none shadow-inner"
              />
            </div>
          )}
        </div>
      </div>

      {/* Footer (Actions) */}
      <div className="h-14 border-t border-border bg-[#f5f6f7] flex items-center justify-between px-4 shrink-0">
        <div>
          <button 
            onClick={handleDelete}
            className="text-red-500 hover:bg-red-500/10 px-3 py-1.5 rounded-sm transition-colors flex items-center gap-2 text-xs border border-transparent hover:border-red-500/20"
          >
            <Trash2 size={14} /> Excluir Chave
          </button>
        </div>
        <div className="flex gap-3">
          <button 
            type="button" 
            onClick={onClose}
            className="bg-background text-foreground px-5 py-1.5 text-[13px] rounded-sm hover:bg-muted border border-border transition-colors shadow-sm min-w-[80px]"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            disabled={!hasChanges || saving || type !== 'string'}
            className="bg-[#4F81BD] text-white px-5 py-1.5 text-[13px] rounded-sm hover:brightness-110 border border-[#1F497D] transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px] justify-center"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </DraggableWindow>
  );
}
