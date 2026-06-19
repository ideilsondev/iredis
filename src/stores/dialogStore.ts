import { create } from 'zustand';

type DialogType = 'info' | 'error' | 'success' | 'confirm';

interface DialogOptions {
  title: string;
  message: string;
  type?: DialogType;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

interface DialogState {
  isOpen: boolean;
  options: DialogOptions | null;
  showDialog: (options: DialogOptions) => void;
  closeDialog: () => void;
}

export const useDialogStore = create<DialogState>((set) => ({
  isOpen: false,
  options: null,
  showDialog: (options) => set({ isOpen: true, options }),
  closeDialog: () => set({ isOpen: false, options: null }),
}));
