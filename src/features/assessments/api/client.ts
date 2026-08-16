import { http } from '@/lib/http';

import type { CloseSubmissionsInput, CreateAssessmentInput } from '../schema';
import type { AssessmentDetail, AssessmentListItem } from '../types';

export const assessmentsApi = {
  list() {
    return http.get<AssessmentListItem[]>('/api/assessments');
  },

  create(input: CreateAssessmentInput) {
    return http.post<AssessmentDetail>('/api/assessments', input);
  },

  setSubmissionsClosed(assessmentId: string, input: CloseSubmissionsInput) {
    return http.patch<AssessmentDetail>(`/api/assessments/${assessmentId}`, input);
  },
};
