/**
 * The client-safe public surface of the students feature. Nothing imports its internals.
 *
 * Services are deliberately absent: they are `server-only`, and a client component
 * importing a hook from here would otherwise drag them into the browser bundle. Server
 * code imports them from `./server` instead.
 */

export {
  ENROLMENT_STATUSES,
  changeStatusSchema,
  createStudentSchema,
  enrolmentStatusSchema,
  studentFiltersSchema,
  updateStudentSchema,
  type ChangeStatusInput,
  type CreateStudentInput,
  type EnrolmentStatusValue,
  type StudentFilters,
  type UpdateStudentInput,
} from './schema';

export type {
  FeeSummary,
  StatusChangeEntry,
  StudentDetail,
  StudentListItem,
  StudentListResult,
  StudentPickerOption,
} from './types';

export { studentKeys } from './api/keys';
export {
  useChangeStatus,
  useCreateStudent,
  useStudent,
  useStudents,
  useUpdateStudent,
} from './hooks/use-students';
export {
  useHasActiveFilters,
  useStudentFilterStore,
  useStudentFilters,
} from './store';

export { StatusBadge } from './components/status-badge';
export { StudentTable } from './components/student-table';
export { StudentFilterBar } from './components/student-filter-bar';
export { StudentForm } from './components/student-form';
export { StudentRecordCard } from './components/student-record-card';
