export const feeKeys = {
  all: ['fees'] as const,
  byStudent: (studentId: string) => [...feeKeys.all, 'student', studentId] as const,
  ledgers: () => ['payments', 'ledger'] as const,
  ledger: (search: string | undefined) => [...feeKeys.ledgers(), search ?? ''] as const,
};
