import { http } from '@/lib/http';

import type { RecordPaymentInput, ReversePaymentInput } from '../schema';
import type { FeeDetail, LedgerEntry } from '../types';

export const feesApi = {
  listForStudent(studentId: string) {
    return http.get<FeeDetail[]>(`/api/students/${studentId}/fees`);
  },

  recordPayment(input: RecordPaymentInput) {
    return http.post<FeeDetail>('/api/payments', input);
  },

  reversePayment(paymentId: string, input: ReversePaymentInput) {
    return http.post<FeeDetail>(`/api/payments/${paymentId}/reverse`, input);
  },

  ledger(search?: string) {
    const query = search ? `?search=${encodeURIComponent(search)}` : '';
    return http.get<LedgerEntry[]>(`/api/payments${query}`);
  },
};
