'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type { HttpError } from '@/lib/http';
import { toast } from '@/stores/toast-store';

import { assessmentsApi } from '../api/client';
import { assessmentKeys } from '../api/keys';
import type { CreateAssessmentInput } from '../schema';

export function useAssessments() {
  return useQuery({
    queryKey: assessmentKeys.lists(),
    queryFn: () => assessmentsApi.list(),
  });
}

/**
 * The assessment header is server-rendered, so the cutoff change is followed by a router
 * refresh rather than only a cache invalidation — the badge and the button label both
 * live in that server component.
 */
export function useSetSubmissionsClosed(assessmentId: string) {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (closed: boolean) =>
      assessmentsApi.setSubmissionsClosed(assessmentId, { closed }),
    onSuccess: (assessment) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
      router.refresh();
      toast.success(
        assessment.submissionsClosedAt ? 'Submissions closed.' : 'Submissions reopened.',
        assessment.submissionsClosedAt
          ? 'No further work will be accepted for this assessment.'
          : 'Late work is being accepted again.',
      );
    },
    onError: (error: HttpError) => {
      toast.error('Submissions unchanged.', error.message);
    },
  });
}

export function useCreateAssessment() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateAssessmentInput) => assessmentsApi.create(input),
    onSuccess: (assessment) => {
      queryClient.invalidateQueries({ queryKey: assessmentKeys.lists() });
      toast.success('Assessment created.', `${assessment.moduleCode} · ${assessment.title}`);
      router.push(`/assessments/${assessment.id}`);
    },
    onError: (error: HttpError) => {
      toast.error('Assessment not created.', error.message);
    },
  });
}
