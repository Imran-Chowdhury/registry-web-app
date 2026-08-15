import { http } from '@/lib/http';

import type {
  ChangeStatusInput,
  CreateStudentInput,
  StudentFilters,
  UpdateStudentInput,
} from '../schema';
import type { StudentDetail, StudentListResult } from '../types';

/** Fetch calls only. No React, no cache concerns — those belong to the hooks. */
export const studentsApi = {
  list(filters: StudentFilters) {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.programmeId) params.set('programmeId', filters.programmeId);
    if (filters.status) params.set('status', filters.status);

    const query = params.toString();
    return http.get<StudentListResult>(`/api/students${query ? `?${query}` : ''}`);
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
