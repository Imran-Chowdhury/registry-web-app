import { formatMoney } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * The only way money reaches the screen. Dividing by 100 inline is how a rounding bug
 * gets into a currency figure, and mono with tabular figures is what makes a column of
 * balances scannable.
 */
export function Money({
  minor,
  className,
  /** Renders in the alert colour — used for an outstanding balance that is overdue. */
  alert = false,
}: {
  minor: number;
  className?: string;
  alert?: boolean;
}) {
  return (
    <span className={cn('font-mono tabular-nums', alert && 'text-alert', className)}>
      {formatMoney(minor)}
    </span>
  );
}
