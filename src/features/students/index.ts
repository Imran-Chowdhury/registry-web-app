/** The public surface of the students feature. Nothing imports its internals. */

export { studentService } from './server/student.service';

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
