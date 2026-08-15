import { create } from 'zustand';

/**
 * Transient UI state only — no server data lives here. Every mutation raises a toast
 * whose verb matches the button that triggered it: `Publish` produces "Result published."
 */
export type ToastTone = 'success' | 'error';

export type Toast = {
  id: string;
  tone: ToastTone;
  message: string;
  /** Optional second line: the specific reason a mutation failed. */
  detail?: string;
};

type ToastState = {
  toasts: Toast[];
  push: (toast: Omit<Toast, 'id'>) => string;
  dismiss: (id: string) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (toast) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

/** Convenience wrapper so callers never touch the store shape directly. */
export const toast = {
  success: (message: string, detail?: string) =>
    useToastStore.getState().push({ tone: 'success', message, detail }),
  error: (message: string, detail?: string) =>
    useToastStore.getState().push({ tone: 'error', message, detail }),
};
