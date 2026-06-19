import { useState } from 'react';
import DraggableWindow from '../ui/DraggableWindow';

interface SubscribeDialogProps {
  onClose: () => void;
  onSuccess: (channel: string) => void;
}

export default function SubscribeDialog({ onClose, onSuccess }: SubscribeDialogProps) {
  const [channel, setChannel] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channel.trim()) return;
    onSuccess(channel.trim());
  };

  return (
    <DraggableWindow title="Novo Canal" onClose={onClose} width="w-[400px]">
      <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Nome do Canal</label>
          <input
            type="text"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            placeholder="Ex: canal:logs"
            className="w-full px-3 py-2 bg-input border border-border rounded-sm text-sm focus:bg-background outline-none"
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button 
            type="button" 
            onClick={onClose}
            className="px-4 py-1.5 text-sm hover:bg-secondary rounded-sm transition-colors"
          >
            Cancelar
          </button>
          <button 
            type="submit" 
            className="bg-[#4F81BD] text-white px-4 py-1.5 text-sm rounded-sm hover:brightness-110 flex items-center gap-2 border border-[#1F497D] disabled:opacity-50"
            disabled={!channel.trim()}
          >
            Inscrever-se
          </button>
        </div>
      </form>
    </DraggableWindow>
  );
}
