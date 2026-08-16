/**
 * What the registry needs to know before doing anything else today.
 *
 * The shape follows DESIGN.md §4.1 — the three questions an admin opens this app to
 * answer: who owes money and how late, who submitted late, and what is ready to publish.
 * Everything here is derived at read time from the same services the feature screens
 * use, so the dashboard cannot disagree with the page it links to.
 */

/**
 * A student who owes money, whether or not the due date has passed.
 *
 * One shape for both lists on the panel: the overdue table and, when nothing is overdue,
 * the largest balances still to collect. Both answer the same question — who owes what —
 * and giving them separate types would only mean maintaining the same fields twice.
 */
export type AccountBalance = {
  studentId: string;
  studentCode: string;
  fullName: string;
  programmeCode: string;
  outstandingMinor: number;
  dueDate: string;
  isOverdue: boolean;
  /** Zero when not overdue. */
  daysOverdue: number;
};

export type LateWorkSummary = {
  lateCount: number;
  /** How many assessments those late submissions are spread across. */
  assessmentCount: number;
  /** The assessment with the most late work — where chasing starts. */
  worstAssessmentId: string | null;
  worstAssessmentTitle: string | null;
};

export type ReadyToPublish = {
  assessmentId: string;
  title: string;
  moduleCode: string;
  markedCount: number;
  expectedCount: number;
  /**
   * Marked, still draft, and awaiting release — exactly what `Publish all marked` would
   * act on. Withheld results are excluded: that decision has already been made.
   */
  unpublishedCount: number;
};

export type DashboardSummary = {
  enrolledCount: number;
  totalOutstandingMinor: number;
  overdueCount: number;
  /** Submitted and waiting on a marker, across every assessment. */
  awaitingMarkingCount: number;
  /** Sorted by days overdue, descending — the worst debt first. */
  overdueAccounts: AccountBalance[];
  /**
   * The largest balances still to collect, shown when nothing is overdue yet.
   *
   * A registry with nothing overdue still has money outstanding, and "no overdue
   * accounts" on its own is a dead panel. Naming who owes the most turns the quiet state
   * into the next thing worth doing.
   */
  topOutstanding: AccountBalance[];
  lateWork: LateWorkSummary;
  readyToPublish: ReadyToPublish[];
};
