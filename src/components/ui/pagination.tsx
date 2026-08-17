'use client';

import { cn } from '@/lib/utils';

/**
 * Numbered pagination.
 *
 * Numbers rather than prev/next alone because a registry admin works a list positionally
 * — "I was partway through the Bs" — and a bare next button gives them no way back to
 * where they were without clicking through.
 */

/** A page number, or a gap standing in for the pages that were skipped. */
export type PageSlot = number | 'gap';

/**
 * The visible window of page numbers: first, last, the current page and its neighbours,
 * with gaps for the rest.
 *
 * Pure and exported so the awkward part — the boundaries, where the window would
 * otherwise slide off either end — can be reasoned about on its own rather than
 * inferred from rendered output.
 */
export function pageWindow(current: number, total: number, radius = 1): PageSlot[] {
  if (total <= 1) return [1];

  const pages = new Set<number>([1, total]);
  for (let page = current - radius; page <= current + radius; page += 1) {
    if (page >= 1 && page <= total) pages.add(page);
  }

  // Near an edge the window is lopsided and would show fewer numbers than in the middle.
  // Top it back up from the other side so the control does not change width as it moves.
  const wanted = Math.min(total, radius * 2 + 3);
  for (let page = 1; pages.size < wanted && page <= total; page += 1) pages.add(page);
  for (let page = total; pages.size < wanted && page >= 1; page -= 1) pages.add(page);

  const sorted = [...pages].sort((a, b) => a - b);
  const slots: PageSlot[] = [];

  for (const [index, page] of sorted.entries()) {
    // A gap standing in for exactly one page is a lie that costs a click: show the page.
    if (index > 0 && page - sorted[index - 1] > 1) slots.push('gap');
    slots.push(page);
  }

  return slots;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
  className,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** True while a page is in flight, so a double click cannot queue two jumps. */
  disabled?: boolean;
  className?: string;
}) {
  // One page is not a choice, and rendering a dead control implies there is more to see.
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label="Pagination"
      className={cn('mt-4 flex items-center justify-center gap-1', className)}
    >
      <Step
        label="Previous page"
        glyph="‹"
        disabled={disabled || page === 1}
        onClick={() => onPageChange(page - 1)}
      />

      {pageWindow(page, totalPages).map((slot, index) =>
        slot === 'gap' ? (
          <span
            key={`gap-${index}`}
            aria-hidden
            className="px-1 font-mono text-xs text-muted"
          >
            …
          </span>
        ) : (
          <button
            key={slot}
            type="button"
            disabled={disabled}
            aria-label={`Page ${slot}`}
            // Announces the position to a screen reader, which cannot see the fill.
            aria-current={slot === page ? 'page' : undefined}
            onClick={() => onPageChange(slot)}
            className={cn(pageClasses, slot === page && currentPageClasses)}
          >
            {slot}
          </button>
        ),
      )}

      <Step
        label="Next page"
        glyph="›"
        disabled={disabled || page === totalPages}
        onClick={() => onPageChange(page + 1)}
      />
    </nav>
  );
}

function Step({
  label,
  glyph,
  disabled,
  onClick,
}: {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={pageClasses}
    >
      <span aria-hidden>{glyph}</span>
    </button>
  );
}

const pageClasses =
  'inline-flex h-8 min-w-8 items-center justify-center rounded-control border ' +
  'border-rule bg-paper px-2 font-mono text-xs tabular-nums transition-control ' +
  'hover:border-ink/40 focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40 ' +
  'disabled:hover:border-rule';

const currentPageClasses = 'border-ink bg-ink text-paper hover:border-ink';
