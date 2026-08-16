import { http } from '@/lib/http';

import type { BulkPublishInput, SaveGradeInput, SetResultStatusInput } from '../schema';
import type {
  BulkPublishResult,
  MarkingRow,
  ResultEntry,
  StudentResultRow,
} from '../types';

export const resultsApi = {
  marking(assessmentId: string) {
    return http.get<MarkingRow[]>(
      `/api/results?assessmentId=${encodeURIComponent(assessmentId)}`,
    );
  },

  byStudent(studentId: string) {
    return http.get<StudentResultRow[]>(`/api/students/${studentId}/results`);
  },

  saveGrade(input: SaveGradeInput) {
    return http.post<ResultEntry>('/api/results', input);
  },

  setStatus(input: SetResultStatusInput) {
    return http.patch<ResultEntry>('/api/results', input);
  },

  publishAll(input: BulkPublishInput) {
    return http.post<BulkPublishResult>('/api/results/publish', input);
  },
};
