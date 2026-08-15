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
  /** Red left border — overdue accounts and other exceptions. Never a full-row fill. */
  flagged?: boolean;
  /** Withdrawn students stay visible at reduced opacity; records persist. */
  dimmed?: boolean;
  clickable?: boolean;
};

export function TR({ className, flagged, dimmed, clickable, ...props }: TrProps) {
  return (
    <tr
      className={cn(
        'transition-control',
        flagged && 'border-l-2 border-l-alert',
        dimmed && 'opacity-60',
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
