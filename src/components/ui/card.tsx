import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Borders over shadows: a card is a ruled paper panel, never a floating one. */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('rounded-card border border-rule bg-paper', className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  action,
  className,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-between gap-4 border-b border-rule px-4 py-3',
        className,
      )}
    >
      {title ? (
        <h2 className="text-base font-semibold text-ink">{title}</h2>
      ) : (
        children
      )}
      {action}
    </div>
  );
}

export function CardBody({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-4 py-3', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('border-t border-rule px-4 py-3 text-xs text-muted', className)}
      {...props}
    />
  );
}
