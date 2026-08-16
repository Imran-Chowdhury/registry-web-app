import type { ReactNode } from 'react';

/**
 * A failed mutation, stated inside the form that caused it.
 *
 * Dialogs in this project are native `<dialog>` elements opened with `showModal()`, which
 * puts them in the browser's top layer — they paint above every normal element regardless
 * of z-index. A toast therefore cannot be seen while a dialog is open, however high it is
 * stacked, so anything a dialog needs to say has to be said inside the dialog. The toast
 * still fires for mutations that have no dialog behind them.
 */
export function FormError({ children }: { children: ReactNode }) {
  return (
    <p
      role="alert"
      className="rounded-control border border-alert bg-alert/5 px-3 py-2 text-xs text-alert"
    >
      {children}
    </p>
  );
}
