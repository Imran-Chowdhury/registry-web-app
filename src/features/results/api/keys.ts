/**
 * The only place a results query key is written. Marking is keyed per assessment, so
 * saving one grade never invalidates another assessment's queue.
 */
export const resultKeys = {
  all: ['results'] as const,
  marking: (assessmentId: string) => [...resultKeys.all, 'marking', assessmentId] as const,
  byStudent: (studentId: string) => [...resultKeys.all, 'student', studentId] as const,
};
