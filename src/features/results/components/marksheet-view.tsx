import { Badge, type BadgeTone } from '@/components/ui';
import { formatDate } from '@/lib/dates';

import type { Classification } from '../classification';
import type { Marksheet, MarksheetEntry } from '../types';

/**
 * The student's marksheet.
 *
 * The structure carries the meaning: published work is listed with its grade, withheld
 * work is listed without one and with the reason, and unmarked work is not listed at
 * all. A student has to be able to tell "not marked yet" from "marked but held back" —
 * that difference is the entire point of the withhold feature, and a single flat list
 * would blur it.
 */
export function MarksheetView({ marksheet }: { marksheet: Marksheet }) {
  const { published, withheld, averageGrade, averageClassification, publishedCount } =
    marksheet;

  return (
    <>
      <section>
        <h2 className="mb-3 text-base font-semibold">Published results</h2>

        <div className="overflow-hidden rounded-card border border-rule bg-paper">
          {published.length === 0 ? (
            <p className="px-5 py-4 text-muted">
              No results published yet. Marks appear here once the Registry releases them.
            </p>
          ) : (
            <ul className="divide-y divide-rule">
              {published.map((entry) => (
                <PublishedRow key={entry.assessmentId} entry={entry} />
              ))}
            </ul>
          )}
        </div>
      </section>

      {averageGrade !== null && (
        <section className="mt-6">
          <div className="flex items-baseline justify-between gap-3 rounded-card border border-rule bg-paper px-5 py-4">
            <span className="font-medium">Average</span>
            <span className="flex items-baseline gap-3">
              <span className="font-mono text-3xl tabular-nums">{averageGrade}</span>
              <span className="text-muted">{averageClassification}</span>
            </span>
          </div>
          {/* The count is stated so the average cannot mislead. */}
          <p className="mt-2 text-sm text-muted">
            Across {publishedCount} published {publishedCount === 1 ? 'result' : 'results'}.
            Withheld and unmarked work is excluded.
          </p>
        </section>
      )}

      {withheld.length > 0 && (
        <section className="mt-9">
          <h2 className="mb-3 text-base font-semibold">Not yet available</h2>

          <div className="overflow-hidden rounded-card border border-rule bg-paper">
            <ul className="divide-y divide-rule">
              {withheld.map((entry) => (
                <li key={entry.assessmentId} className="px-5 py-4">
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{entry.assessmentTitle}</span>
                    <span className="font-mono text-sm text-muted">
                      {entry.moduleCode}
                    </span>
                  </div>
                  <p className="mt-2 font-medium text-alert">Result withheld</p>
                  {entry.withheldReason && (
                    <p className="mt-1 text-sm text-pretty text-muted">
                      {entry.withheldReason}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}

function PublishedRow({ entry }: { entry: MarksheetEntry }) {
  return (
    <li className="px-5 py-4">
      <div className="flex justify-between gap-3">
        <span className="font-medium">{entry.assessmentTitle}</span>
        <span className="font-mono text-sm text-muted">{entry.moduleCode}</span>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <span className="font-mono text-3xl tabular-nums">{entry.grade}</span>
        {entry.classification && (
          <Badge tone={classificationTone(entry.classification)}>
            {entry.classification}
          </Badge>
        )}
      </div>

      {entry.publishedAt && (
        <p className="mt-2 text-sm text-muted">Published {formatDate(entry.publishedAt)}</p>
      )}
    </li>
  );
}

/** Colour carries the band, the label carries the meaning — never colour alone. */
function classificationTone(classification: Classification): BadgeTone {
  switch (classification) {
    case 'Distinction':
      return 'enrolled';
    case 'Merit':
      return 'completed';
    case 'Pass':
      return 'neutral';
    case 'Fail':
      return 'alert';
  }
}
