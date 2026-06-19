import { useState } from 'react';

import { useDialogStore } from '../../stores/dialogStore';
import { setString } from '../../api/keys';
import DraggableWindow from '../ui/DraggableWindow';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

interface Props {
  onClose: () => void;
  onSuccess: (keyName: string) => void;
}

export default function NewKeyDialog({ onClose, onSuccess }: Props) {
  const [keyName, setKeyName] = useState('');
  const [value, setValue] = useState('');
  const [ttl, setTtl] = useState('');
  const [loading, setLoading] = useState(false);
  const { showDialog } = useDialogStore();

  const parseTtl = (input: string): number | undefined => {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return undefined;

    if (/^\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }

    const match = trimmed.match(/^(\d+)([smhd])$/);
    if (!match) return NaN;

    const val = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return val;
      case 'm': return val * 60;
      case 'h': return val * 60 * 60;
      case 'd': return val * 60 * 60 * 24;
      default: return NaN;
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName.trim()) return;

    setLoading(true);
    try {
      const parsedTtl = parseTtl(ttl);
      if (parsedTtl !== undefined && isNaN(parsedTtl)) {
        showDialog({
          title: 'Erro de Validação',
          message: 'Formato de TTL inválido. Use um número (ex: 60) ou sufixos s, m, h, d (ex: 1m, 2h, 1d).',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      await setString(keyName.trim(), value, parsedTtl);
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
          <Input
            type="text"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
            placeholder="ex: sessao:usuario:123"
            autoFocus
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-foreground">TTL / Expiração <span className="text-muted-foreground font-normal">- Opcional</span></label>
          <Input
            type="text"
            value={ttl}
            onChange={(e) => setTtl(e.target.value)}
            placeholder="ex: 60s, 1m, 2h, 1d (Deixe em branco p/ não expirar)"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px] font-medium text-foreground">Valor</label>
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="font-mono min-h-[120px] leading-relaxed"
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
