import type { ReactNode } from 'react';

import { Money } from '@/components/shared/money';
import { formatDate } from '@/lib/dates';

import type { StudentDetail } from '../types';
import { StatusBadge } from './status-badge';

/**
 * The signature element — a physical record card. Registry work is identifier work, so
 * the student code is set large in mono like a filing number, with the status and
 * balance as stamps in the corner.
 */
export function StudentRecordCard({
  student,
  actions,
}: {
  student: StudentDetail;
  actions?: ReactNode;
}) {
  const fee = student.fee;

  return (
    <article className="rounded-card border border-rule bg-paper px-5 py-4">
      <div className="flex items-start justify-between gap-6">
        <div>
          <p className="font-mono text-xl tracking-[0.12em] text-ink">
            {student.studentCode}
          </p>
          <h1 className="mt-1 text-xl">{student.fullName}</h1>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={student.status} />
          {fee && fee.outstandingMinor > 0 && (
            <p className="text-xs">
              <Money minor={fee.outstandingMinor} alert={fee.isOverdue} />
              <span className={fee.isOverdue ? 'text-alert' : 'text-muted'}>
                {fee.isOverdue ? ' overdue' : ' outstanding'}
              </span>
            </p>
          )}
          {fee && fee.outstandingMinor <= 0 && (
            <p className="text-xs text-muted">Paid in full</p>
          )}
        </div>
      </div>

      <dl className="mt-4 space-y-1 text-xs text-muted">
        <div>
          <dt className="sr-only">Contact and programme</dt>
          <dd>
            <span className="font-mono">{student.email}</span> · {student.programmeName} ·
            Year {student.academicYear}
          </dd>
        </div>
        <div>
          <dt className="sr-only">Dates</dt>
          <dd className="font-mono">
            Born {formatDate(student.dateOfBirth)} · Enrolled{' '}
            {formatDate(student.createdAt)}
          </dd>
        </div>
      </dl>

      {actions && <div className="mt-4 flex flex-wrap gap-2">{actions}</div>}
    </article>
  );
}
