import { http } from '@/lib/http';

import type { CreateAssessmentInput } from '../schema';
import type {
  AssessmentDetail,
  AssessmentListItem,
  StudentAssessmentCard,
  SubmissionRow,
} from '../types';

export const assessmentsApi = {
  list() {
    return http.get<AssessmentListItem[]>('/api/assessments');
  },

  submissions(assessmentId: string) {
    return http.get<SubmissionRow[]>(`/api/assessments/${assessmentId}/submissions`);
  },

  create(input: CreateAssessmentInput) {
    return http.post<AssessmentDetail>('/api/assessments', input);
  },

  mine() {
    return http.get<StudentAssessmentCard[]>('/api/submissions');
  },
};
