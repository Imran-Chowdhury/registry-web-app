'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { Button, Field, Input, Select } from '@/components/ui';

import { useCreateAssessment } from '../hooks/use-assessments';
import { assessmentFormSchema, type AssessmentFormValues } from '../schema';
import type { ModuleOption } from '../types';

export function NewAssessmentScreen({ modules }: { modules: ModuleOption[] }) {
  const createAssessment = useCreateAssessment();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      title: '',
      moduleId: modules[0]?.id ?? '',
      deadline: '',
      maxAttempts: 0,
    },
  });

  return (
    <form
      noValidate
      className="max-w-[560px] space-y-4"
      onSubmit={handleSubmit((values) =>
        createAssessment.mutate({
          ...values,
          // The form holds a local datetime string; the server parses it to a Date.
          deadline: values.deadline,
        }),
      )}
    >
      <Field label="Title" htmlFor="title" required error={errors.title?.message}>
        <Input id="title" invalid={Boolean(errors.title)} {...register('title')} />
      </Field>

      <Field label="Module" htmlFor="moduleId" required error={errors.moduleId?.message}>
        <Select id="moduleId" invalid={Boolean(errors.moduleId)} {...register('moduleId')}>
          {modules.map((module) => (
            <option key={module.id} value={module.id}>
              {module.code} — {module.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Deadline"
        htmlFor="deadline"
        required
        error={errors.deadline?.message}
        hint="Submissions after this time are accepted once, and flagged late."
      >
        <Input
          id="deadline"
          type="datetime-local"
          mono
          invalid={Boolean(errors.deadline)}
          {...register('deadline')}
        />
      </Field>

      <Field
        label="Attempt limit"
        htmlFor="maxAttempts"
        hint="0 means students may replace their work as often as they like, until the deadline."
        error={errors.maxAttempts?.message}
      >
        <Select
          id="maxAttempts"
          {...register('maxAttempts', { valueAsNumber: true })}
        >
          <option value={0}>Unlimited before the deadline</option>
          {[1, 2, 3, 4, 5].map((value) => (
            <option key={value} value={value}>
              {value} attempt{value === 1 ? '' : 's'}
            </option>
          ))}
        </Select>
      </Field>

      <div className="pt-2">
        <Button type="submit" pending={isSubmitting} pendingLabel="Creating…">
          Create assessment
        </Button>
      </div>
    </form>
  );
}
