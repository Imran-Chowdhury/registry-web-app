import type { TextareaHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';
import { fieldClasses } from './input';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export function Textarea({ className, invalid, rows = 3, ...props }: TextareaProps) {
  return (
    <textarea
      rows={rows}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldClasses,
        'resize-y py-2',
        invalid && 'border-alert focus:border-alert',
        className,
      )}
      {...props}
    />
  );
}
