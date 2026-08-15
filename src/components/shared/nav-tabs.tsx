'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@/lib/utils';

export type NavItem = {
  href: string;
  label: string;
  /** Set on index routes such as `/me`, which would otherwise match every child path. */
  exact?: boolean;
};

/**
 * Horizontal tabs, ink on paper, 2px ink underline on the active tab.
 *
 * No sidebar: it would cost 240px of horizontal space the staff tables need, and there
 * are only a handful of destinations.
 */
export function NavTabs({
  items,
  align = 'left',
  className,
}: {
  items: NavItem[];
  align?: 'left' | 'center';
  className?: string;
}) {
  const pathname = usePathname();

  return (
    <nav className={cn('border-b border-rule bg-paper', className)}>
      <ul
        className={cn(
          'mx-auto flex max-w-[1440px] gap-1 px-6',
          align === 'center' && 'justify-center',
        )}
      >
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-flex h-11 items-center border-b-2 px-3 text-base transition-control',
                  active
                    ? 'border-ink font-medium text-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** `/students/abc` keeps the Students tab lit; `/me/marksheet` must not light `/me`. */
function isActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href) return true;
  if (item.exact) return false;
  return pathname.startsWith(`${item.href}/`);
}
