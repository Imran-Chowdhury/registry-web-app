import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/**
 * The only place in the product a large number appears — DESIGN.md §4.1.
 *
 * `alert` is driven by the value, not by the caller's taste: the overdue tile turns red
 * above zero and stays muted at zero, so one glance answers whether today is a chasing
 * day.
 */
export function StatTile({
  value,
  label,
  alert = false,
}: {
  value: ReactNode;
  label: string;
  alert?: boolean;
}) {
  return (
    <div className="rounded-card border border-rule bg-paper px-4 py-4">
      <div
        className={cn(
          'font-mono text-3xl font-medium tabular-nums',
          alert ? 'text-alert' : 'text-ink',
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 text-xs tracking-wide text-muted uppercase">{label}</div>
    </div>
  );
}
