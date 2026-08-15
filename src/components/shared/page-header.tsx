import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Page title with an optional primary action on the right — "Students / + Add student". */
export function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-5 flex items-start justify-between gap-4', className)}>
      <div>
        <h1 className="text-xl">{title}</h1>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}
