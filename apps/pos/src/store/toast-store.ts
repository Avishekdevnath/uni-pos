import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration: number; // ms, 0 = sticky
}

interface ToastStore {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant, duration?: number) => void;
  dismiss: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  push: (message, variant = 'info', duration = 3500) => {
    const id = crypto.randomUUID();
    set((s) => ({ toasts: [...s.toasts, { id, message, variant, duration }] }));
    if (duration > 0) {
      setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), duration);
    }
  },

  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Convenience helpers — call these anywhere without hooks
export const toast = {
  success: (msg: string, duration?: number) => useToastStore.getState().push(msg, 'success', duration),
  error:   (msg: string, duration?: number) => useToastStore.getState().push(msg, 'error', duration),
  warning: (msg: string, duration?: number) => useToastStore.getState().push(msg, 'warning', duration),
  info:    (msg: string, duration?: number) => useToastStore.getState().push(msg, 'info', duration),
};
