import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

import type { EnrolmentStatus } from '../src/generated/prisma/client';
import { PrismaClient } from '../src/generated/prisma/client';
import { academicSession } from '../src/lib/academic-session';
import { formatStudentCode } from '../src/lib/student-id';
import { clearUploads, writeSubmissionFile, type FileKind } from './seed-files';

/**
 * The registry a reviewer sees on a clean clone.
 *
 * Written to demonstrate the domain rules rather than to fill tables: every enrolment
 * status, every fee state, late and resubmitted coursework, and results in all four
 * conditions — unmarked, draft, published, withheld. The case worth finding is Rafi
 * Hasan, 45 days in arrears **and** holding a marked result that has not been released.
 * Publishing it is where the fee rule and the withhold flow meet.
 *
 * **Dates are relative to the run**, never fixed. A seed pinned to calendar dates stops
 * demonstrating anything the month it goes stale: nothing overdue, no imminent deadline,
 * and a dashboard that looks broken rather than empty.
 *
 * **Destructive and deterministic.** Every table is emptied first and the student-code
 * counter reset, so codes always start at 0001 and the README can name a student by
 * code. Re-running discards anything entered through the UI in the meantime — the price
 * of a demo that is identical on every machine.
 */

if (process.env.NODE_ENV === 'production') {
  throw new Error('This seed truncates every table. It will not run against production.');
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const NOW = new Date();
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/** Days (and optionally hours) before the moment the seed runs. */
function ago(days: number, hours = 0): Date {
  return new Date(NOW.getTime() - days * DAY - hours * HOUR);
}

/** Days ahead of the moment the seed runs. */
function ahead(days: number, hours = 0): Date {
  return new Date(NOW.getTime() + days * DAY + hours * HOUR);
}

/** Pins a date to a wall-clock UTC time, so a deadline reads as 17:00 and not 09:43. */
function at(date: Date, hour: number, minute = 0): Date {
  const pinned = new Date(date);
  pinned.setUTCHours(hour, minute, 0, 0);
  return pinned;
}

const MARKED_BY = 'Registry staff';

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

const PROGRAMMES = [
  { code: 'CSE', name: 'Computer Science', feeMinor: 10_000, feeDueDays: 30 },
  { code: 'BBA', name: 'Business Administration', feeMinor: 5_000, feeDueDays: 30 },
];

const MODULES = [
  { code: 'CSE-101', name: 'Programming Fundamentals', programmes: ['CSE'] },
  { code: 'CSE-201', name: 'Data Structures', programmes: ['CSE'] },
  { code: 'BBA-110', name: 'Principles of Management', programmes: ['BBA'] },
  { code: 'BBA-210', name: 'Marketing Principles', programmes: ['BBA'] },
  // Shared across both programmes — the reason Module has a many-to-many relation, and
  // the reason a BBA student and a CSE student see one assessment in common.
  { code: 'GEN-100', name: 'Academic Writing', programmes: ['CSE', 'BBA'] },
];

/**
 * Deadlines span past, imminent, and future, so every card state on the student
 * assessments screen has something to render.
 */
const ASSESSMENTS = [
  {
    key: 'midterm',
    title: 'Midterm Report',
    moduleCode: 'CSE-201',
    deadline: at(ago(42), 17),
    maxAttempts: 0,
    // Marking is finished, so late work is no longer accepted. The cutoff is separate
    // from the deadline: closing does not change who was late.
    submissionsClosedAt: ago(35),
  },
  {
    key: 'final-project',
    title: 'Final Project',
    moduleCode: 'CSE-201',
    deadline: at(ago(5), 17),
    maxAttempts: 0,
    submissionsClosedAt: null,
  },
  {
    key: 'lab-2',
    title: 'Lab Exercise 2',
    moduleCode: 'CSE-101',
    deadline: at(ahead(9), 17),
    maxAttempts: 3,
    submissionsClosedAt: null,
  },
  {
    key: 'case-study-1',
    title: 'Case Study 1',
    moduleCode: 'BBA-110',
    deadline: at(ago(21), 23, 59),
    maxAttempts: 0,
    submissionsClosedAt: ago(14),
  },
  {
    key: 'group-presentation',
    title: 'Group Presentation',
    moduleCode: 'BBA-110',
    deadline: at(ahead(2), 17),
    maxAttempts: 0,
    submissionsClosedAt: null,
  },
  {
    key: 'market-analysis',
    title: 'Market Analysis',
    moduleCode: 'BBA-210',
    deadline: at(ago(3), 17),
    maxAttempts: 0,
    submissionsClosedAt: null,
  },
  {
    key: 'reflective-essay',
    title: 'Reflective Essay',
    moduleCode: 'GEN-100',
    deadline: at(ahead(18), 17),
    maxAttempts: 0,
    submissionsClosedAt: null,
  },
];

/**
 * Submission times are expressed against their own deadline rather than against the run
 * clock, so "two days four hours late" is a stated intention and not a by-product of
 * arithmetic between two independent offsets.
 */
function deadlineOf(assessmentKey: string): Date {
  return ASSESSMENTS.find((entry) => entry.key === assessmentKey)!.deadline;
}

function beforeDeadline(assessmentKey: string, days: number, hours = 0): Date {
  return new Date(deadlineOf(assessmentKey).getTime() - days * DAY - hours * HOUR);
}

function afterDeadline(assessmentKey: string, days: number, hours = 0): Date {
  return new Date(deadlineOf(assessmentKey).getTime() + days * DAY + hours * HOUR);
}

// ---------------------------------------------------------------------------
// Students
// ---------------------------------------------------------------------------

/**
 * `createdAt` is what makes an account overdue: the fee falls due 30 days later, so a
 * student created 75 days ago is 45 days in arrears the moment the seed finishes.
 * Without backdating, nothing on a fresh database is ever late and the entire arrears
 * workflow is invisible.
 */
const STUDENTS: {
  key: string;
  fullName: string;
  email: string;
  dateOfBirth: Date;
  programmeCode: string;
  intakeYear: number;
  academicYear: number;
  status: EnrolmentStatus;
  createdAt: Date;
  /** Bursary or scholarship, deducted before the balance is worked out. */
  waivedMinor?: number;
  /** Transitions after creation. The creation entry is written for every student. */
  history?: { toStatus: EnrolmentStatus; reason: string; changedAt: Date }[];
}[] = [
  {
    key: 'aisha',
    fullName: 'Aisha Rahman',
    email: 'aisha.rahman@example.edu',
    dateOfBirth: new Date(Date.UTC(2004, 1, 4)),
    programmeCode: 'CSE',
    intakeYear: 2025,
    academicYear: 2,
    status: 'ENROLLED',
    createdAt: ago(380),
  },
  {
    key: 'sadia',
    fullName: 'Sadia Islam',
    email: 'sadia.islam@example.edu',
    dateOfBirth: new Date(Date.UTC(2004, 10, 27)),
    programmeCode: 'BBA',
    intakeYear: 2025,
    academicYear: 2,
    // Deferred, and still in arrears. Deferral does not clear what is owed.
    status: 'DEFERRED',
    createdAt: ago(120),
    history: [
      {
        toStatus: 'DEFERRED',
        reason: 'Deferring for one academic year on medical grounds.',
        changedAt: ago(60),
      },
    ],
  },
  {
    key: 'imtiaz',
    fullName: 'Imtiaz Karim',
    email: 'imtiaz.karim@example.edu',
    dateOfBirth: new Date(Date.UTC(2003, 2, 8)),
    programmeCode: 'CSE',
    intakeYear: 2025,
    academicYear: 3,
    // Withdrawn: still in the registry, still holding a fee history, and barred from
    // submitting or being graded.
    status: 'WITHDRAWN',
    createdAt: ago(400),
    history: [
      {
        toStatus: 'WITHDRAWN',
        reason: 'Withdrew for personal reasons. Fee history retained.',
        changedAt: ago(45),
      },
    ],
  },
  {
    key: 'farhana',
    fullName: 'Farhana Akter',
    email: 'farhana.akter@example.edu',
    dateOfBirth: new Date(Date.UTC(2003, 7, 22)),
    programmeCode: 'BBA',
    intakeYear: 2025,
    academicYear: 3,
    status: 'COMPLETED',
    createdAt: ago(395),
    history: [
      { toStatus: 'COMPLETED', reason: 'Completed the programme.', changedAt: ago(20) },
    ],
  },
  {
    key: 'shafiq',
    fullName: 'Shafiq Rahman',
    email: 'shafiq.rahman@example.edu',
    dateOfBirth: new Date(Date.UTC(2004, 4, 6)),
    programmeCode: 'CSE',
    intakeYear: 2025,
    academicYear: 2,
    status: 'ENROLLED',
    createdAt: ago(370),
    // Half the fee carried by a bursary. The waiver settles the account on $50 of a $100
    // fee — the case a naive "paid < amount" check reports as arrears.
    waivedMinor: 5_000,
  },
  {
    key: 'rafi',
    fullName: 'Rafi Hasan',
    email: 'rafi.hasan@example.edu',
    dateOfBirth: new Date(Date.UTC(2005, 6, 19)),
    programmeCode: 'CSE',
    intakeYear: 2026,
    academicYear: 1,
    status: 'ENROLLED',
    // The demo case: 45 days overdue on the full $100, holding a marked result that has
    // not been released.
    createdAt: ago(75),
  },
  {
    key: 'nusrat',
    fullName: 'Nusrat Jahan',
    email: 'nusrat.jahan@example.edu',
    dateOfBirth: new Date(Date.UTC(2005, 3, 2)),
    programmeCode: 'BBA',
    intakeYear: 2026,
    academicYear: 1,
    status: 'ENROLLED',
    createdAt: ago(62),
  },
  {
    key: 'tanvir',
    fullName: 'Tanvir Ahmed',
    email: 'tanvir.ahmed@example.edu',
    dateOfBirth: new Date(Date.UTC(2005, 8, 15)),
    programmeCode: 'CSE',
    intakeYear: 2026,
    academicYear: 1,
    status: 'ENROLLED',
    // Part-paid: outstanding is the balance, not the invoice.
    createdAt: ago(48),
  },
  {
    key: 'maliha',
    fullName: 'Maliha Chowdhury',
    email: 'maliha.chowdhury@example.edu',
    dateOfBirth: new Date(Date.UTC(2005, 5, 11)),
    programmeCode: 'BBA',
    intakeYear: 2026,
    academicYear: 1,
    status: 'ENROLLED',
    createdAt: ago(95),
  },
  {
    key: 'zubair',
    fullName: 'Zubair Alam',
    email: 'zubair.alam@example.edu',
    dateOfBirth: new Date(Date.UTC(2006, 0, 30)),
    programmeCode: 'CSE',
    intakeYear: 2026,
    academicYear: 1,
    status: 'ENROLLED',
    // Enrolled last week: the fee is not due yet, which is a different state from unpaid
    // and must not be counted as arrears.
    createdAt: ago(8),
  },
];

// ---------------------------------------------------------------------------
// Payments — oldest first, which is the order the ledger reads
// ---------------------------------------------------------------------------

const PAYMENTS: {
  studentKey: string;
  amountMinor: number;
  paidAt: Date;
  reference: string;
  note?: string;
  /** Marks this payment reversed and writes its negative counter-entry. */
  reversal?: { reason: string; reversedAt: Date };
}[] = [
  {
    studentKey: 'imtiaz',
    amountMinor: 10_000,
    paidAt: ago(390),
    reference: 'BANK-2025-0388',
  },
  {
    studentKey: 'farhana',
    amountMinor: 5_000,
    paidAt: ago(385),
    reference: 'BANK-2025-0401',
  },
  {
    studentKey: 'aisha',
    amountMinor: 10_000,
    paidAt: ago(370),
    reference: 'BANK-2025-0417',
  },
  {
    studentKey: 'shafiq',
    amountMinor: 5_000,
    paidAt: ago(360),
    reference: 'BANK-2025-0512',
    note: 'Balance of the fee carried by a bursary waiver.',
  },
  {
    studentKey: 'sadia',
    amountMinor: 2_500,
    paidAt: ago(80),
    reference: 'BANK-2026-0176',
  },
  {
    studentKey: 'maliha',
    amountMinor: 5_000,
    paidAt: ago(60),
    reference: 'BANK-2026-0214',
    // Money rows are never deleted. The correction is a counter-entry, and both sides
    // stay on the ledger where an auditor can see what happened.
    reversal: { reason: 'Recorded against the wrong student.', reversedAt: ago(59) },
  },
  {
    studentKey: 'maliha',
    amountMinor: 5_000,
    paidAt: ago(58),
    reference: 'BANK-2026-0231',
  },
  {
    studentKey: 'tanvir',
    amountMinor: 6_500,
    paidAt: ago(20),
    reference: 'BANK-2026-0302',
  },
  {
    // Paid something, still short, and still past the due date. "Overdue" has to survive a
    // part payment — a naive "has this student paid?" check clears him the moment any
    // money arrives, which is the wrong answer for the account chasing him.
    studentKey: 'rafi',
    amountMinor: 3_000,
    paidAt: ago(30),
    reference: 'BANK-2026-0288',
  },
];

// ---------------------------------------------------------------------------
// Submissions — on time, late, resubmitted, and missing
// ---------------------------------------------------------------------------

const SUBMISSIONS: {
  studentKey: string;
  assessmentKey: string;
  attempt: number;
  submittedAt: Date;
  fileName: string;
  kind: FileKind;
}[] = [
  // Midterm Report — deadline 42 days ago, submissions closed, marking finished.
  {
    studentKey: 'aisha',
    assessmentKey: 'midterm',
    attempt: 1,
    submittedAt: beforeDeadline('midterm', 2),
    fileName: 'midterm-report.pdf',
    kind: 'pdf',
  },
  {
    studentKey: 'tanvir',
    assessmentKey: 'midterm',
    attempt: 1,
    submittedAt: beforeDeadline('midterm', 1, 6),
    fileName: 'data-structures-midterm.pdf',
    kind: 'pdf',
  },
  {
    studentKey: 'shafiq',
    assessmentKey: 'midterm',
    attempt: 1,
    submittedAt: beforeDeadline('midterm', 3),
    fileName: 'midterm.pdf',
    kind: 'pdf',
  },
  {
    // Two days sixteen hours past the deadline: accepted, and flagged late for good.
    studentKey: 'rafi',
    assessmentKey: 'midterm',
    attempt: 1,
    submittedAt: afterDeadline('midterm', 2, 16),
    fileName: 'midterm-report-final.pdf',
    kind: 'pdf',
  },

  // Final Project — deadline 5 days ago, still open, one result released of three.
  {
    // Replaced before the deadline: attempt 1 stays for audit, attempt 2 is active.
    studentKey: 'tanvir',
    assessmentKey: 'final-project',
    attempt: 1,
    submittedAt: beforeDeadline('final-project', 3),
    fileName: 'final-project-draft.pdf',
    kind: 'pdf',
  },
  {
    studentKey: 'tanvir',
    assessmentKey: 'final-project',
    attempt: 2,
    submittedAt: beforeDeadline('final-project', 1, 4),
    fileName: 'final-project.docx',
    kind: 'docx',
  },
  {
    // Nineteen hours late, and unmarked — the top of the marking queue.
    studentKey: 'aisha',
    assessmentKey: 'final-project',
    attempt: 1,
    submittedAt: afterDeadline('final-project', 0, 19),
    fileName: 'final-project-aisha.pdf',
    kind: 'pdf',
  },

  // Lab Exercise 2 — deadline still ahead, one early submission.
  {
    studentKey: 'zubair',
    assessmentKey: 'lab-2',
    attempt: 1,
    submittedAt: beforeDeadline('lab-2', 10),
    fileName: 'lab-exercise-2.pdf',
    kind: 'pdf',
  },

  // Case Study 1 — deadline 21 days ago, submissions closed, results released.
  {
    studentKey: 'farhana',
    assessmentKey: 'case-study-1',
    attempt: 1,
    submittedAt: beforeDeadline('case-study-1', 3),
    fileName: 'case-study-final.pdf',
    kind: 'pdf',
  },
  {
    studentKey: 'maliha',
    assessmentKey: 'case-study-1',
    attempt: 1,
    submittedAt: beforeDeadline('case-study-1', 2),
    fileName: 'case-study-1.pdf',
    kind: 'pdf',
  },
  {
    studentKey: 'sadia',
    assessmentKey: 'case-study-1',
    attempt: 1,
    submittedAt: beforeDeadline('case-study-1', 1, 5),
    fileName: 'case-study-sadia.pdf',
    kind: 'pdf',
  },
  {
    // Two days four hours late — the delay is shown, not just a flag.
    studentKey: 'nusrat',
    assessmentKey: 'case-study-1',
    attempt: 1,
    submittedAt: afterDeadline('case-study-1', 2, 4),
    fileName: 'case-study-1-nusrat.pdf',
    kind: 'pdf',
  },

  // Market Analysis — deadline 3 days ago, still open, nothing marked yet.
  {
    studentKey: 'nusrat',
    assessmentKey: 'market-analysis',
    attempt: 1,
    submittedAt: beforeDeadline('market-analysis', 1),
    fileName: 'market-analysis.pdf',
    kind: 'pdf',
  },

  // Reflective Essay — shared module, deadline well ahead.
  {
    studentKey: 'aisha',
    assessmentKey: 'reflective-essay',
    attempt: 1,
    submittedAt: beforeDeadline('reflective-essay', 20),
    fileName: 'reflective-essay.pdf',
    kind: 'pdf',
  },
];

// ---------------------------------------------------------------------------
// Results — unmarked, draft, published, withheld
// ---------------------------------------------------------------------------

/**
 * Unmarked work is absent from this list rather than present with a null grade. A
 * student's marksheet has to distinguish "not marked yet" (not listed at all) from
 * "marked but held back" (listed, with the reason), and that distinction is the point of
 * the withhold feature.
 */
const RESULTS: {
  studentKey: string;
  assessmentKey: string;
  grade: number;
  status: 'DRAFT' | 'PUBLISHED' | 'WITHHELD';
  publishedAt?: Date;
  withheldReason?: string;
  note?: string;
}[] = [
  // Midterm Report — marked and released, except one.
  {
    studentKey: 'aisha',
    assessmentKey: 'midterm',
    grade: 78,
    status: 'PUBLISHED',
    publishedAt: ago(35),
  },
  {
    studentKey: 'tanvir',
    assessmentKey: 'midterm',
    grade: 64,
    status: 'PUBLISHED',
    publishedAt: ago(35),
  },
  {
    // Below 40. The brief's bands stop at Pass; a fail still has to be sayable.
    studentKey: 'shafiq',
    assessmentKey: 'midterm',
    grade: 38,
    status: 'PUBLISHED',
    publishedAt: ago(35),
  },
  {
    // Marked, never released — and this student is 45 days in arrears. Publishing it is
    // the flow the overdue warning on the marking screen exists for.
    studentKey: 'rafi',
    assessmentKey: 'midterm',
    grade: 62,
    status: 'DRAFT',
  },

  // Case Study 1 — released, with one held back for arrears.
  {
    studentKey: 'farhana',
    assessmentKey: 'case-study-1',
    grade: 76,
    status: 'PUBLISHED',
    publishedAt: ago(12),
  },
  {
    studentKey: 'maliha',
    assessmentKey: 'case-study-1',
    grade: 82,
    status: 'PUBLISHED',
    publishedAt: ago(12),
  },
  {
    studentKey: 'nusrat',
    assessmentKey: 'case-study-1',
    grade: 55,
    status: 'PUBLISHED',
    publishedAt: ago(12),
  },
  {
    // The student sees that a result exists and why it is held, rather than a blank.
    studentKey: 'sadia',
    assessmentKey: 'case-study-1',
    grade: 71,
    status: 'WITHHELD',
    withheldReason:
      'Outstanding balance on your account. Contact the Registry office to arrange payment.',
  },

  // Market Analysis — one absence on record, still in draft.
  {
    // A zero with no explanation is indistinguishable from a mistake a year later, so
    // recording an absence carries its reason.
    studentKey: 'maliha',
    assessmentKey: 'market-analysis',
    grade: 0,
    status: 'DRAFT',
    note: 'Absent, did not sit the assessment. Confirmed with the module leader.',
  },

  // Final Project — one released, the rest still unmarked. A marking queue is rarely
  // finished in one sitting, and a part-marked assessment is the state staff actually see.
  {
    studentKey: 'aisha',
    assessmentKey: 'final-project',
    grade: 80,
    status: 'PUBLISHED',
    publishedAt: ago(2),
  },

  // Reflective Essay — marked early and released, so one marksheet averages three results.
  {
    studentKey: 'aisha',
    assessmentKey: 'reflective-essay',
    grade: 85,
    status: 'PUBLISHED',
    publishedAt: ago(1),
  },
];

// ---------------------------------------------------------------------------
// Seeding
// ---------------------------------------------------------------------------

/**
 * Emptied in dependency order rather than with `TRUNCATE ... CASCADE`: the order is the
 * schema's foreign keys written out, so a model added later and missed here fails loudly
 * on a constraint instead of being silently wiped by a cascade.
 */
async function truncate(): Promise<void> {
  await prisma.result.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.feeAssignment.deleteMany();
  await prisma.statusChange.deleteMany();
  await prisma.student.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.module.deleteMany();
  await prisma.programme.deleteMany();
  // Reset too, so codes start at SMS-YYYY-0001 and the README can name a student by code.
  await prisma.studentCodeCounter.deleteMany();
}

async function main(): Promise<void> {
  await truncate();
  await clearUploads();

  const programmeIds = new Map<string, string>();
  for (const programme of PROGRAMMES) {
    const created = await prisma.programme.create({
      data: programme,
      select: { id: true },
    });
    programmeIds.set(programme.code, created.id);
  }

  const moduleIds = new Map<string, string>();
  for (const entry of MODULES) {
    const created = await prisma.module.create({
      data: {
        code: entry.code,
        name: entry.name,
        programmes: { connect: entry.programmes.map((code) => ({ code })) },
      },
      select: { id: true },
    });
    moduleIds.set(entry.code, created.id);
  }

  const assessmentIds = new Map<string, string>();
  for (const assessment of ASSESSMENTS) {
    const created = await prisma.assessment.create({
      data: {
        title: assessment.title,
        moduleId: moduleIds.get(assessment.moduleCode)!,
        deadline: assessment.deadline,
        maxAttempts: assessment.maxAttempts,
        submissionsClosedAt: assessment.submissionsClosedAt,
      },
      select: { id: true },
    });
    assessmentIds.set(assessment.key, created.id);
  }

  const studentIds = new Map<string, string>();
  const feeIds = new Map<string, string>();
  // One sequence per intake year, mirroring `StudentCodeCounter`. The counter rows are
  // written afterwards, so a student created through the UI continues the same run
  // rather than colliding with a seeded code.
  const sequences = new Map<number, number>();

  for (const student of STUDENTS) {
    const programme = PROGRAMMES.find((entry) => entry.code === student.programmeCode)!;
    const sequence = (sequences.get(student.intakeYear) ?? 0) + 1;
    sequences.set(student.intakeYear, sequence);

    const dueDate = new Date(student.createdAt);
    dueDate.setUTCDate(dueDate.getUTCDate() + programme.feeDueDays);

    const created = await prisma.student.create({
      data: {
        studentCode: formatStudentCode(student.intakeYear, sequence),
        fullName: student.fullName,
        email: student.email,
        dateOfBirth: student.dateOfBirth,
        programmeId: programmeIds.get(student.programmeCode)!,
        academicYear: student.academicYear,
        intakeYear: student.intakeYear,
        status: student.status,
        createdAt: student.createdAt,
        // Set explicitly, or `@updatedAt` stamps the seed run and every record in the
        // registry reads as touched today.
        updatedAt: student.history?.at(-1)?.changedAt ?? student.createdAt,
      },
      select: { id: true },
    });
    studentIds.set(student.key, created.id);

    const fee = await prisma.feeAssignment.create({
      data: {
        studentId: created.id,
        // A snapshot of the programme fee at creation, not a reference to it.
        description: `Tuition ${academicSession(student.createdAt)}`,
        amountMinor: programme.feeMinor,
        waivedMinor: student.waivedMinor ?? 0,
        dueDate,
        createdAt: student.createdAt,
        updatedAt: student.createdAt,
      },
      select: { id: true },
    });
    feeIds.set(student.key, fee.id);

    // Every student carries the entry the create flow writes, then any transitions.
    await prisma.statusChange.create({
      data: {
        studentId: created.id,
        fromStatus: null,
        toStatus: student.history?.length ? 'ENROLLED' : student.status,
        reason: 'Student record created.',
        changedAt: student.createdAt,
      },
    });

    let fromStatus: EnrolmentStatus = 'ENROLLED';
    for (const change of student.history ?? []) {
      await prisma.statusChange.create({
        data: {
          studentId: created.id,
          fromStatus,
          toStatus: change.toStatus,
          reason: change.reason,
          changedAt: change.changedAt,
        },
      });
      fromStatus = change.toStatus;
    }
  }

  for (const [year, lastValue] of sequences) {
    await prisma.studentCodeCounter.create({ data: { year, lastValue } });
  }

  for (const payment of PAYMENTS) {
    const created = await prisma.payment.create({
      data: {
        feeId: feeIds.get(payment.studentKey)!,
        amountMinor: payment.amountMinor,
        paidAt: payment.paidAt,
        reference: payment.reference,
        note: payment.note,
        status: payment.reversal ? 'REVERSED' : 'COMPLETED',
        createdAt: payment.paidAt,
      },
      select: { id: true },
    });

    if (payment.reversal) {
      await prisma.payment.create({
        data: {
          feeId: feeIds.get(payment.studentKey)!,
          // Negative, so the ledger reads as double entry rather than as a second
          // payment that happens to be tagged.
          amountMinor: -payment.amountMinor,
          paidAt: payment.reversal.reversedAt,
          reference: `${payment.reference}-REV`,
          status: 'REVERSED',
          reversalOf: created.id,
          note: payment.reversal.reason,
          createdAt: payment.reversal.reversedAt,
        },
      });
    }
  }

  for (const submission of SUBMISSIONS) {
    const assessmentId = assessmentIds.get(submission.assessmentKey)!;
    const studentId = studentIds.get(submission.studentKey)!;
    const assessment = ASSESSMENTS.find(
      (entry) => entry.key === submission.assessmentKey,
    )!;
    const student = STUDENTS.find((entry) => entry.key === submission.studentKey)!;

    const stored = await writeSubmissionFile({
      assessmentId,
      studentId,
      attempt: submission.attempt,
      fileName: submission.fileName,
      kind: submission.kind,
      title: `${assessment.title} — ${student.fullName}`,
    });

    await prisma.submission.create({
      data: {
        studentId,
        assessmentId,
        attempt: submission.attempt,
        fileName: submission.fileName,
        submittedAt: submission.submittedAt,
        ...stored,
      },
    });
  }

  for (const result of RESULTS) {
    // `updatedAt` is the moment the result was last acted on. Left to Prisma it would be
    // the seed run, and the marking screen would flag every published mark as edited
    // since publication.
    const touchedAt = result.publishedAt ?? ago(2);

    await prisma.result.create({
      data: {
        studentId: studentIds.get(result.studentKey)!,
        assessmentId: assessmentIds.get(result.assessmentKey)!,
        grade: result.grade,
        status: result.status,
        withheldReason: result.withheldReason,
        publishedAt: result.publishedAt,
        note: result.note,
        markedBy: MARKED_BY,
        createdAt: touchedAt,
        updatedAt: touchedAt,
      },
    });
  }

  process.stdout.write(
    `Seeded ${PROGRAMMES.length} programmes, ${MODULES.length} modules, ` +
      `${ASSESSMENTS.length} assessments, ${STUDENTS.length} students, ` +
      `${PAYMENTS.length} payments, ${SUBMISSIONS.length} submissions, ` +
      `${RESULTS.length} results.\n`,
  );
}

main()
  .catch((error) => {
    process.exitCode = 1;
    process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  })
  .finally(() => prisma.$disconnect());
