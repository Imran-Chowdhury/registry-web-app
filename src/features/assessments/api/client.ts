import { http } from '@/lib/http';

import type { CreateAssessmentInput } from '../schema';
import type { AssessmentDetail, AssessmentListItem } from '../types';

export const assessmentsApi = {
  list() {
    return http.get<AssessmentListItem[]>('/api/assessments');
  },

  create(input: CreateAssessmentInput) {
    return http.post<AssessmentDetail>('/api/assessments', input);
  },
};
