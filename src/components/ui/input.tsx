import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

export const fieldClasses =
  'w-full rounded-control border border-rule bg-paper px-3 text-base text-ink transition-control ' +
  'placeholder:text-muted focus:border-ink focus:outline-none ' +
  'disabled:cursor-not-allowed disabled:bg-surface disabled:text-muted';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
  /** Set for identifiers, money and dates so digits align down the column. */
  mono?: boolean;
};

export function Input({ className, invalid, mono, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        fieldClasses,
        'h-9',
        mono && 'font-mono tabular-nums',
        invalid && 'border-alert focus:border-alert',
        className,
      )}
      {...props}
    />
  );
}

export type FieldProps = {
  label: string;
  htmlFor: string;
  /** Rendered under the field in muted text — use it to state consequences, not to repeat the label. */
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

/** Label + control + hint/error. Errors are inline and specific — never a toast. */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-ink">
        {label}
        {required && <span className="text-muted"> *</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} className="text-xs text-alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
