import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/*
  Status pills — DESIGN.md §2. Fill is the status colour at 10%, text and border at full
  strength. Every pill carries its label: colour is never the only carrier of meaning,
  which matters for both accessibility and for printing a student record.
*/
const tones = {
  enrolled: 'bg-enrolled/10 text-enrolled border-enrolled/30',
  deferred: 'bg-deferred/10 text-deferred border-deferred/30',
  withdrawn: 'bg-withdrawn/10 text-withdrawn border-withdrawn/30',
  completed: 'bg-completed/10 text-completed border-completed/30',
  alert: 'bg-alert/10 text-alert border-alert/30',
  neutral: 'bg-surface text-muted border-rule',
} as const;

export type BadgeTone = keyof typeof tones;

export type BadgeProps = {
  tone?: BadgeTone;
  /** Renders a filled dot before the label, as used in the students table. */
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

export function Badge({ tone = 'neutral', dot = false, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {dot && <span aria-hidden className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
