'use client';

import { useRouter } from 'next/navigation';

import { Money } from '@/components/shared/money';
import { TBody, TD, TH, THead, TR, Table } from '@/components/ui';
import { formatDateShort } from '@/lib/dates';

import type { StudentListItem } from '../types';
import { StatusBadge } from './status-badge';

/**
 * The screen the admin lives in. Everything is aligned so that a column of forty rows
 * can be scanned rather than read: codes and balances in mono with tabular figures,
 * balances right-aligned.
 */
export function StudentTable({ students }: { students: StudentListItem[] }) {
  const router = useRouter();

  return (
    <Table>
      <THead>
        <TR>
          <TH>Code</TH>
          <TH>Name</TH>
          <TH>Programme</TH>
          <TH numeric>Year</TH>
          <TH>Status</TH>
          <TH numeric>Balance</TH>
        </TR>
      </THead>
      <TBody>
        {students.map((student) => {
          const overdue = student.fee?.isOverdue ?? false;
          // Owing but not yet late. Worth seeing without reading the balance column, and
          // worth distinguishing from overdue rather than colouring both the same.
          const owing = (student.fee?.outstandingMinor ?? 0) > 0;

          return (
            <TR
              key={student.id}
              clickable
              // A red left border marks the exception; the tint marks a balance still to
              // collect. Two levels, so a full-strength fill never has to carry both.
              flagged={overdue}
              tinted={owing}
              // Withdrawn students stay visible and legible, just clearly inactive.
              // Registry records persist.
              dimmed={student.status === 'WITHDRAWN'}
              onClick={() => router.push(`/students/${student.id}`)}
            >
              <TD mono>{student.studentCode}</TD>
              <TD className="font-medium">{student.fullName}</TD>
              <TD>
                <span title={student.programmeName}>{student.programmeCode}</span>
              </TD>
              <TD mono numeric>
                {student.academicYear}
              </TD>
              <TD>
                <StatusBadge status={student.status} />
              </TD>
              <TD numeric className="py-1">
                {student.fee ? (
                  <>
                    <Money minor={student.fee.outstandingMinor} alert={overdue} />
                    {overdue ? (
                      <span className="block text-xs text-alert">
                        {student.fee.daysOverdue} day
                        {student.fee.daysOverdue === 1 ? '' : 's'} overdue
                      </span>
                    ) : (
                      owing && (
                        // The tint is never the only carrier: the row says in words what
                        // the colour hints at.
                        <span className="block text-xs text-muted">
                          due {formatDateShort(student.fee.dueDate)}
                        </span>
                      )
                    )}
                  </>
                ) : (
                  <span className="text-muted">—</span>
                )}
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
