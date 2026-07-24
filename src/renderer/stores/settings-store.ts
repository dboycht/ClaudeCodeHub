import { create } from 'zustand';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

interface SettingsState {
  toasts: Toast[];
  isRenameOpen: boolean;
  isDeleteOpen: boolean;
  isExportOpen: boolean;
  isImportOpen: boolean;
  isBackupOpen: boolean;
  isSettingsOpen: boolean;
  isAboutOpen: boolean;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  setRenameOpen: (open: boolean) => void;
  setDeleteOpen: (open: boolean) => void;
  setExportOpen: (open: boolean) => void;
  setImportOpen: (open: boolean) => void;
  setBackupOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setAboutOpen: (open: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  toasts: [],
  isRenameOpen: false,
  isDeleteOpen: false,
  isExportOpen: false,
  isImportOpen: false,
  isBackupOpen: false,
  isSettingsOpen: false,
  isAboutOpen: false,

  addToast: (toast) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }));
    const dur = toast.duration || 3000;
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) }));
    }, dur);
  },

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  setRenameOpen: (open) => set({ isRenameOpen: open }),
  setDeleteOpen: (open) => set({ isDeleteOpen: open }),
  setExportOpen: (open) => set({ isExportOpen: open }),
  setImportOpen: (open) => set({ isImportOpen: open }),
  setBackupOpen: (open) => set({ isBackupOpen: open }),
  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
  setAboutOpen: (open) => set({ isAboutOpen: open }),
}));
