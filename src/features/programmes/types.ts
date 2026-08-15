/** What the client is allowed to know about a programme. Never a Prisma model. */
export type ProgrammeOption = {
  id: string;
  code: string;
  name: string;
  /** Source of truth for new fee assignments; existing students hold a snapshot. */
  feeMinor: number;
  feeDueDays: number;
};

export type ProgrammeSummary = ProgrammeOption & {
  moduleCount: number;
  studentCount: number;
};
