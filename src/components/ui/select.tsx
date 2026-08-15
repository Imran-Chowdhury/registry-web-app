import type { SelectHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { fieldClasses } from './input';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

/**
 * Native `<select>`. Registry work is keyboard work, and the native control already
 * gives type-ahead, arrow navigation and the platform's own overlay behaviour — none
 * of which a hand-built listbox would match without real effort.
 */
export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        fieldClasses,
        'h-9 appearance-none bg-no-repeat pr-8',
        invalid && 'border-alert focus:border-alert',
        className,
      )}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none' stroke='%23667085' stroke-width='1.5'%3E%3Cpath d='M3 4.5 6 7.5 9 4.5'/%3E%3C/svg%3E\")",
        backgroundPosition: 'right 0.75rem center',
      }}
      {...props}
    >
      {children}
    </select>
  );
}
