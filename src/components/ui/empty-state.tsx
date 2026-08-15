import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * A one-line statement of fact plus one action — DESIGN.md §6. Copy is written per
 * screen: "No overdue accounts. Next payment due 14 March." carries information; a
 * generic "No data" is a wasted opportunity.
 */
export function EmptyState({
  title,
  description,
  action,
  tone = 'neutral',
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** `alert` for failure states — "Couldn't load students. Retry." */
  tone?: 'neutral' | 'alert';
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-card border border-dashed px-6 py-10 text-center',
        tone === 'alert' ? 'border-alert/40 bg-alert/5' : 'border-rule bg-paper',
        className,
      )}
    >
      <p
        className={cn(
          'text-base font-medium',
          tone === 'alert' ? 'text-alert' : 'text-ink',
        )}
      >
        {title}
      </p>
      {description && <div className="max-w-prose text-xs text-muted">{description}</div>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
