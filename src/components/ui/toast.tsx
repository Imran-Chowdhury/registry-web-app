'use client';

import { useEffect } from 'react';

import { useToastStore, type Toast as ToastData } from '@/stores/toast-store';
import { cn } from '@/lib/utils';

const AUTO_DISMISS_MS = 5000;

/**
 * Bottom-right on staff screens, bottom-centre on student screens — DESIGN.md §6.
 * Mounted once per route group layout.
 */
export function Toaster({ placement = 'right' }: { placement?: 'right' | 'center' }) {
  const toasts = useToastStore((state) => state.toasts);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className={cn(
        'pointer-events-none fixed bottom-4 z-50 flex flex-col gap-2',
        placement === 'right' ? 'right-4 items-end' : 'left-1/2 -translate-x-1/2 items-center',
      )}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

function ToastItem({ toast }: { toast: ToastData }) {
  const dismiss = useToastStore((state) => state.dismiss);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast.id, dismiss]);

  const isError = toast.tone === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto w-[min(24rem,calc(100vw-2rem))] rounded-card border px-3 py-2 shadow-overlay',
        isError ? 'border-alert bg-paper text-ink' : 'border-ink bg-ink text-paper',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={cn('text-base font-medium', isError && 'text-alert')}>
            {toast.message}
          </p>
          {toast.detail && (
            <p className={cn('mt-0.5 text-xs', isError ? 'text-muted' : 'text-paper/70')}>
              {toast.detail}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => dismiss(toast.id)}
          aria-label="Dismiss"
          className={cn(
            'shrink-0 rounded-control px-1 text-xs transition-control',
            isError ? 'text-muted hover:text-ink' : 'text-paper/60 hover:text-paper',
          )}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
