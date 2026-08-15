/**
 * The client-safe public surface of the assessments feature. Services live in
 * `./server`, because they are `server-only` and this module is reachable from client
 * components.
 */

export {
  assessmentFormSchema,
  createAssessmentSchema,
  submissionFilters,
  type AssessmentFormValues,
  type CreateAssessmentInput,
  type SubmissionFilter,
} from './schema';

export type {
  AssessmentDetail,
  AssessmentListItem,
  ModuleOption,
  StudentAssessmentCard,
  SubmissionAttempt,
  SubmissionRow,
} from './types';

export { assessmentKeys } from './api/keys';
export {
  useAssessmentSubmissions,
  useAssessments,
  useCreateAssessment,
} from './hooks/use-assessments';

export { AssessmentList } from './components/assessment-list';
export { AssessmentSubmissions } from './components/assessment-submissions';
export { NewAssessmentScreen } from './components/new-assessment-screen';
export { StudentAssessmentList } from './components/student-assessment-list';
