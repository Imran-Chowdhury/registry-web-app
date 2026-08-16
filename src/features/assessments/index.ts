/**
 * The client-safe public surface of the assessments feature. Services live in
 * `./server`, because they are `server-only` and this module is reachable from client
 * components.
 */

export {
  assessmentFormSchema,
  closeSubmissionsSchema,
  createAssessmentSchema,
  type AssessmentFormValues,
  type CloseSubmissionsInput,
  type CreateAssessmentInput,
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
  useAssessments,
  useCreateAssessment,
  useSetSubmissionsClosed,
} from './hooks/use-assessments';

export { AssessmentList } from './components/assessment-list';
export { SubmissionCutoffControl } from './components/submission-cutoff-control';
export { NewAssessmentScreen } from './components/new-assessment-screen';
export { StudentAssessmentList } from './components/student-assessment-list';
