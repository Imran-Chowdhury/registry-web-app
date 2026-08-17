'use client';

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import type { HttpError } from '@/lib/http';
import { toast } from '@/stores/toast-store';

import { studentsApi } from '../api/client';
import { studentKeys } from '../api/keys';
import type {
  ChangeStatusInput,
  CreateStudentInput,
  StudentQuery,
  UpdateStudentInput,
} from '../schema';
import type { StudentDetail } from '../types';

export function useStudents(query: StudentQuery) {
  return useQuery({
    queryKey: studentKeys.list(query),
    queryFn: () => studentsApi.list(query),
    // Keeps the current page on screen while the next one loads. Without it the table
    // collapses to a skeleton on every page click, which reads as the list breaking.
    placeholderData: keepPreviousData,
  });
}

export function useStudent(id: string) {
  return useQuery({
    queryKey: studentKeys.detail(id),
    queryFn: () => studentsApi.get(id),
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: (input: CreateStudentInput) => studentsApi.create(input),
    onSuccess: (student) => {
      // Narrowest key that is still correct: the lists are stale, the other details
      // are not.
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      queryClient.setQueryData(studentKeys.detail(student.id), student);
      toast.success('Student added.', `${student.fullName} · ${student.studentCode}`);
      router.push(`/students/${student.id}`);
    },
    onError: (error: HttpError) => {
      toast.error('Student not added.', error.message);
    },
  });
}

export function useUpdateStudent(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStudentInput) => studentsApi.update(id, input),
    onSuccess: (student) => {
      queryClient.setQueryData(studentKeys.detail(id), student);
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      toast.success('Student updated.');
    },
    onError: (error: HttpError) => {
      toast.error('Changes not saved.', error.message);
    },
  });
}

export function useChangeStatus(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChangeStatusInput) => studentsApi.changeStatus(id, input),
    onSuccess: (student: StudentDetail) => {
      queryClient.setQueryData(studentKeys.detail(id), student);
      queryClient.invalidateQueries({ queryKey: studentKeys.lists() });
      toast.success(
        'Status changed.',
        `${student.fullName} is now ${student.status.toLowerCase()}.`,
      );
    },
    onError: (error: HttpError) => {
      toast.error('Status not changed.', error.message);
    },
  });
}
