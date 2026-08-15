import { cn } from '@/lib/utils';

/** A gentle pulse, never a shimmer sweep. Six hours a day of it would be exhausting. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-control bg-rule', className)} />;
}

/**
 * Loading state for tables. Column widths and the 40px row height match the real table
 * so the layout does not jump when data lands.
 */
export function SkeletonTable({
  rows = 6,
  columns,
}: {
  rows?: number;
  /** Tailwind width classes, one per column — mirror the real table's columns. */
  columns: string[];
}) {
  return (
    <div role="status" aria-label="Loading" className="divide-y divide-rule">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex h-10 items-center gap-4 px-3">
          {columns.map((width, columnIndex) => (
            <Skeleton key={columnIndex} className={cn('h-3', width)} />
          ))}
        </div>
      ))}
    </div>
  );
}
