'use client';

import Link from 'next/link';

import type { ProgrammeOption } from '@/features/programmes';
import { Button, EmptyState, SkeletonTable, TableCaption, buttonClasses } from '@/components/ui';

import { useStudents } from '../hooks/use-students';
import { useHasActiveFilters, useStudentFilterStore, useStudentFilters } from '../store';
import { StudentFilterBar } from './student-filter-bar';
import { StudentTable } from './student-table';

const SKELETON_COLUMNS = ['w-28', 'w-40', 'w-12', 'w-8', 'w-20', 'w-16'];

/** Loading, empty, and error are all written out. A silent blank screen is a bug. */
export function StudentList({ programmes }: { programmes: ProgrammeOption[] }) {
  const filters = useStudentFilters();
  const hasFilters = useHasActiveFilters();
  const clear = useStudentFilterStore((state) => state.clear);
  const { data, isPending, isError, error, refetch, isFetching } = useStudents(filters);

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
            title="No students match those filters."
            description="Check the spelling, or widen the search."
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
            {data.total} student{data.total === 1 ? '' : 's'}
            {data.overdueCount > 0 && (
              <>
                {' · '}
                <span className="text-alert">{data.overdueCount} overdue</span>
              </>
            )}
            {isFetching && ' · updating…'}
          </TableCaption>
          <StudentTable students={data.students} />
        </>
      )}
    </>
  );
}
