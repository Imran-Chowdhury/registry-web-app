'use client';

import Link from 'next/link';

import type { ProgrammeOption } from '@/features/programmes';
import {
  Button,
  EmptyState,
  Pagination,
  SkeletonTable,
  TableCaption,
  buttonClasses,
} from '@/components/ui';

import { useStudents } from '../hooks/use-students';
import { useHasActiveFilters, useStudentFilterStore, useStudentQuery } from '../store';
import { StudentFilterBar } from './student-filter-bar';
import { StudentTable } from './student-table';

const SKELETON_COLUMNS = ['w-28', 'w-40', 'w-12', 'w-8', 'w-20', 'w-16'];

/** Loading, empty, and error are all written out. A silent blank screen is a bug. */
export function StudentList({ programmes }: { programmes: ProgrammeOption[] }) {
  // `overdue` comes from the URL inside this hook, so a link into `?overdue=true` renders
  // filtered on the first paint and matches the key the server prefetched under.
  const query = useStudentQuery();
  const hasFilters = useHasActiveFilters();
  const clear = useStudentFilterStore((state) => state.clear);
  const setPage = useStudentFilterStore((state) => state.setPage);
  const { data, isPending, isError, error, refetch, isFetching } = useStudents(query);

  return (
    <>
      <StudentFilterBar programmes={programmes} />

      {isPending ? (
        <div className="rounded-card border border-rule bg-paper">
          <SkeletonTable columns={SKELETON_COLUMNS} />
        </div>
      ) : isError ? (
        <EmptyState
          tone="alert"
          title="Couldn't load students."
          description={error.message}
          action={
            <Button size="sm" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      ) : data.students.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title={
              query.overdue
                ? 'No overdue balances.'
                : 'No students match those filters.'
            }
            description={
              query.overdue
                ? 'Every fee that has fallen due has been paid. Clear the filter to see the full registry.'
                : 'Check the spelling, or widen the search.'
            }
            action={
              <Button size="sm" variant="secondary" onClick={clear}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No students yet."
            description="Add your first student to get started. A fee record is created with them."
            action={
              <Link href="/students/new" className={buttonClasses('primary', 'sm')}>
                Add student
              </Link>
            }
          />
        )
      ) : (
        <>
          <TableCaption>
            {/* The range, not just the total: on page 3 of 6 the useful fact is where
                you are in the list, and the total alone does not say. */}
            {data.totalPages > 1 && (
              <>
                Showing {(data.page - 1) * data.pageSize + 1}–
                {(data.page - 1) * data.pageSize + data.students.length} of{' '}
              </>
            )}
            {data.total} student{data.total === 1 ? '' : 's'}
            {data.overdueCount > 0 && (
              <>
                {' · '}
                {/* Counted across every match, not this page. */}
                <span className="text-alert">{data.overdueCount} overdue</span>
              </>
            )}
            {isFetching && ' · updating…'}
          </TableCaption>
          <StudentTable students={data.students} />
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={setPage}
            disabled={isFetching}
          />
        </>
      )}
    </>
  );
}
