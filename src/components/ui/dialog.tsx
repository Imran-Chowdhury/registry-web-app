'use client';

import { useEffect, useRef, type ReactNode } from 'react';

import { cn } from '@/lib/utils';
import { Button, type ButtonVariant } from './button';

/**
 * Built on the native `<dialog>` element rather than a headless library: it already
 * provides the focus trap, Escape-to-close, inert background and top-layer stacking
 * that would otherwise be the expensive part of a hand-rolled dialog.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  /** State the consequence of the action, not a restatement of the title. */
  description?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open && !node.open) node.showModal();
    if (!open && node.open) node.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      // Fires on Escape as well as close() — keeps React state in step with the element.
      onClose={onClose}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        // The backdrop is part of the dialog's own box, so a click landing on the
        // element itself (not its content) is a backdrop click.
        if (event.target === ref.current) onClose();
      }}
      aria-labelledby="dialog-title"
      className={cn(
        'w-[min(32rem,calc(100vw-2rem))] rounded-card border border-rule bg-paper p-0 text-ink shadow-overlay',
        'm-auto backdrop:bg-ink/40',
        className,
      )}
    >
      <div className="border-b border-rule px-4 py-3">
        <h2 id="dialog-title" className="text-base font-semibold">
          {title}
        </h2>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>

      {children && <div className="px-4 py-3">{children}</div>}

      {footer && (
        <div className="flex justify-end gap-2 border-t border-rule bg-surface px-4 py-3">
          {footer}
        </div>
      )}
    </dialog>
  );
}

/**
 * Required before publishing a result, recording a payment, changing enrolment status
 * or replacing a submission. The primary button repeats the verb from the trigger.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  pending = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  confirmVariant?: ButtonVariant;
  pending?: boolean;
  children?: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            pending={pending}
            pendingLabel={`${confirmLabel}…`}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Dialog>
  );
}
