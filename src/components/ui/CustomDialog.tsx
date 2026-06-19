import { useDialogStore } from '../../stores/dialogStore';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import DraggableWindow from './DraggableWindow';

export default function CustomDialog() {
  const { isOpen, options, closeDialog } = useDialogStore();

  if (!isOpen || !options) return null;

  const getIcon = () => {
    switch (options.type) {
      case 'error': return <AlertCircle className="text-red-500 shrink-0" size={32} />;
      case 'success': return <CheckCircle2 className="text-green-500 shrink-0" size={32} />;
      case 'confirm': return <AlertCircle className="text-[#4F81BD] shrink-0" size={32} />;
      default: return <Info className="text-muted-foreground shrink-0" size={32} />;
    }
  };

  const handleConfirm = () => {
    if (options.onConfirm) {
      options.onConfirm();
    }
    closeDialog();
  };

  return (
    <DraggableWindow title={options.title} onClose={closeDialog} width="w-[420px]" zIndex="z-[100]">
      <div className="p-5 flex gap-4 bg-background">
        {getIcon()}
        <p className="text-[13px] text-foreground/90 whitespace-pre-wrap flex-1 mt-1 leading-relaxed">
          {options.message}
        </p>
      </div>

      {/* Footer Actions */}
      <div className="bg-[#f0f0f0] dark:bg-[#1e1e1e] px-4 py-3 border-t border-border/80 flex justify-end gap-2">
        {options.type === 'confirm' && (
          <button 
            onClick={closeDialog}
            className="min-w-[80px] px-4 py-1.5 text-[13px] text-foreground bg-card border border-border/80 rounded-sm hover:bg-muted transition-colors shadow-sm"
          >
            {options.cancelText || 'Cancelar'}
          </button>
        )}
        <button 
          onClick={handleConfirm}
          className="min-w-[80px] px-4 py-1.5 text-[13px] text-white bg-[#005a9e] border border-[#004578] rounded-sm hover:bg-[#0078d4] transition-colors shadow-sm"
        >
          {options.confirmText || 'OK'}
        </button>
      </div>
    </DraggableWindow>
  );
}
