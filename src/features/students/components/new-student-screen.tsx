'use client';

import type { ProgrammeOption } from '@/features/programmes';

import { useCreateStudent } from '../hooks/use-students';
import { StudentForm } from './student-form';

export function NewStudentScreen({ programmes }: { programmes: ProgrammeOption[] }) {
  const createStudent = useCreateStudent();

  return (
    <StudentForm
      programmes={programmes}
      submitLabel="Add student"
      pendingLabel="Adding…"
      onSubmit={(values) => createStudent.mutate(values)}
    />
  );
}
