'use client';

import { useState } from 'react';

import type { ProgrammeOption } from '@/features/programmes';
import { Button, Card, CardBody, EmptyState, Skeleton } from '@/components/ui';
import { formatDateTime } from '@/lib/dates';
import { cn } from '@/lib/utils';

import { useStudent, useUpdateStudent } from '../hooks/use-students';
import type { StudentDetail } from '../types';
import { StatusChangeDialog } from './status-change-dialog';
import { StudentForm } from './student-form';
import { StudentRecordCard } from './student-record-card';
import { statusLabel } from './status-badge';

const TABS = ['Fees', 'Submissions', 'Results', 'History'] as const;
type Tab = (typeof TABS)[number];

export function StudentDetailScreen({
  studentId,
  programmes,
}: {
  studentId: string;
  programmes: ProgrammeOption[];
}) {
  const { data: student, isPending, isError, error, refetch } = useStudent(studentId);
  const [tab, setTab] = useState<Tab>('Fees');
  const [statusOpen, setStatusOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  if (isPending) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-8 w-64" />
      </div>
    );
  }

  if (isError) {
    return (
      <EmptyState
        tone="alert"
        title="Couldn't load this student."
        description={error.message}
        action={
          <Button size="sm" variant="secondary" onClick={() => refetch()}>
            Retry
          </Button>
        }
      />
    );
  }

  return (
    <>
      <StudentRecordCard
        student={student}
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={() => setEditing((v) => !v)}>
              {editing ? 'Cancel edit' : 'Edit'}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setStatusOpen(true)}>
              Change status
            </Button>
          </>
        }
      />

      {editing ? (
        <section className="mt-6">
          <h2 className="mb-3 text-base font-semibold">Edit record</h2>
          <EditStudentForm
            student={student}
            programmes={programmes}
            onDone={() => setEditing(false)}
          />
        </section>
      ) : (
        <section className="mt-6">
          <div className="flex gap-1 border-b border-rule">
            {TABS.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTab(name)}
                aria-current={tab === name ? 'true' : undefined}
                className={cn(
                  '-mb-px border-b-2 px-3 py-2 text-base transition-control',
                  tab === name
                    ? 'border-ink font-medium text-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="pt-4">
            {tab === 'History' ? (
              <StatusHistory student={student} />
            ) : (
              <EmptyState
                title={`${tab} arrive in a later phase.`}
                description={
                  tab === 'Fees'
                    ? 'The payments ledger and the record-payment action land in Phase 3.'
                    : tab === 'Submissions'
                      ? 'Coursework and late flagging land in Phase 4.'
                      : 'Grades, publishing, and withholding land in Phase 5.'
                }
              />
            )}
          </div>
        </section>
      )}

      {/* Keyed on open state and current status so each opening starts fresh — the
          React-recommended way to reset state, rather than an effect. */}
      <StatusChangeDialog
        key={`${statusOpen}-${student.status}`}
        studentId={student.id}
        currentStatus={student.status}
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
      />
    </>
  );
}

function EditStudentForm({
  student,
  programmes,
  onDone,
}: {
  student: StudentDetail;
  programmes: ProgrammeOption[];
  onDone: () => void;
}) {
  const updateStudent = useUpdateStudent(student.id);

  return (
    <StudentForm
      programmes={programmes}
      existingCode={student.studentCode}
      // Status is deliberately absent: it changes through the audited dialog.
      showStatus={false}
      defaultValues={{
        fullName: student.fullName,
        email: student.email,
        dateOfBirth: student.dateOfBirth.slice(0, 10),
        programmeId: student.programmeId,
        academicYear: student.academicYear,
      }}
      submitLabel="Save changes"
      pendingLabel="Saving…"
      onSubmit={(values) => {
        const { status: _status, ...rest } = values;
        updateStudent.mutate(rest, { onSuccess: onDone });
      }}
    />
  );
}

/** Low visual priority, high credibility — a plain dated list of what happened. */
function StatusHistory({ student }: { student: StudentDetail }) {
  if (student.statusHistory.length === 0) {
    return <EmptyState title="No status changes recorded." />;
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        {student.statusHistory.map((entry) => (
          <div key={entry.id} className="border-b border-rule pb-3 last:border-0 last:pb-0">
            <p className="text-base">
              {entry.fromStatus
                ? `${statusLabel(entry.fromStatus)} → ${statusLabel(entry.toStatus)}`
                : statusLabel(entry.toStatus)}
            </p>
            <p className="mt-0.5 font-mono text-xs text-muted">
              {formatDateTime(entry.changedAt)}
            </p>
            {entry.reason && <p className="mt-1 text-xs text-muted">{entry.reason}</p>}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

