'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { studentKeys } from '@/features/students';
import type { HttpError } from '@/lib/http';
import { formatMoney } from '@/lib/money';
import { toast } from '@/stores/toast-store';

import { feesApi } from '../api/client';
import { feeKeys } from '../api/keys';
import type { RecordPaymentInput, ReversePaymentInput } from '../schema';

export function useStudentFees(studentId: string) {
  return useQuery({
    queryKey: feeKeys.byStudent(studentId),
    queryFn: () => feesApi.listForStudent(studentId),
  });
}

export function usePaymentLedger(search?: string) {
  return useQuery({
    queryKey: feeKeys.ledger(search),
    queryFn: () => feesApi.ledger(search),
  });
}

export function useRecordPayment(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RecordPaymentInput) => feesApi.recordPayment(input),
    onSuccess: (fee) => {
      // A payment changes the balance shown on the fee panel, on the students list, and
      // in the ledger — all three are invalidated, none of them more broadly than that.
      queryClient.invalidateQueries({ queryKey: feeKeys.byStudent(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(studentId) });
      queryClient.invalidateQueries({ queryKey: feeKeys.ledgers() });
      toast.success(
        'Payment recorded.',
        fee.outstandingMinor > 0
          ? `${formatMoney(fee.outstandingMinor)} still outstanding.`
          : 'This fee is now paid in full.',
      );
    },
    onError: (error: HttpError) => {
      toast.error('Payment not recorded.', error.message);
    },
  });
}

export function useReversePayment(studentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      paymentId,
      input,
    }: {
      paymentId: string;
      input: ReversePaymentInput;
    }) => feesApi.reversePayment(paymentId, input),
    onSuccess: (fee) => {
      queryClient.invalidateQueries({ queryKey: feeKeys.byStudent(studentId) });
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: studentKeys.detail(studentId) });
      queryClient.invalidateQueries({ queryKey: feeKeys.ledgers() });
      toast.success(
        'Payment reversed.',
        `${formatMoney(fee.outstandingMinor)} now outstanding.`,
      );
    },
    onError: (error: HttpError) => {
      toast.error('Payment not reversed.', error.message);
    },
  });
}
