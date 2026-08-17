/**
 * The client-safe public surface of the students feature. Nothing imports its internals.
 *
 * Services are deliberately absent: they are `server-only`, and a client component
 * importing a hook from here would otherwise drag them into the browser bundle. Server
 * code imports them from `./server` instead.
 */

export {
  DEFAULT_STUDENT_QUERY,
  ENROLMENT_STATUSES,
  STUDENT_PAGE_SIZE,
  changeStatusSchema,
  createStudentSchema,
  enrolmentStatusSchema,
  studentFiltersSchema,
  studentQuerySchema,
  updateStudentSchema,
  type ChangeStatusInput,
  type CreateStudentInput,
  type EnrolmentStatusValue,
  type StudentFilters,
  type StudentQuery,
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
  useStudentQuery,
} from './store';

export { StatusBadge } from './components/status-badge';
export { StudentTable } from './components/student-table';
export { StudentFilterBar } from './components/student-filter-bar';
export { StudentForm } from './components/student-form';
export { StudentRecordCard } from './components/student-record-card';
