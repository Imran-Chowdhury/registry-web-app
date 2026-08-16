import Link from 'next/link';

import type { Marksheet } from '../types';

/**
 * The results strip on a student's overview — the last few marks, with a way through to
 * the full marksheet.
 *
 * Only published and withheld entries appear, for the same reason they do on the
 * marksheet: a `DRAFT` result is work in progress inside the registry, and showing a
 * student that a row exists before anyone has decided to release it invites a question
 * nobody is ready to answer.
 */
export function RecentResults({ marksheet }: { marksheet: Marksheet }) {
  const entries = [
    ...marksheet.published.map((entry) => ({ entry, withheld: false })),
    ...marksheet.withheld.map((entry) => ({ entry, withheld: true })),
  ].slice(0, 3);

  if (entries.length === 0) {
    return (
      <p className="rounded-card border border-rule bg-paper px-5 py-4 text-muted">
        No results yet. Marks appear here once the Registry releases them.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-card border border-rule bg-paper">
        <ul className="divide-y divide-rule">
          {entries.map(({ entry, withheld }) => (
            <li
              key={entry.assessmentId}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <span>{entry.assessmentTitle}</span>
              <span className="flex items-baseline gap-3">
                <span className="font-mono tabular-nums">{entry.grade ?? '—'}</span>
                <span className={withheld ? 'text-sm text-alert' : 'text-sm text-muted'}>
                  {withheld ? 'Withheld' : entry.classification}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/me/marksheet"
        className="mt-3 inline-block text-sm underline underline-offset-2"
      >
        See the full marksheet →
      </Link>
    </>
  );
}
