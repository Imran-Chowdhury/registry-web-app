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
