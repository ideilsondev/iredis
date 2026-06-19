import { useState } from 'react';

import { useDialogStore } from '../../stores/dialogStore';
import { setString } from '../../api/keys';
import DraggableWindow from '../ui/DraggableWindow';

interface Props {
  onClose: () => void;
  onSuccess: (keyName: string) => void;
}

export default function NewKeyDialog({ onClose, onSuccess }: Props) {
  const [keyName, setKeyName] = useState('');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const { showDialog } = useDialogStore();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setLoading(true);
    try {
      await setString(keyName.trim(), value);
      onSuccess(keyName.trim());
      onClose();
    } catch (error) {
      showDialog({
        title: 'Erro',
        message: `Falha ao criar chave: ${String(error)}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DraggableWindow title="Nova Chave (String)" onClose={onClose} width="w-[500px]">
      <form onSubmit={handleSave} className="p-5 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-foreground">Nome da Chave</label>
          <input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm bg-input border border-border/80 rounded-sm focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] outline-none transition-colors"
            placeholder="ex: sessao:usuario:123"
            autoFocus
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-foreground">Valor</label>
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-2.5 py-1.5 text-sm bg-input border border-border/80 rounded-sm focus:border-[#0078d4] focus:ring-1 focus:ring-[#0078d4] outline-none transition-colors font-mono min-h-[120px] resize-y leading-relaxed"
            placeholder="Digite o valor..."
          />
        </div>

        <div className="flex justify-end gap-2 pt-4 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[80px] px-4 py-1.5 text-[13px] text-foreground bg-card border border-border/80 rounded-sm hover:bg-muted transition-colors shadow-sm"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !keyName.trim()}
            className="min-w-[80px] px-4 py-1.5 text-[13px] text-white bg-[#005a9e] border border-[#004578] rounded-sm hover:bg-[#0078d4] flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
          >
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </DraggableWindow>
  );
}
