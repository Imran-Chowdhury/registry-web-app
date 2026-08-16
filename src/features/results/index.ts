/**
 * The client-safe public surface of the results feature. Services live in `./server`,
 * because they are `server-only` and this module is reachable from client components.
 */

export {
  averageGrade,
  classify,
  CLASSIFICATION_BOUNDARIES,
  type Classification,
} from './classification';

export {
  absentFormSchema,
  ARREARS_WITHHOLD_REASON,
  DEFAULT_WITHHOLD_REASON,
  bulkPublishSchema,
  gradeSchema,
  markingFilters,
  resultActions,
  saveGradeSchema,
  setResultStatusSchema,
  withholdFormSchema,
  type AbsentFormValues,
  type BulkPublishInput,
  type MarkingFilter,
  type ResultAction,
  type SaveGradeInput,
  type SetResultStatusInput,
  type WithholdFormValues,
} from './schema';

export type {
  BulkPublishResult,
  MarkingRow,
  Marksheet,
  MarksheetEntry,
  ResultEntry,
  ResultStatusValue,
  StudentResultRow,
} from './types';

export { resultKeys } from './api/keys';
export {
  useMarkingQueue,
  usePublishAll,
  useSaveGrade,
  useSetResultStatus,
  useStudentResults,
} from './hooks/use-results';

export { MarkingQueue } from './components/marking-queue';
export { MarksheetView } from './components/marksheet-view';
export { RecentResults } from './components/recent-results';
export { StudentResultsTab } from './components/student-results-tab';
