'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { studentKeys } from '@/features/students';
import type { HttpError } from '@/lib/http';
import { toast } from '@/stores/toast-store';

import { resultsApi } from '../api/client';
import { resultKeys } from '../api/keys';
import { classify } from '../classification';
import type { BulkPublishInput, SaveGradeInput, SetResultStatusInput } from '../schema';
import type { MarkingRow } from '../types';

export function useMarkingQueue(assessmentId: string) {
  return useQuery({
    queryKey: resultKeys.marking(assessmentId),
    queryFn: () => resultsApi.marking(assessmentId),
  });
}

export function useStudentResults(studentId: string) {
  return useQuery({
    queryKey: resultKeys.byStudent(studentId),
    queryFn: () => resultsApi.byStudent(studentId),
  });
}

/**
 * Grade entry is optimistic: marking twenty students should feel like typing twenty
 * numbers, not like waiting for twenty round trips. `onError` puts the previous queue
 * back, so a rejected grade never leaves a wrong number on screen.
 */
export function useSaveGrade(assessmentId: string) {
  const queryClient = useQueryClient();
  const key = resultKeys.marking(assessmentId);

  return useMutation({
    mutationFn: (input: SaveGradeInput) => resultsApi.saveGrade(input),

    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<MarkingRow[]>(key);

      const grade = Number(input.grade);
      queryClient.setQueryData<MarkingRow[]>(key, (rows) =>
        rows?.map((row) =>
          row.studentId === input.studentId && row.result
            ? { ...row, result: { ...row.result, grade, classification: classify(grade) } }
            : row,
        ),
      );

      return { previous };
    },

    onError: (error: HttpError, _input, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
      toast.error('Grade not saved.', error.message);
    },

    onSuccess: (result) => {
      toast.success('Grade saved.', `${result.grade} · ${result.classification}`);
    },

    // Whether it succeeded or failed, the server's version is the one that counts.
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: key });
    },
  });
}

export function useSetResultStatus(assessmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SetResultStatusInput) => resultsApi.setStatus(input),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: resultKeys.marking(assessmentId) });
      queryClient.invalidateQueries({ queryKey: resultKeys.byStudent(result.studentId) });

      if (result.status === 'PUBLISHED') {
        toast.success('Result published.', 'The student can see this mark now.');
      } else {
        toast.success('Result withheld.', 'The student sees the reason, not the mark.');
      }
    },
    onError: (error: HttpError) => {
      toast.error('Result not changed.', error.message);
    },
  });
}

export function usePublishAll(assessmentId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkPublishInput) => resultsApi.publishAll(input),
    onSuccess: ({ publishedCount, withheldCount }) => {
      queryClient.invalidateQueries({ queryKey: resultKeys.marking(assessmentId) });
      queryClient.invalidateQueries({ queryKey: resultKeys.all });
      // The students list shows nothing about results, but a student record's Results
      // tab does.
      queryClient.invalidateQueries({ queryKey: studentKeys.details() });

      toast.success(
        `${publishedCount} result${publishedCount === 1 ? '' : 's'} published.`,
        withheldCount > 0
          ? `${withheldCount} withheld for fee arrears.`
          : undefined,
      );
    },
    onError: (error: HttpError) => {
      toast.error('Nothing published.', error.message);
    },
  });
}
