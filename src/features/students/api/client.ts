import { http } from '@/lib/http';

import type {
  ChangeStatusInput,
  CreateStudentInput,
  StudentQuery,
  UpdateStudentInput,
} from '../schema';
import type { StudentDetail, StudentListResult } from '../types';

/** Fetch calls only. No React, no cache concerns — those belong to the hooks. */
export const studentsApi = {
  list(query: StudentQuery) {
    const params = new URLSearchParams();
    if (query.search) params.set('search', query.search);
    if (query.programmeId) params.set('programmeId', query.programmeId);
    if (query.status) params.set('status', query.status);
    if (query.overdue) params.set('overdue', 'true');
    params.set('page', String(query.page));
    params.set('pageSize', String(query.pageSize));

    return http.get<StudentListResult>(`/api/students?${params.toString()}`);
  },

  get(id: string) {
    return http.get<StudentDetail>(`/api/students/${id}`);
  },

  create(input: CreateStudentInput) {
    return http.post<StudentDetail>('/api/students', input);
  },

  update(id: string, input: UpdateStudentInput) {
    return http.patch<StudentDetail>(`/api/students/${id}`, input);
  },

  changeStatus(id: string, input: ChangeStatusInput) {
    return http.post<StudentDetail>(`/api/students/${id}/status`, input);
  },
};
