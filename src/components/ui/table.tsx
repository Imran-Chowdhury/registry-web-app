import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

import { cn } from '@/lib/utils';

/*
  Staff density — DESIGN.md §2: 13px cells, 40px rows, 12px horizontal padding.
  Identifiers and money go in `mono` cells so a mismatched digit is visible without
  reading the number.
*/

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-card border border-rule bg-paper">
      <table className={cn('w-full border-collapse text-sm', className)} {...props} />
    </div>
  );
}

export function THead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('border-b border-rule bg-surface', className)}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn('divide-y divide-rule', className)} {...props} />;
}

export type TrProps = HTMLAttributes<HTMLTableRowElement> & {
  /** Red left border — the exception itself: overdue, late. */
  flagged?: boolean;
  /**
   * A faint red wash for rows that need attention but are not yet exceptions.
   *
   * Kept to 5% so it reads as a tint rather than a fill: DESIGN.md §4.2 warns that a
   * full-strength red row destroys readability at forty of them. Paired with `flagged`
   * it gives two legible levels — tinted means something is owed, tinted with a border
   * means it is overdue.
   */
  tinted?: boolean;
  /** Withdrawn students stay visible at reduced opacity; records persist. */
  dimmed?: boolean;
  clickable?: boolean;
};

export function TR({
  className,
  flagged,
  tinted,
  dimmed,
  clickable,
  ...props
}: TrProps) {
  return (
    <tr
      className={cn(
        'transition-control',
        flagged && 'border-l-2 border-l-alert',
        tinted && 'bg-alert/5',
        dimmed && 'opacity-60',
        // Hover has to win over the tint, or a tinted row stops responding to the cursor.
        clickable && 'cursor-pointer hover:bg-surface',
        className,
      )}
      {...props}
    />
  );
}

export type CellProps = {
  /** Identifiers, money, dates, references, grades. */
  mono?: boolean;
  numeric?: boolean;
};

export function TH({
  className,
  mono,
  numeric,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <th
      scope="col"
      className={cn(
        'h-10 px-3 text-left text-xs font-medium tracking-wide text-muted uppercase',
        numeric && 'text-right',
        mono && 'font-mono',
        className,
      )}
      {...props}
    />
  );
}

export function TD({
  className,
  mono,
  numeric,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & CellProps) {
  return (
    <td
      className={cn(
        'h-10 px-3 align-middle text-ink',
        numeric && 'text-right',
        mono && 'font-mono tabular-nums',
        className,
      )}
      {...props}
    />
  );
}

/** Result count line above a table: "142 students · 7 overdue". */
export function TableCaption({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mb-2 text-xs text-muted', className)} {...props} />;
}
