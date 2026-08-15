'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';

import type { ProgrammeOption } from '@/features/programmes';
import { Button, Field, Input, Select } from '@/components/ui';
import { formatDate } from '@/lib/dates';
import { formatMoney } from '@/lib/money';
import { studentCodePlaceholder } from '@/lib/student-id';

import { ENROLMENT_STATUSES, studentFormSchema, type StudentFormValues } from '../schema';
import { statusLabel } from './status-badge';

/**
 * Single column, not a modal. Creating a student is a considered act with enough fields
 * to deserve a page — and it has a consequence (a fee record) worth showing first.
 */
export function StudentForm({
  programmes,
  defaultValues,
  submitLabel,
  pendingLabel,
  onSubmit,
  /** Status is edited through the audited status-change dialog, not here. */
  showStatus = true,
  existingCode,
}: {
  programmes: ProgrammeOption[];
  defaultValues?: Partial<StudentFormValues>;
  submitLabel: string;
  pendingLabel: string;
  onSubmit: (values: StudentFormValues) => void;
  showStatus?: boolean;
  existingCode?: string;
}) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      fullName: '',
      email: '',
      dateOfBirth: '',
      programmeId: programmes[0]?.id ?? '',
      academicYear: 1,
      status: 'ENROLLED',
      ...defaultValues,
    },
  });

  // Subscribed rather than read from `watch()`, so only this component re-renders when
  // the programme changes — and the fee preview below updates as soon as it does.
  const programmeId = useWatch({ control, name: 'programmeId' });
  const selectedProgramme = programmes.find((programme) => programme.id === programmeId);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="max-w-[560px] space-y-4"
    >
      <Field label="Full name" htmlFor="fullName" required error={errors.fullName?.message}>
        <Input
          id="fullName"
          autoComplete="off"
          invalid={Boolean(errors.fullName)}
          {...register('fullName')}
        />
      </Field>

      <Field label="Email" htmlFor="email" required error={errors.email?.message}>
        <Input
          id="email"
          type="email"
          autoComplete="off"
          invalid={Boolean(errors.email)}
          {...register('email')}
        />
      </Field>

      <Field
        label="Date of birth"
        htmlFor="dateOfBirth"
        required
        error={errors.dateOfBirth?.message}
      >
        <Input
          id="dateOfBirth"
          type="date"
          mono
          invalid={Boolean(errors.dateOfBirth)}
          {...register('dateOfBirth')}
        />
      </Field>

      <Field
        label="Programme"
        htmlFor="programmeId"
        required
        error={errors.programmeId?.message}
      >
        <Select
          id="programmeId"
          invalid={Boolean(errors.programmeId)}
          {...register('programmeId')}
        >
          {programmes.map((programme) => (
            <option key={programme.id} value={programme.id}>
              {programme.name} ({programme.code})
            </option>
          ))}
        </Select>
      </Field>

      {/*
        Makes the invisible consequence of the programme choice visible before the admin
        commits: choosing a programme sets what this student will owe and by when.
      */}
      {selectedProgramme && (
        <div className="rounded-card border border-rule bg-surface px-3 py-2 text-xs">
          <p className="font-medium text-ink">
            {selectedProgramme.name} ({selectedProgramme.code})
          </p>
          <p className="mt-0.5 font-mono text-muted">
            Fee {formatMoney(selectedProgramme.feeMinor)} · due{' '}
            {formatDate(dueDateFrom(selectedProgramme.feeDueDays))} (
            {selectedProgramme.feeDueDays} days)
          </p>
          <p className="mt-0.5 text-muted">A fee record is created automatically.</p>
        </div>
      )}

      <Field
        label="Academic year"
        htmlFor="academicYear"
        required
        error={errors.academicYear?.message}
      >
        <Select
          id="academicYear"
          invalid={Boolean(errors.academicYear)}
          {...register('academicYear', { valueAsNumber: true })}
        >
          {[1, 2, 3, 4, 5, 6].map((year) => (
            <option key={year} value={year}>
              Year {year}
            </option>
          ))}
        </Select>
      </Field>

      {showStatus && (
        <Field label="Enrolment status" htmlFor="status" error={errors.status?.message}>
          <Select id="status" {...register('status')}>
            {ENROLMENT_STATUSES.map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </Select>
        </Field>
      )}

      <Field
        label="Student code"
        htmlFor="studentCode"
        hint={existingCode ? undefined : 'Generated on save.'}
      >
        <Input
          id="studentCode"
          mono
          disabled
          readOnly
          value={existingCode ?? studentCodePlaceholder(new Date().getUTCFullYear())}
        />
      </Field>

      <div className="flex gap-2 pt-2">
        <Button type="submit" pending={isSubmitting} pendingLabel={pendingLabel}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function dueDateFrom(days: number): Date {
  const due = new Date();
  due.setUTCDate(due.getUTCDate() + days);
  return due;
}
